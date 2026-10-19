export type Segment =
  | { type: 'text' | 'code' | 'strong' | 'em'; text: string }
  | { type: 'link'; text: string; href: string };

const token =
  /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

const unescape = (text: string) => text.replace(/\\([\\`*_[\]()#.!-])/g, '$1');

// The inline markdown a discussion's prose uses: code, bold, italics and web links.
// Anything else stays as the text it was written as, and nothing becomes raw HTML.
export function inlineSegments(source: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of source.matchAll(token)) {
    if (match.index > last) {
      segments.push({ type: 'text', text: unescape(source.slice(last, match.index)) });
    }
    const [, code, strong, em, label, href] = match;
    if (code !== undefined) segments.push({ type: 'code', text: code });
    else if (strong !== undefined)
      segments.push({ type: 'strong', text: unescape(strong) });
    else if (em !== undefined) segments.push({ type: 'em', text: unescape(em) });
    else segments.push({ type: 'link', text: unescape(label), href });
    last = match.index + match[0].length;
  }
  if (last < source.length) {
    segments.push({ type: 'text', text: unescape(source.slice(last)) });
  }
  return segments;
}
