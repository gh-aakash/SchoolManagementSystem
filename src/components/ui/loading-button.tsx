'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button, ButtonProps } from "./button"
import { cn } from "@/lib/utils"

interface LoadingButtonProps extends ButtonProps {
    isLoading?: boolean
    loadingText?: string
}

const IOSSpinner = () => (
    <div className="ios-spinner mr-2">
        {[...Array(12)].map((_, i) => (
            <div key={i} className="ios-spinner-leaf" />
        ))}
    </div>
)

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
    ({ className, isLoading, loadingText, children, disabled, ...props }, ref) => {
        return (
            <motion.div
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
                <Button
                    ref={ref}
                    className={cn("relative overflow-hidden transition-all duration-200", className)}
                    disabled={isLoading || disabled}
                    {...props}
                >
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center justify-center gap-2"
                            >
                                <IOSSpinner />
                                {loadingText && <span>{loadingText}</span>}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {children}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </motion.div>
        )
    }
)
LoadingButton.displayName = "LoadingButton"

export { LoadingButton }
