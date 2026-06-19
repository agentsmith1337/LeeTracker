import type { Platform } from "@/types/revision";

function slugToTitle(slug: string): string {
  return slug
    .replace(/\.html?$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function detectPlatform(url: string): Platform {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("leetcode.com")) return "leetcode";
    if (hostname.includes("geeksforgeeks.org")) return "gfg";
    if (hostname.includes("codeforces.com")) return "codeforces";
    if (hostname.includes("hackerrank.com")) return "hackerrank";
    if (hostname.includes("codechef.com")) return "codechef";
    if (hostname.includes("cses.fi")) return "cses";
    return "other";
  } catch {
    return "other";
  }
}

export function extractProblemName(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    if (hostname.includes("leetcode.com")) {
      const match = pathname.match(/\/problems\/([^/]+)/);
      if (match) return slugToTitle(match[1]);
    }

    if (hostname.includes("geeksforgeeks.org")) {
      const segments = pathname.split("/").filter(Boolean);
      const slug =
        segments.find((segment) => segment !== "problems") ??
        segments[segments.length - 1];
      if (slug) {
        return slugToTitle(
          slug.replace(/-(problem|practice|set-\d+)$/i, ""),
        );
      }
    }

    if (hostname.includes("codeforces.com")) {
      const segments = pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1];
      if (last && !["problem", "problemset", "contest"].includes(last)) {
        return slugToTitle(last);
      }
    }

    if (hostname.includes("hackerrank.com")) {
      const match = pathname.match(/\/challenges\/([^/]+)/);
      if (match) return slugToTitle(match[1]);
    }

    if (hostname.includes("codechef.com")) {
      const match = pathname.match(/\/problems\/([^/]+)/);
      if (match) return slugToTitle(match[1]);
    }

    if (hostname.includes("cses.fi")) {
      const segments = pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1];
      if (last) return slugToTitle(last);
    }

    const segments = pathname.split("/").filter(
      (segment) => segment && segment !== "problems",
    );
    if (segments.length > 0) {
      return slugToTitle(segments[segments.length - 1]);
    }

    return "Unknown Problem";
  } catch {
    return "Unknown Problem";
  }
}