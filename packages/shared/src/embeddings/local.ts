// @xenova/transformers pipeline is cached at module level
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipeline: any = null

async function getPipeline() {
  if (!pipeline) {
    const { pipeline: createPipeline } = await import('@xenova/transformers')
    pipeline = await createPipeline('feature-extraction', 'Xenova/multilingual-e5-large')
  }
  return pipeline
}

export async function embed(texts: string[]): Promise<number[][]> {
  const pipe = await getPipeline()
  const results: number[][] = []

  for (const text of texts) {
    const output = await pipe(text, { pooling: 'mean', normalize: true })
    results.push(Array.from(output.data as Float32Array))
  }

  return results
}
