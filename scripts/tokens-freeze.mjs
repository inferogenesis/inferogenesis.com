import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const source = readFileSync('src/styles/tokens.css', 'utf8');
const target = `public/tokens/${version}.css`;

mkdirSync('public/tokens', { recursive: true });
writeFileSync(target, `/* inferogenesis tokens ${version} */\n${source}`);
console.log(`${target} frozen from src/styles/tokens.css`);
