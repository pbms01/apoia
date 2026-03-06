'use client'

import { useState, useEffect } from 'react'
import { Form, InputGroup, Button, Badge } from 'react-bootstrap'

type Provider = {
    key: string
    label: string
    prefix: string
    envKey: string
}

const providers: Provider[] = [
    { key: 'openai', label: 'OpenAI', prefix: 'sk-proj-', envKey: 'OPENAI_API_KEY' },
    { key: 'anthropic', label: 'Anthropic', prefix: 'sk-ant-', envKey: 'ANTHROPIC_API_KEY' },
    { key: 'google', label: 'Google', prefix: 'AI', envKey: 'GOOGLE_API_KEY' },
]

type ApiKeys = Record<string, string>

export default function ApiKeyConfig({ onKeysChange }: { onKeysChange: (keys: ApiKeys) => void }) {
    const [keys, setKeys] = useState<ApiKeys>({})
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

    useEffect(() => {
        const saved: ApiKeys = {}
        providers.forEach(p => {
            const val = localStorage.getItem(`apoia_${p.envKey}`)
            if (val) saved[p.envKey] = val
        })
        setKeys(saved)
        onKeysChange(saved)
    }, [])

    const updateKey = (envKey: string, value: string) => {
        const newKeys = { ...keys, [envKey]: value }
        if (!value) delete newKeys[envKey]
        setKeys(newKeys)

        if (value) {
            localStorage.setItem(`apoia_${envKey}`, value)
        } else {
            localStorage.removeItem(`apoia_${envKey}`)
        }
        onKeysChange(newKeys)
    }

    return (
        <div>
            <h6 className="mb-3">Chaves de API</h6>
            {providers.map(p => (
                <Form.Group key={p.key} className="mb-2">
                    <Form.Label className="small mb-1">
                        {p.label}{' '}
                        {keys[p.envKey] ? (
                            <Badge bg="success" className="ms-1">Configurada</Badge>
                        ) : (
                            <Badge bg="secondary" className="ms-1">Nao configurada</Badge>
                        )}
                    </Form.Label>
                    <InputGroup size="sm">
                        <Form.Control
                            type={showKeys[p.key] ? 'text' : 'password'}
                            placeholder={`${p.prefix}...`}
                            value={keys[p.envKey] || ''}
                            onChange={e => updateKey(p.envKey, e.target.value)}
                        />
                        <Button
                            variant="outline-secondary"
                            onClick={() => setShowKeys(s => ({ ...s, [p.key]: !s[p.key] }))}
                        >
                            {showKeys[p.key] ? 'Ocultar' : 'Mostrar'}
                        </Button>
                    </InputGroup>
                </Form.Group>
            ))}
        </div>
    )
}
