import React, { useState, useEffect } from 'react';
import { UserCheck, UserPlus, MessageSquare, X, Check, Users } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { subscribeToRequests, respondToRequest, subscribeToFriends } from '../services/friends';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { FriendRequest, UserProfile } from '../types';
import { ChatWindow } from './ChatWindow';

interface FriendsPageProps {
  onViewProfile?: (userId: string) => void;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({ onViewProfile }) => {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [friends, setFriends] = useState<string[]>([]);
    const [friendProfiles, setFriendProfiles] = useState<Record<string, UserProfile>>({});
    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
    const [selectedChatUser, setSelectedChatUser] = useState<{id: string, name: string} | null>(null);
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<(UserProfile & { uid: string })[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            // Import dynamically to avoid circular deps if any, or just import at top
            const { searchUsers } = await import('../services/friends');
            const results = await searchUsers(searchQuery);
            setSearchResults(results);
        } catch(e) { console.error(e); }
        finally { setIsSearching(false); }
    };

    useEffect(() => {
        if (!currentUser) return;
        
        // Subscribe to incoming requests
        const unsubRequests = subscribeToRequests(currentUser.uid, (reqs) => {
            setRequests(reqs);
        });

        // Subscribe to friend list
        const unsubFriends = subscribeToFriends(currentUser.uid, (friendIds) => {
            setFriends(friendIds);
            // Fetch profiles
            friendIds.forEach(async (fid) => {
                if (friendProfiles[fid]) return;
                try {
                    const snap = await getDoc(doc(db, "users", fid));
                    if (snap.exists()) {
                        setFriendProfiles(prev => ({...prev, [fid]: snap.data() as UserProfile}));
                    }
                } catch(e) { console.error(e) }
            });
        });

        return () => {
            unsubRequests();
            unsubFriends();
        };
    }, [currentUser]);

    const handleAccept = async (req: FriendRequest) => {
        if (!currentUser) return;
        try {
            await respondToRequest(req.id, req.from, currentUser.uid, 'accept');
        } catch(e) { alert("Failed to accept"); }
    };

    const handleReject = async (req: FriendRequest) => {
        if (!currentUser) return;
        try {
            await respondToRequest(req.id, req.from, currentUser.uid, 'reject');
        } catch(e) { alert("Failed to reject"); }
    };

