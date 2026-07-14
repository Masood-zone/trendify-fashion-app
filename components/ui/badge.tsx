import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "type-label inline-flex w-fit items-center gap-1 rounded-none px-2.5 py-1",
  {
    variants: {
      variant: {
        neutral: "bg-surface-dim/40 text-on-surface",
        gold: "bg-tertiary-fixed text-on-tertiary-fixed",
        burgundy: "bg-heritage-burgundy text-white",
        outline: "border border-surface-dim bg-white text-on-surface",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
