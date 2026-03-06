import { CoreMessage, jsonSchema } from 'ai'
import { parse, ALL } from 'partial-json'
import nunjucks from 'nunjucks'

// --- Types (from @/lib/ai/prompt-types.ts) ---

export type PromptDefinitionType = {
    kind: string
    systemPrompt?: string
    prompt?: string
    jsonSchema?: string
    format?: string
    model?: string
    cacheControl?: boolean | number
}

export type TextoType = {
    id?: string
    event?: string
    label?: string
    descr: string
    slug: string
    texto?: string
}

export type PromptDataType = { textos: TextoType[] }

export type PromptExecuteParamsType = {
    structuredOutputs?: { schemaName: string, schemaDescription: string, schema: any },
    format?: (s: string) => string,
}

export type PromptExecuteType = {
    message: CoreMessage[], params?: PromptExecuteParamsType
}

// --- Slugify (from @/lib/utils/utils.ts) ---

export const slugify = (str: string): string => {
    str = str.replace(/^\s+|\s+$/g, '')
    str = str.toLowerCase()
    const from = "àáäâãèéëêìíïîòóöôõùúüûñç·/_,:;"
    const to = "aaaaaeeeeiiiiooooouuuunc------"
    for (let i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
    }
    str = str.replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/-+$/g, '')
        .replace(/^-+/g, '')
    return str
}

// --- Format (from @/lib/ai/format.ts) ---

export function buildFormatter(formatter: string): (s: string) => string {
    return (s: string) => format(formatter, s)
}

export function format(formatter: string, s: string): string {
    if (!s) return ''
    if (!s.startsWith('{')) return s
    const json = parse(s, ALL)
    if (!json) return ''
    var env = nunjucks.configure({ autoescape: false })
    env.addFilter('deProcedencia', arr => arr.filter(e => e.tipo == 'PROCEDENTE'))
    env.addFilter('deImprocedencia', arr => arr.filter(e => e.tipo == 'IMPROCEDENTE'))
    const result = env.renderString(formatter, json)
    return result
}

// --- Prompt functions (from @/lib/ai/prompt.ts) ---

export const formatText = (txt: TextoType, limit?: number) => {
    let s: string = txt.descr
    s += `:\n<${txt.slug}${txt.event ? ` event="${txt.event}"` : ''}${txt.label ? ` label="${txt.label}"` : ''}>\n${limit ? txt.texto?.substring(0, limit) : txt.texto}\n</${txt.slug}>\n\n`
    return s
}

export const applyTextsAndVariables = (text: string, data: PromptDataType): string => {
    if (!text) return ''
    const allTexts = `${data.textos.reduce((acc, txt) => acc + formatText(txt), '')}`
    text = text.replace('{{textos}}', allTexts)

    text = text.replace(/{{textos\.limit\((\d+)\)}}/g, (match, limit) => {
        const limitNumber = parseInt(limit, 10)
        const limitedTexts = data.textos.reduce((acc, txt) => acc + formatText(txt, limitNumber), '')
        return limitedTexts
    })

    text = text.replace(/{{textos\.([a-z_]+)}}/g, (match, slug) => {
        const found = data.textos.find(txt => txt.slug === slug)
        if (!found) throw new Error(`Slug '${slug}' nao encontrado`)
        return `${found.descr}:\n<${found.slug}>\n${found.texto}\n</${found.slug}>\n\n`
    })

    return text
}

export const promptExecuteBuilder = (definition: PromptDefinitionType, data: PromptDataType): PromptExecuteType => {
    const message: CoreMessage[] = []
    if (definition.systemPrompt)
        message.push({ role: 'system', content: applyTextsAndVariables(definition.systemPrompt, data) })

    let prompt = definition.prompt
    if (prompt && !prompt.includes('{{') && (!definition.systemPrompt || !definition.systemPrompt.includes('{{')))
        prompt = `${prompt}\n\n{{textos}}`

    const promptContent: string = applyTextsAndVariables(prompt, data)
    message.push({ role: 'user', content: promptContent })

    const params: PromptExecuteParamsType = {}
    if (definition.jsonSchema)
        params.structuredOutputs = { schemaName: 'structuredOutputs', schemaDescription: 'Structured Outputs', schema: jsonSchema(JSON.parse(definition.jsonSchema)) }
    if (definition.format)
        params.format = buildFormatter(definition.format)
    return { message, params }
}

export const promptDefinitionFromMarkdown = (slug: string, md: string): PromptDefinitionType => {
    const regex = /(?:^# (?<tag>SYSTEM PROMPT|PROMPT|JSON SCHEMA|FORMAT)\s*)$/gms

    const parts = md.split(regex).reduce((acc, part, index, array) => {
        if (index % 2 === 0) {
            const tag = array[index - 1]?.trim()
            if (tag) {
                acc[slugify(tag).replaceAll('-', '_')] = part.trim()
            }
        }
        return acc
    }, {} as { prompt: string, system_prompt?: string, json_schema?: string, format?: string })

    const { prompt, system_prompt, json_schema, format: fmt } = parts

    return { kind: slug, prompt, systemPrompt: system_prompt, jsonSchema: json_schema, format: fmt, cacheControl: true }
}
