/**
 * One-off diagnostic: calls the JSearch (RapidAPI) endpoint with the
 * configured JSEARCH_API_KEY and logs the raw response so we can see
 * exactly what RapidAPI is rejecting and why. Never logs the full key —
 * only its length and first/last few characters, enough to catch a
 * copy-paste/whitespace issue without exposing the secret.
 */
const apiKey = process.env.JSEARCH_API_KEY;

async function main() {
  if (!apiKey) {
    console.log("[jsearch-diag] JSEARCH_API_KEY is not set.");
    return;
  }

  console.log(
    `[jsearch-diag] key length=${apiKey.length} preview=${apiKey.slice(0, 4)}...${apiKey.slice(-4)} hasWhitespace=${/\s/.test(apiKey)}`
  );

  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.set("query", "software engineer");
  url.searchParams.set("page", "1");
  url.searchParams.set("num_pages", "1");

  const response = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  });

  const headersObj: Record<string, string> = {};
  response.headers.forEach((v, k) => (headersObj[k] = v));

  console.log(`[jsearch-diag] status=${response.status} statusText=${response.statusText}`);
  console.log(`[jsearch-diag] response headers=${JSON.stringify(headersObj)}`);

  const body = await response.text();
  console.log(`[jsearch-diag] body=${body.slice(0, 1000)}`);
}

main().catch((e) => {
  console.error("[jsearch-diag] error:", e);
});
