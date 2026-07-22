// Implementation by Viqtorhvayx
"use client";

import React from 'react';
import { Logo } from './Logo';
import { 
  LockKey, 
  TrendUp, 
  ArrowsDownUp,
  ChartLineUp,
  Users,
  Gear,
  SignOut,
  ChartPie,
  FileText,
  ShieldCheck,
  Lifebuoy
} from '@phosphor-icons/react';
import { CustomVaultIcon } from './CustomVaultIcon';
import { CustomEarnIcon } from './CustomEarnIcon';
import { CustomP2PIcon } from './CustomP2PIcon';
import { CustomActivityIcon } from './CustomActivityIcon';
import { useWallet } from '../context/WalletContext';

interface SidebarProps {
  theme: 'light' | 'dark';
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ theme, activeTab, setActiveTab }) => {
  const { isConnected, disconnect } = useWallet();

  // Log out: disconnect the wallet (if any) and return to the landing page.
  const handleLogout = async () => {
    try { if (isConnected) await disconnect(); } catch { /* ignore */ }
    setActiveTab('Home');
  };

  const primaryMenu = [
    { id: 'Vault', icon: LockKey, label: 'Vault' },
    { id: 'Earn', icon: TrendUp, label: 'Earn' },
    { id: 'P2P', icon: Users, label: 'P2P' },
  ];

  const secondaryMenu = [
    { id: 'Activity', icon: ChartLineUp, label: 'Activity' },
    { id: 'Portfolio', icon: ChartPie, label: 'Portfolio' },
    { id: 'Settings', icon: Gear, label: 'Settings' },
  ];

  const tertiaryMenu = [
    { id: 'Docs', icon: FileText, label: 'Docs' },
    { id: 'Audits', icon: ShieldCheck, label: 'Audits' },
    { id: 'Support', icon: Lifebuoy, label: 'Support' },
  ];

  return (
    <div className="w-[140px] h-full flex flex-col border-r border-black/5 dark:border-white/5 bg-transparent px-2 py-6 shrink-0 relative overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-slate-200 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full transition-colors">
      <div className="flex flex-col gap-2">
        {/* Primary Menu */}
        {primaryMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 w-full font-bold text-[13px] ${
                isActive
                  ? 'bg-[#00A8E8]/10 text-[#00A8E8] border border-transparent dark:bg-[#00A8E8]/15 dark:text-[#00A8E8] dark:border-transparent dark:shadow-none'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              {item.id === 'Vault' ? (
                <CustomVaultIcon className="w-[18px] h-[18px] shrink-0" />
              ) : item.id === 'Earn' ? (
                <CustomEarnIcon className="w-[18px] h-[18px] shrink-0" />
              ) : item.id === 'P2P' ? (
                <CustomP2PIcon className="w-[18px] h-[18px] shrink-0" />
              ) : (
                <Icon size={18} weight={isActive ? "fill" : "regular"} />
              )}
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-full border-t border-black/10 dark:border-white/5 my-2"></div>

        {/* Secondary Menu */}
        {secondaryMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 w-full font-bold text-[13px] ${
                isActive
                  ? 'bg-[#00A8E8]/10 text-[#00A8E8] border border-transparent dark:bg-[#00A8E8]/15 dark:text-[#00A8E8] dark:border-transparent dark:shadow-none'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              {item.id === 'Activity' ? (
                <CustomActivityIcon className="w-[18px] h-[18px] shrink-0" />
              ) : (
                <Icon size={18} weight={isActive ? "fill" : "regular"} />
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
        {/* Second Divider */}
        <div className="w-full border-t border-black/10 dark:border-white/5 my-2"></div>

        {/* Tertiary Menu */}
        {tertiaryMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 w-full font-bold text-[13px] ${
                isActive
                  ? 'bg-[#00A8E8]/10 text-[#00A8E8] border border-transparent dark:bg-[#00A8E8]/15 dark:text-[#00A8E8] dark:border-transparent dark:shadow-none'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              <Icon size={18} weight={isActive ? "fill" : "regular"} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-3 w-full rounded-lg transition-all duration-300 font-bold text-[13px] text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white">
          <SignOut size={18} />
          <span>Log out</span>
        </button>
      </div>

    </div>
  );
};
