import React from 'react';
import { Shield, EyeOff, Globe, PenTool } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Privacy in Plain Sight
        </h2>
        <p className="text-slate-400 text-lg">
          Shadow-Net uses <span className="text-cyber-400">steganography</span> to hide encrypted messages inside innocent-looking images.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-cyber-800 p-6 rounded-xl border border-cyber-700">
          <EyeOff className="w-8 h-8 text-cyber-500 mb-4" />
          <h3 className="font-bold text-white mb-2">Anti-Censorship</h3>
          <p className="text-slate-400 text-sm">
            In regions where text is monitored, images pass through filters unnoticed. A photo of a cat is just a photo of a cat—unless you have the key.
          </p>
        </div>
        <div className="bg-cyber-800 p-6 rounded-xl border border-cyber-700">
          <Globe className="w-8 h-8 text-purple-500 mb-4" />
          <h3 className="font-bold text-white mb-2">Journalist Protection</h3>
          <p className="text-slate-400 text-sm">
            Whistleblowers can send tips embedded in public image posts without establishing a suspicious direct line of encrypted chat.
          </p>
        </div>
        <div className="bg-cyber-800 p-6 rounded-xl border border-cyber-700">
          <Shield className="w-8 h-8 text-blue-500 mb-4" />
          <h3 className="font-bold text-white mb-2">No Metadata Trail</h3>
          <p className="text-slate-400 text-sm">
            The message exists only in the pixels. Once the image is deleted, the message is gone forever. No server logs of the content.
          </p>
        </div>
        <div className="bg-cyber-800 p-6 rounded-xl border border-cyber-700">
          <PenTool className="w-8 h-8 text-yellow-500 mb-4" />
          <h3 className="font-bold text-white mb-2">AI-Assisted Cover</h3>
          <p className="text-slate-400 text-sm">
            Use Gemini to generate innocuous cover images and "boring" captions to blend perfectly into social media noise.
          </p>
        </div>
      </div>
      
      <div className="bg-cyber-900/50 p-6 rounded-xl border border-slate-700 text-center">
          <p className="text-xs text-slate-500 font-mono">
              DISCLAIMER: This is a proof of concept. Do not use for high-stakes security without auditing the steganography implementation.
          </p>
      </div>
    </div>
  );
};
