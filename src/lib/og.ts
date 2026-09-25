import * as fontkit from 'fontkit';

export type Measure = (text: string, size: number) => number;

const titleSize = 40;
const titleLeading = 50;
const titleWidth = 880;
const titleLines = 3;
const tagline = /<text\b[^>]*>continuous active inference, from the first cell<\/text>/;

// One share image per route: / is /og/index.png, /a/b/ is /og/a/b.png.
export function ogImagePath(pathname: string): string {
  const route = pathname.replace(/^\/|\/$/g, '');
  return `/og/${route || 'index'}.png`;
}

// Width of a run of text at a font size, from the font's own advances and kerning.
export function measureWith(fontPath: string): Measure {
  const font = fontkit.openSync(fontPath) as fontkit.Font;
  return (text, size) => (font.layout(text).advanceWidth * size) / font.unitsPerEm;
}

export function wrapTitle(
  title: string,
  measure: Measure,
  size: number,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of title.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate, size) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = `${kept[maxLines - 1]}…`;
  while (measure(last, size) > maxWidth && last.includes(' ')) {
    last = `${last.slice(0, last.lastIndexOf(' '))}…`;
  }
  kept[maxLines - 1] = last;
  return kept;
}

const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

// The banner with the page title where its tagline sits. The landing page, with no title
// of its own, keeps the banner as supplied. Colours and faces come from the banner.
export function ogSvg(banner: string, title: string | null, measure: Measure): string {
  if (title === null) return banner;
  const taglineElement = tagline.exec(banner)?.[0];
  if (!taglineElement)
    throw new Error('The banner no longer has its tagline to replace.');
  const x = /\bx="([^"]+)"/.exec(taglineElement)?.[1];
  const y = Number(/\by="([^"]+)"/.exec(taglineElement)?.[1]);
  const family = /font-family="([^"]+)"/.exec(taglineElement)?.[1];
  const fill = /<tspan[^>]*fill="([^"]+)"[^>]*>infero</.exec(banner)?.[1];
  const lines = wrapTitle(title, measure, titleSize, titleWidth, titleLines);
  const spans = lines
    .map(
      (line, index) =>
        `<tspan x="${x}" y="${y + 8 + index * titleLeading}">${escape(line)}</tspan>`,
    )
    .join('');
  const titleElement = `<text font-family="${family}" font-weight="500" font-size="${titleSize}" fill="${fill}">${spans}</text>`;
  return banner.replace(taglineElement, titleElement);
}
