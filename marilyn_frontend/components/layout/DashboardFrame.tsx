import type { ReactNode } from "react"

import { SiteHeader } from "@/components/layout/header"
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type DashboardFrameProps = {
  children: ReactNode
  sidebarType: "system" | "company"
  compact?: boolean
}

export default function DashboardFrame({
  children,
  sidebarType,
  compact = false,
}: DashboardFrameProps) {
  const isSystem = sidebarType === "system"

  return (
    <div
      className={cn(
        "relative min-h-svh overflow-x-hidden text-foreground",
        isSystem
          ? "bg-[#e9e1d7] dark:bg-slate-950"
          : "bg-white dark:bg-slate-950",
      )}
    >
      {isSystem ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,255,255,0.92),transparent_31%),radial-gradient(circle_at_88%_76%,rgba(206,180,138,0.20),transparent_34%),linear-gradient(145deg,#eee7de_0%,#e7ded3_44%,#f0ebe4_100%)] dark:hidden" />
          <div className="absolute -left-24 top-[-5rem] h-[30rem] w-[11rem] rotate-[38deg] rounded-full bg-white/50 blur-2xl dark:hidden" />
          <div className="absolute left-[10%] top-[-8rem] h-[32rem] w-[5rem] rotate-[38deg] rounded-full bg-white/35 blur-xl dark:hidden" />
          <div className="absolute right-[4%] top-0 h-full w-px bg-white/40 dark:hidden" />
          <div className="absolute right-[5.5%] top-0 h-full w-px bg-[#c6b8a5]/25 dark:hidden" />
          <div className="absolute right-[7%] top-0 h-full w-px bg-white/40 dark:hidden" />
          <div className="absolute -bottom-20 -left-16 h-72 w-72 rounded-full border-[44px] border-white/25 blur-[1px] dark:hidden" />
          <div className="absolute -bottom-36 right-[-5rem] h-96 w-96 rounded-full bg-[#d8c2a4]/20 blur-3xl dark:hidden" />
        </div>
      ) : null}

      <SidebarProvider>
        {isSystem ? (
          <div
            className={cn(
              "relative z-10 mx-auto flex min-h-svh w-full max-w-none flex-col overflow-x-hidden",
              compact
                ? "px-2 pb-2 pt-2"
                : "px-3 pb-4 pt-3 md:px-5 md:pb-5 xl:px-7 xl:pb-7",
            )}
          >
            <div className="sticky top-2 z-50 isolate">
              <SiteHeader sidebarType="system" />
            </div>

            <main
              className={cn(
                "min-w-0 flex-1",
                compact ? "pt-3" : "pt-4 xl:pt-5",
              )}
            >
              {children}
            </main>
          </div>
        ) : (
          <>
            <AppSidebar type={sidebarType} />

            <SidebarInset className="min-h-svh overflow-x-hidden bg-white text-foreground dark:bg-slate-950">
              <div
                className={cn(
                  "flex min-h-svh flex-1 flex-col bg-white dark:bg-slate-950",
                  compact
                    ? "px-2 pb-2 pt-2"
                    : "px-2 pb-2 pt-2 md:px-3 md:pb-3 md:pt-3 xl:px-4 xl:pb-4 xl:pt-3",
                )}
              >
                <div
                  className={cn(
                    "sticky top-2 z-50 isolate overflow-hidden",
                    "border border-slate-200/70 bg-white",
                    "shadow-[0_12px_32px_rgba(15,23,42,0.045)]",
                    "dark:border-white/10 dark:bg-slate-950",
                    "dark:shadow-[0_14px_38px_rgba(0,0,0,0.28)]",
                    "[&>header]:rounded-[inherit] [&>header]:bg-transparent",
                    "[&>header>div]:rounded-[inherit]",
                    compact ? "rounded-[1.35rem]" : "rounded-[1.65rem]",
                  )}
                >
                  <SiteHeader sidebarType="company" />
                </div>

                <main
                  className={cn(
                    "mt-3 min-w-0 flex-1 bg-white dark:bg-slate-950",
                    compact ? "p-2 md:p-3" : "p-3 md:p-4 xl:p-5",
                  )}
                >
                  <div className="min-w-0 bg-white dark:bg-slate-950">
                    {children}
                  </div>
                </main>
              </div>
            </SidebarInset>
          </>
        )}
      </SidebarProvider>
    </div>
  )
}
