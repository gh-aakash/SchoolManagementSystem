
import { createClient } from '@/lib/supabase/server'
import { RuleBuilder } from '../create/rule-builder'
import { Separator } from '@/components/ui/separator'
import { notFound } from 'next/navigation'
import { AutomationRule } from '../types'

export default async function EditAutomationPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { id } = params

    const { data: automation } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .single()

    // ...

    if (!automation) return notFound()

    const typedAutomation = automation as unknown as AutomationRule

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Edit Automation</h3>
                <p className="text-muted-foreground">
                    Modify your automation rule.
                </p>
            </div>
            <Separator />
            <RuleBuilder initialData={typedAutomation} isEditMode={true} />
        </div>
    )
}
