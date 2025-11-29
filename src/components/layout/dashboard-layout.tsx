
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Bus,
    Settings,
    LogOut,
    Menu,
    IndianRupee,
    Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Students', href: '/dashboard/students' },
    { icon: IndianRupee, label: 'Fees', href: '/dashboard/fees' },
    { icon: Bell, label: 'Notifications', href: '/dashboard/notifications/create' },
    { icon: GraduationCap, label: 'Academics', href: '/dashboard/academics' },
    { icon: Bus, label: 'Transport', href: '/dashboard/transport' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const supabase = createClient()

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const SidebarContent = () => (
        <div className="flex h-full flex-col gap-4">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <span className="">SchoolOS</span>
                </Link>
            </div>
            <div className="flex-1">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${pathname === item.href
                                ? 'bg-muted text-primary'
                                : 'text-muted-foreground'
                                }`}
                            onClick={() => setIsMobileOpen(false)}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="mt-auto p-4">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    )

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 md:block">
                <SidebarContent />
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                        {/* Add search or breadcrumbs here if needed */}
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <span className="sr-only">User menu</span>
                        {/* User avatar can go here */}
                    </Button>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
