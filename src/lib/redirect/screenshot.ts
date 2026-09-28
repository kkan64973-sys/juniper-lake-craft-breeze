import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { isIP } from "node:net";
import { assertSafe, isBlockedIp } from "./ssrf";
import { trace } from "./trace";

const TOTAL_LIMIT_MS = 12000;
const VIEWPORT = { width: 390, height: 844 };
const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";

export type ShotResult = {
  png: Buffer;
  pageUrl: string;
};

function remaining(started: number) {
  return Math.max(400, TOTAL_LIMIT_MS - (Date.now() - started));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function timed<T>(
  operation: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} がタイムアウトしました (${ms}ms)`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function findChrome(): string | undefined {
  const envPath =
    process.env.PLAYWRIGHT_CHROMIUM_PATH || process.env.CHROME_PATH;
  if (envPath && existsSync(envPath)) return envPath;

  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;
  try {
    for (const dir of readdirSync(root)) {
      if (!dir.startsWith("chromium")) continue;
      const candidate = join(root, dir, "chrome-linux64", "chrome");
      if (existsSync(candidate)) return candidate;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function isUnsafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return true;
    const host = u.hostname.replace(/^\[|\]$/g, "");
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return true;
    }
    if (isIP(host) && isBlockedIp(host)) return true;
    if (u.port && u.port !== "80" && u.port !== "443") return true;
    return false;
  } catch {
    return true;
  }
}

type PlaywrightModule = typeof import("playwright-core");

let chromiumImport: Promise<PlaywrightModule["chromium"]> | undefined;
let browserPromise: Promise<import("playwright-core").Browser> | undefined;

async function loadChromium() {
  if (!chromiumImport) {
    chromiumImport = import("playwright-core")
      .then((mod) => mod.chromium)
      .catch((err) => {
        chromiumImport = undefined;
        throw err;
      });
  }
  return chromiumImport;
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const chromium = await loadChromium();
      const executablePath = findChrome();
      return chromium.launch({
        headless: true,
        executablePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-extensions",
          "--hide-scrollbars",
        ],
      });
    })().catch((err) => {
      browserPromise = undefined;
      throw err;
    });
  }
  return browserPromise;
}

async function screenshotWithPlaywright(
  url: string,
  started: number,
): Promise<ShotResult> {
  const browser = await timed(
    getBrowser(),
    Math.min(4000, remaining(started)),
    "ブラウザ起動",
  );
  const context = await browser.newContext({
    viewport: VIEWPORT,
    userAgent: UA,
    javaScriptEnabled: true,
    bypassCSP: false,
    locale: "ja-JP",
  });

  try {
    const page = await context.newPage();
    page.setDefaultTimeout(Math.min(8000, remaining(started)));

    await page.route("**/*", async (route) => {
      const reqUrl = route.request().url();
      if (isUnsafeUrl(reqUrl)) {
        await route.abort("blockedbyclient");
        return;
      }
      await route.continue();
    });

    await timed(
      page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: Math.min(8000, remaining(started)),
      }),
      Math.min(8500, remaining(started)),
      "ページ読み込み",
    );

    await sleep(Math.min(450, remaining(started)));

    const pageUrl = page.url();
    if (isUnsafeUrl(pageUrl)) {
      throw new Error("ブラウザが内部向けURLへ遷移したため中止しました");
    }
    await assertSafe(new URL(pageUrl));

    const png = await timed(
      page.screenshot({ type: "png", animations: "disabled" }),
      Math.min(3000, remaining(started)),
      "PNG 撮影",
    );

    return { png: Buffer.from(png), pageUrl };
  } finally {
    await Promise.race([context.close().catch(() => undefined), sleep(800)]);
  }
}

async function screenshotWithMicrolink(
  url: string,
  started: number,
): Promise<ShotResult> {
  const endpoint = new URL("https://api.microlink.io/");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("screenshot", "true");
  endpoint.searchParams.set("meta", "false");
  endpoint.searchParams.set("viewport.width", String(VIEWPORT.width));
  endpoint.searchParams.set("viewport.height", String(VIEWPORT.height));

  const res = await timed(
    fetch(endpoint, { signal: AbortSignal.timeout(Math.min(8000, remaining(started))) }),
    Math.min(8500, remaining(started)),
    "Microlink 撮影",
  );
  if (!res.ok) throw new Error(`Microlink HTTP ${res.status}`);
  const data = (await res.json()) as {
    status?: string;
    data?: { url?: string; screenshot?: { url?: string } };
  };
  const shot = data.data?.screenshot?.url;
  if (data.status !== "success" || !shot) {
    throw new Error("Microlink が画像を返しませんでした");
  }
  const img = await timed(
    fetch(shot, { signal: AbortSignal.timeout(Math.min(5000, remaining(started))) }),
    Math.min(5500, remaining(started)),
    "Microlink 画像取得",
  );
  if (!img.ok) throw new Error(`Microlink 画像 HTTP ${img.status}`);
  const png = Buffer.from(await img.arrayBuffer());
  if (png.length < 800) throw new Error("Microlink 画像が不正です");
  return { png, pageUrl: data.data?.url || url };
}

async function screenshotWithThum(
  url: string,
  started: number,
): Promise<ShotResult> {
  const shot = `https://image.thum.io/get/width/${VIEWPORT.width}/crop/${VIEWPORT.height}/noanimate/${url}`;
  const res = await timed(
    fetch(shot, { signal: AbortSignal.timeout(Math.min(8000, remaining(started))) }),
    Math.min(8500, remaining(started)),
    "thum.io 撮影",
  );
  if (!res.ok) throw new Error(`thum.io HTTP ${res.status}`);
  const ctype = res.headers.get("content-type") ?? "";
  if (!ctype.includes("image/")) throw new Error("thum.io が画像以外を返しました");
  const png = Buffer.from(await res.arrayBuffer());
  if (png.length < 800) throw new Error("thum.io 画像が不正です");
  return { png, pageUrl: url };
}

export async function captureScreenshot(inputUrl: string): Promise<ShotResult> {
  const started = Date.now();

  const traced = await timed(
    trace(inputUrl),
    Math.min(7000, remaining(started)),
    "リダイレクト確認",
  );

  if (!traced.complete || !traced.final) {
    throw new Error("到達を確認できないURLは撮影しません");
  }

  await assertSafe(new URL(traced.final));

  const errors: string[] = [];
  try {
    return await screenshotWithPlaywright(traced.final, started);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  try {
    return await screenshotWithMicrolink(traced.final, started);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  try {
    return await screenshotWithThum(traced.final, started);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  throw new Error(`撮影に失敗しました: ${errors[0] ?? "原因不明"}`);
}

