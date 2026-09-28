import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  Route as RouteIcon,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readApiError } from "@/lib/redirect/api-error";
import { cn } from "@/lib/utils";
import type { Hop, TraceResult } from "@/lib/redirect/types";

const EXAMPLES = [
  { label: "example.com", url: "https://example.com" },
  { label: "http 転送", url: "https://httpbingo.org/redirect/3" },
];

function hopTone(hop: Hop): "ok" | "warn" | "danger" | "default" {
  if (hop.blocked || hop.error) return "danger";
  if (hop.status && hop.status >= 400) return "danger";
  if (hop.status && hop.status >= 300) return "warn";
  if (hop.status && hop.status >= 200 && hop.status < 300 && !hop.location)
    return "ok";
  return "default";
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function schemeOf(url: string) {
  try {
    return new URL(url).protocol.replace(":", "");
  } catch {
    return "";
  }
}

export function CheckerApp() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TraceResult | null>(null);
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [shotPageUrl, setShotPageUrl] = useState<string | null>(null);
  const [shotError, setShotError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const finalHost = useMemo(
    () => (result?.final ? hostOf(result.final) : ""),
    [result],
  );

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
        body: JSON.stringify({ url: next }),
      });
      const body = await res.text();
      let parsed: TraceResult & { error?: string };
      try {
        parsed = JSON.parse(body) as TraceResult & { error?: string };
      } catch {
        throw new Error(
          res.status === 502 || body.trim().startsWith("<!")
            ? "接続がタイムアウトしました。もう一度試してください。"
            : `HTTP ${res.status}`,
        );
      }
      if (!res.ok || parsed.error) {
        throw new Error(parsed.error || `HTTP ${res.status}`);
      }
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
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "撮影に失敗しました"));
      }
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

  const jsMismatch =
    shotPageUrl && result?.final && shotPageUrl !== result.final;

  return (
    <main className="relative mx-auto min-h-dvh w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <header className="mb-8 sm:mb-10">
        <p className="mb-3 font-mono text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Path lab
        </p>
        <h1 className="text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Redirect Checker
        </h1>
        <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          短縮URLや転送チェーンをホップごとに追跡し、到達先の見た目まで確認します。
          JavaScript 転送はスクリーンショットで捕捉します。
        </p>
      </header>

      <form
        className="rounded-2xl bg-surface p-3 shadow-border sm:p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void runTrace();
        }}
      >
        <label htmlFor="target-url" className="sr-only">
          調べるURL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="target-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://bit.ly/… または example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="font-mono text-sm sm:text-base"
          />
          <Button
            type="submit"
            disabled={loading}
            className="h-12 shrink-0 px-6 sm:min-w-36"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                確認中
              </>
            ) : (
              <>
                <RouteIcon />
                確認する
              </>
            )}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.url}
              type="button"
              onClick={() => {
                setUrl(ex.url);
                void runTrace(ex.url);
              }}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-[var(--motion-quick)] hover:bg-muted hover:text-foreground"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </form>

      {error ? (
        <div
          role="alert"
          className="mt-6 flex gap-3 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <p className="min-w-0 break-words">{error}</p>
        </div>
      ) : null}

      {result ? (
        <section className="mt-8 space-y-6">
          {result.warnings.length > 0 ? (
            <ul className="space-y-2">
              {result.warnings.map((w) => (
                <li
                  key={w}
                  className="flex gap-3 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="rounded-2xl bg-surface p-4 shadow-border sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium tracking-wide text-muted-foreground">
                経路
              </h2>
              <Badge variant="outline">{result.hops.length} hops</Badge>
            </div>
            <ol className="space-y-0">
              {result.hops.map((hop, i) => {
                const tone = hopTone(hop);
                return (
                  <li key={`${hop.url}-${i}`} className="relative flex gap-3">
                    <div className="flex w-6 shrink-0 flex-col items-center">
                      <span
                        className={cn(
                          "mt-1 size-2.5 rounded-full",
                          tone === "ok" && "bg-ok",
                          tone === "warn" && "bg-warn",
                          tone === "danger" && "bg-danger",
                          tone === "default" && "bg-subtle",
                        )}
                      />
                      {i < result.hops.length - 1 ? (
                        <span className="w-px flex-1 bg-border" />
                      ) : null}
                    </div>
                    <div className={cn("min-w-0 flex-1", i < result.hops.length - 1 ? "pb-5" : "")}>
                      <p className="break-all font-mono text-xs leading-relaxed text-foreground sm:text-sm">
                        {hop.url}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {hop.via ? (
                          <Badge variant="outline">{hop.via}</Badge>
                        ) : null}
                        {hop.status ? (
                          <Badge
                            variant={
                              hop.status >= 400
                                ? "danger"
                                : hop.status >= 300
                                  ? "warn"
                                  : "ok"
                            }
                          >
                            {hop.status}
                          </Badge>
                        ) : null}
                        {hop.blocked ? (
                          <Badge variant="danger">拒否</Badge>
                        ) : null}
                        {hop.error ? (
                          <Badge variant="danger">{hop.error}</Badge>
                        ) : null}
                      </div>
                      {hop.blocked ? (
                        <p className="mt-1 text-xs text-danger">{hop.blocked}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
            {result.note ? (
              <p className="mt-4 text-xs text-muted-foreground">{result.note}</p>
            ) : null}
          </div>

          {result.page ? (
            <div className="rounded-2xl bg-surface p-4 shadow-border sm:p-5">
              <h2 className="mb-3 text-sm font-medium tracking-wide text-muted-foreground">
                ページ
              </h2>
              <p className="text-base font-medium text-foreground">
                {result.page.title || "（タイトルなし）"}
              </p>
              {result.page.description ? (
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {result.page.description}
                </p>
              ) : null}
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-lg bg-muted px-3 py-2">
                  <dt className="text-xs text-muted-foreground">password</dt>
                  <dd className="font-mono tabular-nums">
                    {result.page.passwordInputs}
                  </dd>
                </div>
                <div className="rounded-lg bg-muted px-3 py-2">
                  <dt className="text-xs text-muted-foreground">iframe</dt>
                  <dd className="font-mono tabular-nums">{result.page.iframes}</dd>
                </div>
                <div className="rounded-lg bg-muted px-3 py-2">
                  <dt className="text-xs text-muted-foreground">form</dt>
                  <dd className="font-mono tabular-nums">
                    {result.page.forms.length}
                  </dd>
                </div>
              </dl>
              {result.page.forms.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {result.page.forms.map((f) => (
                    <li
                      key={`${f.method}-${f.action}`}
                      className={cn(
                        "rounded-lg px-3 py-2 font-mono text-xs break-all",
                        f.crossHost
                          ? "bg-danger-soft text-danger"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {f.method} → {f.action}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl bg-surface p-4 shadow-border sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-medium tracking-wide text-muted-foreground">
                  最終到達先
                </h2>
                <p className="mt-2 break-all font-mono text-sm text-foreground">
                  {result.final}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {result.complete ? (
                    <Badge variant="ok">到達確認</Badge>
                  ) : (
                    <Badge variant="danger">未完了</Badge>
                  )}
                  {finalHost ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="size-3.5" />
                      {finalHost}
                    </span>
                  ) : null}
                  {result.final && schemeOf(result.final) === "https" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-ok">
                      <Lock className="size-3.5" />
                      https
                    </span>
                  ) : null}
                </div>
              </div>
              {result.final ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => void copyFinal()}
                  aria-label="最終URLをコピー"
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
              ) : null}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-subtle">
              {result.caveat}
            </p>

            {result.complete ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => void takeShot()}
                  disabled={shooting}
                  className="sm:min-w-52"
                >
                  {shooting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      撮影中
                    </>
                  ) : (
                    <>
                      <Camera />
                      スクリーンショット
                    </>
                  )}
                </Button>
                {result.final ? (
                  <Button variant="outline" asChild>
                    <a href={result.final} target="_blank" rel="noreferrer">
                      到達先を開く
                      <ExternalLink />
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}

            {shotError ? (
              <p className="mt-4 flex gap-2 text-sm text-danger">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0 break-words">{shotError}</span>
              </p>
            ) : null}

            {jsMismatch ? (
              <p className="mt-4 flex gap-2 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
                <ArrowRight className="mt-0.5 size-4 shrink-0" />
                <span>
                  ブラウザ上の最終URLが異なります（JS転送の可能性）
                  <span className="mt-1 block break-all font-mono text-xs">
                    {shotPageUrl}
                  </span>
                </span>
              </p>
            ) : shotPageUrl && result.final && shotPageUrl === result.final ? (
              <p className="mt-4 text-sm text-ok">
                ブラウザ上の最終URLも一致しました
              </p>
            ) : null}

            {shotUrl ? (
              <div className="mx-auto mt-6 w-[min(100%,280px)] rounded-[2rem] bg-elevated p-2 shadow-border">
                <div className="overflow-hidden rounded-[1.4rem] bg-bg">
                  <img
                    src={shotUrl}
                    alt="到達先ページのスクリーンショット"
                    className="block h-auto w-full outline outline-1 -outline-offset-1 outline-white/10"
                  />
                </div>
              </div>
            ) : shooting ? (
              <div className="mx-auto mt-6 flex h-[420px] w-[min(100%,280px)] items-center justify-center rounded-[2rem] bg-elevated p-2">
                <div className="flex h-full w-full items-center justify-center rounded-[1.4rem] bg-muted">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
