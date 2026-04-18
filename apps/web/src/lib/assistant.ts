export interface AssistantChunk {
  chunkText: string
  protocolFilename: string
}

function normalizeToken(value: string): string {
  return value.toLocaleLowerCase('ru-RU').replace(/[^\p{L}\p{N}_-]/gu, '')
}

function tokenize(value: string): string[] {
  return value
    .split(/\s+/)
    .map(normalizeToken)
    .filter((token) => token.length >= 3)
}

export function pickRelevantChunks(
  question: string,
  chunks: AssistantChunk[],
  limit = 6,
): AssistantChunk[] {
  const tokens = tokenize(question)
  if (tokens.length === 0) {
    return chunks.slice(0, limit)
  }

  const scored = chunks
    .map((chunk) => {
      const haystack = normalizeToken(chunk.chunkText)
      const score = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0)
      return {
        chunk,
        score,
      }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) {
    return chunks.slice(0, Math.min(limit, 4))
  }

  return scored.slice(0, limit).map((item) => item.chunk)
}
