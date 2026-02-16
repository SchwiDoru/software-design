import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from "react"
import { cn } from "../../lib/cn"

const fieldBaseClass =
  "h-12 w-full rounded-xl border border-[color:var(--border)] bg-white px-4 text-sm text-[color:var(--foreground)] shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]"

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input className={cn(fieldBaseClass, className)} ref={ref} {...props} />
  }
)

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return <select className={cn(fieldBaseClass, "pr-10", className)} ref={ref} {...props} />
})
