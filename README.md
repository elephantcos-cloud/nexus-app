# Nexus - Social Chat App

A full-featured social media + chat app built with React Native (Expo) and Firebase.

## Features
- Email & Google Authentication
- News Feed with Like, Comment, Share
- Private Messaging (Real-time)
- Group Chats
- Nexus AI Chatbot (Groq)
- Push Notifications
- Dark/Light Mode
- User Profiles

## Setup

### 1. GitHub Secrets
Add these secrets in your GitHub repository settings:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `GROQ_API_KEY`

### 2. Build APK
Push to main branch → GitHub Actions will automatically build the APK.
Download from Actions → Artifacts → nexus-app-debug

## Tech Stack
- React Native + Expo
- Firebase (Auth + Firestore)
- Groq AI (Llama 3.3 70B)
- TypeScript
