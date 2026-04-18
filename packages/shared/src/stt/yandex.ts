const YC_STT_URL = 'https://stt.api.cloud.yandex.net/speech/v1/stt:recognize'

export async function transcribeAudio(oggOpusBuffer: Buffer): Promise<string> {
  const apiKey = process.env.YC_API_KEY
  const folderId = process.env.YC_FOLDER_ID
  if (!apiKey) throw new Error('YC_API_KEY is not set')
  if (!folderId) throw new Error('YC_FOLDER_ID is not set')

  const url = `${YC_STT_URL}?folderId=${folderId}&lang=ru-RU&format=oggopus`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${apiKey}`,
      'Content-Type': 'application/octet-stream',
    },
    body: oggOpusBuffer,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Yandex STT ${res.status}: ${text}`)
  }

  const data = (await res.json()) as { result?: string; error_code?: string; error_message?: string }

  if (data.error_code) {
    throw new Error(`Yandex STT error: ${data.error_message ?? data.error_code}`)
  }

  return data.result ?? ''
}
