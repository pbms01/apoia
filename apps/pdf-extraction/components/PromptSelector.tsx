'use client'

import { useState, useEffect } from 'react'
import { Form, Spinner } from 'react-bootstrap'

type PromptInfo = {
    slug: string
    kind: string
    category: string
    systemPreview: string
    promptPreview: string
    hasJsonSchema: boolean
    hasFormat: boolean
}

export default function PromptSelector({
    selectedPrompt,
    onPromptChange
}: {
    selectedPrompt: string
    onPromptChange: (slug: string) => void
}) {
    const [prompts, setPrompts] = useState<PromptInfo[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/prompts')
            .then(r => r.json())
            .then(data => {
                setPrompts(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return <Spinner animation="border" size="sm" />

    const grouped = prompts.reduce((acc, p) => {
        if (!acc[p.category]) acc[p.category] = []
        acc[p.category].push(p)
        return acc
    }, {} as Record<string, PromptInfo[]>)

    const selected = prompts.find(p => p.slug === selectedPrompt)

    return (
        <div>
            <Form.Group className="mb-2">
                <Form.Label className="small mb-1"><strong>Template de Prompt</strong></Form.Label>
                <Form.Select
                    size="sm"
                    value={selectedPrompt}
                    onChange={e => onPromptChange(e.target.value)}
                >
                    <option value="">Selecione um prompt...</option>
                    {Object.entries(grouped).map(([cat, items]) => (
                        <optgroup key={cat} label={cat}>
                            {items.map(p => (
                                <option key={p.slug} value={p.slug}>
                                    {p.slug}
                                    {p.hasJsonSchema ? ' [JSON]' : ''}
                                    {p.hasFormat ? ' [FMT]' : ''}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </Form.Select>
            </Form.Group>
            {selected && (
                <div className="mt-2 small text-muted">
                    <strong>System Prompt (preview):</strong>
                    <div className="bg-light p-2 rounded mt-1" style={{ maxHeight: 100, overflow: 'auto', fontSize: '0.8rem' }}>
                        {selected.systemPreview || '(vazio)'}...
                    </div>
                    <strong className="mt-1 d-block">Prompt (preview):</strong>
                    <div className="bg-light p-2 rounded mt-1" style={{ maxHeight: 100, overflow: 'auto', fontSize: '0.8rem' }}>
                        {selected.promptPreview || '(vazio)'}...
                    </div>
                </div>
            )}
        </div>
    )
}
