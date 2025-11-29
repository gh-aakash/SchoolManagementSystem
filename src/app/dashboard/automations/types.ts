
export type TriggerType = 'FEE_DUE' | 'NEW_ADMISSION' | 'ATTENDANCE_LOW' | 'EXAM_RESULT'

export type Operator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'contains'

export interface Condition {
    id: string
    type: 'condition'
    field: string
    operator: Operator
    value: string
}

export interface ConditionGroup {
    id: string
    type: 'group'
    logic: 'AND' | 'OR'
    conditions: (Condition | ConditionGroup)[]
}

export type ActionType = 'SEND_EMAIL' | 'SEND_SMS' | 'SEND_WHATSAPP'

export interface Action {
    id: string
    type: ActionType
    params: Record<string, any>
    delay?: number // minutes
}

export interface AutomationRule {
    id?: string
    name: string
    description?: string
    trigger_type: TriggerType
    conditions: ConditionGroup
    actions: Action[]
    is_active: boolean
}

export const TRIGGER_OPTIONS: { value: TriggerType; label: string }[] = [
    { value: 'FEE_DUE', label: 'Fee Due Reminder' },
    { value: 'FEE_PAID', label: 'Fee Payment Confirmation' },
    { value: 'NEW_ADMISSION', label: 'New Student Admission' },
    { value: 'ATTENDANCE_LOW', label: 'Low Attendance Alert' },
    { value: 'ATTENDANCE_ABSENT', label: 'Student Absent Alert' },
    { value: 'EXAM_RESULT', label: 'Exam Result Declared' },
]

export const FIELD_OPTIONS: { value: string; label: string; type: 'string' | 'number' | 'date' | 'boolean' }[] = [
    { value: 'student.class_id', label: 'Student Class', type: 'string' },
    { value: 'student.section_id', label: 'Student Section', type: 'string' },
    { value: 'student.gender', label: 'Gender', type: 'string' },
    { value: 'student.religion', label: 'Religion', type: 'string' },
    { value: 'student.caste_category', label: 'Category', type: 'string' },
    { value: 'fee.amount_due', label: 'Fee Amount Due', type: 'number' },
    { value: 'fee.amount_paid', label: 'Fee Amount Paid', type: 'number' },
    { value: 'fee.days_overdue', label: 'Days Overdue', type: 'number' },
    { value: 'fee.last_payment_date', label: 'Last Payment Date', type: 'date' },
    { value: 'attendance.status', label: 'Attendance Status', type: 'string' },
    { value: 'attendance.percentage', label: 'Attendance %', type: 'number' },
    { value: 'exam.percentage', label: 'Exam Percentage', type: 'number' },
    { value: 'exam.grade', label: 'Exam Grade', type: 'string' },
]

export const ACTION_OPTIONS: { value: ActionType; label: string }[] = [
    { value: 'SEND_WHATSAPP', label: 'Send WhatsApp Message' },
    { value: 'SEND_EMAIL', label: 'Send Email' },
    { value: 'SEND_SMS', label: 'Send SMS' },
]
