import React, { useRef, useState, useEffect } from 'react';
import { Lightning, Palette, Bell, ShieldCheck, CaretDown } from '@phosphor-icons/react';
import { useWallet } from '../context/WalletContext';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';

interface SettingsTabProps {
  theme: 'light' | 'dark';
  onSetTheme?: (t: 'light' | 'dark') => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ theme, onSetTheme }) => {
  const [slippage, setSlippage] = useState('0.5%');
  const [customSlippage, setCustomSlippage] = useState('');
  const appTheme = theme === 'dark' ? 'Dark' : 'Light';
  const [hideDust, setHideDust] = useState(true);

  const [alerts, setAlerts] = useState({
    yieldDrop: false,
    p2pMatches: true,
    vaultMaturity: true
  });

  const { isConnected, address, accountId, disconnect } = useWallet();
  const { currency, setCurrencyCode } = useCurrency();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setCurrencyOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleDisconnect = async () => {
    if (!isConnected || disconnecting) return;
    setDisconnecting(true);
    try { await disconnect(); } catch (err) { console.error('Disconnect failed:', err); }
    finally { setDisconnecting(false); }
  };

  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-500';
  const borderColor = theme === 'dark' ? 'border-white/5' : 'border-[#EAECEF]';
  const cardBg = theme === 'dark' ? 'bg-[#0F141A]' : 'bg-white';

  return (
    <div className="w-full mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-[1200px]">

      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col">
        <h1 className="text-[20px] sm:text-[24px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">
          Settings & Preferences
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
        
        {/* TOP LEFT: Trading & Network */}
        <div className={`w-full ${cardBg} border ${borderColor} rounded-[14px] shadow-sm p-5 sm:p-6 flex flex-col`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-full bg-[#00A8E8]/10 flex items-center justify-center`}>
              <Lightning size={20} weight="fill" className="text-[#00A8E8]" />
            </div>
            <h2 className={`text-[16px] font-bold ${textMain}`}>Trading & Network</h2>
          </div>

          <div className="flex flex-col mb-8">
            <label className={`text-[13px] font-medium ${textMuted} mb-3`}>Default Slippage Tolerance</label>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {['0.1%', '0.5%', '1.0%'].map(val => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`px-3.5 sm:px-4 py-2 rounded-md text-[13px] font-bold transition-colors border shrink-0 ${
                    slippage === val
                      ? 'bg-[#00A8E8] text-white border-[#00A8E8]'
                      : `bg-transparent ${textMuted} ${borderColor} hover:border-[#00A8E8]/30`
                  }`}
                >
                  {val}
                </button>
              ))}
              <div className={`flex items-center px-3 py-2 rounded-md border ${borderColor} focus-within:border-[#00A8E8] transition-colors w-full sm:w-auto sm:ml-auto sm:flex-1 sm:min-w-[130px] sm:max-w-[160px]`}>
                <span className={`text-[13px] font-medium ${textMuted} mr-2`}>Custom:</span>
                <input
                  type="text"
                  value={customSlippage}
                  onChange={(e) => {
                    setCustomSlippage(e.target.value);
                    setSlippage('Custom');
                  }}
                  className="bg-transparent border-none outline-none text-[13px] font-bold w-full text-slate-900 dark:text-white"
                />
                <span className={`text-[13px] font-bold ${textMuted} ml-1`}>%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <label className={`text-[13px] font-medium ${textMuted} mb-3`}>Hedera RPC Node</label>
            <div className={`flex items-center justify-between gap-2 w-full px-4 py-3 border ${borderColor} rounded-md bg-transparent`}>
              <span className={`text-[14px] font-bold ${textMain} truncate min-w-0`}>https://testnet.hashio.io/api</span>
            </div>
          </div>
        </div>

        {/* TOP RIGHT: Display Options */}
        <div className={`w-full ${cardBg} border ${borderColor} rounded-[14px] shadow-sm p-5 sm:p-6 flex flex-col`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-full bg-[#00A8E8]/10 flex items-center justify-center`}>
              <Palette size={20} weight="fill" className="text-[#00A8E8]" />
            </div>
            <h2 className={`text-[16px] font-bold ${textMain}`}>Display Options</h2>
          </div>

          <div className="flex flex-col mb-8">
            <label className={`text-[13px] font-medium ${textMuted} mb-3`}>App Theme</label>
            <div className={`flex items-center w-full rounded-md border ${borderColor} p-1 overflow-hidden`}>
              <button
                onClick={() => onSetTheme?.('light')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[13px] font-bold transition-colors ${
                  appTheme === 'Light'
                    ? 'bg-[#00A8E8] text-white shadow-sm'
                    : `bg-transparent ${textMuted} hover:bg-slate-50 dark:hover:bg-white/5`
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                Light
              </button>
              <button
                onClick={() => onSetTheme?.('dark')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[13px] font-bold transition-colors ${
                  appTheme === 'Dark'
                    ? 'bg-[#00A8E8] text-white shadow-sm'
                    : `bg-transparent ${textMuted} hover:bg-slate-50 dark:hover:bg-white/5`
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                Dark
              </button>
            </div>
          </div>

          <div className="flex flex-col mb-8 relative" ref={currencyRef}>
            <label className={`text-[13px] font-medium ${textMuted} mb-3`}>Base Fiat Currency</label>
            <button
              type="button"
              onClick={() => setCurrencyOpen((o) => !o)}
              className={`flex items-center justify-between w-full px-4 py-3 border ${borderColor} rounded-md bg-transparent cursor-pointer hover:border-[#00A8E8]/30 transition-colors`}
            >
              <span className={`text-[14px] font-bold ${textMain}`}>{currency.code} ({currency.symbol})</span>
              <CaretDown size={16} className={`${textMuted} transition-transform ${currencyOpen ? 'rotate-180' : ''}`} weight="bold" />
            </button>
            {currencyOpen && (
              <div className={`absolute top-full left-0 right-0 mt-1.5 z-20 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl rounded-xl p-1.5 max-h-[240px] overflow-y-auto`}>
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => { setCurrencyCode(c.code); setCurrencyOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${c.code === currency.code ? 'bg-[#00A8E8]/10 dark:bg-[#00A8E8]/20' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <span className={`text-[13px] font-bold ${c.code === currency.code ? 'text-[#00A8E8]' : textMain}`}>{c.code} ({c.symbol})</span>
                    <span className={`text-[11px] font-medium ${textMuted}`}>{c.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between w-full mt-auto pb-1">
            <span className={`text-[13px] font-bold ${textMain}`}>Hide Dust Balances (&lt; $1.00)</span>
            <button 
              onClick={() => setHideDust(!hideDust)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${hideDust ? 'bg-[#00A8E8]' : 'bg-slate-200 dark:bg-white/10'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${hideDust ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* BOTTOM LEFT: Alerts & Notifications */}
        <div className={`w-full ${cardBg} border ${borderColor} rounded-[14px] shadow-sm p-5 sm:p-6 flex flex-col`}>
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-10 h-10 rounded-full bg-[#00A8E8]/10 flex items-center justify-center`}>
              <Bell size={20} weight="fill" className="text-[#00A8E8]" />
            </div>
            <h2 className={`text-[16px] font-bold ${textMain}`}>Alerts & Notifications</h2>
          </div>

          <div className="flex flex-col gap-6 w-full">
            <div className={`flex items-center justify-between w-full pb-6 border-b ${borderColor}`}>
              <span className={`text-[14px] font-medium ${textMain}`}>Yield Hub APY Drop Alerts</span>
              <button 
                onClick={() => setAlerts({...alerts, yieldDrop: !alerts.yieldDrop})}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${alerts.yieldDrop ? 'bg-[#00A8E8]' : 'bg-slate-200 dark:bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${alerts.yieldDrop ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className={`flex items-center justify-between w-full pb-6 border-b ${borderColor}`}>
              <span className={`text-[14px] font-medium ${textMain}`}>P2P Order Matches</span>
              <button 
                onClick={() => setAlerts({...alerts, p2pMatches: !alerts.p2pMatches})}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${alerts.p2pMatches ? 'bg-[#00A8E8]' : 'bg-slate-200 dark:bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${alerts.p2pMatches ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between w-full">
              <span className={`text-[14px] font-medium ${textMain}`}>Vault Maturity Reminders</span>
              <button 
                onClick={() => setAlerts({...alerts, vaultMaturity: !alerts.vaultMaturity})}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${alerts.vaultMaturity ? 'bg-[#00A8E8]' : 'bg-slate-200 dark:bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${alerts.vaultMaturity ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM RIGHT: Security Management */}
        <div className={`w-full ${cardBg} border ${borderColor} rounded-[14px] shadow-sm p-5 sm:p-6 flex flex-col`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-full bg-[#00A8E8]/10 flex items-center justify-center`}>
              <ShieldCheck size={20} weight="fill" className="text-[#00A8E8]" />
            </div>
            <h2 className={`text-[16px] font-bold ${textMain}`}>Security Management</h2>
          </div>

          <div className="flex flex-col mb-8">
            <label className={`text-[13px] font-medium ${textMuted} mb-3`}>Connected Account</label>
            <div className={`text-[15px] font-bold ${textMain} tracking-tight break-all`}>
              {isConnected
                ? (accountId || (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connected'))
                : <span className={textMuted}>Not connected</span>}
            </div>
          </div>

          <div className="flex flex-col mb-auto">
            <label className={`text-[13px] font-medium ${textMuted} mb-3`}>Active Network</label>
            <div className={`flex items-center justify-between w-full px-4 py-3 border ${borderColor} rounded-md bg-transparent`}>
              <span className={`text-[14px] font-bold ${textMain}`}>Hedera Testnet</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-8 pt-6 border-t border-transparent">
            <button className="w-full py-3 rounded-md border border-[#EF4444] text-[#EF4444] font-bold text-[14px] hover:bg-[#EF4444]/5 transition-colors text-center">
              Revoke Allowances
            </button>
            <button
              onClick={handleDisconnect}
              disabled={!isConnected || disconnecting}
              className={`w-full py-3 rounded-md ${theme === 'dark' ? 'bg-white/10 hover:bg-white/15' : 'bg-slate-100 hover:bg-slate-200'} ${textMain} font-bold text-[14px] transition-colors text-center disabled:opacity-50`}
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect Wallet'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
