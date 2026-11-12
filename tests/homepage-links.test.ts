import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homepage = readFileSync(resolve(process.cwd(), "docs/index.html"), "utf8");

describe("GitHub Pages homepage navigation", () => {
  it("keeps every in-page link connected to an existing element", () => {
    const ids = new Set(
      [...homepage.matchAll(/\\bid=["']([^"']+)["']/gi)].map((match) => match[1]),
    );
    const fragments = [
      ...homepage.matchAll(/\\bhref=["']#([^"']+)["']/gi),
    ].map((match) => match[1]);

    expect(fragments.length).toBeGreaterThan(0);
    for (const fragment of fragments) {
      expect(ids.has(fragment), `Missing homepage target: #${fragment}`).toBe(true);
    }
  });

  it("keeps every relative homepage link pointed at a published file or directory", () => {
    const links = [
      ...homepage.matchAll(/\\bhref=["']([^"']+)["']/gi),
    ].map((match) => match[1]);

    for (const href of links) {
      if (!href || href.startsWith("#")) continue;

      let url: URL;
      try {
        url = new URL(href);
        if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:" || url.protocol === "tel:") continue;
      } catch {
        url = new URL(href, "https://connect-preview.invalid/");
      }

      const relativePath = decodeURIComponent(url.pathname).replace(/^\\/+/, "");
      const target = resolve(process.cwd(), "docs", relativePath);
      expect(existsSync(target), `Missing published homepage destination: ${href}`).toBe(true);
    }
  });
});
