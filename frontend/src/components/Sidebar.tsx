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

  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';

  return (
    <div className="w-64 h-screen flex flex-col border-r border-black/5 dark:border-white/5 bg-transparent p-6 shrink-0 sticky top-0 left-0">
      
      {/* Top Logo */}
      <div 
        className="cursor-pointer mb-10 pl-2"
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full font-bold text-sm ${
                isActive
                  ? 'bg-black/5 dark:bg-white/10 text-[#00A8E8] shadow-sm'
                  : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
              }`}
            >
              <Icon size={20} weight={isActive ? "fill" : "regular"} />
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full font-bold text-sm ${
                isActive
                  ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white shadow-sm'
                  : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
              }`}
            >
              <Icon size={20} weight={isActive ? "fill" : "regular"} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Log out */}
      <div className="mt-auto">
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full font-bold text-sm text-red-500 hover:bg-red-500/10 hover:text-red-600">
          <SignOut size={20} />
          <span>Log out</span>
        </button>
      </div>

    </div>
  );
};
