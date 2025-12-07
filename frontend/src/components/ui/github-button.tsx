import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const githubButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-github text-white hover:bg-github-hover shadow-elegant",
        outline: "border border-github text-github hover:bg-github hover:text-white",
        ghost: "text-github hover:bg-github/10",
        hero: "bg-hero-gradient text-white hover:shadow-glow transform hover:scale-105"
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

export interface GitHubButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof githubButtonVariants> {
  asChild?: boolean
}

const GitHubButton = React.forwardRef<HTMLButtonElement, GitHubButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(githubButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
GitHubButton.displayName = "GitHubButton"

// eslint-disable-next-line react-refresh/only-export-components
export { GitHubButton, githubButtonVariants }