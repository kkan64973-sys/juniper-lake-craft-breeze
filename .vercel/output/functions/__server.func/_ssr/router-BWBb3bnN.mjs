import { i as __toESM, n as __exportAll } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as createFileRoute, b as require_jsx_runtime, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, v as createRootRoute, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { isIP } from "node:net";
import { Resolver } from "node:dns/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BWBb3bnN.js
var router_BWBb3bnN_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-CI5qoSwS.css";
var APP_NAME = "Redirect Checker";
var Route$4 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "短縮URLやリダイレクト経路を追跡し、到達先ページのスクリーンショットまで確認します。"
			},
			{
				name: "theme-color",
				content: "#0c0d0f"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "ja",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg text-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
var $$splitComponentImporter = () => import("./routes-DnJsaSCC.mjs");
var Route$3 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var TIMEOUT_MS$1 = 8e3;
var ALLOWED_PORTS = /* @__PURE__ */ new Set([
	"",
	"80",
	"443"
]);
function isBlockedV4(ip) {
	const [a, b] = ip.split(".").map(Number);
	return a === 0 || a === 10 || a === 127 || a === 100 && b >= 64 && b <= 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 192 && b === 0 || a === 198 && (b === 18 || b === 19) || a >= 224;
}
function isBlockedV6(raw) {
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
	return (h & 65024) === 64512 || (h & 65472) === 65152 || (h & 65280) === 65280 || h === 100 || h === 8194 || ip.startsWith("2001:db8");
}
var isBlockedIp = (ip) => isIP(ip) === 4 ? isBlockedV4(ip) : isIP(ip) === 6 ? isBlockedV6(ip) : true;
async function resolveDoh(host, type) {
	const endpoint = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`;
	const res = await fetch(endpoint, {
		headers: { Accept: "application/dns-json" },
		signal: AbortSignal.timeout(TIMEOUT_MS$1)
	});
	if (!res.ok) throw new Error(`DNS over HTTPS error: ${res.status}`);
	const data = await res.json();
	const want = type === "A" ? 1 : 28;
	return (data.Answer ?? []).filter((answer) => answer.type === want).map((answer) => answer.data.replace(/\.$/, ""));
}
async function resolveSystem(host) {
	const resolver = new Resolver();
	resolver.setServers(["1.1.1.1", "8.8.8.8"]);
	const ips = [];
	const [a, aaaa] = await Promise.allSettled([resolver.resolve4(host), resolver.resolve6(host)]);
	if (a.status === "fulfilled") ips.push(...a.value);
	if (aaaa.status === "fulfilled") ips.push(...aaaa.value);
	return ips;
}
async function assertSafe(u) {
	if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("http/https 以外は対応していません");
	if (u.username || u.password) throw new Error("認証情報つきURLは拒否します");
	if (!ALLOWED_PORTS.has(u.port)) throw new Error(`ポート ${u.port} は許可されていません`);
	const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
	if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".arpa")) throw new Error("内部向けホスト名は拒否します");
	let ips = [];
	if (isIP(host)) ips = [host];
	else {
		const [a, aaaa] = await Promise.allSettled([resolveDoh(host, "A"), resolveDoh(host, "AAAA")]);
		if (a.status === "fulfilled") ips.push(...a.value);
		if (aaaa.status === "fulfilled") ips.push(...aaaa.value);
		if (ips.length === 0) try {
			ips.push(...await resolveSystem(host));
		} catch {}
	}
	if (ips.length === 0) throw new Error("名前解決に失敗しました");
	const bad = ips.find(isBlockedIp);
	if (bad) throw new Error(`内部/予約アドレス (${bad}) に解決されるため拒否`);
}
function normalizeInputUrl(raw) {
	const target = raw.trim();
	if (!target) throw new Error("URLを入力してください");
	if (target.length > 2048) throw new Error("URLが長すぎます");
	return new URL(/^[a-z][a-z0-9+.-]*:/i.test(target) ? target : `https://${target}`).href;
}
function attr(tag, name) {
	const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
	return m ? m[2] ?? m[3] ?? m[4] : void 0;
}
function analyzeHtml(html, base) {
	const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim().slice(0, 200);
	let description;
	let metaRefresh;
	for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
		const tag = m[0];
		if (attr(tag, "name")?.toLowerCase() === "description") description = attr(tag, "content")?.slice(0, 300);
		if (attr(tag, "http-equiv")?.toLowerCase() === "refresh") metaRefresh = attr(tag, "content")?.match(/url\s*=\s*['"]?([^'";\s]+)/i)?.[1];
	}
	const forms = [...html.matchAll(/<form\b[^>]*>/gi)].slice(0, 10).map((m) => {
		let action = base.href;
		try {
			action = new URL(attr(m[0], "action") ?? "", base).href;
		} catch {}
		let crossHost = false;
		try {
			crossHost = new URL(action).hostname !== base.hostname;
		} catch {
			crossHost = false;
		}
		return {
			action,
			method: (attr(m[0], "method") ?? "get").toUpperCase(),
			crossHost
		};
	});
	return {
		title,
		description,
		passwordInputs: (html.match(/<input\b[^>]*type\s*=\s*["']?password/gi) ?? []).length,
		iframes: (html.match(/<iframe\b/gi) ?? []).length,
		forms,
		metaRefresh
	};
}
var MAX_HOPS = 10;
var TIMEOUT_MS = 8e3;
var MAX_BODY = 262144;
var UA$1 = "Mozilla/5.0 (compatible; redirect-checker/3.0)";
var CAVEAT = "JavaScriptによる転送は静的解析では追えません（スクリーンショットで確認）。安全性の判定ではありません。";
async function fetchHop(url) {
	const res = await fetch(url, {
		method: "GET",
		redirect: "manual",
		signal: AbortSignal.timeout(TIMEOUT_MS),
		headers: {
			"User-Agent": UA$1,
			Accept: "text/html,*/*;q=0.8"
		}
	});
	if (!(res.status >= 200 && res.status < 300 && (res.headers.get("content-type") ?? "").includes("html")) || !res.body) {
		await res.body?.cancel();
		return {
			res,
			html: void 0
		};
	}
	const reader = res.body.getReader();
	const chunks = [];
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
	return {
		res,
		html: new TextDecoder("utf-8").decode(buf)
	};
}
function makeWarnings(hops, page) {
	const w = [];
	const last = new URL(hops[hops.length - 1].url);
	const host = last.hostname.replace(/^\[|\]$/g, "");
	if (hops.length > 4) w.push(`転送が${hops.length - 1}回あります`);
	if (hops.some((h) => h.via === "meta refresh")) w.push("meta refresh による転送を含みます");
	if (host.includes("xn--")) w.push("最終ドメインがpunycode（似せた偽ドメインの可能性）");
	if (isIP(host)) w.push("最終到達先がIPアドレス直指定です");
	if (last.protocol === "http:") w.push("最終到達先が暗号化されていません (http)");
	if (page) {
		if (page.passwordInputs > 0) w.push("パスワード入力欄があります");
		const cross = page.forms.filter((f) => f.crossHost);
		if (page.passwordInputs > 0 && cross.length > 0) w.push(`フォームの送信先が別ドメインです: ${new URL(cross[0].action).hostname}`);
		if (page.iframes > 0) w.push(`iframeが${page.iframes}個あります`);
	}
	return w;
}
async function trace(input) {
	const hops = [];
	const seen = /* @__PURE__ */ new Set();
	let url = new URL(input);
	let via;
	let page;
	let note;
	for (let i = 0; i <= MAX_HOPS; i++) {
		if (seen.has(url.href)) {
			note = "リダイレクトがループしています";
			break;
		}
		seen.add(url.href);
		const hop = {
			url: url.href,
			via
		};
		via = void 0;
		page = void 0;
		hops.push(hop);
		try {
			await assertSafe(url);
		} catch (e) {
			hop.blocked = e.message;
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
			hop.error = e.name === "TimeoutError" || e.name === "AbortError" ? "タイムアウト" : "接続に失敗しました";
			break;
		}
	}
	const last = hops[hops.length - 1];
	const complete = last?.status !== void 0 && !last.location && !last.blocked && !last.error;
	return {
		hops,
		final: last?.url,
		complete,
		page: complete ? page : void 0,
		warnings: complete ? makeWarnings(hops, page) : [],
		note,
		caveat: CAVEAT
	};
}
var TOTAL_LIMIT_MS = 12e3;
var VIEWPORT = {
	width: 390,
	height: 844
};
var UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
function remaining(started) {
	return Math.max(400, TOTAL_LIMIT_MS - (Date.now() - started));
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
async function timed(operation, ms, label) {
	let timer;
	try {
		return await Promise.race([operation, new Promise((_, reject) => {
			timer = setTimeout(() => reject(/* @__PURE__ */ new Error(`${label} がタイムアウトしました (${ms}ms)`)), ms);
		})]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}
function findChrome() {
	const envPath = process.env.PLAYWRIGHT_CHROMIUM_PATH || process.env.CHROME_PATH;
	if (envPath && existsSync(envPath)) return envPath;
	const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
	if (!root || !existsSync(root)) return void 0;
	try {
		for (const dir of readdirSync(root)) {
			if (!dir.startsWith("chromium")) continue;
			const candidate = join(root, dir, "chrome-linux64", "chrome");
			if (existsSync(candidate)) return candidate;
		}
	} catch {
		return;
	}
}
function isUnsafeUrl(raw) {
	try {
		const u = new URL(raw);
		if (u.protocol !== "http:" && u.protocol !== "https:") return true;
		const host = u.hostname.replace(/^\[|\]$/g, "");
		if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
		if (isIP(host) && isBlockedIp(host)) return true;
		if (u.port && u.port !== "80" && u.port !== "443") return true;
		return false;
	} catch {
		return true;
	}
}
var chromiumImport;
var browserPromise;
async function loadChromium() {
	if (!chromiumImport) chromiumImport = import("playwright-core").then((mod) => mod.chromium).catch((err) => {
		chromiumImport = void 0;
		throw err;
	});
	return chromiumImport;
}
async function getBrowser() {
	if (!browserPromise) browserPromise = (async () => {
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
				"--hide-scrollbars"
			]
		});
	})().catch((err) => {
		browserPromise = void 0;
		throw err;
	});
	return browserPromise;
}
async function screenshotWithPlaywright(url, started) {
	const context = await (await timed(getBrowser(), Math.min(4e3, remaining(started)), "ブラウザ起動")).newContext({
		viewport: VIEWPORT,
		userAgent: UA,
		javaScriptEnabled: true,
		bypassCSP: false,
		locale: "ja-JP"
	});
	try {
		const page = await context.newPage();
		page.setDefaultTimeout(Math.min(8e3, remaining(started)));
		await page.route("**/*", async (route) => {
			if (isUnsafeUrl(route.request().url())) {
				await route.abort("blockedbyclient");
				return;
			}
			await route.continue();
		});
		await timed(page.goto(url, {
			waitUntil: "domcontentloaded",
			timeout: Math.min(8e3, remaining(started))
		}), Math.min(8500, remaining(started)), "ページ読み込み");
		await sleep(Math.min(450, remaining(started)));
		const pageUrl = page.url();
		if (isUnsafeUrl(pageUrl)) throw new Error("ブラウザが内部向けURLへ遷移したため中止しました");
		await assertSafe(new URL(pageUrl));
		const png = await timed(page.screenshot({
			type: "png",
			animations: "disabled"
		}), Math.min(3e3, remaining(started)), "PNG 撮影");
		return {
			png: Buffer.from(png),
			pageUrl
		};
	} finally {
		await Promise.race([context.close().catch(() => void 0), sleep(800)]);
	}
}
async function screenshotWithMicrolink(url, started) {
	const endpoint = new URL("https://api.microlink.io/");
	endpoint.searchParams.set("url", url);
	endpoint.searchParams.set("screenshot", "true");
	endpoint.searchParams.set("meta", "false");
	endpoint.searchParams.set("viewport.width", String(VIEWPORT.width));
	endpoint.searchParams.set("viewport.height", String(VIEWPORT.height));
	const res = await timed(fetch(endpoint, { signal: AbortSignal.timeout(Math.min(8e3, remaining(started))) }), Math.min(8500, remaining(started)), "Microlink 撮影");
	if (!res.ok) throw new Error(`Microlink HTTP ${res.status}`);
	const data = await res.json();
	const shot = data.data?.screenshot?.url;
	if (data.status !== "success" || !shot) throw new Error("Microlink が画像を返しませんでした");
	const img = await timed(fetch(shot, { signal: AbortSignal.timeout(Math.min(5e3, remaining(started))) }), Math.min(5500, remaining(started)), "Microlink 画像取得");
	if (!img.ok) throw new Error(`Microlink 画像 HTTP ${img.status}`);
	const png = Buffer.from(await img.arrayBuffer());
	if (png.length < 800) throw new Error("Microlink 画像が不正です");
	return {
		png,
		pageUrl: data.data?.url || url
	};
}
async function screenshotWithThum(url, started) {
	const shot = `https://image.thum.io/get/width/${VIEWPORT.width}/crop/${VIEWPORT.height}/noanimate/${url}`;
	const res = await timed(fetch(shot, { signal: AbortSignal.timeout(Math.min(8e3, remaining(started))) }), Math.min(8500, remaining(started)), "thum.io 撮影");
	if (!res.ok) throw new Error(`thum.io HTTP ${res.status}`);
	if (!(res.headers.get("content-type") ?? "").includes("image/")) throw new Error("thum.io が画像以外を返しました");
	const png = Buffer.from(await res.arrayBuffer());
	if (png.length < 800) throw new Error("thum.io 画像が不正です");
	return {
		png,
		pageUrl: url
	};
}
async function captureScreenshot(inputUrl) {
	const started = Date.now();
	const traced = await timed(trace(inputUrl), Math.min(7e3, remaining(started)), "リダイレクト確認");
	if (!traced.complete || !traced.final) throw new Error("到達を確認できないURLは撮影しません");
	await assertSafe(new URL(traced.final));
	const errors = [];
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
var Route$2 = createFileRoute("/api/shot")({ server: { handlers: { POST: async ({ request }) => {
	let body;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "JSONが不正です" }, { status: 400 });
	}
	const raw = typeof body === "object" && body !== null && "url" in body && typeof body.url === "string" ? body.url : "";
	let normalized;
	try {
		normalized = normalizeInputUrl(raw);
	} catch (e) {
		return Response.json({ error: e instanceof Error ? e.message : "URLの形式が不正です" }, { status: 400 });
	}
	try {
		const { png, pageUrl } = await captureScreenshot(normalized);
		return new Response(new Uint8Array(png), { headers: {
			"Content-Type": "image/png",
			"Cache-Control": "no-store",
			"X-Page-Url": encodeURIComponent(pageUrl)
		} });
	} catch (e) {
		const detail = e instanceof Error ? e.message : String(e);
		const timedOut = /タイムアウト/.test(detail);
		return Response.json({ error: detail }, { status: timedOut ? 504 : 502 });
	}
} } } });
var Route$1 = createFileRoute("/api/trace")({ server: { handlers: { POST: async ({ request }) => {
	let body;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "JSONが不正です" }, { status: 400 });
	}
	const raw = typeof body === "object" && body !== null && "url" in body && typeof body.url === "string" ? body.url : "";
	let normalized;
	try {
		normalized = normalizeInputUrl(raw);
	} catch (e) {
		return Response.json({ error: e instanceof Error ? e.message : "URLの形式が不正です" }, { status: 400 });
	}
	try {
		const result = await trace(normalized);
		return Response.json(result, { headers: { "Cache-Control": "no-store" } });
	} catch (e) {
		return Response.json({ error: e instanceof Error ? e.message : "確認に失敗しました" }, { status: 502 });
	}
} } } });
var rootRouteChildren = {
	IndexRoute: Route$3.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$4
	}),
	ApiShotRoute: Route$2.update({
		id: "/api/shot",
		path: "/api/shot",
		getParentRoute: () => Route$4
	}),
	ApiTraceRoute: Route$1.update({
		id: "/api/trace",
		path: "/api/trace",
		getParentRoute: () => Route$4
	})
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { getRouter, router_BWBb3bnN_exports as t };
