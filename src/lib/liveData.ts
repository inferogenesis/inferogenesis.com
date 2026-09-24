export type Env = Record<string, string | undefined>;

// A build reads upstream data live in CI, or locally when given a token. Every other
// build reads the snapshots committed under data/.
export function readsLiveData(env: Env): boolean {
  return Boolean(env.CI || env.GITHUB_TOKEN);
}
