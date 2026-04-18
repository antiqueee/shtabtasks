import type { ParsedTaskFromProtocol } from './schemas.js'

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

async function chat(model: string, systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content ?? ''
}

function getFastModel(): string {
  return process.env.OPENROUTER_MODEL_FAST ?? 'google/gemini-2.5-flash'
}

function getSmartModel(): string {
  return process.env.OPENROUTER_MODEL_SMART ?? 'google/gemini-2.5-pro'
}

// Stub: parse quick task from text/voice transcription
export async function parseQuickTask(_text: string): Promise<Partial<ParsedTaskFromProtocol>> {
  // TODO: implement task parsing from short text
  return { title: _text }
}

// Stub: parse meeting protocol into list of tasks
export async function parseProtocol(_text: string): Promise<ParsedTaskFromProtocol[]> {
  // TODO: implement protocol parsing with smart model
  void getSmartModel()
  return []
}

// Stub: RAG answer using retrieved chunks
export async function answerWithRag(_question: string, _chunks: string[]): Promise<string> {
  // TODO: implement RAG answering with fast model
  void getFastModel()
  return 'Ответ будет здесь'
}
