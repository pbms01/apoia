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

        return config
    },
}

module.exports = nextConfig
