import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Unlock, Clock, Eye, ShieldCheck, Lock, User, Trash2, X, Repeat, Users, Globe } from 'lucide-react';
import { StegoImage, UserProfile } from '../types';
import { subscribeToPosts, deletePost, createPost } from '../services/posts';
import { subscribeToFriends } from '../services/friends';
import { useAuth } from '../services/AuthContext';
import { encodeMessage } from '../utils/steganography';
import { PostCard } from './PostCard';

interface PublicFeedProps {
    onDecodeClick: (imageSrc: string) => void;
    onViewProfile?: (userId: string) => void;
}

export const PublicFeed: React.FC<PublicFeedProps> = ({ onDecodeClick, onViewProfile }) => {
    const { currentUser } = useAuth();
    const [rawPosts, setRawPosts] = useState<StegoImage[]>([]);
    const [allPosts, setAllPosts] = useState<StegoImage[]>([]);
    const [displayedPosts, setDisplayedPosts] = useState<StegoImage[]>([]);
    const [now, setNow] = useState(Date.now());

    // Filter State
    const [filterMode, setFilterMode] = useState<'all' | 'connected'>('all');
    const [connectedUserIds, setConnectedUserIds] = useState<string[]>([]);

    const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});

    // Heartbeat
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 3000);
        return () => clearInterval(interval);
    }, []);

    // Post Subscription
    useEffect(() => {
        const unsubscribe = subscribeToPosts((fetchedPosts) => {
            setRawPosts(fetchedPosts);
        });
        return () => unsubscribe();
    }, []);

    // Friend Subscription
    useEffect(() => {
        if (!currentUser) return;
        const unsubscribe = subscribeToFriends(currentUser.uid, (friendIds) => {
            setConnectedUserIds(friendIds);
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Filtering Logic
    useEffect(() => {
        // 1. Time-based filter (Expiry)
        const timeFiltered = rawPosts.filter(post => {
            if (post.expiresAt && post.expiresAt < now) {
                if (post.ownerId === currentUser?.uid) {
                    deletePost(post.id).catch(e => console.warn("Cleanup failed", e));
                }
                return false;
            }
            return true;
        });
        setAllPosts(timeFiltered);

        // 2. Mode-based filter
        let finalPosts = timeFiltered;
        if (filterMode === 'connected') {
            finalPosts = timeFiltered.filter(post =>
                post.ownerId && connectedUserIds.includes(post.ownerId)
            );
        }
        setDisplayedPosts(finalPosts);

        // Fetch profiles
        const uniqueAuthors = Array.from(new Set(timeFiltered.map(p => p.ownerId).filter(Boolean))) as string[];
        uniqueAuthors.forEach((uid) => {
            if (userProfiles[uid]) return;
            import('../services/firebase').then(({ db }) => {
                import('firebase/firestore').then(({ doc, getDoc }) => {
                    getDoc(doc(db, "users", uid)).then(snap => {
                        if (snap.exists()) {
                            setUserProfiles(prev => ({ ...prev, [uid]: snap.data() as UserProfile }));
                        }
                    });
                });
            });
        });

    }, [rawPosts, now, currentUser, filterMode, connectedUserIds]);

    const handleDelete = async (id: string) => {
        if (confirm("Permanently purge this transmission from your local mesh?")) {
            try {
                await deletePost(id);
            } catch (e) {
                alert("Failed to delete: " + e);
            }
        }
    };

    // Repost State
    const [repostModal, setRepostModal] = useState<{ isOpen: boolean, post: StegoImage | null }>({ isOpen: false, post: null });
    const [repostMode, setRepostMode] = useState<'clean' | 'secure'>('clean');
    const [repostSecret, setRepostSecret] = useState('');
    const [repostPass, setRepostPass] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleRepostSubmit = async () => {
        if (!repostModal.post || !currentUser) return;
        setIsProcessing(true);
        try {
            let finalSrc = repostModal.post.src;
            let hasHidden = false;

            if (repostMode === 'secure') {
                if (!repostSecret || !repostPass) {
                    alert("Message and Password required for secure repost.");
                    setIsProcessing(false);
                    return;
                }
                finalSrc = await encodeMessage(repostModal.post.src, repostSecret, repostPass, "This is a re-encrypted transmission.");
                hasHidden = true;
            }

            await createPost({
                src: finalSrc,
                caption: `REPOST [${repostModal.post.user}]: ${repostModal.post.caption}`,
                timestamp: Date.now(),
                user: currentUser.displayName || 'Agent',
                ownerId: currentUser.uid,
                userDp: currentUser.photoURL || null,
                currentViews: 0,
                hasHiddenMessage: hasHidden
            });

            setRepostModal({ isOpen: false, post: null });
            setRepostSecret('');
            setRepostPass('');
            setRepostMode('clean');
            alert("Transmission Reposted Successfully.");

        } catch (e: any) {
            alert("Repost Failed: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 pb-24 font-mono">
            {/* Filter Controls */}
            <div className="flex bg-cyber-900/50 p-1 rounded-lg border border-slate-800 backdrop-blur-sm sticky top-20 z-10 mx-4 lg:mx-0">
                <button
                    onClick={() => setFilterMode('connected')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded transition-all ${filterMode === 'connected'
                            ? 'bg-cyber-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Users className="w-3 h-3" /> Connected Users
                </button>
                <div className="w-px bg-slate-800 mx-1" />
                <button
                    onClick={() => setFilterMode('all')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded transition-all ${filterMode === 'all'
                            ? 'bg-cyber-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Globe className="w-3 h-3" /> All Posts
                </button>
            </div>

            {displayedPosts.map((img) => (
                <PostCard
                    key={img.id}
                    post={img}
                    currentUser={currentUser}
                    userProfile={userProfiles[img.ownerId]}
                    onDecodeClick={onDecodeClick}
                    onViewProfile={onViewProfile}
                    onRepost={(post) => setRepostModal({ isOpen: true, post })}
                />
            ))}

            {displayedPosts.length === 0 && (
                <div className="text-center py-32 bg-cyber-900/50 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-4">
                    <ShieldCheck className="w-12 h-12 text-slate-700" />
                    <div className="space-y-1">
                        <p className="text-slate-500 font-black text-sm uppercase tracking-widest">Zone Clear</p>
                        <p className="text-[10px] text-slate-600 font-bold">
                            {filterMode === 'connected' ? 'NO TRANSMISSIONS FROM NETWORK' : 'NO ACTIVE TRANSMISSIONS DETECTED'}
                        </p>
                    </div>
                </div>
            )}

            {repostModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-cyber-900 border border-slate-700 w-full max-w-md rounded-xl p-6 shadow-2xl relative animate-fade-in">
                        <button
                            onClick={() => setRepostModal({ isOpen: false, post: null })}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1 flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-cyber-500" /> Repost Transmission
                        </h3>
                        <p className="text-xs text-slate-500 mb-6">Re-broadcast this signal to your network.</p>

                        <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-lg">
                            <button
                                onClick={() => setRepostMode('clean')}
                                className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${repostMode === 'clean' ? 'bg-cyber-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Clean Repost
                            </button>
                            <button
                                onClick={() => setRepostMode('secure')}
                                className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${repostMode === 'secure' ? 'bg-cyber-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Re-Encrypt
                            </button>
                        </div>

                        {repostMode === 'secure' && (
                            <div className="space-y-4 mb-6 animate-fade-in">
                                <textarea
                                    value={repostSecret}
                                    onChange={e => setRepostSecret(e.target.value)}
                                    placeholder="New Hidden Message..."
                                    className="w-full bg-black border border-cyber-500/30 p-3 rounded text-sm text-cyber-400 focus:border-cyber-500 outline-none h-24 resize-none"
                                />
                                <input
                                    type="password"
                                    value={repostPass}
                                    onChange={e => setRepostPass(e.target.value)}
                                    placeholder="Decryption Key..."
                                    className="w-full bg-black border border-rose-500/30 p-3 rounded text-sm text-white focus:border-rose-500 outline-none"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRepostModal({ isOpen: false, post: null })}
                                className="px-4 py-2 rounded text-xs font-bold uppercase text-slate-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRepostSubmit}
                                disabled={isProcessing}
                                className="bg-cyber-500 hover:bg-cyber-400 text-black font-black px-6 py-2 rounded uppercase text-xs tracking-widest disabled:opacity-50"
                            >
                                {isProcessing ? 'Processing...' : 'Broadcast'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};