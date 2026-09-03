"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  delayOrder?: number
  staggerDelay?: number
}

export function StaggerContainer({
  children,
  className,
  delayOrder = 0,
  staggerDelay = 0.1,
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
        delayChildren: shouldReduceMotion ? 0 : delayOrder * 0.1,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10%" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
  direction?: "up" | "down" | "left" | "right" | "none"
}

export function StaggerItem({ children, className, direction = "up" }: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion()

  const directionOffset = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
    none: { x: 0, y: 0 },
  }

  const offset = directionOffset[direction]

  const itemVariants = {
    hidden: { 
      opacity: 0,
      x: shouldReduceMotion ? 0 : offset.x,
      y: shouldReduceMotion ? 0 : offset.y,
    },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number],
      }
    },
  }

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}
