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
                    className={cn(
                        "relative overflow-hidden transition-all duration-300 min-w-[140px]",
                        isLoading && "animate-pulse opacity-90",
                        className
                    )}
                    disabled={isLoading || disabled}
                    {...props}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <IOSSpinner />
                            {loadingText && <span>{loadingText}</span>}
                        </div>
                    ) : (
                        <div>{children}</div>
                    )}
                </Button>
            </motion.div>
        )
    }
)
LoadingButton.displayName = "LoadingButton"

export { LoadingButton }
