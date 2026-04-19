import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

export interface ParsedProtocolInput {
  filename: string
  source: 'protocol_docx' | 'protocol_xlsx' | 'protocol_pdf' | 'protocol_paste'
  text: string
}

function normalizeText(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

async function readDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return normalizeText(result.value)
}

function readXlsx(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const parts: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
      header: 1,
      raw: false,
      blankrows: false,
    })

    if (rows.length === 0) {
      continue
    }

    parts.push(`# Лист: ${sheetName}`)
    for (const row of rows) {
      const line = row
        .map((cell) => (cell == null ? '' : String(cell).trim()))
        .filter(Boolean)
        .join(' | ')

      if (line) {
        parts.push(line)
      }
    }
  }

  return normalizeText(parts.join('\n'))
}

async function readPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()
  await parser.destroy()
  return normalizeText(result.text)
}

export async function parseProtocolInput(file: File | null, pastedText: string): Promise<ParsedProtocolInput> {
  const normalizedText = pastedText.trim()

  if (file && file.size > 0) {
    const filename = file.name || 'protocol'
    const lower = filename.toLowerCase()
    const buffer = Buffer.from(await file.arrayBuffer())

    if (lower.endsWith('.docx')) {
      return {
        filename,
        source: 'protocol_docx',
        text: await readDocx(buffer),
      }
    }

    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      return {
        filename,
        source: 'protocol_xlsx',
        text: readXlsx(buffer),
      }
    }

    if (lower.endsWith('.pdf')) {
      return {
        filename,
        source: 'protocol_pdf',
        text: await readPdf(buffer),
      }
    }

    const text = normalizeText(buffer.toString('utf8'))
    return {
      filename,
      source: 'protocol_paste',
      text,
    }
  }

  if (!normalizedText) {
    throw new Error('Protocol source is empty')
  }

  return {
    filename: `Вставка ${new Date().toISOString()}`,
    source: 'protocol_paste',
    text: normalizeText(normalizedText),
  }
}

export function chunkProtocolText(text: string, maxChunkLength = 1200): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let current = ''

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph
    if (candidate.length <= maxChunkLength) {
      current = candidate
      continue
    }

    if (current) {
      chunks.push(current)
    }

    if (paragraph.length <= maxChunkLength) {
      current = paragraph
      continue
    }

    for (let i = 0; i < paragraph.length; i += maxChunkLength) {
      chunks.push(paragraph.slice(i, i + maxChunkLength))
    }
    current = ''
  }

  if (current) {
    chunks.push(current)
  }

  return chunks
}
