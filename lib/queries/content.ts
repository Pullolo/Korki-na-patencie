import { prisma } from "@/lib/prisma"

/** Zapytania panelu o treści CMS — bez filtrów widoczności, admin widzi wszystko. */

export async function getPages() {
  return prisma.page.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      noIndex: true,
      updatedAt: true,
      seoDescription: true,
    },
  })
}

export async function getPageById(id: string) {
  return prisma.page.findUnique({ where: { id } })
}

export async function getNavLinks() {
  return prisma.navLink.findMany({
    orderBy: [{ menu: "asc" }, { order: "asc" }, { label: "asc" }],
    select: {
      id: true,
      label: true,
      href: true,
      menu: true,
      order: true,
      isActive: true,
      parentId: true,
    },
  })
}

export async function getFaqs() {
  return prisma.faq.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      question: true,
      answer: true,
      category: true,
      order: true,
      isPublished: true,
    },
  })
}
