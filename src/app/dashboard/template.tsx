'use client'

import { PageTransition } from '@/components/ui/motion'
import { AnimatePresence } from 'framer-motion'

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <AnimatePresence mode="wait">
            <PageTransition className="w-full h-full">
                {children}
            </PageTransition>
        </AnimatePresence>
    )
}
