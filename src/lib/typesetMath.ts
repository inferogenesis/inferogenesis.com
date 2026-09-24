import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { SVG } from 'mathjax-full/js/output/svg.js';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
// Glyphs are drawn as paths inside each SVG, so no page downloads a maths font.
const document = mathjax.document('', {
  InputJax: new TeX({ packages: AllPackages }),
  OutputJax: new SVG({ fontCache: 'local' }),
});

// Display TeX as a self-contained SVG, drawn in currentColor.
export function typesetDisplaySvg(tex: string): string {
  return adaptor.innerHTML(document.convert(tex, { display: true }));
}
