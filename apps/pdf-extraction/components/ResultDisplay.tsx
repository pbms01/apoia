'use client'

import { useState } from 'react'
import { Button, Spinner, Alert } from 'react-bootstrap'
import ReactMarkdown from 'react-markdown'

export default function ResultDisplay({
    result,
    loading,
    error,
}: {
    result: string
    loading: boolean
    error: string
}) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(result)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (error) return <Alert variant="danger" className="mt-3">{error}</Alert>
    if (!loading && !result) return null

    return (
        <div className="mt-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="mb-0">
                    Resultado
                    {loading && <Spinner animation="border" size="sm" className="ms-2" />}
                </h6>
                {result && (
                    <Button variant="outline-secondary" size="sm" onClick={handleCopy}>
                        {copied ? 'Copiado!' : 'Copiar'}
                    </Button>
                )}
            </div>
            <div className="border rounded p-3 bg-white" style={{ minHeight: 100, maxHeight: 600, overflow: 'auto' }}>
                <ReactMarkdown>{result}</ReactMarkdown>
            </div>
        </div>
    )
}
