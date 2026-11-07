import { readFile, mkdir, writeFile } from "node:fs/promises";

const source = await readFile("app/free-tv/free-tv-directory.tsx", "utf8");
const rows = source.split("\n").filter((line) => line.trim().startsWith("{ id:"));
const channels = rows.map((line) => {
  const id = line.match(/id:"([^"]+)"/)?.[1];
  const name = line.match(/name:"([^"]+)"/)?.[1];
  const url = line.match(/url:"(https?:\/\/[^"]+)"/)?.[1];
  return { id, name, url };
}).filter((item) => item.id && item.name && item.url);

if (channels.length === 0) throw new Error("No Free TV channel records found. Check the directory format.");

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    let response = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal, headers: { "User-Agent": "ConnectTime-LinkHealth/1.0 (+https://github.com/nasras0837-star/ConnectTime-)" } });
    if ([403, 405, 501].includes(response.status)) {
      response = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal, headers: { "User-Agent": "ConnectTime-LinkHealth/1.0 (+https://github.com/nasras0837-star/ConnectTime-)", Range: "bytes=0-0" } });
    }
    return { status: response.status, finalUrl: response.url, outcome: response.status >= 200 && response.status < 400 ? "reachable" : [401, 403, 405, 429].includes(response.status) ? "manual-review" : "needs-review" };
  } catch (error) {
    return { status: null, finalUrl: null, outcome: "manual-review", error: error instanceof Error ? error.message : "Unknown network error" };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
for (const channel of channels) {
  const result = await check(channel.url);
  results.push({ ...channel, ...result });
  console.log(`${result.outcome.toUpperCase()} ${channel.name}: ${result.status ?? result.error} ${channel.url}`);
}
const report = { checkedAt: new Date().toISOString(), total: results.length, reachable: results.filter(x => x.outcome === "reachable").length, needsReview: results.filter(x => x.outcome !== "reachable").length, note: "HTTP reachability is not confirmation of live playback, free access, regional rights, or permission to embed.", results };
await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/free-tv-link-report.json", JSON.stringify(report, null, 2) + "\n");
if (report.needsReview) {
  console.log(`::warning::${report.needsReview} Free TV link(s) need manual review. See the uploaded JSON report.`);
}
console.log(`Checked ${report.total} official broadcaster destinations; ${report.reachable} returned reachable HTTP responses.`);
