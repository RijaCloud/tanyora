export function looksMojibake(input: string): boolean {
  return /Ã|Â|â€™|â€œ|â€|ðŸ|\uFFFD/.test(input);
}

function mojibakeScore(input: string): number {
  const matches = input.match(/Ã|Â|â€™|â€œ|â€|ðŸ|\uFFFD/g);
  return matches ? matches.length : 0;
}

function decodeLatin1AsUtf8(input: string): string {
  const bytes = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    bytes[i] = input.charCodeAt(i) & 0xff;
  }

  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return input;
  }
}

export function fixMojibake(input: string): string {
  if (!looksMojibake(input)) {
    return input;
  }

  let current = input;
  let best = input;
  let bestScore = mojibakeScore(input);

  for (let i = 0; i < 3; i += 1) {
    const candidate = decodeLatin1AsUtf8(current);
    if (!candidate || candidate === current) {
      break;
    }

    const score = mojibakeScore(candidate);
    if (score <= bestScore) {
      best = candidate;
      bestScore = score;
    }

    current = candidate;
  }

  return best;
}
