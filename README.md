<div id="top"></div>

## 👇🏻 Click the below image to watch the SHADOWNET Demo video 

[![Watch the SHADOWNET Demo video](ImgSHADOWNET.jpeg)](https://youtu.be/XQZ24-VpUTs)

<div align="center">

# 🕵️‍♂️ SHADOWNET

<p>
  <em>
    A <b>steganography-based social network</b> that hides secret communication 
    within innocent images, turning social media into a <b>covert privacy tool</b>.
  </em>
</p>

<p>
  <em>
  🚀 Built as a <b>team project</b> for <b>Devfest 5.0 Goa</b>
  </em>
</p>

</div>

---

## 🌐 Live Demo

<p>
  <em>
    Experience the hidden world:<br>
    🔗 <a href="https://shadownet-1eace.web.app/"><b>Visit SHADOWNET</b></a>
  </em>
</p>

---

## 📖 Overview

<p> 
    <em> 
        <b>SHADOWNET</b> is a <b>privacy-first social media platform</b> that enables <b>hidden communication</b> using <b>steganography</b>, where messages are invisibly embedded inside images instead of being stored as text. 
    </em> 
</p>

<p> 
    <em>
         To the public, the platform appears as a normal social feed of photos, memes, and videos. Behind the scenes, encrypted messages are concealed within pixel data and can only be revealed by users who possess the correct <b>secret key</b>. 
    </em> 
</p>

<p> 
    <em> 
        SHADOWNET eliminates traditional chat databases entirely — <b>images themselves act as the data layer</b>. This design supports secure, censorship-resistant, and deniable communication for journalists, activists, privacy-conscious users, and creative communities. 
    </em>
</p>

<p> 
    <em> 
        Built during <b>DevFest 5.0, Goa</b>, SHADOWNET challenges conventional ideas of social networking by combining <b>security, creativity, and usability</b> into a single stealth-based communication system. 
    </em>
</p>

---

## ✨ Core Features

<p><em>🔐 <b>Authentication</b> — Secure user sign-in and logout using Firebase Authentication.</em></p> 
<p><em>📰 <b>Public Feed</b> — A normal-looking social feed of images, memes, and videos with likes, comments, and sharing.</em></p> 
<p><em>👥 <b>Friends & Connections</b> — Search users, send connection requests, manage friends, and chat privately.</em></p>
<p><em>🧪 <b>Encode Media</b> — Hide encrypted messages inside images or videos using steganography with secret-key protection.</em></p> 
<p><em>🎭 <b>Decoy Content</b> — Optional fake messages to mislead unauthorized viewers and enhance plausible deniability.</em></p> 
<p><em>⏳ <b>Self-Destruct Posts</b> — Automatically delete posts after a specified number of views or time duration.</em></p> 
<p><em>🔍 <b>Decode Messages</b> — Extract hidden messages by uploading media and providing the correct secret key.</em></p> 
<p><em>🖼️ <b>Media-as-Database</b> — No text chat storage; images themselves act as the message carrier and data layer.</em></p> 
<p><em>👤 <b>User Profile Management</b> — Edit profile details, display picture, bio, and manage personal posts.</em></p> 
<p><em>🔐 <b>Privacy-First Design</b> — Server never reads hidden content; all encoding and decoding happens client-side.</em></p> 
<p><em>⚡ <b>Real-Time Interactions</b> — Live updates for posts, likes, comments, and chats using Firebase services.</em></p>

---

## 🧠 System Architecture

<p> <em> <b>SHADOWNET</b> follows a <b>client-heavy, privacy-first architecture</b> where sensitive operations like encryption and decryption happen on the <b>user’s device</b>, and the backend acts only as a secure data carrier. </em> </p>

- **Frontend** → React + TypeScript (UI, state management, social interactions)

- **Steganography Engine** → Client-side image encoding & decoding using JavaScript utilities

- **Backend Services** → Firebase Firestore & Firebase Storage (posts, metadata, media)
 
- **Authentication** → Firebase Authentication (secure sign-in / sign-out)

- **Real-Time Features** → Firestore listeners for feed, likes, comments, and chat

- **Privacy Layer** → No text-message database; images act as the data layer

- **Hosting** → Firebase Hosting (production deployment)

<p> <em> In SHADOWNET, the <b>server never knows the hidden message</b>. Images appear normal in public feeds, while only users with the correct <b>secret key</b> can extract encrypted data — making communication <b>deniable, censorship-resistant, and stealth-based</b>. </em> </p>

---

## 🧰 Tech Stack

<p align="center"> 
    <img src="https://img.icons8.com/color/70/react-native.png" alt="React" /> 
    <img src="https://img.icons8.com/color/70/typescript.png" alt="TypeScript" /> 
    <img src="https://img.icons8.com/color/70/firebase.png" alt="Firebase" /> 
    <img src="https://img.icons8.com/color/70/javascript.png" alt="JavaScript" /> 
</p>

**Frontend**

- React + TypeScript
- Vite
- Client-side steganography (image & video encoding / decoding)

**Backend / Services**
- Firebase Authentication
- Firebase Firestore (real-time feed, likes, comments, chat)
- Firebase Storage (media hosting)
- Firebase Hosting

**Security / Processing**
- JavaScript-based steganography utilities
- Client-side encryption & decryption
- Optional auto-expiry logic (time / view based)

---

## ✅ Real-World Use Cases 

### 🥇 Journalists & Whistleblowers
- No visible conversation trail
- Messages hidden in plain sight
- Encrypted chats without raising suspicion  
📌 *Freedom of press & secure sourcing*

---

### 🥇 Anti-Censorship Communication
- Works in regions where messaging apps are blocked
- Avoids keyword-based surveillance  
📌 *Images and memes bypass intent detection*

---

### 🥇 Privacy-First Personal Messaging
- No chat logs stored forever
- Server never knows message content  
📌 *Privacy by design, not policy*

---

### 🥇 Secure One-Time Information Sharing
- Wi-Fi passwords
- Exam room info
- Temporary internal notes  
📌 *Message disappears with the image*

---

### 🥇 Creative & Artistic Communication
- Poems hidden in artwork
- Easter eggs in posts
- Secret communities  
📌 *Art + cryptography crossover*

---

## 🧭 Application Features

### 🔐 Authentication
- Sign up / Login
- Secure session handling
- Logout support

---

### 📰 Public Feed
- Two filters:
  - **Connected Users**
  - **All Posts**
- Like, comment, and share posts
- Looks like a normal social feed

---

### 👥 Friends
- Search users
- Send / accept connections
- One-to-one chat system

---

### 🧪 Encode (Core Feature)

**Step-by-step flow:**
1. Select image or video
2. Add caption & public content
3. Optional hidden message (key-protected)
4. Optional fake message (decoy)
5. Auto-delete after:
   - X views **or**
   - X minutes

---

### 🔍 Decode
- Upload image
- Enter secret key
- Extract and view hidden message

---

### 👤 User Section
- Edit profile (DP, bio, etc.)
- View own posts
- Manage active content

---
## 🔐 Security Philosophy
- No plaintext messages stored
- Encrypted data hidden inside media
- Key-based decoding
- Optional self-destruct logic
- Minimal server knowledge
- Images are treated as data vaults.
---

## 🧠 What We Learned
- Steganography in real-world applications
- Client-side encryption principles
- Designing privacy-first systems
- Secure social feed architecture
- Firebase service layering
- Hackathon-scale product thinking
- Balancing UX with security
---

## 👥 Team – Devfest 5.0 Goa Submission

<p>
  <em>
    This project was built as a <b>group submission</b> for <b>Devfest 5.0</b> by:
  </em>
</p>

<p>
  <em>
    <b>Subham Kolay</b><br>
    <b>Asmita Chakraborty</b><br>
    <b>Soumyadeep Saha</b><br>
    <b>Trishit Majumdar</b>
  </em>
</p>

<p>
  <em>
    Hooghly Engineering And Technology College<br/>
    BTech <b>Computer Science</b>.
  </em>
</p>

---

## 🚀 Future Scope
- End-to-end encrypted group drops
- Watermark-resistant encoding
- Mobile app version
- Anonymous publishing mode
- Decentralized storage integration
---

## ⭐ Support

<p>
  <em>
    If you find <b>SHADOWNET</b> interesting or impactful,  
    consider giving this repository a ⭐ — it motivates our team to keep building!
  </em>
</p>

---

<div align="center">
  <a href="#top">
    <img src="https://img.shields.io/badge/Back%20to%20Top-000000?style=for-the-badge&logo=github&logoColor=white" />
  </a>
</div>
