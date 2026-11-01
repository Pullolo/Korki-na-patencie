import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"
import { Suspense } from "react"

import { AlreadySignedIn } from "@/components/front/auth/already-signed-in"

export const metadata: Metadata = {
  title: "Logowanie",
  robots: { index: false, follow: false },
}

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center px-5 py-16 sm:py-24">
      <SignIn />
      {/* Z aktywną sesją `SignIn` nie renderuje nic — wtedy wchodzi to. */}
      <Suspense fallback={null}>
        <AlreadySignedIn />
      </Suspense>
    </div>
  )
}
