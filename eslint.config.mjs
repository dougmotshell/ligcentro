import nextConfig from 'eslint-config-next/core-web-vitals';

export default [
  { ignores: ['.next-app/**', 'node_modules/**', 'coverage/**'] },
  ...nextConfig,
];
