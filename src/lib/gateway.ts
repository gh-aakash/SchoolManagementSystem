export async function gatewayFetch(path: string, options: RequestInit = {}) {
    const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8000';
    const url = `${GATEWAY_URL}${path}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        cache: 'no-store', // Ensure fresh data for dashboard
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Gateway fetch failed: ${response.status}`);
    }

    return response.json();
}
