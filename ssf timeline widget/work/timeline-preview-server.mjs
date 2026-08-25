import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = join(
  "/Users/gturnipseed/Documents/Codex/2026-08-25/referenced-chatgpt-conversation-this-is-an",
  "outputs/timeline-widget/public"
);

const entries = [
  { year: "1962", content: "Ski instructor Rod Slifer starts selling real estate, becoming Vail’s first ever real estate agent.", image: "" },
  { year: "1968", content: "As Vail grows, Rod Slifer opens his own brokerage, Slifer & Company, on Bridge Street.", image: "" },
  { year: "1983", content: "Jim Flaum, a real estate veteran and former navy pilot, becomes vice president and managing broker of Vail Associates Real Estate.", image: "" },
  { year: "1986", content: "Harry Frampton and Mark Smith form East West Partners, the development group behind Beaver Creek Resort.", image: "" },
  { year: "1994", content: "The top dueling powers of Vail Valley real estate join forces and the modern Slifer Smith & Frampton Real Estate is born.", image: "" },
  { year: "2000", content: "East West Partners comes to Denver and Slifer Smith & Frampton opens its first Mile High City office.", image: "" },
  { year: "2004", content: "We expand beyond the Vail Valley by opening two offices in Summit County.", image: "" },
  { year: "2019", content: "We expand into Aspen, Snowmass and the Roaring Fork Valley for the first time.", image: "" },
  { year: "2019", content: "Our family of companies is named one of Colorado's best places to work by The Denver Post.", image: "" },
  { year: "2020", content: "SSF joins Forbes Global Properties as one of ten founding members.", image: "" },
  { year: "2024", content: "We open a new office in Steamboat Springs to serve the Yampa Valley.", image: "" }
];

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

createServer(async (request, response) => {
  if (request.url === "/api/timeline") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ entries }));
    return;
  }

  const pathname = request.url === "/" ? "/index.html" : request.url;
  try {
    const file = await readFile(join(root, pathname));
    response.writeHead(200, { "Content-Type": contentTypes[extname(pathname)] || "application/octet-stream" });
    response.end(file);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(4173, "127.0.0.1", () => {
  console.log("Timeline preview: http://127.0.0.1:4173");
});
