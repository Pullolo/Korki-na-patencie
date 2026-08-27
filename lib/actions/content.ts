"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth"
import type { NavMenu, PageStatus } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { isReservedSlug } from "@/lib/public/reserved-slugs"
import { slugify, uniqueSlug } from "@/lib/slug"
import { revalidateTags, TAGS } from "@/lib/tags"

/**
 * Treści CMS: strony, menu i pytania.
 *
 * Wszystkie trzy karmią stronę publiczną, która czyta je z cache'a pod tagiem
 * `cms` — dlatego każda zmiana unieważnia tag, a nie tylko ścieżkę w panelu.
 * Bez tego admin zmieniałby regulamin i nie widział tego na stronie.
 */

function refresh(path: string) {
  revalidatePath(path)
  revalidateTags(TAGS.cms)
}

// ─── Strony ───────────────────────────────────────────────────────────────────

export type PageInput = {
  title: string
  slug: string
  content: string | null
  status: PageStatus
  seoTitle: string | null
  seoDescription: string | null
  seoOgImage: string | null
  noIndex: boolean
}

function clean(value: string | null) {
  return value?.trim() || null
}

/**
 * Slug strony musi być wolny i nie może zająć trasy statycznej. Strona
 * o slugu `cennik` nigdy by się nie otworzyła — Next rozstrzygnąłby adres
 * na rzecz `/cennik` i nikt by się o tym nie dowiedział.
 */
async function resolveSlug(input: PageInput, currentId?: string) {
  const wanted = slugify(input.slug || input.title)
  if (!wanted) throw new Error("Podaj tytuł albo adres strony.")

  if (isReservedSlug(wanted)) {
    throw new Error(
      `Adres „${wanted}" jest zajęty przez stałą stronę serwisu. Wybierz inny.`
    )
  }

  return uniqueSlug(
    wanted,
    async (candidate) => {
      const found = await prisma.page.findUnique({
        where: { slug: candidate },
        select: { id: true },
      })
      return found?.id ?? null
    },
    { fallback: "strona", currentId }
  )
}

function validatePage(input: PageInput) {
  if (input.title.trim().length < 2) {
    throw new Error("Tytuł musi mieć co najmniej 2 znaki.")
  }
  if ((input.content ?? "").length > 60_000) {
    throw new Error("Treść strony jest za długa (limit 60 000 znaków).")
  }
}

export async function createPage(input: PageInput) {
  await requireAdmin()
  validatePage(input)

  const page = await prisma.page.create({
    data: {
      title: input.title.trim(),
      slug: await resolveSlug(input),
      content: clean(input.content),
      status: input.status,
      seoTitle: clean(input.seoTitle),
      seoDescription: clean(input.seoDescription),
      seoOgImage: clean(input.seoOgImage),
      noIndex: input.noIndex,
    },
    select: { id: true, slug: true },
  })

  refresh("/dashboard/strony")
  return page
}

export async function updatePage(id: string, input: PageInput) {
  await requireAdmin()
  validatePage(input)

  const page = await prisma.page.update({
    where: { id },
    data: {
      title: input.title.trim(),
      slug: await resolveSlug(input, id),
      content: clean(input.content),
      status: input.status,
      seoTitle: clean(input.seoTitle),
      seoDescription: clean(input.seoDescription),
      seoOgImage: clean(input.seoOgImage),
      noIndex: input.noIndex,
    },
    select: { id: true, slug: true },
  })

  refresh("/dashboard/strony")
  revalidatePath(`/dashboard/strony/${id}`)
  return page
}

export async function deletePage(id: string) {
  await requireAdmin()
  await prisma.page.delete({ where: { id } })
  refresh("/dashboard/strony")
}

export async function setPageStatus(id: string, status: PageStatus) {
  await requireAdmin()
  await prisma.page.update({ where: { id }, data: { status } })
  refresh("/dashboard/strony")
}

// ─── Nawigacja ────────────────────────────────────────────────────────────────

export type NavLinkInput = {
  label: string
  href: string
  menu: NavMenu
  parentId: string | null
  order: number
  isActive: boolean
}

