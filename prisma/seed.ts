import { PrismaPg } from "@prisma/adapter-pg"
import { config as loadEnv } from "dotenv"

import { toDateOnly } from "../lib/dates"
import { seedContent } from "./seed-content"
import { applyDiscount, resolveHourlyPrice } from "../lib/pricing"
import { PrismaClient } from "../lib/generated/prisma/client"

loadEnv({ path: ".env.local" })
loadEnv()

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
})
const prisma = new PrismaClient({ adapter })

/** Data przesunięta o `days` dni od dziś, z ustawioną godziną. */
function day(days: number, hour: number, minute = 0) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

async function main() {
  console.log("Seed: start")

  const settings = await prisma.siteSettings.upsert({
    where: { id: "settings" },
    update: {},
    create: {
      id: "settings",
      siteName: "Korki na patencie",
      tagline: "Korepetycje, na które faktycznie się zapiszesz",
      contactEmail: "kontakt@korkinapatencie.pl",
      contactPhone: "+48 600 000 000",
    },
  })

  // ─── Poziomy ───────────────────────────────────────────────────────────────
  const levelData = [
    { slug: "podstawowka", name: "Podstawówka", order: 1 },
    { slug: "liceum", name: "Liceum i technikum", order: 2 },
    { slug: "matura", name: "Matura", order: 3 },
    { slug: "studia", name: "Studia", order: 4 },
  ]
  const levels = await Promise.all(
    levelData.map((level) =>
      prisma.level.upsert({
        where: { slug: level.slug },
        update: level,
        create: level,
      })
    )
  )
  const byLevel = Object.fromEntries(levels.map((l) => [l.slug, l]))

  // ─── Przedmioty ────────────────────────────────────────────────────────────
  const subjectData = [
    {
      slug: "matematyka",
      name: "Matematyka",
      description: "Od podstawówki po analizę na studiach",
      color: "#6366f1",
      order: 1,
    },
    {
      slug: "fizyka",
      name: "Fizyka",
      description: "Mechanika, elektryczność, zadania maturalne",
      color: "#f59e0b",
      order: 2,
    },
    {
      slug: "informatyka",
      name: "Informatyka",
      description: "Programowanie, algorytmy, matura rozszerzona",
      color: "#10b981",
      order: 3,
    },
    {
      slug: "chemia",
      name: "Chemia",
      description: "Stechiometria i chemia organiczna",
      color: "#ec4899",
      order: 4,
    },
  ]
  const subjects = await Promise.all(
    subjectData.map((subject) =>
      prisma.subject.upsert({
        where: { slug: subject.slug },
        update: subject,
        create: subject,
      })
    )
  )
  const bySubject = Object.fromEntries(subjects.map((s) => [s.slug, s]))

  // ─── Cennik zajęć indywidualnych ───────────────────────────────────────────
  // Odwzorowanie cennika ze strony: stawka zależy od poziomu, nie od przedmiotu.
  const priceList = [
    {
      level: "podstawowka",
      pricePerHour: 80,
      note: "Zajęcia indywidualne dla szkół podstawowych",
    },
    {
      level: "liceum",
      pricePerHour: 100,
      note: "Zajęcia indywidualne dla szkół średnich",
    },
    {
      level: "matura",
      pricePerHour: 120,
      note: "Indywidualne przygotowania maturalne",
    },
  ]
  for (const item of priceList) {
    const existing = await prisma.priceRule.findFirst({
      where: {
        levelId: byLevel[item.level].id,
        subjectId: null,
        teacherProfileId: null,
      },
      select: { id: true },
    })
    if (existing) {
      await prisma.priceRule.update({
        where: { id: existing.id },
        data: { pricePerHour: item.pricePerHour, note: item.note },
      })
    } else {
      await prisma.priceRule.create({
        data: {
          levelId: byLevel[item.level].id,
          pricePerHour: item.pricePerHour,
          note: item.note,
        },
      })
    }
  }
  const priceRules = await prisma.priceRule.findMany({
    where: { isActive: true },
    select: {
      levelId: true,
      subjectId: true,
      teacherProfileId: true,
      pricePerHour: true,
    },
  })

  // ─── Nauczyciele ───────────────────────────────────────────────────────────
  const teacherSpecs = [
    {
      email: "anna.kowalska@example.com",
      firstName: "Anna",
      lastName: "Kowalska",
      slug: "anna-kowalska",
      headline: "Matematyka i fizyka — matura rozszerzona",
      subjects: ["matematyka", "fizyka"],
      locations: [
        { name: "Online (Google Meet)", type: "ONLINE" as const, order: 1 },
        {
          name: "U mnie w domu",
          type: "TEACHER_PLACE" as const,
          address: "ul. Długa 12",
          city: "Kraków",
          order: 2,
        },
      ],
      rules: [
        { weekday: 2, startMin: 16 * 60, endMin: 20 * 60 },
        { weekday: 4, startMin: 16 * 60, endMin: 20 * 60 },
        { weekday: 6, startMin: 10 * 60, endMin: 14 * 60 },
      ],
    },
    {
      email: "piotr.nowak@example.com",
      firstName: "Piotr",
      lastName: "Nowak",
      slug: "piotr-nowak",
      headline: "Informatyka i programowanie od podstaw",
      subjects: ["informatyka", "matematyka"],
      locations: [
        { name: "Online (Discord)", type: "ONLINE" as const, order: 1 },
        {
          name: "Dojazd do ucznia",
          type: "STUDENT_PLACE" as const,
          city: "Kraków",
          note: "Dojeżdżam w granicach miasta, +10 zł poza obwodnicą.",
          order: 2,
        },
      ],
      rules: [
        { weekday: 1, startMin: 17 * 60, endMin: 21 * 60 },
        { weekday: 3, startMin: 17 * 60, endMin: 21 * 60 },
      ],
    },
  ]

  const teachers = []
  for (const spec of teacherSpecs) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: { role: "TEACHER" },
      create: {
        email: spec.email,
        firstName: spec.firstName,
        lastName: spec.lastName,
        role: "TEACHER",
      },
    })

    const profile = await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: { headline: spec.headline },
      create: {
        userId: user.id,
        slug: spec.slug,
        headline: spec.headline,
        isPublished: true,
        bio: "Uczę tak, żeby uczeń rozumiał, a nie zapamiętywał schematy.",
        experienceYears: 6,
      },
    })

    // Lokalizacje należą do nauczyciela — nie ma pola unikalnego, więc
    // wstawiamy je tylko wtedy, gdy jeszcze żadnej nie ma.
    if (
      (await prisma.location.count({
        where: { teacherProfileId: profile.id },
      })) === 0
    ) {
      await prisma.location.createMany({
        data: spec.locations.map((location) => ({
          ...location,
          teacherProfileId: profile.id,
        })),
      })
    }

    for (const slug of spec.subjects) {
      await prisma.teacherSubject.upsert({
        where: {
          teacherProfileId_subjectId: {
            teacherProfileId: profile.id,
            subjectId: bySubject[slug].id,
          },
        },
        update: {},
        create: {
          teacherProfileId: profile.id,
          subjectId: bySubject[slug].id,
          levels: {
            connect: [
              { id: byLevel.podstawowka.id },
              { id: byLevel.liceum.id },
              { id: byLevel.matura.id },
            ],
          },
        },
      })
    }

    const onlineLocation = await prisma.location.findFirst({
      where: { teacherProfileId: profile.id, type: "ONLINE" },
    })

    // Reguły grafiku wstawiamy raz — inaczej każdy seed by je dublował.
    const ruleCount = await prisma.availabilityRule.count({
      where: { teacherProfileId: profile.id },
    })
    if (ruleCount === 0) {
      await prisma.availabilityRule.createMany({
        data: spec.rules.map((rule) => ({
          ...rule,
          teacherProfileId: profile.id,
          locationId: onlineLocation?.id ?? null,
        })),
      })
      await prisma.availabilityException.create({
        data: {
          teacherProfileId: profile.id,
          date: toDateOnly(day(10, 0)),
          type: "BLOCK",
          reason: "Wyjazd",
        },
      })
    }

    teachers.push(profile)
  }

  // ─── Uczniowie ─────────────────────────────────────────────────────────────
  const studentSpecs = [
    {
      email: "kasia@example.com",
      firstName: "Kasia",
      lastName: "Wójcik",
      level: "matura",
    },
    {
      email: "michal@example.com",
      firstName: "Michał",
      lastName: "Zielinski",
      level: "liceum",
    },
    {
      email: "ola@example.com",
      firstName: "Ola",
      lastName: "Dąbrowska",
      level: "podstawowka",
    },
  ]

  const students = []
  for (const spec of studentSpecs) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {},
      create: {
        email: spec.email,
        firstName: spec.firstName,
        lastName: spec.lastName,
        role: "STUDENT",
        phone: "+48 700 100 200",
      },
    })
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, levelId: byLevel[spec.level].id },
    })
    students.push(user)
  }

  // ─── Rezerwacje ────────────────────────────────────────────────────────────
  const bookingCount = await prisma.booking.count()
  if (bookingCount === 0) {
    const plan: Array<{
      offsetDays: number
      hour: number
      teacher: number
      student: number | null
      subject: string
      level: "podstawowka" | "liceum" | "matura"
      status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
    }> = [
      {
        offsetDays: -70,
        hour: 17,
        teacher: 0,
        student: 0,
        subject: "matematyka",
        level: "matura",
        status: "COMPLETED",
      },
      {
        offsetDays: -55,
        hour: 17,
        teacher: 0,
        student: 0,
        subject: "matematyka",
        level: "matura",
        status: "COMPLETED",
      },
      {
        offsetDays: -40,
        hour: 18,
        teacher: 1,
        student: 1,
        subject: "informatyka",
        level: "liceum",
        status: "COMPLETED",
      },
      {
        offsetDays: -30,
        hour: 17,
        teacher: 0,
        student: 1,
        subject: "fizyka",
        level: "matura",
        status: "COMPLETED",
      },
      {
        offsetDays: -21,
        hour: 18,
        teacher: 1,
        student: 2,
        subject: "informatyka",
        level: "liceum",
        status: "COMPLETED",
      },
      {
        offsetDays: -14,
        hour: 17,
        teacher: 0,
        student: 0,
        subject: "matematyka",
        level: "podstawowka",
        status: "COMPLETED",
      },
      {
        offsetDays: -7,
        hour: 19,
        teacher: 1,
        student: 1,
        subject: "matematyka",
        level: "liceum",
        status: "CANCELLED",
      },
      {
        offsetDays: -3,
        hour: 17,
        teacher: 0,
        student: 2,
        subject: "matematyka",
        level: "podstawowka",
        status: "COMPLETED",
      },
      {
        offsetDays: 2,
        hour: 17,
        teacher: 0,
        student: 0,
        subject: "matematyka",
        level: "matura",
        status: "CONFIRMED",
      },
      {
        offsetDays: 3,
        hour: 18,
        teacher: 1,
        student: 1,
        subject: "informatyka",
        level: "liceum",
        status: "CONFIRMED",
      },
      {
        offsetDays: 5,
        hour: 19,
        teacher: 0,
        student: 2,
        subject: "fizyka",
        level: "matura",
        status: "CONFIRMED",
      },
      {
        offsetDays: 6,
        hour: 17,
        teacher: 1,
        student: null,
        subject: "informatyka",
        level: "liceum",
        status: "PENDING",
      },
      {
        offsetDays: 8,
        hour: 18,
        teacher: 0,
        student: 1,
        subject: "matematyka",
        level: "matura",
        status: "PENDING",
      },
      {
        offsetDays: 9,
        hour: 16,
        teacher: 0,
        student: null,
        subject: "chemia",
        level: "podstawowka",
        status: "PENDING",
      },
    ]

    let index = 1
    for (const item of plan) {
      const teacher = teachers[item.teacher]
      const startsAt = day(item.offsetDays, item.hour)
      const student = item.student === null ? null : students[item.student]
      const subject = bySubject[item.subject]

      const onlineLocation = await prisma.location.findFirst({
        where: { teacherProfileId: teacher.id, type: "ONLINE" },
        select: { id: true },
      })

      await prisma.booking.create({
        data: {
          reference: `KOR-${String(index++).padStart(4, "0")}`,
          teacherProfileId: teacher.id,
          studentId: student?.id ?? null,
          guestName: student ? null : "Rodzic — Tomasz Lis",
          guestEmail: student ? null : "tomasz.lis@example.com",
          guestPhone: student ? null : "+48 501 234 567",
          subjectId: subject.id,
          levelId: byLevel[item.level].id,
          locationId: onlineLocation?.id ?? null,
          mode: "ONLINE",
          startsAt,
          endsAt: addMinutes(startsAt, 60),
          // Migawka stawki z cennika obowiązującego w chwili zapisu.
          price: resolveHourlyPrice(priceRules, {
            levelId: byLevel[item.level].id,
            subjectId: subject.id,
            teacherProfileId: teacher.id,
          }),
          status: item.status,
          confirmedAt:
            item.status === "CONFIRMED" || item.status === "COMPLETED"
              ? new Date()
              : null,
          studentNote:
            item.status === "PENDING"
              ? "Chciałbym powtórzyć materiał przed sprawdzianem."
              : null,
        },
      })
    }
  }

  // ─── Zajęcia grupowe ───────────────────────────────────────────────────────
  if ((await prisma.courseGroup.count()) === 0) {
    const annaOnline = await prisma.location.findFirst({
      where: { teacherProfileId: teachers[0].id, type: "ONLINE" },
      select: { id: true },
    })

    const groupSpecs = [
      {
        name: "Przygotowanie do egzaminu ósmoklasisty",
        slug: "grupa-osmoklasisty",
        level: "podstawowka",
        meetingMinutes: 60,
        pricePerMonth: 250,
        weekday: 2,
        startMin: 18 * 60,
        description:
          "Cztery spotkania w miesiącu po godzinie zegarowej, grupa 4–8 osób.",
      },
      {
        name: "Przygotowanie do matury",
        slug: "grupa-maturalna",
        level: "matura",
        meetingMinutes: 90,
        pricePerMonth: 350,
        weekday: 4,
        startMin: 18 * 60,
        description:
          "Cztery spotkania w miesiącu po półtorej godziny, grupa 4–8 osób.",
      },
    ]

    for (const spec of groupSpecs) {
      const group = await prisma.courseGroup.create({
        data: {
          name: spec.name,
          slug: spec.slug,
          teacherProfileId: teachers[0].id,
          subjectId: bySubject.matematyka.id,
          levelId: byLevel[spec.level].id,
          description: spec.description,
          meetingMinutes: spec.meetingMinutes,
          pricePerMonth: spec.pricePerMonth,
          weekday: spec.weekday,
          startMin: spec.startMin,
          locationId: annaOnline?.id ?? null,
          isPublished: true,
        },
      })

      // Kasia ma zajęcia indywidualne, więc łapie się na rabat; Ola płaci pełną cenę.
      const enrollees = [
        { student: students[0], discount: settings.groupDiscountPercent },
        { student: students[2], discount: 0 },
      ]
      for (const entry of enrollees) {
        await prisma.groupEnrollment.create({
          data: {
            groupId: group.id,
            studentId: entry.student.id,
            discountPercent: entry.discount,
            monthlyPrice: applyDiscount(spec.pricePerMonth, entry.discount),
            startedOn: toDateOnly(new Date()),
          },
        })
      }
    }
  }

  // ─── Zapytania i opinie ────────────────────────────────────────────────────
  if ((await prisma.inquiry.count()) === 0) {
    await prisma.inquiry.createMany({
      data: [
        {
          name: "Marta Lewandowska",
          email: "marta@example.com",
          phone: "+48 505 111 222",
          subjectId: bySubject.matematyka.id,
          levelId: byLevel.matura.id,
          message:
            "Syn zdaje maturę rozszerzoną, szukam korepetycji raz w tygodniu.",
          preferredTerm: "wtorki po 17:00",
        },
        {
          name: "Jakub Mazur",
          email: "jakub@example.com",
          subjectId: bySubject.informatyka.id,
          levelId: byLevel.studia.id,
          message: "Potrzebuję pomocy z algorytmami na studiach.",
          status: "IN_PROGRESS",
        },
      ],
    })
  }

  if ((await prisma.review.count()) === 0) {
    await prisma.review.createMany({
      data: [
        {
          authorName: "Kasia W.",
          teacherProfileId: teachers[0].id,
          subjectId: bySubject.matematyka.id,
          rating: 5,
          content: "Wreszcie zrozumiałam całki. Bardzo cierpliwe tłumaczenie.",
          status: "APPROVED",
          publishedAt: new Date(),
        },
        {
          authorName: "Michał Z.",
          teacherProfileId: teachers[1].id,
          subjectId: bySubject.informatyka.id,
          rating: 5,
          content: "Konkretnie, bez lania wody. Polecam.",
          status: "PENDING",
        },
      ],
    })
  }

  // ─── Treści CMS ────────────────────────────────────────────────────────────
  // FAQ, menu i strony trafiają do bazy, bo od etapu 3 to panel jest ich
  // źródłem — front nie trzyma treści w kodzie.
  await seedContent(prisma, settings.siteName)

  console.log("Seed: gotowe")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
