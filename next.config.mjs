/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3', '@anthropic-ai/claude-agent-sdk', 'pdf-parse'],
};
export default nextConfig;
