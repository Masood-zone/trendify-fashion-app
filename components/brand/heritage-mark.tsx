import { cn } from "@/lib/utils"

function HeritageMark({
  className,
  medallion = false,
}: {
  className?: string
  medallion?: boolean
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center text-current",
        medallion && "size-10 rounded-full border border-surface-dim",
        className
      )}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-5"
      >
        <path
          d="M16 3.5v25M3.5 16h25M7.2 7.2l17.6 17.6M24.8 7.2 7.2 24.8"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <circle cx="16" cy="16" r="5.5" fill="currentColor" />
        <circle cx="16" cy="16" r="2.2" fill="var(--surface)" />
      </svg>
    </span>
  )
}

function HeritageSeparator({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center justify-center gap-4", className)}
    >
      <span className="h-px w-12 bg-surface-dim sm:w-24" />
      <HeritageMark medallion className="size-8" />
      <span className="h-px w-12 bg-surface-dim sm:w-24" />
    </div>
  )
}

export { HeritageMark, HeritageSeparator }
