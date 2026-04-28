"use client";

import React, { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { Logo } from './Logo';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

/**
 * @title Header (Diagnostic Wallet Integration)
 * @author Viqtorhvayx
 * @dev Custom wallet button with deep trace logging and network-aware identity resolution.
 */
export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const [isToggling, setIsToggling] = useState(false);
  
  const [nativeHederaId, setNativeHederaId] = useState<string>("");
  const [isResolving, setIsResolving] = useState<boolean>(false);

  const handleThemeToggle = () => {
    setIsToggling(true);
    toggleTheme();
    setTimeout(() => setIsToggling(false), 300);
  };

  /**
   * Diagnostic Identity Resolution
   * Credits: Viqtorhvayx
   */
  useEffect(() => {
    const resolveIdentity = async () => {
      console.log("CREODE TRACE - Connection State:", { isConnected, address, chainId });

      if (!isConnected || !address) {
        setNativeHederaId("");
        setIsResolving(false);
        return;
      }

      if (address.startsWith("0.0.")) {
        setNativeHederaId(address);
        setIsResolving(false);
        return;
      }

      if (address.startsWith("0x")) {
        setIsResolving(true);
        // Detect network for correct Mirror Node endpoint
        const isMainnet = chainId === 295;
        const baseUrl = isMainnet 
          ? "https://mainnet-public.mirrornode.hedera.com" 
          : "https://testnet.mirrornode.hedera.com";
        
        const fetchUrl = `${baseUrl}/api/v1/accounts/${address.toLowerCase()}`;
        console.log("CREODE TRACE - Fetching from:", fetchUrl);

        try {
          const res = await fetch(fetchUrl);
          const data = await res.json();
          console.log("CREODE TRACE - Mirror Node Response:", data);

          if (data.account) {
            setNativeHederaId(data.account);
            console.log("CREODE TRACE - Resolved Native ID:", data.account);
          } else {
            console.warn("CREODE TRACE - No account property in response.");
            setNativeHederaId(address); 
          }
        } catch (err) {
          console.error("CREODE TRACE - Fetch error:", err);
          setNativeHederaId(address);
        } finally {
          setIsResolving(false);
        }
      }
    };

    resolveIdentity();
  }, [address, isConnected, chainId]);

  const formatAddress = (addr: string) => {
    if (!addr) return "Resolving...";
    if (addr.startsWith("0.0.")) {
      const parts = addr.split('.');
      if (parts.length === 3 && parts[2].length > 5) {
        return `${parts[0]}.${parts[1]}.${parts[2].substring(0, 2)}...${parts[2].substring(parts[2].length - 3)}`;
      }
      return addr;
    }
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="mb-12">
      <nav className="flex justify-between items-center">
        <Logo theme={theme} />
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleThemeToggle}
            className="p-2.5 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 active:scale-90"
          >
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isToggling ? "#00A8E8" : "none"} stroke="#00A8E8" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isToggling ? "#00A8E8" : "none"} stroke="#00A8E8" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500">
                <button 
                  onClick={() => open()}
                  className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-200"
                >
                  <div className="w-1.5 h-1.5 bg-[#00A8E8] rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-black/60 dark:text-white font-mono">
                    {isResolving ? "Resolving..." : formatAddress(nativeHederaId || address || "")}
                  </span>
                </button>
                <button 
                  onClick={() => open({ view: 'Account' })}
                  className="text-[9px] font-black text-[#00A8E8] uppercase hover:underline tracking-wider"
                >
                  Account
                </button>
              </div>
            ) : (
              <button 
                onClick={() => open()}
                className="btn-action !px-5 !py-2.5 !text-xs shadow-[0_4px_15_rgba(0,168,232,0.15)]"
                style={{ borderRadius: '60px' }}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};
