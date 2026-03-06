import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'ApoIA - Extrator de PDF e Simulador de Pipeline',
    description: 'Ferramenta para extrair texto de PDFs e simular o pipeline de sintese do ApoIA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR">
            <body>{children}</body>
        </html>
    )
}
