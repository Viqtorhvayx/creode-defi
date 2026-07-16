const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'VaultTab.tsx');
let c = fs.readFileSync(filePath, 'utf-8');

// 1. Ensure import is at the top
const importStr = `import { TOKEN_MAPPINGS, SaucerSwapToken } from '../utils/tokenMapping';`;
if (!c.includes('TOKEN_MAPPINGS')) {
  c = c.replace('import React, { useState, useRef, useEffect } from \\'react\\';', `import React, { useState, useRef, useEffect } from 'react';\n${importStr}`);
}

// 2. Remove the misplaced effect block
const misplacedEffect = `  const [tokenPriceUsd, setTokenPriceUsd] = useState<number>(0);

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

c = c.replace(misplacedEffect, '');

// 3. Inject it correctly after activeToken
const targetAnchor = "const [activeToken, setActiveToken] = useState('HBAR');";
if (!c.includes('setTokenPriceUsd')) {
  c = c.replace(targetAnchor, targetAnchor + '\\n' + misplacedEffect);
}

fs.writeFileSync(filePath, c, 'utf-8');
console.log('Fixed VaultTab scope and imports');
