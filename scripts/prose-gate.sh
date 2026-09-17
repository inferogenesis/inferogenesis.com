#!/usr/bin/env sh
# The revision-pass grep from CLAUDE.md, with frontmatter, fenced code, inline code
# and HTML comments stripped first so code never counts as prose.
set -u

pattern='—|;|, (making|allowing|ensuring|providing|enabling) |[Ii]t.s worth|[Nn]ote that|[Tt]hat said|[Nn]ot just|[Ii]n other words|[Uu]ltimately|[Aa]t its core'

strip_non_prose() {
  awk '
    NR == 1 && $0 == "---"         { front = 1; next }
    front && $0 == "---"           { front = 0; next }
    front                          { next }
    /^[[:space:]]*(```|~~~)/       { fence = !fence; next }
    fence                          { next }
    {
      line = $0
      for (;;) {
        if (comment) {
          end = index(line, "-->")
          if (end == 0) { line = ""; break }
          line = substr(line, end + 3)
          comment = 0
        }
        start = index(line, "<!--")
        if (start == 0) break
        rest = substr(line, start)
        end = index(rest, "-->")
        if (end == 0) { line = substr(line, 1, start - 1); comment = 1; break }
        line = substr(line, 1, start - 1) substr(rest, end + 3)
      }
      gsub(/`[^`]*`/, "", line)
      gsub(/&[A-Za-z0-9#]+;/, "", line)
      print FILENAME ":" NR ":" line
    }
  ' "$1"
}

total=0
for file in "$@"; do
  hits=$(strip_non_prose "$file" | grep -E -- "$pattern")
  if [ -n "$hits" ]; then
    printf '%s\n' "$hits"
    total=$((total + $(printf '%s\n' "$hits" | wc -l)))
  fi
done

if [ "$total" -gt 0 ]; then
  printf 'prose gate: %s hit(s). See the revision pass in CLAUDE.md.\n' "$total" >&2
  exit 1
fi
