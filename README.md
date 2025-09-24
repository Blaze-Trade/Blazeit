# Blaze It

A gamified crypto trading platform with a brutalist, swipe-based UI and competitive portfolio quests on the Aptos network.

Blaze It is a gamified crypto trading and portfolio management platform built on the Aptos blockchain, designed with a raw, brutalist aesthetic. The core experience revolves around a 'Tinder-for-tokens' swipe interface, making investment decisions fast, intuitive, and engaging. The application is divided into three main modules: 'Trade', where users execute real or simulated transactions by swiping on token cards; 'Analysis', a stark dashboard for tracking portfolio performance; and 'Quest', a competitive mode where users build virtual portfolios to compete for centralized prize pools. The entire UI embraces brutalism, featuring oversized typography, a high-contrast color scheme, asymmetrical layouts, and sharp, unapologetic geometric forms, creating a visually striking and memorable user experience.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/codewithmirza/Blazeit)

## Key Features

-   **Swipe-Based Trading:** An intuitive, 'Tinder-for-tokens' interface. Swipe right to buy, left to skip, and up to watchlist.
-   **Competitive Quests:** Join time-based portfolio-building challenges, compete against other users, and win from prize pools.
-   **Portfolio Analysis:** A minimalist dashboard to track your portfolio value, profit/loss, and current holdings.
-   **Brutalist UI/UX:** A stark, visually striking design with oversized typography, high-contrast colors, and sharp geometric forms.
-   **Aptos Wallet Integration:** Securely connect your Aptos-compatible wallet to manage your assets.
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
    -   **Runtime:** Cloudflare Workers
    -   **Framework:** Hono
    -   **Storage:** Cloudflare Durable Objects
-   **Blockchain:**
    -   **Network:** Aptos
    -   **Wallet Integration:** `@aptos-labs/wallet-adapter-react`
-   **Language:** TypeScript

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [Bun](https://bun.sh/) package manager

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
    ```

## Development

To start the local development server, which includes both the Vite frontend and the Hono backend on Cloudflare Workers, run the following command:

```sh
bun dev
```

The application will be available at `http://localhost:3000` (or the next available port). The Vite server supports Hot Module Replacement (HMR) for a fast and efficient development experience.

## Deployment

This project is configured for seamless deployment to Cloudflare's global network.

1.  **Build the project:**
    This command bundles the React frontend and prepares the Worker script for production.
    ```sh
    bun build
    ```
2.  **Deploy to Cloudflare:**
    Make sure you have `wrangler` installed and configured. Then, run the deploy script:
    ```sh
    bun deploy
    ```
    This command will publish your application and durable objects to Cloudflare.

Alternatively, you can deploy directly from your GitHub repository with a single click.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/codewithmirza/Blazeit)

## Project Structure

The codebase is organized into three main directories:

-   `src/`: Contains the entire React frontend application, including pages, components, hooks, and utility functions.
-   `worker/`: Contains the Hono backend application that runs on Cloudflare Workers, including API routes and entity definitions for Durable Objects.
-   `shared/`: Contains TypeScript types and mock data that are shared between the frontend and the backend to ensure type safety.