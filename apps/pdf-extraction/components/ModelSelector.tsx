'use client'

import { Form } from 'react-bootstrap'

type ModelOption = {
    name: string
    provider: string
    providerKey: string
}

const models: ModelOption[] = [
    { name: 'gpt-4o-2024-11-20', provider: 'OpenAI', providerKey: 'OPENAI_API_KEY' },
    { name: 'gpt-4o-2024-08-06', provider: 'OpenAI', providerKey: 'OPENAI_API_KEY' },
    { name: 'gpt-4o-mini-2024-07-18', provider: 'OpenAI', providerKey: 'OPENAI_API_KEY' },
    { name: 'claude-3-7-sonnet-20250219', provider: 'Anthropic', providerKey: 'ANTHROPIC_API_KEY' },
    { name: 'claude-3-5-sonnet-20241022', provider: 'Anthropic', providerKey: 'ANTHROPIC_API_KEY' },
    { name: 'claude-3-5-haiku-20241022', provider: 'Anthropic', providerKey: 'ANTHROPIC_API_KEY' },
    { name: 'gemini-2.0-flash', provider: 'Google', providerKey: 'GOOGLE_API_KEY' },
    { name: 'gemini-2.5-pro-exp-03-25', provider: 'Google', providerKey: 'GOOGLE_API_KEY' },
    { name: 'gemini-1.5-pro-002', provider: 'Google', providerKey: 'GOOGLE_API_KEY' },
]

export default function ModelSelector({
    selectedModel,
    onModelChange,
    apiKeys
}: {
    selectedModel: string
    onModelChange: (model: string) => void
    apiKeys: Record<string, string>
}) {
    const availableModels = models.filter(m => apiKeys[m.providerKey])
    const grouped = availableModels.reduce((acc, m) => {
        if (!acc[m.provider]) acc[m.provider] = []
        acc[m.provider].push(m)
        return acc
    }, {} as Record<string, ModelOption[]>)

    return (
        <Form.Group className="mb-3">
            <Form.Label className="small mb-1"><strong>Modelo</strong></Form.Label>
            {Object.keys(grouped).length === 0 ? (
                <Form.Text className="text-muted d-block">Configure pelo menos uma chave de API para selecionar um modelo.</Form.Text>
            ) : (
                <Form.Select
                    size="sm"
                    value={selectedModel}
                    onChange={e => onModelChange(e.target.value)}
                >
                    <option value="">Selecione um modelo...</option>
                    {Object.entries(grouped).map(([provider, provModels]) => (
                        <optgroup key={provider} label={provider}>
                            {provModels.map(m => (
                                <option key={m.name} value={m.name}>{m.name}</option>
                            ))}
                        </optgroup>
                    ))}
                </Form.Select>
            )}
        </Form.Group>
    )
}
