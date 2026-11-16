function getSanitySettings() {
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID?.trim();
  const dataset = process.env.SANITY_STUDIO_DATASET?.trim();
  if (!projectId || !dataset) return undefined;
  if (!/^[a-z0-9]+$/.test(projectId)) {
    console.warn("The Sanity project ID is invalid.");
    return undefined;
  }
  return { projectId, dataset: encodeURIComponent(dataset) };
}

export function getSanityImagePath() {
  const settings = getSanitySettings();
  return settings && `/images/${settings.projectId}/${settings.dataset}/`;
}

export async function queryPublishedSanity<T>(query: string, params: Record<string, string> = {}) {
  const settings = getSanitySettings();
  if (!settings) return undefined;

  const token = process.env.SANITY_API_READ_TOKEN;
  const url = new URL(`https://${settings.projectId}.api.sanity.io/v2025-02-19/data/query/${settings.dataset}`);
  url.searchParams.set("query", query);
  url.searchParams.set("perspective", "published");
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(`$${name}`, JSON.stringify(value));
  }

  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) {
      console.warn(`Could not read published Sanity content (HTTP ${response.status}).`);
      return undefined;
    }
    const { result }: { result: T } = await response.json();
    return result;
  } catch {
    console.warn("Could not read published Sanity content.");
    return undefined;
  }
}
