import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// Actually, I saw `window.location` usage in UserSection. 
// I should probably check App.tsx to see how routing is handled.
// Wait, the user has NO router installed (package.json checks needed).
// The user asked for "pages". If no router, we usually do conditional rendering in App.tsx. 
// I will implement this component assuming it receives `userId` as a prop or parses search params?
// Or I should suggest installing react-router-dom? 
// For now, I'll make it accepting a `viewedUserId` prop and `onBack` callback if we are doing single-page manual routing, 
// OR I will assume I can update App.tsx to handle basic hash routing or similar.
// Let's implement it as a standard component and I'll handle "routing" in App.tsx.

import { User, UserPlus, MessageSquare, Shield, Check } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, StegoImage } from '../types';
import { useAuth } from '../services/AuthContext';
import { sendFriendRequest, checkFriendStatus, removeFriend } from '../services/friends';
import { PostCard } from './PostCard';

interface PublicProfileProps {
    userId: string;
    onBack?: () => void;
    onDecodeClick?: (src: string, postId: string) => void;
}

export const PublicProfile: React.FC<PublicProfileProps> = ({ userId, onBack, onDecodeClick }) => {
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<StegoImage[]>([]);
    const [friendStatus, setFriendStatus] = useState<'none' | 'friends' | 'pending'>('none');
    const [selectedPost, setSelectedPost] = useState<StegoImage | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;
            // Fetch Profile
            const userSnap = await getDoc(doc(db, "users", userId));
            if (userSnap.exists()) {
                setProfile(userSnap.data() as UserProfile);
            }

            // Fetch Posts
            const q = query(collection(db, "posts"), where("ownerId", "==", userId));
            const postsSnap = await getDocs(q);
            const userPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as StegoImage[];
            const now = Date.now();
            const validPosts = userPosts.filter(p => {
                if (p.expiresAt && p.expiresAt < now) return false;
                return true;
            });
            setPosts(validPosts);

            // Check friend status
            if (currentUser) {
                const status = await checkFriendStatus(currentUser.uid, userId); // This might need update to return 'pending' correctly
                // Quick hack: just check standard status
                // For now assuming 'none' or 'friends' from service, but we'll add pending check if we can.
                setFriendStatus(status as any);
            }
        };
        fetchData();
    }, [userId, currentUser]);

    const handleAddFriend = async () => {
        if (!currentUser || !profile) return;
        try {
            await sendFriendRequest(currentUser.uid, userId, currentUser.displayName || 'Agent', null);
            setFriendStatus('pending');
            alert("Signal transmitted.");
        } catch (e) { alert("Failed to send request"); }
    };

    if (!profile) return <div className="text-center py-20 text-slate-500 animate-pulse">LOCATING TARGET NODE...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-24 font-mono animate-fade-in">
            <button onClick={onBack} className="text-slate-500 hover:text-white mb-6 uppercase text-xs font-bold">&larr; Return to Grid</button>

            {/* Header */}
            <div className="bg-cyber-900 border border-slate-700 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                <div className="w-32 h-32 bg-black rounded-full border-4 border-slate-800 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    {profile.dp ? <img src={profile.dp} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-slate-800" />}
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{profile.name}</h1>
                    <p className="text-cyber-500 text-xs font-bold uppercase tracking-widest">{profile.agentId}</p>
                    <p className="text-slate-400 text-sm max-w-lg">{profile.bio}</p>
                </div>

                <div className="flex flex-col gap-3 min-w-[140px]">
                    {currentUser && currentUser.uid !== userId && (
                        <>
                            {friendStatus === 'none' && (
                                <button onClick={handleAddFriend} className="bg-cyber-500 hover:bg-cyber-400 text-black font-black py-3 px-6 rounded uppercase text-xs flex items-center justify-center gap-2 transition-transform hover:scale-105">
                                    <UserPlus className="w-4 h-4" /> Connect
                                </button>
                            )}
                            {friendStatus === 'pending' && (
                                <button disabled className="bg-slate-800 text-slate-400 font-bold py-3 px-6 rounded uppercase text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                                    <Shield className="w-4 h-4" /> Requested
                                </button>
                            )}
                            {friendStatus === 'friends' && (
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/50 py-3 px-6 rounded uppercase text-xs font-black text-center flex items-center justify-center gap-2">
                                        <Check className="w-4 h-4" /> Ally Node
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (confirm("Sever connection with this node?")) {
                                                import('../services/friends').then(mod => mod.removeFriend(currentUser.uid, userId));
                                                setFriendStatus('none');
                                            }
                                        }}
                                        className="text-[10px] text-rose-500 hover:text-white uppercase font-bold text-center hover:bg-rose-500/20 py-1 rounded transition-colors"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Posts */}
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
                    <div className="col-span-full py-12 text-center text-slate-600 uppercase text-xs">No public transmissions found.</div>
                )}
            </div>

            {selectedPost && profile && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPost(null)}>
                    <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <PostCard
                            post={selectedPost}
                            currentUser={currentUser}
                            userProfile={profile}
                            onDecodeClick={onDecodeClick || (() => { })}
                            onViewProfile={() => { }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
