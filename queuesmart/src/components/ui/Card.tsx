import type { HTMLAttributes } from "react"
import { cn } from "../../lib/cn"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  featured?: boolean
}

function Card({
  className,
  elevated = false,
  featured = false,
  children,
  ...props
}: CardProps) {
  if (featured) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#0052FF] via-[#4D7CFF] to-[#0052FF] p-[2px]">
        <div
          className={cn(
            "h-full rounded-[calc(1rem-2px)] bg-white p-6 shadow-[0_10px_25px_rgba(15,23,42,0.08)]",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_4px_6px_rgba(15,23,42,0.07)]",
        elevated && "shadow-[0_20px_25px_rgba(15,23,42,0.1)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
