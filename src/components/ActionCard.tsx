"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/shared/utils"

type ActionCardProps = {
  icon: LucideIcon
  title: string
  description?: string
  backgroundImage?: string
  imageAlt?: string
  className?: string
  children?: React.ReactNode
}

export function ActionCard({
  icon: Icon,
  title,
  description,
  backgroundImage,
  imageAlt,
  className,
  children,
}: ActionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative w-full sm:w-80 h-56 rounded-2xl p-6 flex flex-col items-center text-center",
        "bg-white/10 backdrop-blur-xl border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden",
        className
      )}
    >
      {backgroundImage ? (
        <div className="absolute inset-0 opacity-25">
          <Image src={backgroundImage} alt={imageAlt ?? ""} fill priority sizes="(max-width: 768px) 100vw, 320px" className="object-cover" />
        </div>
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-br from-white/12 to-transparent pointer-events-none" />

      <div className="relative z-10 p-3 rounded-2xl bg-white/12 backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
        <Icon className="w-8 h-8 text-white" />
      </div>

      <div className="relative z-10 mt-4">
        <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
        {description ? (
          <p className="text-sm text-white/70 mt-1">{description}</p>
        ) : null}
      </div>

      {children ? (
        <div className="relative z-10 mt-5 flex items-center gap-3">{children}</div>
      ) : null}
    </motion.div>
  )
}


