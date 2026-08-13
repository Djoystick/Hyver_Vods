# Roadmap: Hyver Stream Archive

## 🎯 Goal
Build a modern, premium Twitch VOD archive for Hyver, inspired by the visual design of Streamhound and the functional mechanics of BlackUFA archive.

## 🛠 Tech Stack
- Frontend: Next.js (React), Tailwind CSS, Framer Motion
- Player: Video.js or Plyr-React + hls.js
- Backend/Storage: Node.js (FFmpeg processing) + Telegram Bot API (MTProto/Bot API) for HLS chunk storage.

## 🚀 Milestones
1. **Research & UI Prototyping (Done):** Setup IDE, research github solutions for TG streaming and UI.
2. **Architecture Setup (Done):** Init Next.js, configure Tailwind, setup design system.
3. **Backend/Storage System (Done):** Build the HLS chunker and Telegram uploader/downloader API.
4. **Player Integration (Done):** Implement the video player with HLS streaming and quality switching.
5. **Legacy Importer (Current):** Import past videos from YouTube and VK, grouping them into Playlists.
6. **Unified Auto-Uploader Pipeline (Planned):** Upgrade update.sh to handle new Twitch streams perfectly:
   - 2-stage git push (Processing -> Ready).
   - Auto-upload to YouTube and VK (once credentials are provided), parallel to HLS chunking.
   - Attach all 3 sources (TG HLS, YT, VK), correct stream date, and assign to proper Playlist.
7. **Final Polish & Animations (Planned):** Add Framer Motion effects to match Streamhound's premium feel.
