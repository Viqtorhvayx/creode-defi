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
    <div className="w-[170px] h-screen flex flex-col border-r border-black/5 dark:border-white/5 bg-transparent px-4 py-6 shrink-0 sticky top-0 left-0">
      
      {/* Top Logo */}
      <div 
        className="cursor-pointer mb-10 pl-1 scale-[0.75] origin-left"
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full font-bold text-[13px] ${
                isActive
                  ? 'bg-[#00A8E8]/10 text-[#00A8E8] border border-[#00A8E8] shadow-[inset_0_0_10px_rgba(0,168,232,0.1),0_0_10px_rgba(0,168,232,0.1)]'
                  : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full font-bold text-[13px] ${
                isActive
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
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
        <button className="flex items-center gap-3 px-4 py-2 w-full font-bold text-[13px] text-white/60 hover:text-white transition-colors">
          <SignOut size={18} />
          <span>Log out</span>
        </button>

        {/* Total Portfolio Card */}
        <div className="bg-[#090D14] border border-[#1A2332] rounded-[16px] p-5 flex flex-col gap-1">
          <span className="text-[11px] font-bold text-white/60">Total Portfolio</span>
          <span className="text-xl font-bold text-white">$18,642.75</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[11px] font-bold text-[#10B981]">▲ 3.24%</span>
          </div>
          <span className="text-[10px] font-bold text-white/40 mt-1">24h Change</span>
        </div>
      </div>

    </div>
  );
};
