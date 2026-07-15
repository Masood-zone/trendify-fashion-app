import type { ReactNode } from "react"

export function AdminAuthCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <main className="heritage-pattern flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center">
          <h1 className="font-heading text-3xl font-bold">
            Fashion Trendify GH
          </h1>
          <div className="mt-3 flex items-center justify-center gap-5">
            <span className="h-px w-16 bg-outline-variant" />
            <span className="type-label">Admin Portal</span>
            <span className="h-px w-16 bg-outline-variant" />
          </div>
        </div>
        <section className="ambient-shadow border border-outline-variant bg-white p-8 md:p-12">
          <h2 className="mb-8 text-center font-heading text-2xl font-semibold">
            {title}
          </h2>
          {children}
        </section>
        <div className="mt-9 text-center text-sm text-muted-foreground">
          <p className="type-label mb-3 text-heritage-burgundy">
            Security Notice
          </p>
          <p>
            Authorized personnel only. Access is protected by role-based
            authentication.
          </p>
        </div>
      </div>
    </main>
  )
}
