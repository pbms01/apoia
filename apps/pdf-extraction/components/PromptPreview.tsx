'use client'

import { useState } from 'react'
import { Button, Collapse } from 'react-bootstrap'

export default function PromptPreview({
    systemPrompt,
    userPrompt
}: {
    systemPrompt: string
    userPrompt: string
}) {
    const [showSystem, setShowSystem] = useState(false)
    const [showUser, setShowUser] = useState(false)

    if (!systemPrompt && !userPrompt) return null

    return (
        <div className="mt-3">
            <h6>Prompt Construido</h6>

            {systemPrompt && (
                <div className="mb-2">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setShowSystem(!showSystem)}
                    >
                        {showSystem ? 'Ocultar' : 'Mostrar'} System Prompt ({systemPrompt.length.toLocaleString()} chars)
                    </Button>
                    <Collapse in={showSystem}>
                        <div>
                            <pre className="bg-light p-2 rounded mt-1 small" style={{ maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                                {systemPrompt}
                            </pre>
                        </div>
                    </Collapse>
                </div>
            )}

            {userPrompt && (
                <div>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setShowUser(!showUser)}
                    >
                        {showUser ? 'Ocultar' : 'Mostrar'} User Prompt ({userPrompt.length.toLocaleString()} chars)
                    </Button>
                    <Collapse in={showUser}>
                        <div>
                            <pre className="bg-light p-2 rounded mt-1 small" style={{ maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                                {userPrompt}
                            </pre>
                        </div>
                    </Collapse>
                </div>
            )}
        </div>
    )
}
