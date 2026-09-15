import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  // Served from https://s7092910.github.io/Gears/, not the domain root.
  basePath: '/Gears',
  // Emit `docs/foo/index.html` so GitHub Pages resolves directory URLs without redirects.
  trailingSlash: true,
  // The Next image optimizer needs a server; static export has none.
  images: { unoptimized: true },
};

export default withMDX(config);
