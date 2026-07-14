import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "type-label group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent whitespace-nowrap transition-[background-color,color,border-color,transform] duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-container",
        outline:
          "border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        accent: "bg-kente-gold text-on-tertiary-fixed hover:bg-tertiary-fixed",
        secondary:
          "hover:bg-secondary-fixed-dim bg-secondary-container text-on-secondary-container",
        ghost:
          "text-foreground hover:bg-surface-container-low hover:text-foreground",
        destructive:
          "bg-destructive text-white hover:bg-error/90 focus-visible:ring-destructive/30",
        link: "h-auto rounded-none px-0 text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-5",
        xs: "h-8 gap-1.5 px-3 text-[0.6875rem]",
        sm: "h-9 gap-2 px-4",
        lg: "h-13 gap-2.5 px-8",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-13",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
