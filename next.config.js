/** @type {import('next').NextConfig} */
const nextConfig = {
  // API ルートで受け付けるリクエスト body の上限（50MB）
  experimental: {
    proxyClientMaxBodySize: '50mb',
  },
  // 型エラーがあっても無視してビルドを強行する
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLintの警告を無視する
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