function validateNav(input: NavLinkInput) {
  if (input.label.trim().length < 2) {
    throw new Error("Etykieta musi mieć co najmniej 2 znaki.")
  }
  const href = input.href.trim()
  if (!href) throw new Error("Podaj adres, do którego prowadzi pozycja.")
  // Adres względny albo pełny link — nic pomiędzy, bo `//zły-adres` w menu
  // wyprowadza czytelnika z serwisu bez ostrzeżenia.
  if (!/^(\/[^/]|\/$|https?:\/\/|mailto:|tel:|#)/.test(href)) {
    throw new Error(
      "Adres musi zaczynać się od ukośnika, kratki albo pełnego https://."
    )
  }
}

export async function createNavLink(input: NavLinkInput) {
  await requireAdmin()
  validateNav(input)

  await prisma.navLink.create({
    data: {
      label: input.label.trim(),
      href: input.href.trim(),
      menu: input.menu,
      parentId: input.parentId,
      order: input.order,
      isActive: input.isActive,
    },
  })
  refresh("/dashboard/nawigacja")
}

export async function updateNavLink(id: string, input: NavLinkInput) {
  await requireAdmin()
  validateNav(input)

  if (input.parentId === id) {
    throw new Error("Pozycja nie może być własnym rodzicem.")
  }

  await prisma.navLink.update({
    where: { id },
    data: {
      label: input.label.trim(),
      href: input.href.trim(),
      menu: input.menu,
      parentId: input.parentId,
      order: input.order,
      isActive: input.isActive,
    },
  })
  refresh("/dashboard/nawigacja")
}

export async function deleteNavLink(id: string) {
  await requireAdmin()
  await prisma.navLink.delete({ where: { id } })
  refresh("/dashboard/nawigacja")
}

/** Przesunięcie pozycji w menu o jedno miejsce w górę albo w dół. */
export async function moveNavLink(id: string, direction: "up" | "down") {
  await requireAdmin()

  const link = await prisma.navLink.findUnique({
    where: { id },
    select: { id: true, menu: true, parentId: true, order: true },
  })
  if (!link) throw new Error("Nie znaleziono pozycji menu.")

  const neighbour = await prisma.navLink.findFirst({
    where: {
      menu: link.menu,
      parentId: link.parentId,
      order: direction === "up" ? { lt: link.order } : { gt: link.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
    select: { id: true, order: true },
  })
  if (!neighbour) return

  await prisma.$transaction([
    prisma.navLink.update({
      where: { id: link.id },
      data: { order: neighbour.order },
    }),
    prisma.navLink.update({
      where: { id: neighbour.id },
      data: { order: link.order },
    }),
  ])
  refresh("/dashboard/nawigacja")
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export type FaqInput = {
  question: string
  answer: string
  category: string | null
  order: number
  isPublished: boolean
}

function validateFaq(input: FaqInput) {
  if (input.question.trim().length < 5) {
    throw new Error("Pytanie musi mieć co najmniej 5 znaków.")
  }
  if (input.answer.trim().length < 5) {
    throw new Error("Odpowiedź musi mieć co najmniej 5 znaków.")
  }
}

export async function createFaq(input: FaqInput) {
  await requireAdmin()
  validateFaq(input)

  await prisma.faq.create({
    data: {
      question: input.question.trim(),
      answer: input.answer.trim(),
      category: clean(input.category),
      order: input.order,
      isPublished: input.isPublished,
    },
  })
  refresh("/dashboard/faq")
}

export async function updateFaq(id: string, input: FaqInput) {
  await requireAdmin()
  validateFaq(input)

  await prisma.faq.update({
    where: { id },
    data: {
      question: input.question.trim(),
      answer: input.answer.trim(),
      category: clean(input.category),
      order: input.order,
      isPublished: input.isPublished,
    },
  })
  refresh("/dashboard/faq")
}

export async function deleteFaq(id: string) {
  await requireAdmin()
  await prisma.faq.delete({ where: { id } })
  refresh("/dashboard/faq")
}

// ─── SEO serwisu ──────────────────────────────────────────────────────────────

export type SeoInput = {
  seoTitle: string | null
  seoDescription: string | null
  seoOgImage: string | null
  noIndexSite: boolean
}

export async function updateSeoSettings(input: SeoInput) {
  await requireAdmin()

  if ((input.seoDescription ?? "").length > 300) {
    throw new Error("Opis dla wyszukiwarek nie powinien przekraczać 300 znaków.")
  }

  const data = {
    seoTitle: clean(input.seoTitle),
    seoDescription: clean(input.seoDescription),
    seoOgImage: clean(input.seoOgImage),
    noIndexSite: input.noIndexSite,
  }

  await prisma.siteSettings.upsert({
    where: { id: "settings" },
    update: data,
    create: { id: "settings", ...data },
  })

  revalidatePath("/dashboard/seo")
  revalidateTags(TAGS.ustawienia)
}
