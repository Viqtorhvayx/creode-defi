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
    { id: 'Settings', icon: Gear, label: 'Settings' },
  ];

  return (
    <div className="w-[170px] h-screen flex flex-col border-r border-black/5 dark:border-white/5 bg-transparent pl-2 pr-4 py-6 shrink-0 sticky top-0 left-0">
      
      {/* Top Logo */}
      <div 
        className="cursor-pointer mb-10 scale-[0.75] origin-left"
        onClick={() => setActiveTab('Home')}
      >
        <Logo theme={theme} />
      </div>

      {/* Primary Menu */}
      <div className="flex flex-col gap-2 mb-8">
        {primaryMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 w-full font-bold text-[13px] ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border border-transparent dark:bg-blue-600/15 dark:text-blue-400 dark:border-transparent dark:shadow-none'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              <Icon size={18} weight={isActive ? "fill" : "regular"} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-black/5 dark:bg-white/5 mb-8"></div>

      {/* Secondary Menu */}
      <div className="flex flex-col gap-2 flex-1">
        {secondaryMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 w-full font-bold text-[13px] ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border border-transparent dark:bg-blue-600/15 dark:text-blue-400 dark:border-transparent dark:shadow-none'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              <Icon size={18} weight={isActive ? "fill" : "regular"} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="mt-auto flex flex-col gap-6">
        <button className="flex items-center gap-3 px-3 py-2 w-full font-bold text-[13px] text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors">
          <SignOut size={18} />
          <span>Log out</span>
        </button>
      </div>

    </div>
  );
};
