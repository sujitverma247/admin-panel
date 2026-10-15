export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8080"

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export class NetworkError extends Error {
  constructor(message = "Unable to reach the server. Check that the API is running and try again.") {
    super(message)
    this.name = "NetworkError"
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  token?: string | null
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers, ...init } = options
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      ...init,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch (err) {
    if (init.signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) throw err
    throw new NetworkError()
  }

  if (!res.ok) {
    throw new ApiError(res.status, await readError(res))
  }

  return res.json() as Promise<T>
}

export async function apiBlob(
  path: string,
  token: string,
  signal?: AbortSignal,
  fallbackName = "download.pdf",
): Promise<{ blob: Blob; fileName: string }> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      signal,
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (err) {
    if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) throw err
    throw new NetworkError()
  }
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  const blob = await res.blob()
  const fileName = fileNameFromDisposition(res.headers.get("Content-Disposition")) || fallbackName
  return { blob, fileName }
}

function fileNameFromDisposition(header: string | null) {
  if (!header) return ""
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (star) return decodeURIComponent(star[1])
  const quoted = /filename="([^"]+)"/i.exec(header)
  if (quoted) return quoted[1]
  const plain = /filename=([^;]+)/i.exec(header)
  return plain ? plain[1].trim() : ""
}

export function toLoginError(err: unknown): string {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 400) return "Enter your username and password."
    if (err.status === 401) return "Incorrect username or password."
    if (err.status === 403) return "You do not have access to this account."
    if (err.status === 429) return "Too many attempts. Please wait and try again."
    if (err.status >= 500) return "Something went wrong. Please try again."
    return "Unable to sign in. Please try again."
  }
  return "Unable to sign in. Please try again."
}

async function readError(res: Response) {
  try {
    const payload = (await res.json()) as { error?: string }
    return payload.error ?? "request failed"
  } catch {
    return "request failed"
  }
}
