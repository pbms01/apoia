/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    eslint: {
        ignoreDuringBuilds: true,
    },
    webpack: (config, { isServer }) => {
        config.module.rules.push({
            test: /\.(txt|md|html)$/,
            type: 'asset/source',
        })

        if (isServer) {
            // Alias pdfjs-dist to legacy build for serverless compatibility
            config.resolve.alias = {
                ...config.resolve.alias,
                'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.mjs',
            }
        }
        return config
    },
}

module.exports = nextConfig
