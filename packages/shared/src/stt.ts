const YC_STT_URL = 'https://stt.api.cloud.yandex.net/speech/v1/stt:recognize'

// Stub: synchronous speech recognition via Yandex SpeechKit
export async function recognizeSpeech(_audioBuffer: Buffer): Promise<string> {
  const apiKey = process.env.YC_API_KEY
  const folderId = process.env.YC_FOLDER_ID
  if (!apiKey || !folderId) throw new Error('YC_API_KEY and YC_FOLDER_ID must be set')

  // TODO: implement actual STT call
  // POST YC_STT_URL with Authorization: Api-Key {apiKey}
  // body: audio buffer (OGG/OPUS), query params: folderId, lang=ru-RU
  void YC_STT_URL
  return ''
}
