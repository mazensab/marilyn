import type { ReactNode } from "react"

import { SiteHeader } from "@/components/layout/header"
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
// system_workspace_white_floor_v1=true
// system_workspace_sticky_header_fix_v1=true
// system_workspace_sticky_header_opaque_layer_v2=true
// system_workspace_sticky_header_transparent_layer_v3=true

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
      className="relative min-h-svh overflow-x-clip bg-white text-foreground dark:bg-slate-950"
    >

      <SidebarProvider>
        {isSystem ? (
          <div
            className={cn(
              "relative z-10 mx-auto flex min-h-svh w-full max-w-none flex-col overflow-x-clip",
              compact
                ? "px-2 pb-2 pt-2"
                : "px-3 pb-4 pt-3 md:px-5 md:pb-5 xl:px-7 xl:pb-7",
            )}
          >
            <div className="sticky top-0 z-50 isolate bg-transparent py-2">
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
