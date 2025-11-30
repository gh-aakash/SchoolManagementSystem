'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    IndianRupee,
    Settings,
    History,
    Bell,
    UserPlus
} from 'lucide-react'

const sidebarItems = [
    {
        title: 'Overview',
        href: '/dashboard/fees',
        icon: LayoutDashboard
    },
    {
        title: 'Collect Fee',
        href: '/dashboard/fees/collect',
        icon: IndianRupee
    },
    {
        title: 'Fee Structure',
        href: '/dashboard/fees/structure',
        icon: Settings
    },
    {
        title: 'Assign Fee',
        href: '/dashboard/fees/assign',
        icon: UserPlus
    },
    {
        title: 'Fee History',
        href: '/dashboard/fees/history',
        icon: History
    },
    {
        title: 'Reminders',
        href: '/dashboard/fees/reminders',
        icon: Bell
    }
]

export default function FeeLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-64 shrink-0">
                <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>
            </aside>
            <main className="flex-1 min-w-0">
                {children}
            </main>
        </div>
    )
}
