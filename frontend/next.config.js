/** @type {import('next').NextConfig} */
const nextConfig = {
    // Removed output: 'export' to support dynamic routes
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    images: {
        unoptimized: true
    },
}

module.exports = nextConfig
