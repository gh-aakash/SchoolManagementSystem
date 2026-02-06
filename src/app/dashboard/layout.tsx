
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageTransition } from '@/components/ui/motion'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <PageTransition>{children}</PageTransition>
        </DashboardLayout>
    )
}
