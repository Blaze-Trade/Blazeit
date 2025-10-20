# Blaze It

A gamified crypto trading platform with a brutalist, swipe-based UI and competitive portfolio quests on the Aptos network.

Blaze It is a gamified crypto trading and portfolio management platform built on the Aptos blockchain, designed with a raw, brutalist aesthetic. The core experience revolves around a 'Tinder-for-tokens' swipe interface, making investment decisions fast, intuitive, and engaging. The application is divided into three main modules: 'Trade', where users execute real or simulated transactions by swiping on token cards; 'Analysis', a stark dashboard for tracking portfolio performance; and 'Quest', a competitive mode where users build virtual portfolios to compete for centralized prize pools. The entire UI embraces brutalism, featuring oversized typography, a high-contrast color scheme, asymmetrical layouts, and sharp, unapologetic geometric forms, creating a visually striking and memorable user experience.

## Key Features

-   **Swipe-Based Trading:** An intuitive, 'Tinder-for-tokens' interface. Swipe right to buy, left to skip, up to watchlist, and down for token info.
-   **Bancor Bonding Curves (V2):** Tokens start on automated bonding curves with dynamic pricing based on supply and demand.
-   **Automatic DEX Migration:** Tokens automatically migrate to Hyperion DEX at $75k market cap with full liquidity.
-   **Token Creation:** Create your own tokens with customizable bonding curves, social links, and metadata.
-   **Competitive Quests:** Join time-based portfolio-building challenges, compete against other users, and win from prize pools.
-   **Portfolio Analysis:** A minimalist dashboard to track your portfolio value, profit/loss, and current holdings.
-   **Brutalist UI/UX:** A stark, visually striking design with oversized typography, high-contrast colors, and sharp geometric forms.
-   **Aptos Wallet Integration:** Securely connect your Aptos-compatible wallets to manage your assets.
-   **Mobile-First Design:** A fully responsive layout optimized for a seamless experience on any device.

## Technology Stack

-   **Frontend:**
    -   **Framework:** React (with Vite)
    -   **UI Components:** shadcn/ui
    -   **Styling:** Tailwind CSS
    -   **Animations:** Framer Motion
    -   **State Management:** Zustand
    -   **Routing:** React Router
-   **Backend:**
    -   **Database:** Supabase (PostgreSQL)
    -   **Authentication:** Supabase Auth
    -   **Storage:** Supabase Storage
    -   **Real-time:** Supabase Realtime
-   **Blockchain:**
    -   **Network:** Aptos
    -   **Wallet Integration:** `@aptos-labs/wallet-adapter-react`
    -   **SDK:** `@aptos-labs/ts-sdk`
-   **Language:** TypeScript

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [Bun](https://bun.sh/) package manager (or npm)
-   [Supabase](https://supabase.com) account (free tier available)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/blaze-it.git
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd blaze-it
    ```
3.  **Install dependencies:**
    ```sh
    bun install
    # or
    npm install
    ```
4.  **Set up Supabase:**
    - Follow the detailed setup guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
    - Create a Supabase project and configure your environment variables

## Development

To start the local development server:

```sh
bun run dev
# or
npm run dev
```

The application will be available at `http://localhost:3000`. The Vite server supports Hot Module Replacement (HMR) for a fast and efficient development experience.

**Note:** Make sure you have set up your Supabase project and configured your environment variables before running the development server.

## Deployment

This project can be deployed to any static hosting service that supports React applications.

### Build the Project

```sh
bun run build
# or
npm run build
```

This command bundles the React frontend for production.

### Deploy Options

- **Vercel**: Connect your GitHub repository to Vercel for automatic deployments
- **Netlify**: Deploy directly from GitHub with automatic builds
- **Cloudflare Pages**: Use Cloudflare Pages for global CDN distribution
- **Any Static Host**: Upload the `dist/` folder to any static hosting service

### Environment Variables

Make sure to configure the following environment variables in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: Your Aptos contract address
- `NEXT_PUBLIC_APTOS_NETWORK`: Aptos network (devnet/mainnet)

## Project Structure

The codebase is organized into the following directories:

-   `src/`: Contains the entire React frontend application
    -   `components/`: Reusable UI components
    -   `pages/`: Main application pages (Trade, Analysis, Quest, etc.)
    -   `hooks/`: Custom React hooks for Supabase integration
    -   `lib/`: Utility functions and API clients
    -   `stores/`: Zustand state management
-   `shared/`: Contains TypeScript types and mock data
-   `supabase-schema.sql`: Database schema for Supabase setup
-   `SUPABASE_SETUP.md`: Detailed Supabase setup guide

## Key Features Implemented

### ✅ Completed Features

- **Wallet Integration**: Connect Aptos-compatible wallets
- **Token Trading**: Swipe-based token buying/selling with blockchain integration
- **Quest System**: Create and join competitive trading quests
- **Portfolio Analysis**: Track holdings, P&L, and performance
- **Watchlist**: Save tokens for later review
- **Token Creation**: Request custom token creation
- **Real-time Updates**: Live portfolio and quest data
- **Responsive Design**: Mobile-first brutalist UI

### 🔄 Supabase Integration

The application has been fully migrated from Cloudflare Workers to Supabase:

- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Wallet-based user management
- **Storage**: Token images and metadata
- **Real-time**: Live updates for quests and portfolios
- **API**: RESTful endpoints with TypeScript types

### ⚠️ Blockchain Integration Status

The blockchain integration is currently in development:

- **Token Fetching**: Attempts to fetch tokens from Aptos blockchain via contract calls
- **Fallback System**: Gracefully falls back to Supabase tokens and mock data when blockchain calls fail
- **Error Handling**: Comprehensive error handling for contract interactions
- **Development Mode**: Currently uses demo/mock tokens when blockchain integration is unavailable

**Note**: The blockchain integration requires a deployed Aptos contract with the correct module address. If you see console warnings about contract calls failing, this is expected behavior when the contract is not deployed or the module address is incorrect.

## Launchpad V2 (pump.fun Model)

Blaze It now features a **Launchpad V2** system inspired by pump.fun:

### How It Works

1. **Token Creation**: Creators deposit initial APT (e.g., 0.1 APT) to bootstrap a Bancor bonding curve
2. **Bonding Curve Trading**: Users buy/sell tokens at dynamic prices determined by the curve
3. **Price Discovery**: Price increases as more tokens are purchased, providing early buyers with rewards
4. **Automatic Migration**: When market cap reaches $75,000, the token automatically migrates to Hyperion DEX
5. **DEX Trading**: All collected APT becomes DEX liquidity, enabling full decentralized trading

### Key Benefits

- **Immediate Liquidity**: No waiting for liquidity providers
- **Fair Price Discovery**: Bonding curve ensures transparent pricing
- **Automatic Graduation**: Successful tokens automatically migrate to DEX
- **No Rug Pulls**: Liquidity is locked in the bonding curve or DEX
- **Creator Incentives**: Creators benefit from bonding curve fees

### Technical Details

- **Bonding Curve**: Bancor formula with configurable reserve ratio (1-100%)
- **Oracle Integration**: Real-time APT/USD pricing for market cap calculations
- **Fee Structure**: 1% buy/sell fees (configurable by admin)
- **Migration Threshold**: Default $75,000 market cap (customizable per token)
- **DEX Integration**: Hyperion DEX for post-migration trading

See [LAUNCHPAD_V2_MIGRATION.md](./LAUNCHPAD_V2_MIGRATION.md) for detailed migration guide.
