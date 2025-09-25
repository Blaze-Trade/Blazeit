# Blockchain Portfolio Integration

## Overview

The AnalysisPage now integrates with the Aptos blockchain to display real-time portfolio data directly from the user's wallet. This provides authentic, on-chain portfolio analysis that reflects actual token holdings.

## Implementation Details

### 1. Blockchain Portfolio Hook (`useBlockchainPortfolio.ts`)

**Purpose**: Fetches real fungible asset balances from the Aptos blockchain for the connected wallet.

**Key Features**:
- ✅ **Real-time data**: Direct blockchain queries for current balances
- ✅ **Fungible Asset support**: Uses Aptos FA standard for token metadata
- ✅ **Automatic price estimation**: Includes known token prices for portfolio valuation
- ✅ **Error handling**: Graceful fallback when blockchain calls fail
- ✅ **Loading states**: Proper loading indicators during data fetching

**API Methods Used**:
- `getAccountFungibleAssetBalances()` - Gets all token balances for user
- `getFungibleAssetMetadata()` - Fetches token metadata (name, symbol, decimals, icon)

### 2. Enhanced AnalysisPage

**Data Source Options**:
- 🔗 **Blockchain Data**: Real-time on-chain holdings (default)
- 🗄️ **Database Data**: Supabase stored portfolio data
- 🔄 **Combined View**: Merges both sources, prioritizing blockchain data

**New Features**:
- ✅ **Data source selector**: Switch between blockchain/database/combined views
- ✅ **Real-time sync indicator**: Shows when blockchain data is being fetched
- ✅ **Data source breakdown**: Visual representation of data sources
- ✅ **Blockchain status**: Error handling and sync status display
- ✅ **Enhanced refresh**: Updates both blockchain and database data

## Technical Implementation

### Blockchain Data Flow

```typescript
1. User connects wallet → Wallet address available
2. Hook fetches balances → getAccountFungibleAssetBalances()
3. Metadata retrieval → getFungibleAssetMetadata() for each token
4. Data transformation → Convert to Holding[] format
5. Price estimation → Apply known token prices
6. Portfolio calculation → Compute metrics and analytics
```

### Data Structure

**Blockchain Holdings**:
```typescript
interface Holding {
  id: string;           // Asset type (e.g., "0x1::aptos_coin::AptosCoin")
  symbol: string;        // Token symbol (e.g., "APT")
  name: string;          // Token name (e.g., "Aptos")
  quantity: number;      // Actual token amount (decimals applied)
  value: number;         // Current USD value
  cost: number;          // Estimated cost basis
  logoUrl: string;       // Token icon URL
  address: string;       // Asset type address
  decimals: number;      // Token decimals
}
```

### Price Integration

**Current Implementation**:
- Hardcoded prices for major tokens (APT, USDC, BTC, ETH, etc.)
- Fallback to $1.00 for unknown tokens
- Cost basis estimation (80% of current value as placeholder)

**Future Enhancements**:
- Real-time price API integration (CoinGecko, CoinMarketCap)
- Historical price tracking for accurate P&L
- Cross-chain price aggregation

## User Experience

### Visual Indicators

- 🟢 **BLOCKCHAIN badge**: Shows when using real blockchain data
- 🔵 **DATABASE badge**: Shows when using stored data
- 🟣 **COMBINED badge**: Shows when using merged data
- 🟡 **SYNCING badge**: Shows when blockchain data is being fetched

### Data Source Breakdown

The page displays:
- **Blockchain assets**: Count of tokens found on-chain
- **Database assets**: Count of tokens in Supabase
- **Total assets**: Combined count in current view
- **Error status**: Any blockchain sync issues

### Pro Tips

Contextual advice based on data source:
- Blockchain view: "💎 Showing real-time blockchain data from Aptos"
- Database view: Standard portfolio advice
- Combined view: Hybrid recommendations

## Benefits

### For Users
- ✅ **Authentic data**: Real wallet holdings, not simulated
- ✅ **Real-time accuracy**: Always up-to-date with blockchain state
- ✅ **Transparency**: Clear indication of data sources
- ✅ **Flexibility**: Choose between blockchain, database, or combined views

### For Developers
- ✅ **Modular design**: Separate hooks for different data sources
- ✅ **Error resilience**: Graceful fallback when blockchain unavailable
- ✅ **Extensible**: Easy to add more data sources or price APIs
- ✅ **Type safety**: Full TypeScript support with proper interfaces

## Future Enhancements

### Planned Features
- 🔄 **Real-time price feeds**: Integration with price APIs
- 📊 **Historical tracking**: Price history and performance charts
- 🔗 **Cross-chain support**: Multi-chain portfolio aggregation
- 💰 **Cost basis tracking**: Actual purchase price history
- 📈 **Advanced analytics**: Risk metrics, correlation analysis

### Technical Improvements
- ⚡ **Caching layer**: Reduce blockchain API calls
- 🔄 **WebSocket updates**: Real-time balance updates
- 📱 **Mobile optimization**: Better mobile experience
- 🌐 **Multi-language**: Internationalization support

## Usage

### For Users
1. Connect your Aptos wallet
2. Navigate to Analysis page
3. Select "Blockchain Data" from dropdown
4. View your real portfolio holdings
5. Use refresh to sync latest data

### For Developers
```typescript
// Use blockchain portfolio hook
const { holdings, loading, error, refetch } = useBlockchainPortfolio();

// Switch data sources
const [dataSource, setDataSource] = useState<'blockchain' | 'supabase' | 'combined'>('blockchain');
```

## Troubleshooting

### Common Issues
- **No holdings shown**: Check wallet connection and network
- **Loading stuck**: Verify Aptos RPC endpoint availability
- **Price errors**: Check token symbol mapping in price estimation
- **Sync errors**: Review blockchain error messages in UI

### Debug Information
- Check browser console for detailed error logs
- Verify wallet connection status
- Confirm Aptos network configuration
- Test with known token addresses

This integration provides a solid foundation for real blockchain portfolio analysis while maintaining the flexibility to use database data when needed.
