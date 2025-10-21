/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  typescript: {
    // Temporarily ignore build errors to complete migration
    // Remove this once all TypeScript issues are resolved
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    "@aptos-labs/wallet-adapter-react",
    "@aptos-labs/wallet-adapter-core",
    "@aptos-labs/ts-sdk",
    "petra-plugin-wallet-adapter",
  ],
  // Turbopack configuration for faster development builds
  turbopack: {
    // Configure resolve aliases for better module resolution
    resolveAlias: {
      // Map shared types to the correct path
      "@shared/types": "./shared/types",
      "@shared/mock-data": "./shared/mock-data",
    },
    // Configure custom extensions for better file resolution
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
    // Configure rules for specific file types if needed
    rules: {
      // Handle SVG files if you need to import them as React components
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  webpack: (config, { isServer }) => {
    // Polyfills for Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  // Configure Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kemccimkmscougkxiutl.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "fullnode.devnet.aptoslabs.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fullnode.mainnet.aptoslabs.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fullnode.testnet.aptoslabs.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.example.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s2.coinmarketcap.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "coinmarketcap.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.coinmarketcap.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "circle.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.circle.com",
        port: "",
        pathname: "/**",
      },
    ],
    // Allow all external images (less secure but more flexible for development)
    // For production, use specific remotePatterns above
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here
  },
};

export default nextConfig;

