
const META_API_VERSION = 'v18.0'

export async function sendWhatsAppMessage(to: string, templateName: string, languageCode: string = 'en_US', components: any[] = []) {
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID
    const accessToken = process.env.META_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken) {
        console.error('Meta API credentials missing')
        return { error: 'Meta API credentials missing' }
    }

    const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`

    const body = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
            name: templateName,
            language: {
                code: languageCode
            },
            components: components
        }
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('WhatsApp API Error:', data)
            return { error: data.error?.message || 'Failed to send WhatsApp message' }
        }

        return { success: true, data }
    } catch (error) {
        console.error('WhatsApp Fetch Error:', error)
        return { error: 'Network error sending WhatsApp message' }
    }
}
