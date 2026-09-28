import { isIP } from "node:net";
import { Resolver } from "node:dns/promises";

const TIMEOUT_MS = 8000;
const ALLOWED_PORTS = new Set(["", "80", "443"]);

export function isBlockedV4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

export function isBlockedV6(raw: string): boolean {
  const ip = raw.toLowerCase();
  if (ip === "::" || ip === "::1") return true;
  const dotted = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return isBlockedV4(dotted[1]);
  const hex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const hi = parseInt(hex[1], 16);
    const lo = parseInt(hex[2], 16);
    return isBlockedV4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  const h = parseInt(ip.split(":")[0] || "0", 16);
  return (
    (h & 0xfe00) === 0xfc00 ||
    (h & 0xffc0) === 0xfe80 ||
    (h & 0xff00) === 0xff00 ||
    h === 0x64 ||
    h === 0x2002 ||
    ip.startsWith("2001:db8")
  );
}

export const isBlockedIp = (ip: string) =>
  isIP(ip) === 4 ? isBlockedV4(ip) : isIP(ip) === 6 ? isBlockedV6(ip) : true;

async function resolveDoh(host: string, type: "A" | "AAAA"): Promise<string[]> {
  const endpoint = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`;
  const res = await fetch(endpoint, {
    headers: { Accept: "application/dns-json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`DNS over HTTPS error: ${res.status}`);
  const data = (await res.json()) as {
    Answer?: { type?: number; data: string }[];
  };
  const want = type === "A" ? 1 : 28;
  return (data.Answer ?? [])
    .filter((answer) => answer.type === want)
    .map((answer) => answer.data.replace(/\.$/, ""));
}

async function resolveSystem(host: string): Promise<string[]> {
  const resolver = new Resolver();
  resolver.setServers(["1.1.1.1", "8.8.8.8"]);
  const ips: string[] = [];
  const [a, aaaa] = await Promise.allSettled([
    resolver.resolve4(host),
    resolver.resolve6(host),
  ]);
  if (a.status === "fulfilled") ips.push(...a.value);
  if (aaaa.status === "fulfilled") ips.push(...aaaa.value);
  return ips;
}

export async function assertSafe(u: URL): Promise<void> {
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("http/https 以外は対応していません");
  }
  if (u.username || u.password) throw new Error("認証情報つきURLは拒否します");
  if (!ALLOWED_PORTS.has(u.port)) {
    throw new Error(`ポート ${u.port} は許可されていません`);
  }
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".arpa")
  ) {
    throw new Error("内部向けホスト名は拒否します");
  }

  let ips: string[] = [];
  if (isIP(host)) {
    ips = [host];
  } else {
    const [a, aaaa] = await Promise.allSettled([
      resolveDoh(host, "A"),
      resolveDoh(host, "AAAA"),
    ]);
    if (a.status === "fulfilled") ips.push(...a.value);
    if (aaaa.status === "fulfilled") ips.push(...aaaa.value);
    if (ips.length === 0) {
      try {
        ips.push(...(await resolveSystem(host)));
      } catch {
        /* resolve failure handled below */
      }
    }
  }
  if (ips.length === 0) throw new Error("名前解決に失敗しました");
  const bad = ips.find(isBlockedIp);
  if (bad) throw new Error(`内部/予約アドレス (${bad}) に解決されるため拒否`);
}

export function normalizeInputUrl(raw: string): string {
  const target = raw.trim();
  if (!target) throw new Error("URLを入力してください");
  if (target.length > 2048) throw new Error("URLが長すぎます");
  return new URL(
    /^[a-z][a-z0-9+.-]*:/i.test(target) ? target : `https://${target}`,
  ).href;
}
