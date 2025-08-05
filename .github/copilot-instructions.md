# .github/copilot-instructions.md

## AI Coding Agent Instructions for BeautyPoints

Welcome! This document provides conventions and best practices for AI coding agents (e.g., GitHub Copilot, ChatGPT) contributing to the BeautyPoints codebase.

### 1. Project Overview
- **Stack:** Next.js 15 (App Router, TypeScript strict), NextAuth.js, Firebase Firestore, Tailwind CSS
- **Purpose:** Loyalty system for beauty centers using unique QR codes per client
- **Key Features:**
  - Unique QR codes for each client
  - Client dashboard with sticker progress
  - Automatic registration on first scan
  - Persistent client session (localStorage)

### 2. Coding Conventions
- **TypeScript:** Use strict typing. Prefer interfaces from `src/types`.
- **Components:** Use functional React components. Place shared UI in `src/components/ui`.
- **API Routes:** Use Next.js App Router conventions. Await `params` in route handlers.
- **State:** Use React hooks for state/UI logic. Use localStorage for client session persistence.
- **Firestore:** Use helper functions from `src/lib/firestore.ts` for all DB access.
- **Styling:** Use Tailwind CSS utility classes.

### 3. UX Guidelines
- After a successful QR scan, show the actual sticker card/progress, not just a generic message.
- Always persist client session after registration/scan.
- Use clear, friendly Spanish for all user-facing text.

### 4. File/Folder Structure
- `src/app/scan/[code]/page.tsx`: QR scan, registration, and sticker assignment UI
- `src/app/api/scan/[code]/route.ts`: QR validation and sticker assignment API
- `src/app/client/page.tsx`: Client dashboard (sticker cards)
- `src/components/ui/`: Shared UI components (Card, Progress, Badge, etc.)
- `src/lib/`: Firestore and utility functions
- `src/types/`: TypeScript interfaces

### 5. AI Agent Best Practices
- **Gather context before making changes.**
- **Do not repeat code unnecessarily.**
- **Validate TypeScript and ESLint compliance.**
- **Document new features or changes in English and Spanish if possible.**
- **If unsure, prefer reading more context before editing.**

### 6. Example Flows
- **Scan QR:**
  1. Validate QR (GET `/api/scan/[code]`)
  2. If client session exists, POST to assign sticker
  3. Show sticker card/progress UI
- **Client Dashboard:**
  1. Read session from localStorage
  2. Fetch and display all sticker cards

---
For questions, review the README or ask a project maintainer.
