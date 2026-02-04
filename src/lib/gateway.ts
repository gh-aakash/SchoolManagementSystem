export async function gatewayFetch(path: string, options: RequestInit = {}) {
    const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8000';
    const url = `${GATEWAY_URL}${path}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Gateway fetch failed [${response.status}] for ${path}`);
        }

        return await response.json();
    } catch (err: any) {
        if (err.name === 'AbortError') {
            throw new Error(`Gateway timeout (15s) for ${path}`);
        }
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}
