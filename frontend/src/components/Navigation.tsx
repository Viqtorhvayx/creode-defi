"use client";

import React from 'react';
import { Home, Lock, TrendingUp, ArrowDownLeft } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, theme }) => {
  const tabs = [
    { id: 'Home', icon: Home, label: 'Home' },
    { id: 'Vault', icon: Lock, label: 'Vault' },
    { id: 'Lend', icon: TrendingUp, label: 'Lend' },
    { id: 'Borrow', icon: ArrowDownLeft, label: 'Borrow' },
  ];

  return (
    <nav className="flex justify-center mb-12">
      <div className="flex p-1.5 glass-panel !rounded-full shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-pill group ${
                isActive 
                  ? 'bg-[#00A8E8] text-white shadow-[0_0_20px_rgba(0,168,232,0.4)]' 
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Icon 
                size={18} 
                className={`transition-all duration-500 ${
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                }`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
