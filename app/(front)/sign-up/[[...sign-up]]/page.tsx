import { SignUp } from "@clerk/nextjs"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Rejestracja",
  robots: { index: false, follow: false },
}

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center px-5 py-16 sm:py-24">
      <SignUp />
    </div>
  )
}
