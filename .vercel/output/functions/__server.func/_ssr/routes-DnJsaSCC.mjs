import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as LoaderCircle, c as Copy, d as ArrowRight, i as Lock, l as Check, n as ShieldAlert, o as Globe, r as Route, s as ExternalLink, t as TriangleAlert, u as Camera } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DnJsaSCC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide", {
	variants: { variant: {
		default: "border-transparent bg-muted text-foreground",
		ok: "border-transparent bg-ok-soft text-ok",
		warn: "border-transparent bg-warn-soft text-warn",
		danger: "border-transparent bg-danger-soft text-danger",
		outline: "border-border text-muted-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[opacity,transform,background-color,color,box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:opacity-90",
			secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
			outline: "border border-border bg-transparent text-foreground hover:bg-muted",
			ghost: "text-foreground hover:bg-muted",
			danger: "bg-danger text-danger-foreground hover:opacity-90"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-12 px-5",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-12 w-full rounded-lg border border-border bg-surface px-4 text-base text-foreground shadow-border transition-[box-shadow,border-color] duration-[var(--motion-quick)] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
async function readApiError(res, fallback) {
	const ct = res.headers.get("content-type") ?? "";
	const text = await res.text();
	if (ct.includes("application/json") && text) try {
		const parsed = JSON.parse(text);
		if (typeof parsed.error === "string" && parsed.error.trim()) return parsed.error;
	} catch {}
	if (res.status === 502 || res.status === 504) return "接続がタイムアウトしました。もう一度試してください。";
	if (text.trim().startsWith("<!")) return `サーバーエラー (HTTP ${res.status})。もう一度試してください。`;
	return text.replace(/\s+/g, " ").trim().slice(0, 280) || fallback;
}
var EXAMPLES = [{
	label: "example.com",
	url: "https://example.com"
}, {
	label: "http 転送",
	url: "https://httpbingo.org/redirect/3"
}];
function hopTone(hop) {
	if (hop.blocked || hop.error) return "danger";
	if (hop.status && hop.status >= 400) return "danger";
	if (hop.status && hop.status >= 300) return "warn";
	if (hop.status && hop.status >= 200 && hop.status < 300 && !hop.location) return "ok";
	return "default";
}
function hostOf(url) {
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
}
function schemeOf(url) {
	try {
		return new URL(url).protocol.replace(":", "");
	} catch {
		return "";
	}
}
function CheckerApp() {
	const [url, setUrl] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [shooting, setShooting] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [result, setResult] = (0, import_react.useState)(null);
	const [shotUrl, setShotUrl] = (0, import_react.useState)(null);
	const [shotPageUrl, setShotPageUrl] = (0, import_react.useState)(null);
	const [shotError, setShotError] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const finalHost = (0, import_react.useMemo)(() => result?.final ? hostOf(result.final) : "", [result]);
	async function runTrace(target = url) {
		const next = target.trim();
		if (!next) {
			setError("URLを入力してください");
			return;
		}
		setUrl(next);
		setLoading(true);
		setError(null);
		setResult(null);
		setShotError(null);
		setShotPageUrl(null);
		if (shotUrl) URL.revokeObjectURL(shotUrl);
		setShotUrl(null);
		try {
			const res = await fetch("/api/trace", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url: next })
			});
			const body = await res.text();
			let parsed;
			try {
				parsed = JSON.parse(body);
			} catch {
				throw new Error(res.status === 502 || body.trim().startsWith("<!") ? "接続がタイムアウトしました。もう一度試してください。" : `HTTP ${res.status}`);
			}
			if (!res.ok || parsed.error) throw new Error(parsed.error || `HTTP ${res.status}`);
			setResult(parsed);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}
	async function takeShot() {
		if (!url.trim()) return;
		setShooting(true);
		setShotError(null);
		try {
			const res = await fetch("/api/shot", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url: url.trim() })
			});
			if (!res.ok) throw new Error(await readApiError(res, "撮影に失敗しました"));
			const pageUrl = decodeURIComponent(res.headers.get("X-Page-Url") || "");
			const blob = await res.blob();
			if (shotUrl) URL.revokeObjectURL(shotUrl);
			setShotUrl(URL.createObjectURL(blob));
			setShotPageUrl(pageUrl || null);
		} catch (e) {
			setShotError(e instanceof Error ? e.message : String(e));
		} finally {
			setShooting(false);
		}
	}
	async function copyFinal() {
		if (!result?.final) return;
		try {
			await navigator.clipboard.writeText(result.final);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1200);
		} catch {
			setCopied(false);
		}
	}
	const jsMismatch = shotPageUrl && result?.final && shotPageUrl !== result.final;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative mx-auto min-h-dvh w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-8 sm:mb-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 font-mono text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase",
						children: "Path lab"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl",
						children: "Redirect Checker"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base",
						children: "短縮URLや転送チェーンをホップごとに追跡し、到達先の見た目まで確認します。 JavaScript 転送はスクリーンショットで捕捉します。"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "rounded-2xl bg-surface p-3 shadow-border sm:p-4",
				onSubmit: (e) => {
					e.preventDefault();
					runTrace();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						htmlFor: "target-url",
						className: "sr-only",
						children: "調べるURL"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "target-url",
							type: "url",
							inputMode: "url",
							autoComplete: "off",
							spellCheck: false,
							placeholder: "https://bit.ly/… または example.com",
							value: url,
							onChange: (e) => setUrl(e.target.value),
							className: "font-mono text-sm sm:text-base"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: loading,
							className: "h-12 shrink-0 px-6 sm:min-w-36",
							children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }), "確認中"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {}), "確認する"] })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: EXAMPLES.map((ex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setUrl(ex.url);
								runTrace(ex.url);
							},
							className: "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-[var(--motion-quick)] hover:bg-muted hover:text-foreground",
							children: ex.label
						}, ex.url))
					})
				]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "alert",
				className: "mt-6 flex gap-3 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "min-w-0 break-words",
					children: error
				})]
			}) : null,
			result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 space-y-6",
				children: [
					result.warnings.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2",
						children: result.warnings.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: w })]
						}, w))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-surface p-4 shadow-border sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-4 flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-medium tracking-wide text-muted-foreground",
									children: "経路"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									variant: "outline",
									children: [result.hops.length, " hops"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "space-y-0",
								children: result.hops.map((hop, i) => {
									const tone = hopTone(hop);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "relative flex gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex w-6 shrink-0 flex-col items-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("mt-1 size-2.5 rounded-full", tone === "ok" && "bg-ok", tone === "warn" && "bg-warn", tone === "danger" && "bg-danger", tone === "default" && "bg-subtle") }), i < result.hops.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-px flex-1 bg-border" }) : null]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: cn("min-w-0 flex-1", i < result.hops.length - 1 ? "pb-5" : ""),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "break-all font-mono text-xs leading-relaxed text-foreground sm:text-sm",
													children: hop.url
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-1.5 flex flex-wrap items-center gap-1.5",
													children: [
														hop.via ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
															variant: "outline",
															children: hop.via
														}) : null,
														hop.status ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
															variant: hop.status >= 400 ? "danger" : hop.status >= 300 ? "warn" : "ok",
															children: hop.status
														}) : null,
														hop.blocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
															variant: "danger",
															children: "拒否"
														}) : null,
														hop.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
															variant: "danger",
															children: hop.error
														}) : null
													]
												}),
												hop.blocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1 text-xs text-danger",
													children: hop.blocked
												}) : null
											]
										})]
									}, `${hop.url}-${i}`);
								})
							}),
							result.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-xs text-muted-foreground",
								children: result.note
							}) : null
						]
					}),
					result.page ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-surface p-4 shadow-border sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mb-3 text-sm font-medium tracking-wide text-muted-foreground",
								children: "ページ"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-base font-medium text-foreground",
								children: result.page.title || "（タイトルなし）"
							}),
							result.page.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-pretty text-muted-foreground",
								children: result.page.description
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-lg bg-muted px-3 py-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "text-xs text-muted-foreground",
											children: "password"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
											className: "font-mono tabular-nums",
											children: result.page.passwordInputs
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-lg bg-muted px-3 py-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "text-xs text-muted-foreground",
											children: "iframe"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
											className: "font-mono tabular-nums",
											children: result.page.iframes
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-lg bg-muted px-3 py-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "text-xs text-muted-foreground",
											children: "form"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
											className: "font-mono tabular-nums",
											children: result.page.forms.length
										})]
									})
								]
							}),
							result.page.forms.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 space-y-2",
								children: result.page.forms.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: cn("rounded-lg px-3 py-2 font-mono text-xs break-all", f.crossHost ? "bg-danger-soft text-danger" : "bg-muted text-muted-foreground"),
									children: [
										f.method,
										" → ",
										f.action
									]
								}, `${f.method}-${f.action}`))
							}) : null
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-surface p-4 shadow-border sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-sm font-medium tracking-wide text-muted-foreground",
											children: "最終到達先"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 break-all font-mono text-sm text-foreground",
											children: result.final
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2 flex flex-wrap items-center gap-2",
											children: [
												result.complete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "ok",
													children: "到達確認"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "danger",
													children: "未完了"
												}),
												finalHost ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1 text-xs text-muted-foreground",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "size-3.5" }), finalHost]
												}) : null,
												result.final && schemeOf(result.final) === "https" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1 text-xs text-ok",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-3.5" }), "https"]
												}) : null
											]
										})
									]
								}), result.final ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "ghost",
									size: "icon",
									onClick: () => void copyFinal(),
									"aria-label": "最終URLをコピー",
									children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {})
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-xs leading-relaxed text-subtle",
								children: result.caveat
							}),
							result.complete ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex flex-col gap-3 sm:flex-row",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									onClick: () => void takeShot(),
									disabled: shooting,
									className: "sm:min-w-52",
									children: shooting ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }), "撮影中"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {}), "スクリーンショット"] })
								}), result.final ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: result.final,
										target: "_blank",
										rel: "noreferrer",
										children: ["到達先を開く", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {})]
									})
								}) : null]
							}) : null,
							shotError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 flex gap-2 text-sm text-danger",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0 break-words",
									children: shotError
								})]
							}) : null,
							jsMismatch ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 flex gap-2 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["ブラウザ上の最終URLが異なります（JS転送の可能性）", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 block break-all font-mono text-xs",
									children: shotPageUrl
								})] })]
							}) : shotPageUrl && result.final && shotPageUrl === result.final ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-sm text-ok",
								children: "ブラウザ上の最終URLも一致しました"
							}) : null,
							shotUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mx-auto mt-6 w-[min(100%,280px)] rounded-[2rem] bg-elevated p-2 shadow-border",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "overflow-hidden rounded-[1.4rem] bg-bg",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: shotUrl,
										alt: "到達先ページのスクリーンショット",
										className: "block h-auto w-full outline outline-1 -outline-offset-1 outline-white/10"
									})
								})
							}) : shooting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mx-auto mt-6 flex h-[420px] w-[min(100%,280px)] items-center justify-center rounded-[2rem] bg-elevated p-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-full w-full items-center justify-center rounded-[1.4rem] bg-muted",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-6 animate-spin text-muted-foreground" })
								})
							}) : null
						]
					})
				]
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckerApp, {});
}
//#endregion
export { Home as component };
