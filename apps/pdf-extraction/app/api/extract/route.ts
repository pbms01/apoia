import { NextRequest, NextResponse } from 'next/server'
import PDFParser from 'pdf2json'

async function pdfToText(buffer: Buffer): Promise<{ text: string; numPages: number }> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true) // needRawText = true

        pdfParser.on('pdfParser_dataError', (errData) => {
            reject(errData instanceof Error ? errData : errData.parserError)
        })

        pdfParser.on('pdfParser_dataReady', (pdfData) => {
            const numPages = pdfData.Pages.length

            const pagesText = pdfData.Pages.map((page, idx) => {
                const texts = page.Texts.map(t =>
                    t.R.map(r => decodeURIComponent(r.T)).join('')
                ).join(' ')
                const cleaned = texts.replace(/\s+/g, ' ').replace(/\s([.,;?])/g, '$1').trim()
                return `<page number="${idx + 1}">\n${cleaned}\n</page>`
            })

            resolve({ text: pagesText.join('\n'), numPages })
        })

        pdfParser.parseBuffer(buffer)
    })
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('pdf') as File
        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo PDF enviado' }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const { text, numPages } = await pdfToText(buffer)

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
