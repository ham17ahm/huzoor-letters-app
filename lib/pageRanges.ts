export function parsePageRange(input: string): number[] {
  const pages = new Set<number>();

  for (const rawPart of input.split(',')) {
    const part = rawPart.trim();
    if (!part) continue;

    if (part.includes('-')) {
      const rangeParts = part.split('-').map((x) => x.trim());
      if (rangeParts.length !== 2) {
        throw new Error(`Invalid page range: ${part}`);
      }

      const [startRaw, endRaw] = rangeParts;
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
        throw new Error(`Invalid page range: ${part}`);
      }
      for (let page = start; page <= end; page += 1) pages.add(page);
      continue;
    }

    const page = Number(part);
    if (!Number.isInteger(page) || page < 1) {
      throw new Error(`Invalid page number: ${part}`);
    }
    pages.add(page);
  }

  const result = Array.from(pages).sort((a, b) => a - b);
  if (!result.length) throw new Error('At least one page number is required.');
  return result;
}

export function formatPageRange(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  if (!sorted.length) return '';

  const chunks: string[] = [];
  let start = sorted[0];
  let previous = sorted[0];

  for (let i = 1; i < sorted.length; i += 1) {
    const page = sorted[i];
    if (page === previous + 1) {
      previous = page;
      continue;
    }
    chunks.push(start === previous ? String(start) : `${start}-${previous}`);
    start = page;
    previous = page;
  }

  chunks.push(start === previous ? String(start) : `${start}-${previous}`);
  return chunks.join(', ');
}
