import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-md border border-input bg-surface-container-lowest px-4 py-3 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:border-kente-gold focus-visible:ring-2 focus-visible:ring-kente-gold/20",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
