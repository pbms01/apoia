// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getDocument } from 'pdfjs-dist'

// Inline pdfToText to avoid worker import issues in the sub-app
async function pdfToText(blob: ArrayBuffer) {
    const doc = await getDocument(blob.slice(0)).promise
    const pdf = {
        pages: [] as any[]
    }
    const promises = []
    const loadPage = pageNum => doc.getPage(pageNum).then(async page => {
        const viewport = page.getViewport({ scale: 1.0 })
        const pag = {
            content: undefined as any,
            pageInfo: { num: pageNum, height: viewport.height }
        }
        pdf.pages.push(pag)
        await page.getTextContent({ normalizeWhitespace: true }).then((content) => {
            pag.content = content.items.map(item => ({
                str: item.str,
            }))
        })
    })
    for (let i = 1; i <= doc.numPages; i++) {
        promises.push(loadPage(i))
    }
    await Promise.all(promises)
    pdf.pages.sort((a, b) => a.pageInfo.num - b.pageInfo.num)

    const pagesText = pdf.pages.map(page =>
        page.content.map((item) => item.str).join(' ').replace(/\s+/g, ' ').replace(/\s([.,;?])/g, '$1').trim())

    const s = pagesText.map((str, idx) => `<page number="${idx + 1}">\n${str}\n</page>`).join('\n')
    return { text: s, numPages: doc.numPages }
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
