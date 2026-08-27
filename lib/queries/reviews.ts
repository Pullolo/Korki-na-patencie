import { prisma } from "@/lib/prisma"

/** Opinie w panelu — wszystkie stany, z kontekstem lekcji. */
export async function getReviews() {
  return prisma.review.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      authorName: true,
      rating: true,
      content: true,
      status: true,
      createdAt: true,
      publishedAt: true,
      subject: { select: { name: true } },
      teacherProfile: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      booking: { select: { id: true, reference: true, startsAt: true } },
    },
  })
}
