/**
 * @title PriceService
 * @author Viqtorhvayx
 * @dev Service for fetching real-time asset prices for the Hedera network.
 */

export interface MarketPrices {
  hbar: number;
  usdt: number;
  usdc: number;
}

export const fetchPrices = async (): Promise<MarketPrices> => {
  try {
    // Fetching from CoinGecko public API
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph,tether,usd-coin&vs_currencies=usd'
    );
    const data = await response.json();

    return {
      hbar: data['hedera-hashgraph'].usd,
      usdt: data['tether'].usd,
      usdc: data['usd-coin'].usd,
    };
  } catch (error) {
    console.error("Failed to fetch market prices:", error);
    // Fallback static prices if API fails
    return {
      hbar: 0.085,
      usdt: 1.0,
      usdc: 1.0,
    };
  }
};
