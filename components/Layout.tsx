import React from 'react';
import { AppTab } from '../types';
import { Eye, Lock, Unlock, User, Shield } from 'lucide-react';

interface LayoutProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, onTabChange, children }) => {
  const navItems = [
    { id: AppTab.FEED, label: 'Public Feed', icon: Eye },
    { id: AppTab.FRIENDS, label: 'Friends', icon: User }, // Using User icon for friends, maybe Users?
    { id: AppTab.ENCODER, label: 'Encode', icon: Lock },
    { id: AppTab.DECODER, label: 'Decode', icon: Unlock },
    { id: AppTab.USER, label: 'User', icon: Shield }, // Changed User tab icon to Shield for distinction
  ];

  return (
    <div className="min-h-screen bg-cyber-950 text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-cyber-900/90 backdrop-blur-md border-b border-cyber-800 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange(AppTab.FEED)}>
            <Shield className="w-6 h-6 text-cyber-500" />
            <h1 className="text-xl font-bold tracking-tighter uppercase">
              SHADOW<span className="text-cyber-500">NET</span>
            </h1>
          </div>
          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 uppercase tracking-tighter
                  ${activeTab === item.id 
                    ? 'bg-cyber-800 text-cyber-400 shadow-inner' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-cyber-800/50'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
      
      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-cyber-900 border-t border-cyber-800 flex justify-around p-2 pb-safe z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center p-2 rounded-lg w-full ${activeTab === item.id ? 'text-cyber-400' : 'text-slate-500'}`}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] uppercase font-bold tracking-tighter">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};