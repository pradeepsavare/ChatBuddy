# ChatBuddy

ChatBuddy is a frontend-only chatbot application built with React, Vite, Tailwind CSS, and Ant Design. It delivers a professional chat workspace without any backend dependency.

## What is included

- Professional multi-panel interface with a hero section, chat workspace, prompt shortcuts, and insight cards
- Frontend-only response generation with no backend or API requirement
- Local conversation persistence through browser storage
- Tailwind-powered layout and styling combined with Ant Design components
- Responsive experience for desktop and mobile screens

## Scripts

- `npm run dev` starts the Vite development server
- `npm run build` creates a production build
- `npm run preview` previews the production build locally
- `npm run lint` runs ESLint

## Notes

- The assistant responses are generated on the client using local rules and templates.
- No server, database, or authentication flow is included.

## Description

ChatBuddy is a frontend-only chatbot app that runs in the browser without a backend.  
It is built with React, Vite, Tailwind CSS, and Ant Design, and saves chats locally in browser storage.

Features:
- Clean chat interface with user and assistant messages
- Multiple provider options: Ollama (local), OpenAI, Gemini, and custom OpenAI-compatible API
- Light and dark theme toggle
- Auto-saved chat history
- Settings panel for model/API configuration
- Responsive on desktop and mobile

How users can use it:
1. Open the app.
2. Go to Settings and choose a provider (for example, Ollama or OpenAI).
3. Enter the required details (URL/model/API key) and save/test connection.
4. Type a message in the chat box and send.
5. Continue chatting; conversation history is saved automatically and can be viewed later.

## Live

https://chat-buddy-ui.vercel.app/
