/** @type {import('next').NextConfig} */
const nextConfig = {
  // 資料アップロードは /api/admin/documents/upload-url で署名URL取得 → ブラウザから Supabase へ直接 PUT のため、
  // ファイルは Vercel を経由せず、この設定に依存しない。他プロキシ用途用。
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
