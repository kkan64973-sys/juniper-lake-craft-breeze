export async function readApiError(
  res: Response,
  fallback: string,
): Promise<string> {
  const ct = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (ct.includes("application/json") && text) {
    try {
      const parsed = JSON.parse(text) as { error?: unknown };
      if (typeof parsed.error === "string" && parsed.error.trim()) {
        return parsed.error;
      }
    } catch {
      /* fall through */
    }
  }

  if (res.status === 502 || res.status === 504) {
    return "接続がタイムアウトしました。もう一度試してください。";
  }

  if (text.trim().startsWith("<!")) {
    return `サーバーエラー (HTTP ${res.status})。もう一度試してください。`;
  }

  const clipped = text.replace(/\s+/g, " ").trim().slice(0, 280);
  return clipped || fallback;
}
