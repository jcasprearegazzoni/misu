import type { ReactNode } from "react";

export type MobileBottomNavItem = {
  href: string;
  label: string;
  match: string[];
  iconActive?: ReactNode;
  iconInactive?: ReactNode;
};

function normalizePath(path: string) {
  if (!path) return "/";

  const pathWithoutQueryOrHash = path.split("?")[0]?.split("#")[0] ?? path;
  if (pathWithoutQueryOrHash === "/") return "/";

  return pathWithoutQueryOrHash.endsWith("/")
    ? pathWithoutQueryOrHash.slice(0, -1)
    : pathWithoutQueryOrHash;
}

function isPatternMatch(pathname: string, pattern: string) {
  const normalizedPathname = normalizePath(pathname);
  const normalizedPattern = normalizePath(pattern);

  // Si el patron termina en "*" se interpreta como prefijo.
  if (normalizedPattern.endsWith("*")) {
    const rawPrefix = normalizedPattern.slice(0, -1);
    const prefix = normalizePath(rawPrefix);

    if (prefix === "/") return true;
    return normalizedPathname === prefix || normalizedPathname.startsWith(`${prefix}/`);
  }

  return normalizedPathname === normalizedPattern;
}

function getPatternScore(pathname: string, pattern: string) {
  if (!isPatternMatch(pathname, pattern)) return -1;

  // Priorizamos exact match sobre prefijo y luego el patron mas especifico.
  const isPrefix = normalizePath(pattern).endsWith("*");
  const normalizedPattern = normalizePath(pattern);
  const baseScore = isPrefix ? 1_000 : 10_000;

  return baseScore + normalizedPattern.length;
}

export function resolveActiveBottomNavIndex(pathname: string, items: MobileBottomNavItem[]) {
  let bestItemIndex = -1;
  let bestScore = -1;

  for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
    const item = items[itemIndex];

    for (const pattern of item.match) {
      const patternScore = getPatternScore(pathname, pattern);

      if (patternScore > bestScore) {
        bestScore = patternScore;
        bestItemIndex = itemIndex;
      }
    }
  }

  return bestItemIndex;
}
