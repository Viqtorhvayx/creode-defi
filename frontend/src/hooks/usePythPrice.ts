"use client";

import { useState, useEffect } from 'react';

/**
 * @title usePythPrice
 * @author Viqtorhvayx
 * @dev Custom hook to fetch the live HBAR/USD price from Pyth Network's Hermes REST API.
 */
export const usePythPrice = () => {
  const [price, setPrice] = useState<number>(0);
  const PYTH_HBAR_FEED_ID = "3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd";
  const PYTH_HERMES_URL = "https://hermes.pyth.network/v2/updates/price/latest";

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(`${PYTH_HERMES_URL}?ids[]=${PYTH_HBAR_FEED_ID}`);
        if (response.ok) {
          const data = await response.json();
          if (data.parsed && data.parsed[0]) {
            const priceObj = data.parsed[0].price;
            const currentPrice = Number(priceObj.price) * Math.pow(10, priceObj.expo);
            setPrice(currentPrice);
          }
        }
      } catch (err) {
        console.error("Pyth Price Hook Error:", err);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 10000); // 10s polling for stability
    return () => clearInterval(interval);
  }, []);

  return price;
};
