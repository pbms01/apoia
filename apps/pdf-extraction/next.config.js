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
