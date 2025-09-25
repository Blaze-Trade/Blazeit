import { ApiResponse } from "../../shared/types"

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init })
  
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>
  } catch (jsonError) {
    // If JSON parsing fails, check if it's an HTML response (404 page)
    if (res.headers.get('content-type')?.includes('text/html')) {
      throw new Error(`API endpoint not found: ${path}. Make sure the worker is running on port 8787.`);
    }
    throw new Error(`Failed to parse JSON response: ${jsonError}`);
  }
  
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || 'Request failed')
  }
  return json.data
}