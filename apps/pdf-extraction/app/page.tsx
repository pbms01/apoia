'use client'

import { useState, useCallback } from 'react'
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap'
import ApiKeyConfig from '../components/ApiKeyConfig'
import ModelSelector from '../components/ModelSelector'
import PdfUploader from '../components/PdfUploader'
import PromptSelector from '../components/PromptSelector'
import ExtractedText from '../components/ExtractedText'
import PromptPreview from '../components/PromptPreview'
import ResultDisplay from '../components/ResultDisplay'

export default function Home() {
    // State
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
    const [selectedModel, setSelectedModel] = useState('')
    const [selectedPrompt, setSelectedPrompt] = useState('')
    const [extractedText, setExtractedText] = useState('')
    const [fileName, setFileName] = useState('')
    const [numPages, setNumPages] = useState(0)
    const [pieceDescr, setPieceDescr] = useState('Documento')

    // Prompt preview state
    const [builtSystemPrompt, setBuiltSystemPrompt] = useState('')
    const [builtUserPrompt, setBuiltUserPrompt] = useState('')

    // Generation state
    const [result, setResult] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleTextExtracted = useCallback((text: string, fName: string, pages: number) => {
        setExtractedText(text)
        setFileName(fName)
        setNumPages(pages)
        setResult('')
        setError('')
    }, [])

    const handleBuildPrompt = useCallback(async () => {
        if (!selectedPrompt || !extractedText) return

        try {
            const res = await fetch('/api/prompts')
            const prompts = await res.json()
            const prompt = prompts.find((p: any) => p.slug === selectedPrompt)
            if (prompt) {
                // We show a simplified preview - the actual prompt building happens server-side
                setBuiltSystemPrompt(prompt.systemPreview ? prompt.systemPreview + '...' : '')
                setBuiltUserPrompt(`[Prompt template com {{textos}} substituido pelo texto extraido - ${extractedText.length.toLocaleString()} caracteres]`)
            }
        } catch (e) {
            // Silently fail preview
        }
    }, [selectedPrompt, extractedText])

    // Build prompt preview when prompt or text changes
    const handlePromptChange = (slug: string) => {
        setSelectedPrompt(slug)
        setResult('')
        setError('')
        if (slug && extractedText) {
            // Trigger preview build after state update
            setTimeout(() => handleBuildPrompt(), 100)
        }
    }

    const getApiKeyForModel = (model: string): string => {
        if (model.startsWith('claude-')) return apiKeys['ANTHROPIC_API_KEY'] || ''
        if (model.startsWith('gpt-')) return apiKeys['OPENAI_API_KEY'] || ''
        if (model.startsWith('gemini-')) return apiKeys['GOOGLE_API_KEY'] || ''
        return ''
    }

    const canExecute = selectedModel && selectedPrompt && extractedText && getApiKeyForModel(selectedModel)

    const handleExecute = async () => {
        if (!canExecute) return

        setLoading(true)
        setResult('')
        setError('')

        try {
            const apiKey = getApiKeyForModel(selectedModel)
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptSlug: selectedPrompt,
                    textos: extractedText,
                    model: selectedModel,
                    apiKey,
                    pieceDescr,
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro na geracao')
            }

            // Handle streaming response
            const reader = res.body?.getReader()
            if (!reader) throw new Error('Stream nao disponivel')

            const decoder = new TextDecoder()
            let accumulated = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                // Parse Vercel AI SDK data stream format
                const lines = chunk.split('\n')
                for (const line of lines) {
                    if (line.startsWith('0:')) {
                        // Text chunk - parse the JSON string after "0:"
                        try {
                            const text = JSON.parse(line.slice(2))
                            accumulated += text
                            setResult(accumulated)
                        } catch {
                            // Skip malformed lines
                        }
                    }
                }
            }
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Container fluid>
            <Row>
                {/* Sidebar */}
                <Col md={3} className="sidebar p-3">
                    <h5 className="mb-3">ApoIA - Simulador de Pipeline</h5>
                    <hr />

                    <ApiKeyConfig onKeysChange={setApiKeys} />
                    <hr />

                    <ModelSelector
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        apiKeys={apiKeys}
                    />
                    <hr />

                    <PromptSelector
                        selectedPrompt={selectedPrompt}
                        onPromptChange={handlePromptChange}
                    />
                    <hr />

                    <div className="mb-3">
                        <label className="form-label small mb-1"><strong>Descricao da Peca</strong></label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            value={pieceDescr}
                            onChange={e => setPieceDescr(e.target.value)}
                            placeholder="Ex: Peticao Inicial, Contestacao..."
                        />
                        <div className="form-text small">Usado como tag XML ao enviar o texto ao LLM</div>
                    </div>

                    <Button
                        variant="primary"
                        className="w-100"
                        disabled={!canExecute || loading}
                        onClick={handleExecute}
                    >
                        {loading ? 'Processando...' : 'Executar Pipeline'}
                    </Button>

                    {!canExecute && (
                        <Alert variant="info" className="mt-2 py-1 small">
                            {!Object.keys(apiKeys).length && 'Configure uma chave de API. '}
                            {!selectedModel && 'Selecione um modelo. '}
                            {!extractedText && 'Faca upload de um PDF. '}
                            {!selectedPrompt && 'Selecione um prompt. '}
                        </Alert>
                    )}
                </Col>

                {/* Main content */}
                <Col md={9} className="main-content p-4">
                    <div className="step-header">1. Upload do PDF</div>
                    <PdfUploader onTextExtracted={handleTextExtracted} />

                    {extractedText && (
                        <>
                            <div className="step-header mt-4">2. Texto Extraido (editavel)</div>
                            <ExtractedText
                                text={extractedText}
                                fileName={fileName}
                                numPages={numPages}
                                onTextChange={setExtractedText}
                            />
                        </>
                    )}

                    {selectedPrompt && extractedText && (
                        <>
                            <div className="step-header mt-4">3. Preview do Prompt</div>
                            <PromptPreview
                                systemPrompt={builtSystemPrompt}
                                userPrompt={builtUserPrompt}
                            />
                        </>
                    )}

                    {(result || loading || error) && (
                        <>
                            <div className="step-header mt-4">4. Resultado</div>
                            <ResultDisplay
                                result={result}
                                loading={loading}
                                error={error}
                            />
                        </>
                    )}
                </Col>
            </Row>
        </Container>
    )
}
