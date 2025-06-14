"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, History, Database, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const routes = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    // {
    //   href: "/history",
    //   label: "History",
    //   icon: History,
    //   active: pathname === "/history",
    // },
    // {
    //   href: "/saved",
    //   label: "Saved Data",
    //   icon: Database,
    //   active: pathname === "/saved",
    // },
    // {
    //   href: "/database",
    //   label: "Database",
    //   icon: Database,
    //   active: pathname === "/database",
    // },
  ]

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile sidebar toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out bg-background border-r",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h2 className="text-2xl font-bold">Web Scraper</h2>
          </div>
          <ScrollArea className="flex-1">
            <nav className="grid gap-2 px-4">
              {routes.map((route) => (
                <Link key={route.href} href={route.href} onClick={() => setSidebarOpen(false)}>
                  <Button variant={route.active ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <route.icon className="h-4 w-4" />
                    {route.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </ScrollArea>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-6 md:p-10">{children}</main>
    </div>
  )
}
