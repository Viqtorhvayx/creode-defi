const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'VaultTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix Headers
content = content.replace(
  '<th className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">Asset & Amount Locked</th>',
  '<th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">Asset</th>\n                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">Amount Locked</th>'
);
content = content.replace(/<th className="px-4 py-3/g, '<th className="px-6 py-4');

// 2. Fix showNewVault Row
content = content.replace(
  /\{\/\* Newly Deposited Vault \(Animated\) \*\/\}([\s\S]*?)<td className="px-4 py-4">([\s\S]*?)<div className="flex flex-col flex-1 min-w-\[140px\]">([\s\S]*?)<span className="text-\[14px\] font-bold text-slate-900 dark:text-white">\{activeToken\}<\/span>\s*<span className="text-\[14px\] font-bold text-slate-900 dark:text-white">\{depositAmount \|\| '0'\} \{activeToken\}<\/span>([\s\S]*?)<div className="flex justify-end w-full mt-0\.5">\s*<span className="text-\[12px\] font-medium text-slate-500 dark:text-\[\#64748B\]">--<\/span>\s*<\/div>([\s\S]*?)<\/td>/m,
  `{/* Newly Deposited Vault (Animated) */}
                {showNewVault && (
                  <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {activeToken === 'HBAR' && hbarLogoUrlSmall ? (
                          <img src={hbarLogoUrlSmall} alt="HBAR" className="w-8 h-8 rounded-full" />
                        ) : activeToken === 'USDT' && usdtLogoUrlSmall ? (
                          <img src={usdtLogoUrlSmall} alt="USDT" className="w-8 h-8 rounded-full" />
                        ) : activeToken === 'USDC' && usdcLogoUrlSmall ? (
                          <img src={usdcLogoUrlSmall} alt="USDC" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1F2937] flex items-center justify-center text-[12px] font-black">{activeToken.charAt(0)}</div>
                        )}
                        <span className="text-[14px] font-bold text-slate-900 dark:text-white">{activeToken}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-slate-900 dark:text-white">{depositAmount || '0'} {activeToken}</span>
                        <span className="text-[12px] font-medium text-slate-500 dark:text-white/50">--</span>
                      </div>
                    </td>`
);

// 3. Fix Vault Row 1 (HBAR)
content = content.replace(
  /\{\/\* Vault Row 1: Matured Position \(HBAR\) \*\/\}([\s\S]*?)<td className="px-4 py-4">([\s\S]*?)<div className="flex flex-col flex-1 min-w-\[140px\]">\s*<div className="flex items-center justify-between w-full">\s*<span className="text-\[14px\] font-bold text-slate-900 dark:text-white">HBAR<\/span>\s*<span className="text-\[14px\] font-bold text-slate-900 dark:text-white">10,000 HBAR<\/span>\s*<\/div>\s*<div className="flex justify-end w-full mt-0\.5">\s*<span className="text-\[12px\] font-medium text-slate-500 dark:text-\[\#64748B\]">\$1,250\.00<\/span>\s*<\/div>\s*<\/div>([\s\S]*?)<\/td>/m,
  `{/* Vault Row 1: Matured Position (HBAR) */}
                <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      {hbarLogoUrlSmall ? (
                        <img src={hbarLogoUrlSmall} alt="HBAR" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1F2937] flex items-center justify-center text-[12px] font-black">H</div>
                      )}
                      <span className="text-[14px] font-bold text-slate-900 dark:text-white">HBAR</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-slate-900 dark:text-white">10,000 HBAR</span>
                      <span className="text-[12px] font-medium text-slate-500 dark:text-white/50">$1,250.00</span>
                    </div>
                  </td>`
);

// 4. Fix Vault Row 2 (DOVU)
content = content.replace(
  /\{\/\* Vault Row 2: Active Unmatured Position \(DOVU\) \*\/\}([\s\S]*?)<td className="px-4 py-4">([\s\S]*?)<div className="flex flex-col flex-1 min-w-\[140px\]">\s*<div className="flex items-center justify-between w-full">\s*<span className="text-\[14px\] font-bold text-slate-900 dark:text-white">DOVU<\/span>\s*<span className="text-\[14px\] font-bold text-slate-900 dark:text-white">50,000 DOVU<\/span>\s*<\/div>\s*<div className="flex justify-end w-full mt-0\.5">\s*<span className="text-\[12px\] font-medium text-slate-500 dark:text-\[\#64748B\]">\$450\.00<\/span>\s*<\/div>\s*<\/div>([\s\S]*?)<\/td>/m,
  `{/* Vault Row 2: Active Unmatured Position (DOVU) */}
                <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#00A8E8]/10 text-[#00A8E8] flex items-center justify-center text-[13px] font-black">
                        D
                      </div>
                      <span className="text-[14px] font-bold text-slate-900 dark:text-white">DOVU</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-slate-900 dark:text-white">50,000 DOVU</span>
                      <span className="text-[12px] font-medium text-slate-500 dark:text-white/50">$450.00</span>
                    </div>
                  </td>`
);

// 5. Replace all remaining px-4 py-4 inside tbody with px-6 py-5
// But wait, there might be other px-4 py-4 in the file. We should only do it for the table rows.
// Let's replace 'px-4 py-4' with 'px-6 py-5' globally since we checked it earlier and it's only in the table rows.
content = content.replace(/px-4 py-4/g, 'px-6 py-5');

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Replaced successfully!");
