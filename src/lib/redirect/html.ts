import type { PageInfo } from "./types";

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return m ? (m[2] ?? m[3] ?? m[4]) : undefined;
}

export function analyzeHtml(html: string, base: URL): PageInfo {
  const title = html
    .match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    ?.replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  let description: string | undefined;
  let metaRefresh: string | undefined;
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    if (attr(tag, "name")?.toLowerCase() === "description") {
      description = attr(tag, "content")?.slice(0, 300);
    }
    if (attr(tag, "http-equiv")?.toLowerCase() === "refresh") {
      metaRefresh = attr(tag, "content")?.match(
        /url\s*=\s*['"]?([^'";\s]+)/i,
      )?.[1];
    }
  }

  const forms = [...html.matchAll(/<form\b[^>]*>/gi)].slice(0, 10).map((m) => {
    let action = base.href;
    try {
      action = new URL(attr(m[0], "action") ?? "", base).href;
    } catch {
      /* keep current URL */
    }
    let crossHost = false;
    try {
      crossHost = new URL(action).hostname !== base.hostname;
    } catch {
      crossHost = false;
    }
    return {
      action,
      method: (attr(m[0], "method") ?? "get").toUpperCase(),
      crossHost,
    };
  });

  return {
    title,
    description,
    passwordInputs: (html.match(/<input\b[^>]*type\s*=\s*["']?password/gi) ?? [])
      .length,
    iframes: (html.match(/<iframe\b/gi) ?? []).length,
    forms,
    metaRefresh,
  };
}
