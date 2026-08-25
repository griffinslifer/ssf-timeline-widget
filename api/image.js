const SHEET_HTML_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7H9ZZFHQzpy3zVpctYpBnm3QaiPNTEZJJWw8S-N_2qnY9OVU1v8o2OAbET8vSiJcfReySw4invFrR/pubhtml/sheet?headers=false&gid=0";

function imagesFromPublishedHtml(html) {
  const matches = html.matchAll(
    /<img\b[^>]*\bsrc=["'](https:\/\/docs\.google\.com\/sheets-images-rt\/[^"']+)["']/gi
  );

  return [...matches].map((match) =>
    match[1]
      .replaceAll("&amp;", "&")
      .replace(/=w\d+(?:-h\d+)?$/, "=w1200")
  );
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).send("Method not allowed");
  }

  const rawIndex = Array.isArray(request.query.index)
    ? request.query.index[0]
    : request.query.index;
  const imageIndex = Number(rawIndex);

  if (!Number.isInteger(imageIndex) || imageIndex < 0 || imageIndex > 100) {
    return response.status(400).send("Invalid image index");
  }

  try {
    const requestOptions = {
      headers: { "User-Agent": "SSF Timeline Widget/1.0" },
    };
    const sheetResponse = await fetch(SHEET_HTML_URL, requestOptions);

    if (!sheetResponse.ok) {
      throw new Error(`Google Sheets returned ${sheetResponse.status}.`);
    }

    const images = imagesFromPublishedHtml(await sheetResponse.text());
    const imageUrl = images[imageIndex];

    if (!imageUrl) return response.status(404).send("Image not found");

    const imageResponse = await fetch(imageUrl, requestOptions);
    const contentType = imageResponse.headers.get("content-type") || "";

    if (!imageResponse.ok || !contentType.startsWith("image/")) {
      throw new Error(`Google image returned ${imageResponse.status}.`);
    }

    response.setHeader("Content-Type", contentType);
    response.setHeader(
      "Cache-Control",
      "public, s-maxage=86400, stale-while-revalidate=604800"
    );
    return response
      .status(200)
      .send(Buffer.from(await imageResponse.arrayBuffer()));
  } catch (error) {
    return response.status(502).send("Timeline image is temporarily unavailable");
  }
}

export { imagesFromPublishedHtml };
