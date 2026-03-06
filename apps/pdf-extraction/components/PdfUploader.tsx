'use client'

import { useState, useRef, DragEvent } from 'react'
import { Button, Spinner, Alert } from 'react-bootstrap'

export default function PdfUploader({
    onTextExtracted
}: {
    onTextExtracted: (text: string, fileName: string, numPages: number) => void
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [isDragOver, setIsDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const extractText = async (file: File) => {
        setLoading(true)
        setError('')
        try {
            const formData = new FormData()
            formData.append('pdf', file)
            const res = await fetch('/api/extract', { method: 'POST', body: formData })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao extrair texto')
            }
            const data = await res.json()
            onTextExtracted(data.text, data.fileName, data.numPages)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleFile = (files: FileList | null) => {
        if (!files || files.length === 0) return
        const file = files[0]
        if (file.type !== 'application/pdf') {
            setError('Por favor, selecione um arquivo PDF.')
            return
        }
        extractText(file)
    }

    const handleDrop = (e: DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        handleFile(e.dataTransfer.files)
    }

    return (
        <div>
            <div
                className={`border rounded p-4 text-center ${isDragOver ? 'border-primary bg-light' : 'border-dashed'}`}
                style={{ borderStyle: 'dashed', cursor: 'pointer', minHeight: 120 }}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                {loading ? (
                    <div>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Extraindo texto do PDF...
                    </div>
                ) : (
                    <div>
                        <div className="mb-2" style={{ fontSize: '2rem' }}>
                            &#128196;
                        </div>
                        <div>Arraste um arquivo PDF aqui ou clique para selecionar</div>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files)}
                />
            </div>
            {error && <Alert variant="danger" className="mt-2 py-1 small">{error}</Alert>}
        </div>
    )
}
