import React, { useState, useRef, useEffect } from 'react';
import { Upload, Lock, Send, Clock, Eye, MessageSquare, ShieldAlert, ChevronRight, ChevronLeft, Ghost, Download, AlertCircle } from 'lucide-react';
import { encodeMessage } from '../utils/steganography';
import { StegoImage, UserProfile } from '../types';
import { createPost } from '../services/posts';
import { useAuth } from '../services/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { compressImage } from '../utils/compression';

interface EncoderProps {
  onPostComplete?: () => void;
}

export const Encoder: React.FC<EncoderProps> = ({ onPostComplete }) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [carrierSrc, setCarrierSrc] = useState<string | null>(null);
  const [carrierType, setCarrierType] = useState<'image' | 'video' | null>(null);

  // Payload States
  const [caption, setCaption] = useState('');
  const [hiddenMessage, setHiddenMessage] = useState('');
  const [fakeMessage, setFakeMessage] = useState('');
  const [passphrase, setPassphrase] = useState('');

  // Deletion States
  const [expiryMins, setExpiryMins] = useState<string>('');
  const [viewLimit, setViewLimit] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [encodedResult, setEncodedResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert("Invalid file type. Please select an image or video file.");
        return;
      }
      const type = file.type.startsWith('image/') ? 'image' : 'video';

      if (type === 'image') {
        // Resize large images to reasonable payload carrier size (e.g. 600px width)
        // High quality (0.9) to preserve some fidelity for steg, though steg usually needs PNG.
        // compressImage handles resizing.
        compressImage(file, 600, 0.9).then(dataUrl => {
          setCarrierSrc(dataUrl);
          setCarrierType(type);
        }).catch(err => {
          console.error(err);
          alert("Failed to process image carrier.");
        });
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setCarrierSrc(ev.target?.result as string);
          setCarrierType(type);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleProcessPayload = async () => {
    if (hiddenMessage && !passphrase) {
      alert("A key (password) is required to secure your hidden message.");
      return;
    }

    setIsLoading(true);
    try {
      if (hiddenMessage && carrierType === 'image') {
        const result = await encodeMessage(carrierSrc!, hiddenMessage, passphrase, fakeMessage || "Nothing unusual here.");
        setEncodedResult(result);
      } else {
        if (hiddenMessage && carrierType === 'video') {
          alert("Note: High-fidelity steganography is currently optimized for images.");
        }
        setEncodedResult(carrierSrc);
      }
      setStep(3);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalPost = async () => {
    if (!encodedResult || !currentUser) return;
    setIsLoading(true);

    // Fetch latest user profile data
    let userProfile = { name: 'Anonymous Agent', agentId: 'UNKNOWN', dp: null };
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        userProfile = {
          name: data.name,
          agentId: data.agentId,
          dp: data.dp
        };
      }
    } catch (e) { console.error("Profile fetch error", e); }

    // Convert minutes to milliseconds (Minutes * 60 * 1000)
    const expiryTimestamp = expiryMins ? Date.now() + (parseInt(expiryMins) * 60 * 1000) : undefined;
    const views = viewLimit ? parseInt(viewLimit) : undefined;

    // Safety check for Firestore 1MB limit (approx 1048576 bytes)
    // Base64 is ~1.33x larger than binary. 1MB chars is roughly 750KB binary.
    if (encodedResult.length > 1000000) {
      alert("Transmission too large for free-tier mesh (1MB Limit). Please use a simpler or smaller image.");
      setIsLoading(false);
      return;
    }

    try {
      await createPost({
        src: encodedResult,
        caption: caption,
        timestamp: Date.now(),
        expiresAt: expiryTimestamp,
        user: userProfile.name,
        ownerId: currentUser.uid,
        userDp: userProfile.dp,
        maxViews: views,
        currentViews: 0,
        hasHiddenMessage: !!hiddenMessage
      });
      alert("Transmission Uploaded to Mesh.");
      setStep(1);
      setCarrierSrc(null);
      setEncodedResult(null);
      if (onPostComplete) onPostComplete();
    } catch (e: any) {
      alert("Upload Failed: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!encodedResult) return;
    const link = document.createElement('a');
    link.href = encodedResult;
    link.download = `shadow_net_${Date.now()}.${carrierType === 'video' ? 'mp4' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 font-mono">
      {/* Visual Stepper */}
      <div className="flex items-center justify-between px-4 mb-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-black transition-colors ${step >= s ? 'bg-cyber-500 border-cyber-500 text-black' : 'border-slate-800 text-slate-700'}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 mx-2 ${step > s ? 'bg-cyber-500' : 'bg-slate-800'}`} />}
          </div>
        ))}
        <span className="text-[10px] text-cyber-500 font-black uppercase ml-auto">Process: {step}/3</span>
      </div>

      {step === 1 && (
        <div className="bg-cyber-900 border border-cyber-700 p-8 rounded-lg shadow-2xl animate-fade-in space-y-8">
          <div className="text-center">
            <h3 className="text-xl font-bold text-cyber-400 mb-2 uppercase tracking-tighter">1. CHOOSE CARRIER VEHICLE</h3>
            <p className="text-xs text-slate-500">Select a local image or video as your transmission shell.</p>
          </div>

          {!carrierSrc ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 rounded-lg p-20 flex flex-col items-center justify-center cursor-pointer hover:border-cyber-500 hover:bg-cyber-500/5 transition-all group bg-black/20"
            >
              <Upload className="w-16 h-16 text-slate-700 group-hover:text-cyber-400 mb-6 transition-transform group-hover:scale-110" />
              <span className="text-slate-400 font-black uppercase text-sm tracking-widest group-hover:text-white">SELECT LOCAL CARRIER</span>
              <p className="text-[10px] text-slate-600 mt-2">SUPPORTED: IMAGE/VIDEO ONLY</p>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
            </div>
          ) : (
            <div className="space-y-6 flex flex-col items-center">
              <div className="w-full aspect-video bg-black rounded-lg border border-cyber-500/30 flex items-center justify-center overflow-hidden relative group">
                {carrierType === 'image' ? (
                  <img src={carrierSrc} className="max-h-full object-contain" alt="Carrier preview" />
                ) : (
                  <video src={carrierSrc} className="max-h-full object-contain" controls />
                )}
                <button
                  onClick={() => { setCarrierSrc(null); setCarrierType(null); }}
                  className="absolute top-4 right-4 bg-black/80 p-2 rounded text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all z-10"
                >
                  <Ghost className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-cyber-500 text-black font-black px-12 py-4 rounded-md hover:bg-cyber-400 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em]"
              >
                LOOK CARRIER <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="bg-cyber-900 border border-cyber-700 p-8 rounded-lg shadow-2xl animate-fade-in space-y-8">
          <div className="text-center">
            <h3 className="text-xl font-bold text-cyber-400 mb-2 uppercase tracking-tighter">2. SET PAYLOAD CONFIGURATION</h3>
            <p className="text-xs text-slate-500">Configure public metadata and secure hidden data.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase font-black flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" /> Public Caption (Optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="The story visible to others..."
                  className="w-full h-20 bg-black border border-slate-700 p-3 rounded text-sm text-slate-200 focus:border-cyber-500 outline-none resize-none"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <label className="text-[10px] text-cyber-500 uppercase font-black flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Hidden Message (Optional)
                </label>
                <textarea
                  value={hiddenMessage}
                  onChange={(e) => setHiddenMessage(e.target.value)}
                  placeholder="Data to be hidden in pixels..."
                  className="w-full h-20 bg-black border border-cyber-700/50 p-3 rounded text-sm text-cyber-400 font-mono focus:border-cyber-500 outline-none resize-none"
                />

                {hiddenMessage && (
                  <div className="animate-fade-in space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-warning uppercase font-black flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" /> Fake Message (Optional)
                      </label>
                      <textarea
                        value={fakeMessage}
                        onChange={(e) => setFakeMessage(e.target.value)}
                        placeholder="Visible if the wrong key is used..."
                        className="w-full h-20 bg-black border border-slate-700 p-3 rounded text-xs text-slate-400 focus:border-warning outline-none resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-rose-500 uppercase font-black">Decryption Key (Required)</label>
                      <input
                        type="password"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder="Enter Key..."
                        className="w-full bg-black border border-rose-500/50 p-2 rounded text-sm focus:border-rose-500 outline-none text-rose-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4 bg-cyber-800/10 p-4 rounded-lg border border-slate-800">
                <h4 className="text-[10px] text-slate-400 uppercase font-black flex items-center gap-2">
                  <ShieldAlert className="w-3 h-3" /> Auto-Delete protocols
                </h4>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase font-bold">Auto-Delete after (Minutes)</label>
                    <div className="relative">
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
                      <input
                        type="number"
                        value={expiryMins}
                        onChange={e => setExpiryMins(e.target.value)}
                        placeholder="Indefinite"
                        className="w-full bg-black border border-slate-700 p-2 pl-7 rounded text-xs focus:border-cyber-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase font-bold">Max View Limit</label>
                    <div className="relative">
                      <Eye className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
                      <input
                        type="number"
                        value={viewLimit}
                        onChange={e => setViewLimit(e.target.value)}
                        placeholder="Unlimited"
                        className="w-full bg-black border border-slate-700 p-2 pl-7 rounded text-xs focus:border-cyber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-950/10 border border-yellow-700/20 rounded text-[9px] text-yellow-500 leading-relaxed italic">
                NOTICE: Fake messages act as psychological decoys. If a third party demands the key, you can provide an alternative one to show the decoy message instead.
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-md flex items-center justify-center gap-2 uppercase text-xs transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Go Back
            </button>
            <button
              onClick={handleProcessPayload}
              disabled={isLoading}
              className="flex-[2] bg-cyber-500 hover:bg-cyber-400 text-black font-black py-4 rounded-md shadow-lg shadow-cyber-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              {isLoading ? 'ENCRYPTING...' : 'PREPARE DATA'} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && encodedResult && (
        <div className="bg-cyber-900 border border-cyber-500 p-12 rounded-lg text-center animate-glitch shadow-2xl">
          <div className="w-20 h-20 bg-cyber-500/10 border border-cyber-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-cyber-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Transmission Finalized</h2>
          <p className="text-slate-400 mb-10 max-w-sm mx-auto text-sm">
            Payload is locked into the carrier bitstream. Choose your next action.
          </p>

          <div className="max-w-xs mx-auto mb-10 border-2 border-cyber-500/30 rounded-lg overflow-hidden shadow-2xl">
            {carrierType === 'image' ? (
              <img src={encodedResult} className="w-full" alt="Final preview" />
            ) : (
              <video src={encodedResult} className="w-full" controls />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setStep(2)}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-4 rounded-md flex items-center justify-center gap-2 uppercase text-[10px] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Go Back
            </button>
            <button
              onClick={handleDownload}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-4 rounded-md flex items-center justify-center gap-2 uppercase text-[10px] transition-colors"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              onClick={handleFinalPost}
              disabled={isLoading}
              className="bg-cyber-500 hover:bg-cyber-400 text-black font-black px-4 py-4 rounded-md flex items-center justify-center gap-2 shadow-xl shadow-cyber-500/20 active:scale-105 transition-all uppercase text-[10px] tracking-widest disabled:opacity-70 disabled:cursor-wait"
            >
              <Send className="w-4 h-4" /> {isLoading ? 'TRANSMITTING...' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};