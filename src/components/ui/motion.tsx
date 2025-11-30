'use client'

import { motion, HTMLMotionProps, Variants } from 'framer-motion'
import { ReactNode } from 'react'

interface MotionProps {
    children: ReactNode
    className?: string
    delay?: number
}

export const FadeIn = ({ children, className, delay = 0 }: MotionProps) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.4, delay, ease: 'easeOut' }}
        className={className}
    >
        {children}
    </motion.div>
)

export const SlideUp = ({ children, className, delay = 0 }: MotionProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay, ease: 'backOut' }}
        className={className}
    >
        {children}
    </motion.div>
)

export const SlideInFromLeft = ({ children, className, delay = 0 }: MotionProps) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4, delay, ease: 'easeOut' }}
        className={className}
    >
        {children}
    </motion.div>
)

export const PageTransition = ({ children, className }: { children: ReactNode; className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={className}
    >
        {children}
    </motion.div>
)

export const StaggerContainer = ({ children, className, delay = 0 }: MotionProps) => (
    <motion.div
        initial="hidden"
        animate="show"
        variants={{
            hidden: { opacity: 0 },
            show: {
                opacity: 1,
                transition: {
                    staggerChildren: 0.1,
                    delayChildren: delay
                }
            }
        }}
        className={className}
    >
        {children}
    </motion.div>
)

export const StaggerItem = ({ children, className }: { children: ReactNode; className?: string }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0 }
        }}
        className={className}
    >
        {children}
    </motion.div>
)
