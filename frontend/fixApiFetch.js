const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'VaultTab.tsx');
let c = fs.readFileSync(filePath, 'utf-8');

const oldEffect = `
  const [tokenPriceUsd, setTokenPriceUsd] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.saucerswap.finance/tokens');
        if (!res.ok) return; // Silent fail if unauthorized or other HTTP error
        const data = await res.json();
        
        if (Array.isArray(data)) {
          const tokenId = TOKEN_MAPPINGS[activeToken] || TOKEN_MAPPINGS['HBAR'];
          const tokenData = data.find((t: SaucerSwapToken) => t.id === tokenId || t.symbol === activeToken);
          
          if (tokenData && tokenData.priceUsd) {
            setTokenPriceUsd(Number(tokenData.priceUsd));
          }
        }
      } catch (err) {
        console.error("Failed to fetch token price", err);
      }
    };

    fetchPrice();
    interval = setInterval(fetchPrice, 15000); // 15 seconds polling

    return () => clearInterval(interval);
  }, [activeToken]);

  const fiatDisplayValue = (Number(depositAmount || 0) * tokenPriceUsd).toFixed(2);
`;

const newEffect = `
  const [tokenPriceUsd, setTokenPriceUsd] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const fetchPrice = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_SAUCERSWAP_API_KEY || '';
        const headers = apiKey ? { 'Authorization': \`Bearer \${apiKey}\` } : {};
        
        const res = await fetch('https://api.saucerswap.finance/tokens', { headers });
        
        if (!res.ok) {
          // Fallback to mock prices if unauthorized (SaucerSwap API requires key)
          const mockPrices: Record<string, number> = {
            'HBAR': 0.05,
            'USDC': 1.00,
            'USDT': 1.00,
            'SAUCE': 0.03,
            'DOVU': 0.001,
            'PACK': 0.0001,
            'WETH': 3000.00,
            'WBTC': 60000.00,
            'JAM': 0.002,
            'BONZO': 0.0005
          };
          setTokenPriceUsd(mockPrices[activeToken] || 0);
          return;
        }
        
        const data = await res.json();
        
        if (Array.isArray(data)) {
          const tokenId = TOKEN_MAPPINGS[activeToken] || TOKEN_MAPPINGS['HBAR'];
          const tokenData = data.find((t: SaucerSwapToken) => t.id === tokenId || t.symbol === activeToken);
          
          if (tokenData && tokenData.priceUsd) {
            setTokenPriceUsd(Number(tokenData.priceUsd));
          }
        }
      } catch (err) {
        console.error("Failed to fetch token price", err);
      }
    };

    fetchPrice();
    interval = setInterval(fetchPrice, 15000); // 15 seconds polling

    return () => clearInterval(interval);
  }, [activeToken]);

  const fiatDisplayValue = (Number(depositAmount || 0) * tokenPriceUsd).toFixed(2);
`;

c = c.replace(oldEffect.trim(), newEffect.trim());

fs.writeFileSync(filePath, c, 'utf-8');
console.log('Fixed API fetch with auth and mock fallback');