    return (
        <div className="max-w-4xl mx-auto pb-24 space-y-8 font-mono animate-fade-in relative">
            <div className="flex items-center justify-between mb-8">
                <div>
                   <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                       <Users className="w-8 h-8 text-cyber-500" /> Network Nodes
                   </h1>
                   <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">Manage Trusted Connections</p>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-8 flex gap-4">
                <div className="flex-1 relative">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search for agents by name..."
                        className="w-full bg-black border border-slate-700 p-4 pl-12 rounded-lg text-slate-200 focus:border-cyber-500 outline-none uppercase font-bold tracking-wider"
                    />
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                </div>
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="bg-cyber-500 hover:bg-cyber-400 text-black px-8 rounded-lg font-black uppercase text-sm tracking-widest disabled:opacity-50"
                >
                    {isSearching ? 'Scanning...' : 'Search'}
                </button>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="mb-12 space-y-4 animate-fade-in border-b border-slate-800 pb-8">
                     <h3 className="text-cyber-500 uppercase font-black text-sm tracking-widest mb-4">Search Results ({searchResults.length})</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {searchResults.map(user => (
                             <div key={user.uid} className="bg-cyber-900/80 border border-cyber-500/30 p-4 rounded-lg flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-black rounded-lg overflow-hidden">
                                         {user.dp ? <img src={user.dp} className="w-full h-full object-cover" /> : null}
                                     </div>
                                     <div>
                                         <h4 className="text-white font-bold text-sm uppercase">{user.name}</h4>
                                         <span className="text-[10px] text-slate-500">{user.agentId}</span>
                                     </div>
                                 </div>
                                 <button 
                                     onClick={() => onViewProfile?.(user.uid)}
                                     className="bg-cyber-500/20 text-cyber-500 hover:bg-cyber-500 hover:text-black px-3 py-1 rounded text-[10px] font-black uppercase transition-colors"
                                 >
                                     View Profile
                                 </button>
                             </div>
                         ))}
                     </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-800">
                <button 
                  onClick={() => setActiveTab('friends')}
                  className={`pb-4 px-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'friends' ? 'text-cyber-500 border-b-2 border-cyber-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    My Allies ({friends.length})
                </button>
                <button 
                  onClick={() => setActiveTab('requests')}
                  className={`pb-4 px-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'requests' ? 'text-cyber-500 border-b-2 border-cyber-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Signal Requests ({requests.length})
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main List Area */}
                <div className="md:col-span-2 space-y-4">
                    {activeTab === 'requests' && (
                        <div className="space-y-4">
                             {requests.length === 0 && (
                                 <div className="text-center py-20 text-slate-600 text-xs uppercase">No incoming signals.</div>
                             )}
                             {requests.map(req => (
                                 <div key={req.id} className="bg-cyber-900 border border-slate-700 p-4 rounded-lg flex items-center justify-between shadow-xl">
                                     <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 bg-black rounded-full overflow-hidden border border-slate-600">
                                             {req.fromDp ? <img src={req.fromDp} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800" />}
                                         </div>
                                         <div>
                                             <h4 className="text-white font-bold text-sm">{req.fromName}</h4>
                                             <p className="text-[10px] text-slate-500 uppercase">Incoming Encryption Key Request</p>
                                         </div>
                                     </div>
                                     <div className="flex gap-2">
                                         <button onClick={() => handleAccept(req)} className="p-2 bg-cyber-500/20 text-cyber-500 hover:bg-cyber-500 hover:text-black rounded transition-colors"><Check className="w-4 h-4" /></button>
                                         <button onClick={() => handleReject(req)} className="p-2 bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded transition-colors"><X className="w-4 h-4" /></button>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    )}

                    {activeTab === 'friends' && (
                        <div className="grid gap-4">
                            {friends.length === 0 && (
                                <div className="text-center py-20 text-slate-600 text-xs uppercase">Network Empty. Connect with other agents.</div>
                            )}
                            {friends.map(fid => {
                                const profile = friendProfiles[fid];
                                if (!profile) return null;
                                return (
                                    <div key={fid} className="bg-cyber-900/50 border border-slate-800 p-4 rounded-lg flex items-center justify-between hover:border-cyber-500/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-black rounded-lg overflow-hidden border border-slate-700 group-hover:border-cyber-500 transition-colors">
                                                {profile.dp ? <img src={profile.dp} className="w-full h-full object-cover" /> : null}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black text-sm uppercase">{profile.name}</h4>
                                                <p className="text-[9px] text-slate-500 uppercase tracking-widest">{profile.agentId}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button 
                                              onClick={() => setSelectedChatUser({id: fid, name: profile.name})}
                                              className="flex items-center gap-2 bg-slate-800 hover:bg-cyber-500 hover:text-black text-slate-300 px-4 py-2 rounded text-xs font-bold uppercase transition-all"
                                            >
                                                <MessageSquare className="w-3 h-3" /> Secure Chat
                                            </button>
                                            <button 
                                              onClick={() => onViewProfile?.(fid)}
                                              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded text-xs font-bold uppercase transition-all"
                                            >
                                                Profile
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Chat Overlay / Sticky Area */}
                <div className="md:col-span-1">
                   {selectedChatUser ? (
                       <div className="sticky top-8">
                           <div className="flex items-center justify-between mb-2">
                               <span className="text-xs text-cyber-500 font-bold uppercase">Active Channel</span>
                               <button onClick={() => setSelectedChatUser(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                           </div>
                           <ChatWindow targetUserId={selectedChatUser.id} targetUserName={selectedChatUser.name} />
                       </div>
                   ) : (
                       <div className="bg-slate-900/20 border border-slate-800 border-dashed rounded-lg h-64 flex items-center justify-center text-center p-8 sticky top-8">
                           <div className="space-y-2">
                               <MessageSquare className="w-8 h-8 text-slate-700 mx-auto" />
                               <p className="text-xs text-slate-600 uppercase font-bold">Select an ally to establish secure link</p>
                           </div>
                       </div>
                   )}
                </div>
            </div>
        </div>
    );
};
