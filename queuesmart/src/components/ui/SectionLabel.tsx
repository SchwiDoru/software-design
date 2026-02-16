import type { ReactNode } from "react"

interface SectionLabelProps {
  children: ReactNode
}

function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[#0052FF]/30 bg-[#0052FF]/5 px-5 py-2">
      <span className="pulse-dot h-2 w-2 rounded-full bg-[#0052FF]" />
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#0052FF]">
        {children}
      </span>
    </div>
  )
}

export default SectionLabel
