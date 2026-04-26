import { db, protocolChunks, protocols } from '@/lib/workspace-db'
import { answerWithRag } from '@/lib/workspace-shared'
import { pickRelevantChunks } from '@/lib/assistant'
import { asc, desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: string }
    const question = String(body.question ?? '').trim()

    if (!question) {
      return NextResponse.json(
        {
          question: '',
          answer: 'Нужен вопрос по загруженным протоколам.',
          sources: [],
        },
        { status: 400 },
      )
    }

    const chunks = await db
      .select({
        chunkText: protocolChunks.chunkText,
        protocolFilename: protocols.filename,
      })
      .from(protocolChunks)
      .innerJoin(protocols, eq(protocolChunks.protocolId, protocols.id))
      .orderBy(desc(protocols.uploadedAt), asc(protocolChunks.chunkIndex))
      .limit(250)

    const relevant = pickRelevantChunks(question, chunks)
    const result = await answerWithRag(
      question,
      relevant.map((item) => ({
        text: item.chunkText,
        protocolFilename: item.protocolFilename,
      })),
    )

    return NextResponse.json({
      question,
      answer: result.answer,
      sources: result.sources,
    })
  } catch (error) {
    console.error('Assistant API failed', error)
    return NextResponse.json(
      {
        question: '',
        answer: 'Не удалось получить ответ ассистента. Попробуй ещё раз через несколько секунд.',
        sources: [],
      },
      { status: 500 },
    )
  }
}
