import { linkMarkup, termMarkup } from '../content/schemas';

export type TermPart =
  string | { term: string; shown: string } | { href: string; label: string };

export const termSlug = (term: string) =>
  term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// Splits running text on [[term]], [[term|shown text]] and [label](href) markup.
export function termParts(text: string): TermPart[] {
  const markup = new RegExp(`${termMarkup.source}|${linkMarkup.source}`, 'g');
  const parts: TermPart[] = [];
  let last = 0;
  for (const match of text.matchAll(markup)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    if (match[1] !== undefined) {
      parts.push({ term: match[1].trim(), shown: (match[2] ?? match[1]).trim() });
    } else {
      parts.push({ href: match[4], label: match[3] });
    }
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// Running text with the markup removed, for places that cannot show a tip.
export const plainText = (text: string) =>
  termParts(text)
    .map((part) =>
      typeof part === 'string' ? part : 'term' in part ? part.shown : part.label,
    )
    .join('');
