"use client";

import React from 'react';
import { House, LockKey, TrendUp, ArrowsDownUp } from '@phosphor-icons/react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, theme }) => {
  const tabs = [
    { id: 'Home', icon: House, label: 'Home' },
    { id: 'Vault', icon: LockKey, label: 'Vault' },
    { id: 'Lend', icon: TrendUp, label: 'Lend' },
    { id: 'Borrow', icon: ArrowsDownUp, label: 'Borrow' },
  ];

  return (
    <nav className="flex justify-center mb-16">
      <div className="flex p-1.5 glass-panel !rounded-full shadow-2xl bg-black/20 scale-90 md:scale-95">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-500 font-bold text-xs cursor-pointer tracking-tight ${
                isActive 
                  ? 'bg-[#00A8E8]/15 text-white border border-[#00A8E8]/30 shadow-[0_0_15px_rgba(0,168,232,0.3)]' 
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Icon size={16} weight="duotone" color={isActive ? "#00A8E8" : "currentColor"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
