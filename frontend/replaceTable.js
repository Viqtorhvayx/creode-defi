const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'VaultTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const tableStart = content.indexOf('<table');
const tableEnd = content.indexOf('</table>') + '</table>'.length;

const newTable = `<table className="w-full text-center border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-transparent">
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Asset</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Amount Locked</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">APY</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Accrued Yield</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Unlocks On</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Progress</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Status</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {/* Newly Deposited Vault (Animated) */}
                {showNewVault && (
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center justify-center gap-3">
                        {activeToken === 'HBAR' && hbarLogoUrlSmall ? (
                          <img src={hbarLogoUrlSmall} alt="HBAR" className="w-7 h-7 rounded-full" />
                        ) : activeToken === 'USDT' && usdtLogoUrlSmall ? (
                          <img src={usdtLogoUrlSmall} alt="USDT" className="w-7 h-7 rounded-full" />
                        ) : activeToken === 'USDC' && usdcLogoUrlSmall ? (
                          <img src={usdcLogoUrlSmall} alt="USDC" className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#1F2937] flex items-center justify-center text-[11px] font-black">{activeToken.charAt(0)}</div>
                        )}
                        <span className="text-[13px] font-medium text-slate-900 dark:text-white">{activeToken}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[13px] font-medium text-slate-900 dark:text-white">{depositAmount || '0'} {activeToken}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle text-center">
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white">{displayLockDays === 7 ? '1.20%' : displayLockDays === 30 ? '3.30%' : displayLockDays === 60 ? '5.40%' : '--'}</span>
                    </td>
                    <td className="px-6 py-5 align-middle text-center">
                      <span className="text-[13px] font-medium text-[#10B981]">+0.00 {activeToken}</span>
                    </td>
                    <td className="px-6 py-5 align-middle text-center">
                      <span className="text-[13px] font-medium text-slate-700 dark:text-white/80">{formattedMaturityDate}</span>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center justify-center gap-3 w-full">
                        <span className="text-[13px] font-medium text-slate-700 dark:text-white/80 w-8 text-right">0%</span>
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00A8E8] rounded-full transition-all duration-1000 ease-out" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle text-center">
                      <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#00A8E8]/30 bg-[#00A8E8]/5">
                        <span className="text-[12px] font-medium text-[#00A8E8]">Locked</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle text-center">
                      <button className="w-[120px] h-[34px] text-[12px] font-medium text-red-500 border border-red-500 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center mx-auto">
                        Unlock
                      </button>
                    </td>
                  </tr>
                )}

                {/* Hardcoded Row 1 */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3">
                      {hbarLogoUrlSmall ? (
                        <img src={hbarLogoUrlSmall} alt="HBAR" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#1F2937] flex items-center justify-center text-[11px] font-black">H</div>
                      )}
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white">HBAR</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">1,000.00 HBAR</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">8.00%</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-[#10B981]">+45.32 HBAR</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-700 dark:text-white/80">15th, Aug, 2026</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <span className="text-[13px] font-medium text-slate-700 dark:text-white/80 w-8 text-right">65%</span>
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#00A8E8]/30 bg-[#00A8E8]/5">
                        <span className="text-[12px] font-medium text-[#00A8E8]">Locked</span>
                      </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <button className="w-[120px] h-[34px] text-[12px] font-medium text-red-500 border border-red-500 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center mx-auto">
                      Unlock
                    </button>
                  </td>
                </tr>

                {/* Hardcoded Row 2 */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3">
                      {usdcLogoUrlSmall ? (
                        <img src={usdcLogoUrlSmall} alt="USDC" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#1F2937] flex items-center justify-center text-[11px] font-black">U</div>
                      )}
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white">USDC</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">500.00 USDC</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">6.00%</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-[#10B981]">+15.25 USDC</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-700 dark:text-white/80">22nd, Jul, 2026</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <span className="text-[13px] font-medium text-slate-700 dark:text-white/80 w-8 text-right">38%</span>
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '38%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#00A8E8]/30 bg-[#00A8E8]/5">
                        <span className="text-[12px] font-medium text-[#00A8E8]">Locked</span>
                      </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <button className="w-[120px] h-[34px] text-[12px] font-medium text-red-500 border border-red-500 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center mx-auto">
                      Unlock
                    </button>
                  </td>
                </tr>

                {/* Hardcoded Row 3 */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#00A8E8]/10 text-[#00A8E8] flex items-center justify-center text-[12px] font-black">
                        D
                      </div>
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white">DOVU</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">2,000.00 DOVU</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">12.00%</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-[#10B981]">+120.75 DOVU</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-700 dark:text-white/80">05th, Sep, 2026</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <span className="text-[13px] font-medium text-slate-700 dark:text-white/80 w-8 text-right">42%</span>
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '42%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#00A8E8]/30 bg-[#00A8E8]/5">
                        <span className="text-[12px] font-medium text-[#00A8E8]">Locked</span>
                      </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <button className="w-[120px] h-[34px] text-[12px] font-medium text-red-500 border border-red-500 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center mx-auto">
                      Unlock
                    </button>
                  </td>
                </tr>

                {/* Hardcoded Row 4 */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-[12px] font-black">
                        W
                      </div>
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white">wETH</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">0.7500 wETH</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">7.50%</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-[#10B981]">+0.0421 wETH</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-700 dark:text-white/80">30th, Jul, 2026</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <span className="text-[13px] font-medium text-slate-700 dark:text-white/80 w-8 text-right">55%</span>
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '55%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#00A8E8]/30 bg-[#00A8E8]/5">
                        <span className="text-[12px] font-medium text-[#00A8E8]">Locked</span>
                      </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <button className="w-[120px] h-[34px] text-[12px] font-medium text-red-500 border border-red-500 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center mx-auto">
                      Unlock
                    </button>
                  </td>
                </tr>

              </tbody>
            </table>`;

content = content.substring(0, tableStart) + newTable + content.substring(tableEnd);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Table replaced successfully.');
