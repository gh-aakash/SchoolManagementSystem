
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing');
        return { success: false, error: 'Email configuration missing' };
    }

    try {
        const data = await resend.emails.send({
            from: 'SchoolOS <onboarding@resend.dev>', // Default for testing
            to: to,
            subject: subject,
            html: html,
        });

        if (data.error) {
            console.error('Resend API Error:', data.error);
            return { success: false, error: data.error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: 'Failed to send email' };
    }
}
