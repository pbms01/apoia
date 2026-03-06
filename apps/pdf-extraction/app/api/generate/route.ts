import { NextRequest } from 'next/server'
import { streamText, streamObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { LanguageModelV1 } from '@ai-sdk/provider'
import { PromptDataType, PromptDefinitionType, promptDefinitionFromMarkdown, promptExecuteBuilder } from '@/lib/prompt-utils'

// Import all prompt files
import ementa from '@/prompts/ementa.md'
import resumo_peca from '@/prompts/resumo-peca.md'
import resumo_peticao_inicial from '@/prompts/resumo-peticao-inicial.md'
import resumo_contestacao from '@/prompts/resumo-contestacao.md'
import resumo_informacao_em_mandado_de_seguranca from '@/prompts/resumo-informacao-em-mandado-de-seguranca.md'
import resumo_sentenca from '@/prompts/resumo-sentenca.md'
import resumo_recurso_inominado from '@/prompts/resumo-recurso-inominado.md'
import resumo from '@/prompts/resumo.md'
import analise from '@/prompts/analise.md'
import analise_tr from '@/prompts/analise-tr.md'
import analise_completa from '@/prompts/analise-completa.md'
import analise_completa_json from '@/prompts/analise-completa-json.md'
import analise_completa_com_indice_json from '@/prompts/analise-completa-com-indice-json.md'
import revisao from '@/prompts/revisao.md'
import refinamento from '@/prompts/refinamento.md'
import sentenca from '@/prompts/sentenca.md'
import litigancia_predatoria from '@/prompts/litigancia-predatoria.md'
import pedidos_de_peticao_inicial from '@/prompts/pedidos-de-peticao-inicial.md'
import pedidos_fundamentacoes_e_dispositivos from '@/prompts/pedidos-fundamentacoes-e-dispositivos.md'
import indice from '@/prompts/indice.md'
import relatorio from '@/prompts/relatorio.md'
import relatorio_completo_criminal from '@/prompts/relatorio-completo-criminal.md'
import triagem from '@/prompts/triagem.md'
import minuta_de_despacho_de_acordo_9_dias from '@/prompts/minuta-de-despacho-de-acordo-9-dias.md'

const promptFiles: Record<string, string> = {
    'ementa': ementa,
    'resumo-peca': resumo_peca,
    'resumo-peticao-inicial': resumo_peticao_inicial,
    'resumo-contestacao': resumo_contestacao,
    'resumo-informacao-em-mandado-de-seguranca': resumo_informacao_em_mandado_de_seguranca,
    'resumo-sentenca': resumo_sentenca,
    'resumo-recurso-inominado': resumo_recurso_inominado,
    'resumo': resumo,
    'analise': analise,
    'analise-tr': analise_tr,
    'analise-completa': analise_completa,
    'analise-completa-json': analise_completa_json,
    'analise-completa-com-indice-json': analise_completa_com_indice_json,
    'revisao': revisao,
    'refinamento': refinamento,
    'sentenca': sentenca,
    'litigancia-predatoria': litigancia_predatoria,
    'pedidos-de-peticao-inicial': pedidos_de_peticao_inicial,
    'pedidos-fundamentacoes-e-dispositivos': pedidos_fundamentacoes_e_dispositivos,
    'indice': indice,
    'relatorio': relatorio,
    'relatorio-completo-criminal': relatorio_completo_criminal,
    'triagem': triagem,
    'minuta-de-despacho-de-acordo-9-dias': minuta_de_despacho_de_acordo_9_dias,
}

function getModelRef(modelName: string, apiKey: string, structuredOutputs: boolean): LanguageModelV1 {
    if (modelName.startsWith('claude-')) {
        const anthropic = createAnthropic({ apiKey })
        return anthropic(modelName)
    }
    if (modelName.startsWith('gpt-')) {
        const openai = createOpenAI({ apiKey })
        return openai(modelName, { structuredOutputs }) as unknown as LanguageModelV1
    }
    if (modelName.startsWith('gemini-')) {
        const google = createGoogleGenerativeAI({ apiKey })
        return google(modelName, { structuredOutputs })
    }
    throw new Error(`Modelo ${modelName} nao suportado`)
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { promptSlug, textos, model, apiKey, pieceDescr } = body

        if (!promptSlug || !textos || !model || !apiKey) {
            return new Response(JSON.stringify({ error: 'Parametros obrigatorios: promptSlug, textos, model, apiKey' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const md = promptFiles[promptSlug]
        if (!md) {
            return new Response(JSON.stringify({ error: `Prompt '${promptSlug}' nao encontrado` }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const definition: PromptDefinitionType = promptDefinitionFromMarkdown(promptSlug.replace(/-/g, '_'), md)

        const data: PromptDataType = {
            textos: [{
                descr: pieceDescr || 'Documento',
                slug: 'documento',
                texto: textos
            }]
        }

        const exec = promptExecuteBuilder(definition, data)
        const messages = exec.message
        const structuredOutputs = exec.params?.structuredOutputs

        const modelRef = getModelRef(model, apiKey, !!structuredOutputs)

        if (!structuredOutputs) {
            const result = streamText({
                model: modelRef,
                messages,
                maxRetries: 0,
            })
            return result.toDataStreamResponse()
        } else {
            const result = streamObject({
                model: modelRef,
                messages,
                maxRetries: 1,
                schemaName: `schema_${definition.kind}`,
                schemaDescription: `Schema for ${definition.kind}`,
                schema: structuredOutputs.schema,
            })
            return result.toTextStreamResponse()
        }
    } catch (error: any) {
        console.error('Erro na geracao:', error)
        return new Response(JSON.stringify({ error: error.message || 'Erro ao gerar conteudo' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
