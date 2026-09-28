import { isIP } from "node:net";
import { analyzeHtml } from "./html";
import { assertSafe } from "./ssrf";
import type { Hop, PageInfo, TraceResult } from "./types";

const MAX_HOPS = 10;
const TIMEOUT_MS = 8000;
const MAX_BODY = 256 * 1024;
const UA = "Mozilla/5.0 (compatible; redirect-checker/3.0)";

const CAVEAT =
  "JavaScriptによる転送は静的解析では追えません（スクリーンショットで確認）。安全性の判定ではありません。";

async function fetchHop(url: URL) {
  const res = await fetch(url, {
    method: "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": UA, Accept: "text/html,*/*;q=0.8" },
  });
  const isHtml =
    res.status >= 200 &&
    res.status < 300 &&
    (res.headers.get("content-type") ?? "").includes("html");
  if (!isHtml || !res.body) {
    await res.body?.cancel();
    return { res, html: undefined as string | undefined };
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BODY) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel();
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.length;
  }
  return { res, html: new TextDecoder("utf-8").decode(buf) };
}

function makeWarnings(hops: Hop[], page?: PageInfo): string[] {
  const w: string[] = [];
  const last = new URL(hops[hops.length - 1].url);
  const host = last.hostname.replace(/^\[|\]$/g, "");

  if (hops.length > 4) w.push(`転送が${hops.length - 1}回あります`);
  if (hops.some((h) => h.via === "meta refresh")) {
    w.push("meta refresh による転送を含みます");
  }
  if (host.includes("xn--")) {
    w.push("最終ドメインがpunycode（似せた偽ドメインの可能性）");
  }
  if (isIP(host)) w.push("最終到達先がIPアドレス直指定です");
  if (last.protocol === "http:") {
    w.push("最終到達先が暗号化されていません (http)");
  }

  if (page) {
    if (page.passwordInputs > 0) w.push("パスワード入力欄があります");
    const cross = page.forms.filter((f) => f.crossHost);
    if (page.passwordInputs > 0 && cross.length > 0) {
      w.push(
        `フォームの送信先が別ドメインです: ${new URL(cross[0].action).hostname}`,
      );
    }
    if (page.iframes > 0) w.push(`iframeが${page.iframes}個あります`);
  }
  return w;
}

export async function trace(input: string): Promise<TraceResult> {
  const hops: Hop[] = [];
  const seen = new Set<string>();
  let url = new URL(input);
  let via: string | undefined;
  let page: PageInfo | undefined;
  let note: string | undefined;

  for (let i = 0; i <= MAX_HOPS; i++) {
    if (seen.has(url.href)) {
      note = "リダイレクトがループしています";
      break;
    }
    seen.add(url.href);
    const hop: Hop = { url: url.href, via };
    via = undefined;
    page = undefined;
    hops.push(hop);

    try {
      await assertSafe(url);
    } catch (e) {
      hop.blocked = (e as Error).message;
      break;
    }

    try {
      const { res, html } = await fetchHop(url);
      hop.status = res.status;

      const loc = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && loc) {
        url = new URL(loc, url);
        hop.location = url.href;
        via = "HTTP";
      } else if (html) {
        page = analyzeHtml(html, url);
        if (page.metaRefresh) {
          url = new URL(page.metaRefresh, url);
          hop.location = url.href;
          via = "meta refresh";
        }
      }
      if (!hop.location) break;
      if (i === MAX_HOPS) note = `${MAX_HOPS}回を超えたため打ち切り`;
    } catch (e) {
      hop.error =
        (e as Error).name === "TimeoutError" ||
        (e as Error).name === "AbortError"
          ? "タイムアウト"
          : "接続に失敗しました";
      break;
    }
  }

  const last = hops[hops.length - 1];
  const complete =
    last?.status !== undefined && !last.location && !last.blocked && !last.error;

  return {
    hops,
    final: last?.url,
    complete,
    page: complete ? page : undefined,
    warnings: complete ? makeWarnings(hops, page) : [],
    note,
    caveat: CAVEAT,
  };
}
