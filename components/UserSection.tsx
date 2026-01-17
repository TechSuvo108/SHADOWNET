import React, { useState, useRef, useEffect } from 'react';
import { User, Camera, Shield, EyeOff, Globe, PenTool, Save, LogOut } from 'lucide-react';
import { UserProfile, StegoImage } from '../types';
import { useAuth } from '../services/AuthContext';

const PROFILE_KEY = 'shadow_net_profile_v1';

import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { compressToJpeg } from '../utils/compression';
import { PostCard } from './PostCard';

interface UserSectionProps {
  onDecodeClick?: (src: string, postId: string) => void;
}

export const UserSection: React.FC<UserSectionProps> = ({ onDecodeClick }) => {
  const { logout, currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Anonymous Agent',
    bio: 'Securing the mesh, one bit at a time.',
    dp: null,
    agentId: 'LOADING...'
  });
  const [posts, setPosts] = useState<StegoImage[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile & { nameLower?: string };
          setProfile(data);

          // Self-healing: If nameLower is missing, add it
          if (!data.nameLower && data.name) {
            await updateDoc(docRef, {
              nameLower: data.name.toLowerCase()
            });
          }
        } else {
          // Determine new agent ID if not found (should be set on signup but fallback here)
          const newProfile = {
            name: currentUser.displayName || 'New Agent',
            nameLower: (currentUser.displayName || 'New Agent').toLowerCase(),
            bio: 'Just joined the network.',
            dp: null,
            agentId: 'AGENT_' + Math.random().toString(36).substr(2, 6).toUpperCase()
          };
          setProfile(newProfile);
          await setDoc(docRef, newProfile);
        }
      } catch (e) {
        console.error("Profile fetch error", e);
      }

      // Fetch User Posts
      try {
        const q = query(collection(db, "posts"), where("ownerId", "==", currentUser.uid));
        const postsSnap = await getDocs(q);
        const userPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as StegoImage[];
        const now = Date.now();
        const validPosts = userPosts.filter(p => {
          if (p.expiresAt && p.expiresAt < now) {
            // Lazy delete for own profile (since we are owner)
            import('../services/posts').then(mod => mod.deletePost(p.id).catch(e => console.warn(e)));
            return false;
          }
          return true;
        });
        setPosts(validPosts);
      } catch (e) {
        console.error("Failed to fetch user posts", e);
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        name: profile.name,
        nameLower: profile.name.toLowerCase(),
        bio: profile.bio,
        dp: profile.dp
      });
      setIsEditing(false);
    } catch (e) {
      console.error("Profile save error:", e);
      if (e instanceof Error) {
        alert(`Failed to save profile: ${e.message}`);
      } else {
        alert("Failed to save profile. Check console for details.");
      }
    }
  };

  const handleDpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress to 300px max width, JPEG 0.7 quality
      compressToJpeg(file, 300, 0.7).then(dataUrl => {
        setProfile({ ...profile, dp: dataUrl });
      }).catch(err => {
        console.error("Compression error", err);
        alert("Failed to process image.");
      });
    }
  };



  const [selectedPost, setSelectedPost] = useState<StegoImage | null>(null);

  const [backupProfile, setBackupProfile] = useState<UserProfile | null>(null);

  const handleEditStart = () => {
    setBackupProfile(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (backupProfile) {
      setProfile(backupProfile);
    }
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 space-y-12 font-mono animate-fade-in">
      {/* Profile Card */}
      <div className="bg-cyber-900 border border-slate-800 rounded-2xl p-8 pt-16 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 flex items-center gap-4">
          <button
            onClick={() => logout()}
            className="group/logout flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white px-3 py-1.5 rounded transition-all"
            title="Terminate Session"
          >
            <LogOut className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-wider">Disconnect</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group/dp">
            <div className="w-32 h-32 rounded-2xl bg-black border-2 border-cyber-500/20 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all group-hover/dp:border-cyber-500/50">
              {profile.dp ? (
                <img src={profile.dp} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <User className="w-16 h-16 text-slate-800" />
              )}
            </div>
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-cyber-500 text-black p-2 rounded-lg shadow-xl hover:bg-cyber-400 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleDpChange} />
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-black border border-slate-700 p-2 rounded text-cyber-500 font-black uppercase text-xl outline-none focus:border-cyber-500"
                  placeholder="Display Name"
                />
                <textarea
                  value={profile.bio}
                  onChange={e => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full bg-black border border-slate-700 p-2 rounded text-xs text-slate-400 outline-none focus:border-cyber-500 h-20 resize-none"
                  placeholder="Tell your story..."
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="bg-cyber-500 text-black px-6 py-2 rounded font-black uppercase text-xs flex items-center gap-2 hover:bg-cyber-400 transition-colors"
                  >
                    <Save className="w-4 h-4" /> Commit Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-slate-800 text-white px-4 py-2 rounded font-bold uppercase text-xs hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{profile.name}</h2>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{profile.agentId}</p>
                <p className="text-sm text-slate-400 leading-relaxed max-w-md">{profile.bio}</p>
                <button
                  onClick={handleEditStart}
                  className="text-[10px] text-cyber-500 uppercase font-black border border-cyber-500/30 px-3 py-1 rounded hover:bg-cyber-500/10 transition-colors"
                >
                  Edit Identity
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* User Posts Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <Shield className="w-5 h-5 text-cyber-500" />
          <h3 className="text-lg font-black text-white uppercase tracking-tighter">Transmission Log</h3>
          <span className="text-xs text-slate-500 font-bold uppercase">({posts.length})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="bg-black border border-slate-800 rounded-lg overflow-hidden group hover:border-cyber-500/50 transition-colors cursor-pointer"
            >
              <div className="aspect-square bg-slate-900 relative">
                <img src={post.src} className="w-full h-full object-cover" />
                {post.hasHiddenMessage && <div className="absolute top-2 right-2 bg-black/80 text-cyber-500 p-1 rounded"><Shield className="w-3 h-3" /></div>}
              </div>
              <div className="p-3">
                <p className="text-slate-300 text-xs line-clamp-2">{post.caption}</p>
                <p className="text-[9px] text-slate-600 mt-2 uppercase font-bold">{new Date(post.timestamp).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-600 uppercase text-xs">No local transmissions recorded.</div>
          )}
        </div>
      </div>

      {/* Platform Motive / About Section */}
      <div className="space-y-8">
        <div className="border-l-4 border-cyber-500 pl-4">
          <h3 className="text-lg font-black text-white uppercase tracking-tighter">Shadow-Net Protocol Motive</h3>
          <p className="text-xs text-slate-500 uppercase">System Intelligence // Operation: Privacy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-cyber-800/20 p-6 rounded-xl border border-slate-800 hover:border-cyber-500/20 transition-colors group">
            <EyeOff className="w-6 h-6 text-cyber-500 mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="font-black text-white mb-2 uppercase text-xs">Censorship Bypass</h4>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              In environments where digital communications are heavily monitored, simple text is the first to be flagged. Shadow-Net transforms messages into innocuous pixel data, allowing truth to flow through plain sight.
            </p>
          </div>
          <div className="bg-cyber-800/20 p-6 rounded-xl border border-slate-800 hover:border-purple-500/20 transition-colors group">
            <Shield className="w-6 h-6 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="font-black text-white mb-2 uppercase text-xs">Zero Trail Archiving</h4>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              We believe in the right to vanish. Our auto-deletion protocols (view limits and time-based expiry) ensure that sensitive intel does not linger in the digital ether indefinitely.
            </p>
          </div>
          <div className="bg-cyber-800/20 p-6 rounded-xl border border-slate-800 hover:border-blue-500/20 transition-colors group">
            <Globe className="w-6 h-6 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="font-black text-white mb-2 uppercase text-xs">Global Mesh Access</h4>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              Shadow-Net is built on the philosophy of decentralized, local-first security. Your data is encrypted in your browser, not on our servers. You own the key; you own the silence.
            </p>
          </div>
          <div className="bg-cyber-800/20 p-6 rounded-xl border border-slate-800 hover:border-yellow-500/20 transition-colors group">
            <PenTool className="w-6 h-6 text-yellow-500 mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="font-black text-white mb-2 uppercase text-xs">Decoy Psychology</h4>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              Encryption is only half the battle. Deniability is the other. Our decoy system allows agents to provide 'fake' keys that reveal harmless messages, protecting the true payload from coercion.
            </p>
          </div>
        </div>
      </div>

      <footer className="pt-12 border-t border-slate-900 text-center space-y-4">
        <p className="text-[10px] text-slate-600 uppercase font-bold tracking-[0.2em]">
          End Transmission // Shadow-Net V2.4.0
        </p>
        <div className="flex justify-center gap-8 text-[9px] text-slate-700 uppercase font-black">
          <span className="cursor-help hover:text-cyber-500">Security Audit</span>
          <span className="cursor-help hover:text-cyber-500">Node Status: Active</span>
          <span className="cursor-help hover:text-rose-500" onClick={() => { if (confirm('Wipe all local records?')) { localStorage.clear(); window.location.reload(); } }}>Emergency Purge</span>
        </div>
        <p className="text-[9px] text-slate-800 max-w-sm mx-auto leading-relaxed italic">
          Disclaimer: This platform is a conceptual tool for digital sovereignty. Users are responsible for their own security hygiene and local compliance laws.
        </p>
      </footer>

      {/* Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPost(null)}>
          <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <PostCard
              post={selectedPost}
              currentUser={currentUser}
              // Since it's our own profile, we are the userProfile
              userProfile={profile}
              onDecodeClick={onDecodeClick || (() => { })}
            // No need to view profile as we are here
            />
          </div>
        </div>
      )}
    </div>
  );
};