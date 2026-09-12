/**
 * One-off diagnostic: tests both the /search and /job-details JSearch
 * (RapidAPI) endpoints with the configured JSEARCH_API_KEY to see which,
 * if any, this key's RapidAPI subscription actually allows. Never logs
 * the full key — only its length and a masked preview.
 */
const apiKey = process.env.JSEARCH_API_KEY;

async function tryEndpoint(label: string, url: string) {
  const response = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey!,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  });
  const body = await response.text();
  console.log(`[jsearch-diag] [${label}] status=${response.status} statusText=${response.statusText}`);
  console.log(`[jsearch-diag] [${label}] body=${body.slice(0, 800)}`);
}

async function main() {
  if (!apiKey) {
    console.log("[jsearch-diag] JSEARCH_API_KEY is not set.");
    return;
  }

  console.log(
    `[jsearch-diag] key length=${apiKey.length} preview=${apiKey.slice(0, 4)}...${apiKey.slice(-4)} hasWhitespace=${/\s/.test(apiKey)}`
  );

  await tryEndpoint(
    "search",
    "https://jsearch.p.rapidapi.com/search?query=software%20engineer&page=1&num_pages=1"
  );

  await tryEndpoint(
    "job-details",
    "https://jsearch.p.rapidapi.com/job-details?country=us&job_id=TU1SQkRfOURuWDhXVmFWREFBQUFBQT09OkVzd0JDb3dCUVVwcFZEUjBUR0pqWW5CcVdrOVFPVkpUWmpWSVdHNUJOelF4WXpRMlEwaGxPVFZwZUVSM2FsSkNlbEp6TFY5V1duWklabUo2U1hwSlQwZEtaR1U0UTNJd1p5MVdRM1JRWVdkYVMzWmFjR2s0ZEhScldXWTVSelJmV1VkVGVsYzJiMjlrY21aeGVUaGpWRGR0WVVkUkxXczJXSE0wTFdSc2VYbzRjWFJIWVRGUlZtUnFTMEppVEU4M1EwRVNGMGszZERaaGNsZFJUblF5UzNKMVJWQm5PSGsxYlZGUkdpSkJSSE55T1daUmNuWlRUbEpuUXpOYVpERlphbXMxWVVkSmNrSmZRMGN3VW05Qg"
  );
}

main().catch((e) => {
  console.error("[jsearch-diag] error:", e);
});
