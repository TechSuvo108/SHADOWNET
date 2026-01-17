import React, { useState, useRef, useEffect } from 'react';
import { Unlock, Upload, FileSearch, RefreshCcw, Key, Terminal, Flame, ShieldAlert, AlertTriangle } from 'lucide-react';
import { decodeMessage, DecodedResult } from '../utils/steganography';
import { incrementPostView } from '../services/posts';

interface DecoderProps {
  initialImage?: string | null;
  initialPostId?: string | null;
  onBurned?: (src: string) => void;
}

export const Decoder: React.FC<DecoderProps> = ({ initialImage, initialPostId, onBurned }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [currentPostId, setCurrentPostId] = useState<string | null>(initialPostId || null);
  const [passphrase, setPassphrase] = useState('');
  const [result, setResult] = useState<DecodedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [burnTimer, setBurnTimer] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialImage) setImageSrc(initialImage);
    if (initialPostId) setCurrentPostId(initialPostId);
  }, [initialImage, initialPostId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageSrc(ev.target?.result as string);
        setCurrentPostId(null); // Local file upload has no post ID
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDecode = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    setResult(null);

    setTimeout(async () => {
      try {
        const decoded = await decodeMessage(imageSrc, passphrase);
        setResult(decoded);

        // Log view if it's a network post
        if (decoded && !decoded.isDecoy && currentPostId) {
          incrementPostView(currentPostId).then(status => {
            if (status === 'deleted') {
              // Optional: Notify user it was the last view
              console.log("Post deleted due to view limit.");
            }
          });
        }

        if (decoded && decoded.selfDestruct && !decoded.isDecoy) {
          initiateSelfDestruct();
        }
      } catch (e) {
        setResult({ message: "EXTRACTION_FAILED: Bitstream Corrupted", isDecoy: true, selfDestruct: false, anonymous: false });
      } finally {
        setIsProcessing(false);
      }
    }, 1000);
  };

  const initiateSelfDestruct = () => {
    setBurnTimer(5);
    const interval = setInterval(() => {
      setBurnTimer(prev => {
        if (prev === 1) {
          clearInterval(interval);
          if (onBurned && imageSrc) onBurned(imageSrc);
          setImageSrc(null);
          setResult(null);
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 font-mono">
      <div className="bg-cyber-900 border border-cyber-700 p-6 rounded-lg shadow-2xl">
        <h2 className="text-xl font-bold text-cyber-400 mb-6 flex items-center gap-2 uppercase tracking-tighter">
          <Terminal className="w-5 h-5" /> BITSTREAM_RECONSTRUCTION
        </h2>

        {!imageSrc ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 rounded-lg p-20 flex flex-col items-center justify-center cursor-pointer hover:border-cyber-500 transition-all bg-black/40 group"
          >
            <Upload className="w-12 h-12 text-slate-700 mb-4 group-hover:text-cyber-500 transition-colors" />
            <span className="text-slate-500 uppercase text-xs font-black tracking-widest group-hover:text-white">Awaiting Carrier Signal...</span>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative aspect-video w-full rounded overflow-hidden bg-black border border-slate-800 group shadow-inner">
              <img src={imageSrc} className="max-w-full max-h-full object-contain mx-auto" alt="Carrier" />
              <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 border border-cyber-500/20 text-[10px] text-cyber-500 font-bold uppercase">
                STATUS: CARRIER_LOADED
              </div>
              {isProcessing && (
                <div className="absolute inset-0 bg-cyber-500/5 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="w-full h-1 bg-cyber-500 absolute top-0 animate-[scan_2s_linear_infinite]"></div>
                  <span className="text-cyber-500 font-black animate-pulse bg-black/80 px-4 py-2 border border-cyber-500 uppercase">SCANNING_PIXELS...</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Extraction Passphrase</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="password"
                    value={passphrase}
                    onChange={e => setPassphrase(e.target.value)}
                    placeholder="Enter key for primary payload..."
                    className="w-full bg-black border border-slate-700 p-3 pl-10 rounded text-cyber-400 text-sm focus:border-cyber-500 outline-none transition-all"
                  />
                </div>
              </div>
              <button
                onClick={handleDecode}
                disabled={isProcessing}
                className="bg-cyber-500 hover:bg-cyber-400 text-black font-black h-[46px] px-8 rounded flex items-center gap-2 uppercase text-xs active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-cyber-500/10"
              >
                {isProcessing ? <RefreshCcw className="animate-spin w-4 h-4" /> : <Unlock className="w-4 h-4" />} Extract
              </button>
            </div>

            {burnTimer !== null && (
              <div className="bg-cyber-accent/10 border border-cyber-accent p-4 rounded text-cyber-accent flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <Flame className="animate-bounce w-5 h-5" />
                  <span className="font-black uppercase text-xs tracking-widest">Protocol: Burn After Reading Initiated</span>
                </div>
                <span className="text-2xl font-black">00:0{burnTimer}</span>
              </div>
            )}

            {result && (
              <div className="space-y-4 animate-fade-in">
                <div className={`p-6 border rounded-lg transition-all ${result.isDecoy ? 'border-warning/30 bg-warning/5' : 'border-cyber-500/50 bg-cyber-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      {result.isDecoy ? <AlertTriangle className="w-3 h-3 text-warning" /> : <ShieldAlert className="w-3 h-3 text-cyber-500" />}
                      <span className={`text-[10px] font-black uppercase tracking-widest ${result.isDecoy ? 'text-warning' : 'text-cyber-500'}`}>
                        {result.isDecoy ? 'DECOY_OVERLAY_EXTRACTED' : 'PRIMARY_PAYLOAD_DECRYPTED'}
                      </span>
                    </div>
                    {result.anonymous && <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">GHOST_TRANSMISSION</span>}
                  </div>
                  <p className={`whitespace-pre-wrap leading-relaxed text-sm font-mono ${result.isDecoy ? 'text-slate-400' : 'text-slate-100'}`}>
                    {result.message}
                  </p>
                  {result.isDecoy && passphrase && (
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-[9px] text-warning uppercase font-bold italic">
                      Note: Key verification failed. Displaying decoy signal.
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setImageSrc(null); setResult(null); setPassphrase(''); }}
                  className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-500 py-3 rounded text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-800"
                >
                  Purge Current Session
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};