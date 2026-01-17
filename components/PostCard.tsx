import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Unlock, Clock, Eye, ShieldCheck, Lock, User, Trash2, Repeat } from 'lucide-react';
import { StegoImage, UserProfile } from '../types';
import { deletePost, toggleLike, addComment, deleteComment } from '../services/posts';

interface PostCardProps {
    post: StegoImage;
    currentUser: any; // Using any for auth user context to match usage, ideally strict User type
    userProfile?: UserProfile;
    onDecodeClick: (src: string, postId: string) => void;
    onViewProfile?: (userId: string) => void;
    onRepost?: (post: StegoImage) => void;
    onDelete?: (id: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
    post,
    currentUser,
    userProfile,
    onDecodeClick,
    onViewProfile,
    onRepost,
    onDelete
}) => {
    const isOwner = currentUser && post.ownerId === currentUser.uid;
    const authorProfile = userProfile;
    const displayDp = authorProfile?.dp || post.userDp;
    const displayName = authorProfile?.name || post.user || 'Anonymous';

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Permanently purge this transmission from your local mesh?")) {
            try {
                await deletePost(post.id);
                if (onDelete) onDelete(post.id);
            } catch (e: any) {
                alert("Failed to delete: " + e.message);
            }
        }
    };

    const handleExternalShare = async () => {
        try {
            // Convert Base64 to Blob
            const response = await fetch(post.src);
            const blob = await response.blob();
            const file = new File([blob], "transmission.png", { type: "image/png" });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'ShadowNet Transmission',
                    text: post.caption || 'Incoming Secure Signal',
                    files: [file]
                });
            } else if (navigator.share) {
                await navigator.share({
                    title: 'ShadowNet Transmission',
                    text: post.caption || 'Incoming Secure Signal',
                    url: window.location.href
                });
            } else {
                alert("Native sharing not supported on this device.");
            }
        } catch (e) {
            console.error("Share failed", e);
        }
    };

    return (
        <div className="bg-cyber-900 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl transition-all hover:border-cyber-500/20 group animate-fade-in font-mono">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-black border border-cyber-500/20 flex items-center justify-center overflow-hidden">
                        {displayDp ? (
                            <img src={displayDp} className="w-full h-full object-cover" alt="User DP" />
                        ) : (
                            <User className="w-4 h-4 text-slate-800" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span
                            onClick={() => post.ownerId && onViewProfile?.(post.ownerId)}
                            className="font-bold text-xs text-slate-100 cursor-pointer hover:text-cyber-500 transition-colors"
                        >
                            {displayName}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] text-slate-500 uppercase tracking-tighter">Carrier_ID: {post.id.toUpperCase()}</span>
                            {post.hasHiddenMessage && <Lock className="w-2 h-2 text-cyber-500" />}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                    <button
                        onClick={() => post.ownerId && onViewProfile?.(post.ownerId)}
                        className="bg-slate-800 hover:bg-cyber-500 hover:text-black text-slate-400 p-1.5 rounded transition-all"
                        title="View Profile / Connect"
                    >
                        <User className="w-3 h-3" />
                    </button>
                    {post.maxViews && (
                        <div className="flex items-center gap-1 text-[9px] font-bold">
                            <Eye className="w-3 h-3" /> {post.currentViews}/{post.maxViews}
                        </div>
                    )}
                    {post.expiresAt && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-rose-500/70">
                            <Clock className="w-3 h-3" /> {Math.max(0, Math.ceil((post.expiresAt - Date.now()) / (1000 * 60)))}m
                        </div>
                    )}
                </div>
            </div>

            {/* Image Area */}
            <div className="w-full bg-black relative group/img overflow-hidden">
                <img
                    src={post.src}
                    alt={post.caption || "Social post"}
                    className="w-full h-auto object-cover transition-transform duration-1000 group-hover/img:scale-105"
                />

                {/* Visual Indicators */}
                <div className="absolute top-4 left-4 flex gap-2">
                    {post.hasHiddenMessage ? (
                        <div className="bg-cyber-500/90 text-black text-[8px] font-black px-2 py-0.5 rounded flex items-center gap-1 shadow-lg">
                            <Lock className="w-2 h-2" /> DATA_LOCKED
                        </div>
                    ) : (
                        <div className="bg-slate-900/90 text-slate-400 text-[8px] font-black px-2 py-0.5 rounded flex items-center gap-1 shadow-lg border border-slate-700">
                            <ShieldCheck className="w-2 h-2" /> CLEAN_CARRIER
                        </div>
                    )}
                </div>

                {/* Primary Delete Button directly on image for owners */}
                {isOwner && (
                    <button
                        onClick={handleDelete}
                        className="absolute top-4 right-4 bg-rose-600 hover:bg-rose-500 text-white p-2.5 rounded-lg z-30 shadow-2xl transition-all active:scale-95 border border-rose-400/30 flex items-center gap-2"
                        title="Purge from mesh"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-tighter pr-1">Purge</span>
                    </button>
                )}

                {/* Decode Shortcut Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDecodeClick(post.src, post.id);
                        }}
                        className="bg-cyber-500 hover:bg-cyber-400 text-black font-black text-[10px] px-8 py-3 rounded-md flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-cyber-500/20"
                    >
                        <Unlock className="w-3 h-3" />
                        INITIATE_DECODE
                    </button>
                    <p className="text-[8px] text-slate-400 mt-4 uppercase font-bold tracking-[0.2em]">Quantum Security Enabled</p>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 pt-3 space-y-3">
                <div className="flex gap-5">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!currentUser) return;
                            const isLiked = post.likes?.includes(currentUser.uid) || false;
                            toggleLike(post.id, currentUser.uid, isLiked);
                        }}
                        className="group/like flex items-center gap-1 focus:outline-none"
                    >
                        <Heart className={`w-5 h-5 transition-colors ${post.likes?.includes(currentUser?.uid || '') ? 'text-rose-500 fill-rose-500' : 'text-slate-500 group-hover/like:text-rose-500'}`} />
                        {post.likes && post.likes.length > 0 && <span className="text-[10px] font-bold text-slate-500">{post.likes.length}</span>}
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const text = prompt("Encrypt a comment:");
                            if (text && currentUser) {
                                const comment = {
                                    id: Math.random().toString(36).substr(2, 9),
                                    userId: currentUser.uid,
                                    userName: currentUser.displayName || 'Agent',
                                    text,
                                    timestamp: Date.now()
                                };
                                addComment(post.id, { ...comment, userName: 'Agent ' + currentUser.uid.substr(0, 4) });
                            }
                        }}
                        className="group/comment flex items-center gap-1 focus:outline-none"
                    >
                        <MessageCircle className="w-5 h-5 text-slate-500 group-hover/comment:text-cyber-500 transition-colors" />
                        {post.comments && post.comments.length > 0 && <span className="text-[10px] font-bold text-slate-500">{post.comments.length}</span>}
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); onRepost?.(post); }} title="Repost to Feed">
                        <Repeat className="w-5 h-5 text-slate-500 hover:text-white cursor-pointer transition-colors" />
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); handleExternalShare(); }} title="Share Externally">
                        <Share2 className="w-5 h-5 text-slate-500 hover:text-white cursor-pointer transition-colors" />
                    </button>
                </div>
                <div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        <span className="font-black mr-2 text-white">{displayName}</span>
                        {post.caption || "A peaceful transmission."}
                    </p>
                    <p className="text-[9px] text-slate-600 mt-3 uppercase tracking-widest font-bold">
                        {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • TRANSMISSION_SECURE
                    </p>
                </div>

                {/* Comments Section */}
                {post.comments && post.comments.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/50 space-y-2">
                        {post.comments.map(comment => (
                            <div key={comment.id} className="flex justify-between items-start group/c">
                                <p className="text-xs text-slate-400">
                                    <span className="font-bold text-slate-300 mr-2">{comment.userName}:</span>
                                    {comment.text}
                                </p>
                                {(currentUser?.uid === comment.userId || isOwner) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Delete this comment?")) {
                                                deleteComment(post.id, comment);
                                            }
                                        }}
                                        className="opacity-0 group-hover/c:opacity-100 text-rose-500"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
