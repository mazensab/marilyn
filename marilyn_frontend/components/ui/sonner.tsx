"use client"

import * as React from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

type ToastTone = "success" | "info" | "warning" | "error" | "loading"

const toneClasses: Record<ToastTone, string> = {
  success:
    "border-emerald-200/80 bg-emerald-50/95 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-200",
  info:
    "border-sky-200/80 bg-sky-50/95 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-200",
  warning:
    "border-amber-200/90 bg-amber-50/95 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/12 dark:text-amber-200",
  error:
    "border-rose-200/90 bg-rose-50/95 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/12 dark:text-rose-200",
  loading:
    "border-[#d8c39f]/80 bg-[#fbf5e9]/95 text-[#9a6f32] dark:border-[#c9a15f]/30 dark:bg-[#c9a15f]/12 dark:text-[#e6c98d]",
}

function ToastGlyph({
  tone,
  children,
}: {
  tone: ToastTone
  children: React.ReactNode
}) {
  return (
    <span
      aria-hidden="true"
      className={[
        "grid size-9 shrink-0 place-items-center rounded-full border",
        "shadow-[0_8px_22px_rgba(112,91,64,0.12)] backdrop-blur-sm",
        toneClasses[tone],
      ].join(" ")}
    >
      {children}
    </span>
  )
}

const toastShell = [
  "group/toast relative isolate overflow-hidden rounded-[18px]",
  "border border-[#d8c39f]/70",
  "!bg-white ring-1 ring-white/90 dark:!bg-[#171717]",
  "text-slate-950 shadow-[0_20px_55px_rgba(112,91,64,0.18)]",
  "backdrop-blur-2xl",
  "before:pointer-events-none before:absolute before:-inset-[70%] before:z-0 before:opacity-[0.14] before:content-['']",
  "before:bg-[conic-gradient(from_115deg_at_50%_50%,transparent_0deg,rgba(217,185,121,0.06)_65deg,rgba(200,158,88,0.34)_104deg,transparent_148deg,transparent_360deg)]",
  "before:animate-[spin_14s_linear_infinite]",
  "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:h-[2px] after:content-['']",
  "after:bg-[linear-gradient(90deg,transparent,#d9b979_20%,#c89e58_50%,#b7853f_80%,transparent)]",
  "dark:border-[#c9a15f]/35",
  "dark:bg-[radial-gradient(circle_at_10%_15%,rgba(217,185,121,0.12),transparent_32%),radial-gradient(circle_at_92%_88%,rgba(181,133,63,0.10),transparent_30%),linear-gradient(145deg,rgba(20,20,22,0.97),rgba(31,28,24,0.93))]",
  "dark:text-white",
  "motion-reduce:before:animate-none",
].join(" ")

const Toaster = ({
  style,
  toastOptions,
  ...props
}: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <ToastGlyph tone="success">
            <CircleCheckIcon className="size-[18px]" />
          </ToastGlyph>
        ),
        info: (
          <ToastGlyph tone="info">
            <InfoIcon className="size-[18px]" />
          </ToastGlyph>
        ),
        warning: (
          <ToastGlyph tone="warning">
            <TriangleAlertIcon className="size-[18px]" />
          </ToastGlyph>
        ),
        error: (
          <ToastGlyph tone="error">
            <OctagonXIcon className="size-[18px]" />
          </ToastGlyph>
        ),
        loading: (
          <ToastGlyph tone="loading">
            <Loader2Icon className="size-[18px] animate-spin" />
          </ToastGlyph>
        ),
      }}
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast: toastShell,
          content: "relative z-10 gap-0.5",
          title:
            "text-sm font-semibold tracking-tight text-slate-950 dark:text-white",
          description:
            "text-xs leading-5 text-slate-600 dark:text-slate-300",
          icon: "relative z-10 !m-0 !size-9 !shrink-0",
          actionButton:
            "relative z-10 rounded-xl border border-[#b58c4d]/45 bg-[linear-gradient(110deg,#d9b979_0%,#c89e58_48%,#b7853f_100%)] px-3 text-white shadow-sm hover:brightness-[0.97]",
          cancelButton:
            "relative z-10 rounded-xl border border-[#d8c39f]/70 bg-white/80 px-3 text-slate-700 hover:bg-[#fbf5e9] dark:bg-white/10 dark:text-white",
          closeButton:
            "relative z-20 !start-auto !end-2 !top-2 border-[#d8c39f]/70 bg-white/90 text-[#8f6a37] shadow-sm hover:bg-[#fbf5e9] dark:bg-black/35 dark:text-[#e2c486]",
          ...toastOptions?.classNames,
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--success-bg": "#ffffff",
          "--info-bg": "#ffffff",
          "--warning-bg": "#ffffff",
          "--error-bg": "#ffffff",
          "--normal-text": "inherit",
          "--normal-border": "transparent",
          "--border-radius": "18px",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
