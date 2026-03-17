/** @type {import('next').NextConfig} */
const nextConfig = {
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
