"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, History, Database, Menu, X, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuthStore } from "@/lib/auth-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()

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

  const handleLogout = () => {
    logout()
    // The ProtectedRoute component will handle redirecting to login
  }

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

          {/* User section in sidebar */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.username?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.username || "Admin"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "admin@webcrawler.com"}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Top header for desktop */}
      <div className="hidden md:block fixed top-0 right-0 left-64 z-30 bg-background border-b">
        <div className="flex items-center justify-end h-16 px-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.username?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.username || "Admin"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || "admin@webcrawler.com"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 md:mt-16 p-6 md:p-10">{children}</main>
    </div>
  )
}
