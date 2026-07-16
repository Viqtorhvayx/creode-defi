const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'VaultTab.tsx');
let c = fs.readFileSync(filePath, 'utf-8');

const effectStr = `
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

if (!c.includes('fiatDisplayValue')) {
  c = c.replace('const [showNewVault, setShowNewVault] = useState<boolean>(false);', 'const [showNewVault, setShowNewVault] = useState<boolean>(false);\n' + effectStr);
}

fs.writeFileSync(filePath, c, 'utf-8');
console.log('Fixed missing fiatDisplayValue');
