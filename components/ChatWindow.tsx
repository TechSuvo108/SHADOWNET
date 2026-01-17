import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Trash2 } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { subscribeToChat, sendMessage, unsendMessage, deleteMessageForUser } from '../services/chat';
import { ChatMessage, UserProfile } from '../types';

interface ChatWindowProps {
  targetUserId: string;
  targetUserName: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ targetUserId, targetUserName }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<ChatMessage | null>(null);


  useEffect(() => {
    if (!currentUser || !targetUserId) return;
    const unsubscribe = subscribeToChat(currentUser.uid, targetUserId, (msgs) => {
      // Filter out messages deleted for this user
      const visibleMsgs = msgs.filter(msg => !msg.deletedFor?.includes(currentUser.uid));
      setMessages(visibleMsgs);
    });
    return () => unsubscribe();
  }, [currentUser, targetUserId]);



  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;
    try {
      await sendMessage(currentUser.uid, targetUserId, inputText);
      setInputText('');
    } catch (err) {
      console.error("Failed to send", err);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-cyber-900 border border-slate-700/50 rounded-lg overflow-hidden font-mono relative">
      {/* Header */}
      <div className="bg-slate-900/50 p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyber-500 animate-pulse" />
          <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
            SECURE_LINK :: {targetUserName}
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40 flex flex-col-reverse">
        {messages.length === 0 && (
          <div className="text-center text-[10px] text-slate-600 italic py-10 opacity-50">
                // START OF TRANSMISSION //
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-center gap-2 group/msg mb-1`}>
              {/* Delete Button (Left side for Sender) */}
              {isMe && (
                <button
                  onClick={() => setDeleteCandidate(msg)}
                  className="opacity-40 hover:opacity-100 transition-opacity p-2 text-rose-500 hover:bg-rose-500/10 rounded-full"
                  title="Unsend"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}

              <div className={`max-w-[80%] rounded p-2 text-xs border ${isMe
                ? 'bg-cyber-500/10 border-cyber-500/30 text-cyber-400'
                : 'bg-slate-800/50 border-slate-700 text-slate-300'
                }`}>
                <p>{msg.text}</p>
                <p className={`text-[8px] mt-1 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Delete Button (Right side for Receiver) */}
              {!isMe && (
                <button
                  onClick={() => setDeleteCandidate(msg)}
                  className="opacity-40 hover:opacity-100 transition-opacity p-2 text-rose-500 hover:bg-rose-500/10 rounded-full"
                  title="Delete for me"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}



      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900/50 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          className="flex-1 bg-black border border-slate-700 rounded p-2 text-xs text-slate-200 outline-none focus:border-cyber-500 transition-colors"
          placeholder="Encrypt message..."
        />
        <button
          type="submit"
          className="bg-cyber-500 hover:bg-cyber-400 text-black p-2 rounded transition-colors"
          disabled={!inputText.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Custom Delete Confirmation Modal */}
      {
        deleteCandidate && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10 p-6 animate-fade-in">
            <div className="bg-cyber-900 border border-slate-700 rounded-lg p-6 max-w-sm w-full space-y-4 shadow-2xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {deleteCandidate.senderId === currentUser?.uid ? 'Confirm Protocol' : 'Local Deletion'}
              </h3>
              <p className="text-xs text-slate-400">
                {deleteCandidate.senderId === currentUser?.uid
                  ? 'Retract this transmission from all nodes? This cannot be undone.'
                  : 'Remove this message from your local view? It will remain for the sender.'}
              </p>

              <div className="flex flex-col gap-2 pt-2">
                {deleteCandidate.senderId === currentUser?.uid ? (
                  <button
                    onClick={() => {
                      unsendMessage(currentUser!.uid, targetUserId, deleteCandidate.id);
                      setDeleteCandidate(null);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white py-3 rounded text-xs font-black uppercase tracking-widest transition-colors"
                  >
                    Unsend
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      deleteMessageForUser(currentUser!.uid, targetUserId, deleteCandidate.id, currentUser!.uid);
                      setDeleteCandidate(null);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white py-3 rounded text-xs font-black uppercase tracking-widest transition-colors"
                  >
                    Delete for Me
                  </button>
                )}

                <button
                  onClick={() => setDeleteCandidate(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded text-xs font-bold uppercase transition-colors border border-slate-700"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};
