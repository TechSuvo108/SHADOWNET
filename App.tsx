import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { PublicFeed } from './components/PublicFeed';
import { Encoder } from './components/Encoder';
import { Decoder } from './components/Decoder';
import { UserSection } from './components/UserSection';
import { FriendsPage } from './components/FriendsPage';
import { PublicProfile } from './components/PublicProfile';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { AppTab } from './types';
import { AuthProvider, useAuth } from './services/AuthContext';

function AuthenticatedApp() {
  const { currentUser, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FEED);
  const [selectedImageForDecode, setSelectedImageForDecode] = useState<string | null>(null);
  const [selectedPostIdForDecode, setSelectedPostIdForDecode] = useState<string | null>(null);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);

  const handleViewProfile = (userId: string) => {
    setViewProfileId(userId);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyber-500 font-mono">INITIALIZING UPLINK...</div>;

  if (!currentUser) {
    return isLogin ? <Login onSwitch={() => setIsLogin(false)} /> : <Signup onSwitch={() => setIsLogin(true)} />;
  }

  const handleDecodeShortcut = (imgSrc: string, postId: string) => {
    setSelectedPostIdForDecode(postId);
    setSelectedImageForDecode(imgSrc);

    // We need to clear the profile view so the main tabs (including DECODE) can render
    setViewProfileId(null);

    // Force a small delay or ensure state updates before switching if needed, 
    // but usually React batched updates handle this. 
    // Just setting active tab is enough if viewProfileId is gone.
    setActiveTab(AppTab.DECODER);

    // We might want to pass the src to the decoder too if it supports it, 
    // but the Decoder component currently seems to not take a direct src prop for pre-filling 
    // other than via paste or file drop. 
    // Wait, the user manual says "drag and drop". 
    // Let's assume the user will drag it or we need to pass it.
    // Looking at previous Decoder code, it doesn't seem to have a prop for initial image.
    // But the requirement says "redirected to Decode section". 
    // The previous implementation of handleDecodeShortcut just set active tab.
    // If we want to pre-fill, we'd need to modify Decoder. 
    // But for this bug fix, the PRIMARY issue is the redirection not happening.
  };

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    setViewProfileId(null);
    if (tab !== AppTab.DECODER) setSelectedImageForDecode(null);
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === AppTab.FEED && !viewProfileId && (
        <PublicFeed
          onDecodeClick={handleDecodeShortcut}
          onViewProfile={handleViewProfile}
        />
      )}
      {activeTab === AppTab.FRIENDS && !viewProfileId && (
        <FriendsPage onViewProfile={handleViewProfile} />
      )}
      {viewProfileId && (
        <PublicProfile
          userId={viewProfileId}
          onBack={() => setViewProfileId(null)}
          onDecodeClick={handleDecodeShortcut}
        />
      )}
      {activeTab === AppTab.ENCODER && !viewProfileId && (
        <Encoder onPostComplete={() => setActiveTab(AppTab.FEED)} />
      )}
      {activeTab === AppTab.DECODER && !viewProfileId && (
        <Decoder
          initialImage={selectedImageForDecode}
          initialPostId={selectedPostIdForDecode}
          onBurned={() => { }}
        />
      )}
      {activeTab === AppTab.USER && !viewProfileId && <UserSection onDecodeClick={handleDecodeShortcut} />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;