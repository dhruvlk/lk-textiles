"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Home, History, Layers, Send, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const navItems = [
  { label: "Home", href: "#home", icon: Home, description: "Overview & Highlights" },
  { label: "Heritage", href: "#about", icon: History, description: "Our 30-Year Legacy" },
  { label: "Capabilities", href: "#categories", icon: Layers, description: "Fabrics, Knits & Yarns" },
  { label: "Contact", href: "#contact", icon: Send, description: "Get in touch with us" },
]

export function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false)

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Close menu on screen resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setIsOpen(false)
    if (href.startsWith("#")) {
      e.preventDefault()
      const target = document.querySelector(href)
      if (target) {
        target.scrollIntoView({ behavior: "smooth" })
        window.history.pushState(null, "", href)
      }
    }
  }

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2.5rem)] md:w-full max-w-7xl rounded-full border border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-2 z-10 shrink-0">
          <Image
            src="/logo-1.png"
            alt="LK Textiles Logo"
            width={120}
            height={50}
            className="h-9 sm:h-11 md:h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 font-medium text-sm text-slate-700">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-primary transition-all hover:-translate-y-0.5"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Action Buttons & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-4 z-10">
          <Link
            href="#contact"
            className={cn(
              buttonVariants(),
              "hidden sm:inline-flex rounded-full px-5 sm:px-6 bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-sm"
            )}
          >
            Inquire Now
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? "Close menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-slate-100/80 hover:bg-slate-200/80 active:scale-95 text-slate-800 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer Menu & Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden"
              aria-hidden="true"
            />

            {/* Floating Dropdown Card */}
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-18 sm:top-20 inset-x-3 sm:inset-x-6 max-w-md mx-auto z-50 rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.18)] p-4 sm:p-5 md:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-1">
                <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Menu
                </div>

                <nav className="flex flex-col gap-1">
                  {navItems.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 + 0.05 }}
                      >
                        <Link
                          href={item.href}
                          onClick={(e) => handleLinkClick(e, item.href)}
                          className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-slate-700 font-medium hover:text-slate-950 hover:bg-slate-100/90 transition-all active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-700">
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                              <span className="text-xs text-slate-400 font-normal">{item.description}</span>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-400" />
                        </Link>
                      </motion.div>
                    )
                  })}
                </nav>

                <div className="h-px bg-slate-100 my-2" />

                {/* Inquire Button */}
                <Link
                  href="#contact"
                  onClick={(e) => handleLinkClick(e, "#contact")}
                  className={cn(
                    buttonVariants(),
                    "w-full rounded-2xl py-3.5 bg-slate-900 text-white hover:bg-slate-800 shadow-md font-medium text-center justify-center transition-all duration-200 active:scale-[0.98]"
                  )}
                >
                  Inquire Now
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
