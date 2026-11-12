import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homepage = readFileSync(resolve(process.cwd(), "docs/index.html"), "utf8");
const appLayout = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");
const appContrast = readFileSync(resolve(process.cwd(), "app/readability-overrides.css"), "utf8");

describe("sitewide light-surface contrast", () => {
  it("places the homepage contrast guard after every legacy style block and before document closure", () => {
    const guardStart = homepage.lastIndexOf('<style id="connect-final-cascade-contrast">');
    const lastStyleClose = homepage.lastIndexOf("</style>");
    const documentClose = homepage.indexOf("</body></html>");

    expect(guardStart).toBeGreaterThan(-1);
    expect(lastStyleClose).toBeGreaterThan(guardStart);
    expect(documentClose).toBeGreaterThan(lastStyleClose);
    expect(homepage.match(/<\/body><\/html>/g)).toHaveLength(1);
  });

  it("keeps the app contrast stylesheet after the shared design system", () => {
    expect(appLayout.indexOf('import "../docs/connect-design-system.css"')).toBeLessThan(
      appLayout.indexOf('import "./readability-overrides.css"'),
    );
  });

  it("covers generic cards, panels, tiles, boxes, and light utility surfaces", () => {
    for (const selector of ['[class*="card" i]', '[class*="panel" i]', '[class*="box" i]', '[class*="tile" i]', '[class~="bg-white"]']) {
      expect(appContrast).toContain(selector);
    }
    expect(appContrast).toContain("-webkit-text-fill-color: #edf6ff !important");
    const descendantGuard = homepage.slice(homepage.lastIndexOf(") :where(*:not(button)"));
    expect(descendantGuard).toContain("[class*=\"card\" i]");
    expect(descendantGuard).toContain("[class*=\"box\" i]");
    expect(descendantGuard).toContain("color: #edf6ff !important");
    const globalCss = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    expect(globalCss).toContain("Final readable-text guard for intentionally light card surfaces");
    expect(globalCss).toContain(":where(.vInterest,.vShortcut,.feature,.videoCard,.recommendationInfo)");
    expect(globalCss).toContain("color: #355879 !important");
    expect(globalCss).toContain("color: #092b68 !important");
  });
});
