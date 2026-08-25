const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7H9ZZFHQzpy3zVpctYpBnm3QaiPNTEZJJWw8S-N_2qnY9OVU1v8o2OAbET8vSiJcfReySw4invFrR/pub?output=csv";

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];

    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function timelineFromCsv(csv) {
  const rows = parseCsv(csv.trim());
  if (rows.length < 2) return [];

  const headings = rows[0].map((heading) => heading.trim().toLowerCase());
  const yearIndex = headings.indexOf("year");
  const contentIndex = headings.indexOf("content");
  const imageIndex = headings.indexOf("image");

  if (yearIndex === -1 || contentIndex === -1) {
    throw new Error('The sheet must include columns named "Year" and "Content".');
  }

  return rows
    .slice(1)
    .map((values, sourceIndex) => ({
      year: (values[yearIndex] || "").trim(),
      content: (values[contentIndex] || "").trim(),
      image: imageIndex === -1 ? "" : (values[imageIndex] || "").trim(),
      sourceIndex,
    }))
    .filter((entry) => entry.year && entry.content)
    .sort((first, second) => {
      const yearDifference = Number(first.year) - Number(second.year);
      return Number.isNaN(yearDifference) || yearDifference === 0
        ? first.sourceIndex - second.sourceIndex
        : yearDifference;
    })
    .map(({ sourceIndex, ...entry }) => entry);
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sheetResponse = await fetch(SHEET_URL, {
      headers: { "User-Agent": "SSF Timeline Widget/1.0" },
    });

    if (!sheetResponse.ok) {
      throw new Error(`Google Sheets returned ${sheetResponse.status}.`);
    }

    const entries = timelineFromCsv(await sheetResponse.text());
    response.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=86400"
    );
    return response.status(200).json({ entries });
  } catch (error) {
    return response.status(502).json({
      error: "The timeline data is temporarily unavailable.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

export { parseCsv, timelineFromCsv };
