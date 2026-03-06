const path = require('path')

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

        // Resolve modules from both local and root project node_modules
        config.resolve.modules = [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, '../../node_modules'),
            'node_modules',
        ]

        if (isServer) {
            config.externals = [
                ...config.externals,
                {
                    "pdfjs-dist/build/pdf.worker.min.js": "pdfjs-dist/build/pdf.worker.min.js"
                }
            ]
        }
        return config
    },
}

module.exports = nextConfig
