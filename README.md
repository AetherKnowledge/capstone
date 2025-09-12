# 🎓 SafeHub

A capstone project built for **La Consolacion University Philippines (LCUP)** that streamlines the **student counseling and development process**.  
The system allows students to **book appointments, attend video counseling sessions, view announcements, and chat with an AI chatbot when no human counselor is available.**  

---

## 🚀 Features

- **📅 Appointment Booking**  
  Powered by **Supabase** for real-time database management and scheduling.  

- **🎥 Video Call Integration**  
  Uses **WebRTC** for secure peer-to-peer video counseling sessions.  

- **📰 Posts & Announcements**  
  Admins and counselors can publish important updates for students.  

- **🤖 AI Chatbot Support**  
  Integrated with **n8n workflows** and **Ollama models** to provide instant, automated support when no counselor is online.  

- **🔒 Authentication & User Roles**  
  Handled via **NextAuth + Supabase Auth**:  
  - **Students** → Book sessions, join calls, chat with the AI, view posts  
  - **Counselors** → Manage availability, accept/reject bookings, host video calls  
  - **Admins** → Manage users, monitor bookings, publish announcements  

---

## 🏗️ Tech Stack

- **Frontend:** Next.js (React, TypeScript) + Tailwind CSS / DaisyUI  
- **Backend:** Supabase (Postgres + Auth + Realtime)  
- **Authentication:** NextAuth.js + Supabase Auth  
- **Video Calls:** WebRTC  
- **Chatbot & Automation:** n8n + Ollama  
- **Deployment:** Vercel (frontend), Supabase Cloud (backend), Docker (for n8n & Ollama)  

---
