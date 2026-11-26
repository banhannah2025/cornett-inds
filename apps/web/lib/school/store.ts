import "server-only";

export function schoolStorageReady() {
  return Boolean(
    process.env.SCHOOL_SUPABASE_URL && process.env.SCHOOL_SUPABASE_SECRET_KEY,
  );
}
export async function schoolDb<T>(
  table: string,
  query: URLSearchParams,
  method = "GET",
  body?: unknown,
  upsert = false,
): Promise<T> {
  const base = process.env.SCHOOL_SUPABASE_URL;
  const key = process.env.SCHOOL_SUPABASE_SECRET_KEY;
  if (!base || !key)
    throw new Error("Private school storage is not configured.");
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: `return=representation${upsert ? ",resolution=merge-duplicates" : ""}`,
  };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  const response = await fetch(
    `${base.replace(/\/$/, "")}/rest/v1/${table}?${query}`,
    {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!response.ok)
    throw new Error(
      "School records are temporarily unavailable. No successful save has been confirmed.",
    );
  if (response.status === 204) return [] as T;
  return response.json() as Promise<T>;
}
export function query(values: Record<string, string>) {
  return new URLSearchParams(values);
}
