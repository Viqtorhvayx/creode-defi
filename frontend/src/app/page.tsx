"use client";

// Developer: Viqtorhvayx (GitHub: Viqtorhvayx)
/* Component: Dashboard
 * Description: Main protocol dashboard refactored into a 4-tabbed architectural interface.
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';

import { VaultTab } from '../components/VaultTab';
import { P2PTab } from '../components/P2PTab';
import { EarnTab } from '../components/EarnTab';
import { Logo } from '../components/Logo';

import { Footer } from '@/components/Footer';

export default function Dashboard() {
  const { balance } = useWallet();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeMainTab, setActiveMainTab] = useState("Vault");
  
  const userXP = 45; 
  const userPoints = 1250;

  useEffect(() => {
    const savedTheme = localStorage.getItem('creode-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (activeMainTab === 'Home') {
      // Force dark mode on landing page
      document.documentElement.classList.add('dark');
    } else {
      // Restore user theme preference when navigating away
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [activeMainTab, theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('creode-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const matchedDarkIntensity = 'rgba(255, 255, 255, 0.6)';
  const secondaryLabelColor = theme === 'dark' ? matchedDarkIntensity : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  const renderTabContent = () => {
    switch (activeMainTab) {
      case 'Vault':
        return (
          <div className="pt-[39px] pb-8">
            <VaultTab theme={theme} />
          </div>
        );
      case 'P2P':
        return (
          <div className="pt-[39px] pb-8">
            <P2PTab theme={theme} />
          </div>
        );
      case 'Earn':
        return (
          <div className="pt-[39px] pb-8">
            <EarnTab theme={theme} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background transition-colors duration-500">
      
      {/* Top Header (Full Width) */}
      {activeMainTab !== 'P2P' && (
        <header className="w-full flex items-center border-b border-black/5 dark:border-white/5 z-50 bg-background/80 backdrop-blur-md relative">
          {/* Left: Logo (aligned with Sidebar) */}
          <div className="w-[140px] flex items-center shrink-0 px-2 pt-6 pb-6">
            <div 
              className="cursor-pointer scale-[0.85] origin-left"
              onClick={() => setActiveMainTab('Vault')}
            >
              <Logo theme={theme} />
            </div>
          </div>

          {/* Right: Controls (aligned with main content) */}
          <div className="flex-1 pl-6 pr-[42px] md:pr-[46px] pt-6 pb-6">
            <div className="max-w-[1400px] w-full mr-auto flex justify-end pr-3 md:pr-4">
              <Header 
                theme={theme} 
                toggleTheme={toggleTheme} 
                activeTab={activeMainTab}
                setActiveTab={setActiveMainTab}
              />
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar (Fixed Width) */}
        {activeMainTab !== 'P2P' && (
          <aside className="w-[140px] shrink-0 border-r border-black/5 dark:border-white/5 overflow-y-auto pl-2 py-8 bg-background/50 relative z-40">
            <Sidebar 
              theme={theme}
              activeTab={activeMainTab}
              setActiveTab={setActiveMainTab}
            />
          </aside>
        )}

        {/* Right Main Content Area */}
        <main className="flex-1 overflow-y-auto pl-6 pr-[42px] md:pr-[46px] relative z-10 w-full min-w-0" style={{ backgroundImage: `radial-gradient(ellipse at 50% -20%, ${theme === 'dark' ? 'rgba(0, 168, 232, 0.05)' : 'rgba(0, 168, 232, 0.05)'}, transparent 50%)` }}>
          <div className="max-w-[1400px] w-full mr-auto h-full flex flex-col pt-2 pr-3 md:pr-4">
            {renderTabContent()}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
