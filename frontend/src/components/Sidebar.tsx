// Implementation by Viqtorhvayx
"use client";

import React from 'react';
import { Logo } from './Logo';
import { 
  LockKey, 
  TrendUp, 
  ArrowsDownUp, 
  SquaresFour, 
  ChartLineUp, 
  Gift, 
  Gear, 
  SignOut 
} from '@phosphor-icons/react';

interface SidebarProps {
  theme: 'light' | 'dark';
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ theme, activeTab, setActiveTab }) => {
  const primaryMenu = [
    { id: 'Vault', icon: LockKey, label: 'Vault' },
    { id: 'Lend', icon: TrendUp, label: 'Lend' },
    { id: 'Borrow', icon: ArrowsDownUp, label: 'Borrow' },
  ];

  const secondaryMenu = [
    { id: 'Dashboard', icon: SquaresFour, label: 'Dashboard' },
    { id: 'Activity', icon: ChartLineUp, label: 'Activity' },
    { id: 'Rewards', icon: Gift, label: 'Rewards' },
  ];

  return (
    <div className="w-[140px] h-full flex flex-col border-r border-black/5 dark:border-white/5 bg-transparent px-2 py-6 shrink-0 relative">
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
              <Icon size={18} weight={isActive ? "fill" : "regular"} />
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
              <Icon size={18} weight={isActive ? "fill" : "regular"} />
              <span>{item.label}</span>
            </button>
          );
        })}
        {/* Second Divider */}
        <div className="w-full border-t border-black/10 dark:border-white/5 my-2"></div>

        {/* Bottom Section (Settings & Log out) */}
        <button
          onClick={() => setActiveTab('Settings')}
          className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 w-full font-bold text-[13px] ${
            activeTab === 'Settings'
              ? 'bg-[#00A8E8]/10 text-[#00A8E8] border border-transparent dark:bg-[#00A8E8]/15 dark:text-[#00A8E8] dark:border-transparent dark:shadow-none'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'
          }`}
        >
          <Gear size={18} weight={activeTab === 'Settings' ? "fill" : "regular"} />
          <span>Settings</span>
        </button>

        <button className="flex items-center gap-3 px-3 py-3 w-full rounded-lg transition-all duration-300 font-bold text-[13px] text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white">
          <SignOut size={18} />
          <span>Log out</span>
        </button>
      </div>

    </div>
  );
};
