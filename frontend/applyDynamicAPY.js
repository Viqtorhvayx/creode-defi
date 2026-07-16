const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'VaultTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Add the calculateAPY function right before VaultTab definition
const funcStr = `
const getBaseRates = (token: string) => {
  const t = token.toUpperCase();
  if (['USDT', 'USDC'].includes(t)) return { d7: 4.0, d30: 6.5, d60: 9.0 };
  if (['SAUCE', 'PACK', 'BONZO', 'JAM'].includes(t)) return { d7: 8.0, d30: 14.0, d60: 22.0 };
  // Default to Blue-Chip
  return { d7: 3.5, d30: 5.5, d60: 8.0 };
};

const calculateAPY = (token: string, days: number): string => {
  if (!days || days <= 0) return '--';
  const rates = getBaseRates(token);
  
  if (days === 7) return rates.d7.toFixed(2) + '%';
  if (days === 30) return rates.d30.toFixed(2) + '%';
  if (days === 60) return rates.d60.toFixed(2) + '%';
  
  let rate = 0;
  if (days < 7) {
    rate = (rates.d7 / 7) * days;
  } else if (days < 30) {
    rate = rates.d7 + ((rates.d30 - rates.d7) * (days - 7)) / (30 - 7);
  } else if (days < 60) {
    rate = rates.d30 + ((rates.d60 - rates.d30) * (days - 30)) / (60 - 30);
  } else {
    rate = rates.d60 + ((rates.d60 - rates.d30) * (days - 60)) / (60 - 30);
  }
  
  return rate.toFixed(2) + '%';
};

export const VaultTab: React.FC<VaultTabProps> = ({ theme }) => {`;

content = content.replace('export const VaultTab: React.FC<VaultTabProps> = ({ theme }) => {', funcStr);

// Replace Estimated APY Block
const estimatedApyBlockOld = `<div className="flex flex-col w-full mb-6">
            <label className="text-[13px] font-semibold text-slate-700 dark:text-white/80 mb-2">Estimated APY</label>
            <div className="flex items-center justify-between w-full pb-5 border-b border-slate-100 dark:border-white/5">
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">7 Days</span>
                <span className="text-[14px] font-bold text-[#10B981]">1.20%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">30 Days</span>
                <span className="text-[14px] font-bold text-[#10B981]">3.30%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">60 Days</span>
                <span className="text-[14px] font-bold text-[#10B981]">5.40%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">Custom</span>
                <span className="text-[14px] font-bold text-slate-400 dark:text-white/40">--</span>
              </div>
            </div>
          </div>`;

const estimatedApyBlockNew = `<div className="flex flex-col w-full mb-6">
            <label className="text-[13px] font-semibold text-slate-700 dark:text-white/80 mb-2">Estimated APY</label>
            <div className="flex items-center justify-between w-full pb-5 border-b border-slate-100 dark:border-white/5">
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">7 Days</span>
                <span className="text-[14px] font-bold text-[#10B981]">{calculateAPY(activeToken, 7)}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">30 Days</span>
                <span className="text-[14px] font-bold text-[#10B981]">{calculateAPY(activeToken, 30)}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">60 Days</span>
                <span className="text-[14px] font-bold text-[#10B981]">{calculateAPY(activeToken, 60)}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">Custom</span>
                <span className={\`text-[14px] font-bold \${![7, 30, 60].includes(displayLockDays) ? 'text-[#10B981]' : 'text-slate-400 dark:text-white/40'}\`}>
                  {![7, 30, 60].includes(displayLockDays) ? calculateAPY(activeToken, displayLockDays) : '--'}
                </span>
              </div>
            </div>
          </div>`;

content = content.replace(estimatedApyBlockOld, estimatedApyBlockNew);

// Replace table row APY (for new vault)
const tableApyOld = `<span className="text-[13px] font-medium text-slate-900 dark:text-white">{displayLockDays === 7 ? '1.20%' : displayLockDays === 30 ? '3.30%' : displayLockDays === 60 ? '5.40%' : '--'}</span>`;
const tableApyNew = `<span className="text-[13px] font-medium text-slate-900 dark:text-white">{calculateAPY(activeToken, displayLockDays)}</span>`;

content = content.replace(tableApyOld, tableApyNew);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('APY replaced successfully.');
