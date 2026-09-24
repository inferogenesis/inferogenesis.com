// A fixed ref from the gates table as a link: a commit in the programme's repository, a
// DOI through doi.org, or a URL as it stands.
export function refUrl(ref: string, repository: string): string {
  if (/^[0-9a-f]{7,40}$/.test(ref))
    return `https://github.com/${repository}/commit/${ref}`;
  if (/^10\.\d{4,9}\//.test(ref)) return `https://doi.org/${ref}`;
  return ref;
}
