import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv, timelineFromCsv } from "./timeline.js";

test("parseCsv handles quoted commas, escaped quotes, and CRLF", () => {
  const rows = parseCsv('Year,Content,Image\r\n1962,"Hello, world",\r\n1968,"A ""quoted"" event",x.jpg\r\n');
  assert.deepEqual(rows, [
    ["Year", "Content", "Image"],
    ["1962", "Hello, world", ""],
    ["1968", 'A "quoted" event', "x.jpg"],
  ]);
});

test("timelineFromCsv sorts by year and preserves duplicate-year order", () => {
  const entries = timelineFromCsv(
    "Year,Content,Image\n2020,Third,\n2019,First,\n2019,Second,https://example.com/image.jpg\n"
  );
  assert.deepEqual(entries, [
    { year: "2019", content: "First", image: "" },
    { year: "2019", content: "Second", image: "https://example.com/image.jpg" },
    { year: "2020", content: "Third", image: "" },
  ]);
});

test("timelineFromCsv requires Year and Content headers", () => {
  assert.throws(() => timelineFromCsv("Date,Description\n1962,Hello"), /must include columns/);
});
