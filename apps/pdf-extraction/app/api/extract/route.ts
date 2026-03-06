import { NextRequest, NextResponse } from 'next/server'
import { extractText, getDocumentProxy } from 'unpdf'

async function pdfToText(arrayBuffer: ArrayBuffer) {
    const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer))
    const { totalPages, text: rawText } = await extractText(pdf, { mergePages: false })

    const s = rawText
        .map((pageText, idx) => {
            const cleaned = pageText.replace(/\s+/g, ' ').replace(/\s([.,;?])/g, '$1').trim()
            return `<page number="${idx + 1}">\n${cleaned}\n</page>`
        })
        .join('\n')

    return { text: s, numPages: totalPages }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('pdf') as File
        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo PDF enviado' }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const { text, numPages } = await pdfToText(arrayBuffer)

        return NextResponse.json({
            text,
            numPages,
            numChars: text.length,
            fileName: file.name
        })
    } catch (error: any) {
        console.error('Erro na extração do PDF:', error)
        return NextResponse.json({ error: error.message || 'Erro ao extrair texto do PDF' }, { status: 500 })
    }
}
