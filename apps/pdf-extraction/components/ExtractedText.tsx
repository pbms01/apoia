'use client'

import { Form, Badge } from 'react-bootstrap'

export default function ExtractedText({
    text,
    fileName,
    numPages,
    onTextChange
}: {
    text: string
    fileName: string
    numPages: number
    onTextChange: (text: string) => void
}) {
    if (!text) return null

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="mb-0">Texto Extraido</h6>
                <div>
                    <Badge bg="info" className="me-1">{fileName}</Badge>
                    <Badge bg="secondary" className="me-1">{numPages} paginas</Badge>
                    <Badge bg="secondary">{text.length.toLocaleString()} chars</Badge>
                </div>
            </div>
            <Form.Control
                as="textarea"
                rows={10}
                value={text}
                onChange={e => onTextChange(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
            />
        </div>
    )
}
