
import { RuleBuilder } from './rule-builder'
import { Separator } from '@/components/ui/separator'

export default function CreateAutomationPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Create Automation</h3>
                <p className="text-muted-foreground">
                    Define triggers, conditions, and actions for your workflow.
                </p>
            </div>
            <Separator />
            <RuleBuilder />
        </div>
    )
}
