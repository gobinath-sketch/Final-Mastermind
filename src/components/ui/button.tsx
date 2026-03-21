import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[18px] border-[3px] border-[#141414] bg-primary text-primary-foreground text-sm font-semibold tracking-wide shadow-[4px_4px_0_#141414] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#141414]",
  {
    variants: {
      variant: {
        default: "",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[4px_4px_0_rgba(255,107,107,0.6)]",
        outline:
          "bg-secondary text-foreground border-[3px] border-[#141414] shadow-[4px_4px_0_#141414]",
        secondary:
          "bg-accent text-accent-foreground shadow-[4px_4px_0_rgba(0,184,169,0.55)]",
        ghost:
          "bg-background text-foreground border-[3px] border-[#141414] shadow-[4px_4px_0_#141414]",
        link: "bg-transparent text-foreground shadow-none border-none underline underline-offset-4 hover:text-accent",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 rounded-[16px] px-4 text-xs",
        lg: "h-14 rounded-[20px] px-10 text-base",
        icon: "h-11 w-11 rounded-[18px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
