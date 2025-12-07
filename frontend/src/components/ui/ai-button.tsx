import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const aiButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-ai-gradient text-white hover:shadow-glow transform hover:scale-105",
        outline: "border-2 border-primary text-primary hover:bg-ai-gradient hover:text-white",
        ghost: "text-primary hover:bg-primary/10",
        loading: "bg-ai-gradient text-white animate-pulse cursor-not-allowed"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface AIButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof aiButtonVariants> {
  asChild?: boolean
  loading?: boolean
}

const AIButton = React.forwardRef<HTMLButtonElement, AIButtonProps>(
  ({ className, variant, size, asChild = false, loading, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const finalVariant = loading ? "loading" : variant
    
    return (
      <Comp
        className={cn(aiButtonVariants({ variant: finalVariant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      />
    )
  }
)
AIButton.displayName = "AIButton"

export { AIButton }