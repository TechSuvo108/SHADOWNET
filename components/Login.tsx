import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export const Login: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono p-4">
      <div className="max-w-md w-full bg-cyber-900/20 border border-slate-800 rounded-2xl p-8 space-y-8 animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-500 to-transparent opacity-50"></div>
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyber-500/10 text-cyber-500 mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Identity Verify</h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Shadow-Net Access Control</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Agent ID (Email)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black border border-slate-800 focus:border-cyber-500 text-white pl-10 pr-4 py-2.5 rounded-lg outline-none transition-colors text-sm"
                placeholder="agent@shadownet.dev"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Passphrase</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black border border-slate-800 focus:border-cyber-500 text-white pl-10 pr-4 py-2.5 rounded-lg outline-none transition-colors text-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-cyber-500 hover:bg-cyber-400 text-black font-black uppercase text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            Authenticate <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-800/50">
          <p className="text-xs text-slate-500">
            No credentials? 
            <button onClick={onSwitch} className="text-cyber-500 font-bold ml-2 hover:underline uppercase text-[10px] tracking-wider">
              Request Uplink
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
