declare module '*.md' {
    const content: string
    export default content
}

declare module '*.txt' {
    const content: string
    export default content
}

declare module '*.html' {
    const content: string
    export default content
}

// Type declarations for modules resolved from parent lib/ that TypeScript
// can't find because they're not in the parent's node_modules
declare module 'partial-json' {
    export const ALL: number
    export function parse(text: string, allow?: number): any
}

declare module 'ms' {
    function ms(val: string): number
    function ms(val: number, options?: any): string
    export default ms
}
