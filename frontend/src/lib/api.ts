/**
 * Thin fetch wrapper. Admin calls rely on the Laravel session cookie and send
 * the XSRF-TOKEN cookie back as a header, which Laravel checks for CSRF.
 */
export class ApiError extends Error {
  status: number
  errors: Record<string, string[]>

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

function xsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  const token = xsrfToken()
  if (token) headers.set('X-XSRF-TOKEN', token)

  let body = init.body
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(init.json)
  }

  const response = await fetch(path, { ...init, headers, body, credentials: 'same-origin' })

  if (!response.ok) {
    let payload: { message?: string; errors?: Record<string, string[]> } = {}
    try {
      payload = await response.json()
    } catch {
      // Non-JSON error page (proxy, timeout): keep the generic message.
    }
    const first = payload.errors ? Object.values(payload.errors)[0]?.[0] : undefined
    throw new ApiError(response.status, first ?? payload.message ?? `Errore ${response.status}`, payload.errors)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
