# AlignUs 📅⚡

> **High-Performance, Real-Time Group Meeting Scheduler & Availability Coordinator**

**AlignUs** is a modern, high-performance web application designed to eliminate the hassle of back-and-forth messaging, timezone confusion, and calendar friction when scheduling group meetings. Built with React 18, TypeScript, Vite, Tailwind CSS, Drizzle ORM, and Neon Serverless PostgreSQL, AlignUs offers real-time availability heatmaps, automated top-slot recommendations, browser-bound identity protection, live analytics tracking, and 1-click calendar exports.

---

## 🌟 Key Functionalities & Features

### 📅 1. Interactive Availability Grid & Multi-Slot Drag Selection
- **Intuitive Selection Controls:** Click individual slots or click-and-drag across multiple hours and days to quickly select available time blocks.
- **Mobile & Touch Friendly:** Optimized gesture support for smartphone and tablet browsers.
- **30-Minute Granularity:** Displays fine-grained half-hour time slots tailored to custom session daily boundaries (e.g., 8:00 AM to 10:00 PM).
- **Preferred Slot Marker:** Toggle priority preferences on high-convenience slots.

### 🔥 2. Real-Time Heatmap & Visual Density Mapping
- **Dynamic Color Gradients:** Calculates real-time participant availability density and renders dynamic CSS heatmaps across the entire calendar grid.
- **Participant Hover Inspection:** Hover over any participant's name in the active roster to isolate and highlight their exact availability on the grid.
- **Instant Visual Overlap:** Colors range from light background tones (low overlap) to deep indigo/emerald highlights (maximum group availability).

### 🤖 3. Smart Match Recommendation Engine & Duration Filtering
- **Automated Window Matching (`findBestSlotWindows`):** Continuously evaluates all available time slots against participant count to identify peak meeting windows.
- **Flexible Meeting Durations:** Filter recommendations dynamically for **30 min**, **60 min**, **90 min**, or custom meeting lengths.
- **Embedded Top Pick Card:** Displays the #1 recommended meeting window at a glance, complete with total participant count, percentage match, and attending member names.
- **Summary Copying:** One-click copy formatted text summary of meeting recommendations directly to clipboard for instant sharing in Slack, Teams, or WhatsApp.

### 🔐 4. Browser-Bound Identity Protection & Host Controls
- **Persistent Device UUID (`getOrCreateUserId`):** Each browser automatically generates and maintains a unique persistent User ID in `localStorage`, preventing participants on different devices from overwriting or hijacking each other's selections.
- **Unique Display Name Enforcement:** The session modal verifies participant names in real-time, blocking duplicate names within the same session.
- **Host-Restricted Slot Finalization:** Identifies session creators via browser identity. Only the session host/creator has permission to lock in and finalize the official meeting time slot.
- **Host Notice Banner:** Informs participants when slot finalization is restricted to the session host.

### ⚡ 5. Optimistic UI & Real-Time Synchronisation
- **Zero-Latency Visual Feedback:** Local state updates instantly when dragging or clicking slots, eliminating UI lag.
- **Background Server Sync & Retry:** Automatically syncs changes with the backend database in the background. Includes exponential backoff and connection error handling.
- **2-Second Polling Sync:** Keeps all open browser windows synchronized in real-time without requiring manual page refreshes.
- **5-Second Timeout Protection:** Graceful fallback notice if network connectivity experiences delays.

### 📊 6. Built-In Real-Time Engagement Analytics & Live Dashboard
- **Private Engagement Tracker (`/dashboard` or `/stats`):** Built-in event logging system that tracks application usage without relying on heavy third-party trackers.
- **15-Minute Sliding Window Deduplication:** Deduplicates raw page view events per user ID within a 15-minute timeframe for precise unique visit calculations.
- **Key Performance Metrics (KPIs):** Displays live counters for:
  - Total Deduplicated Page Views
  - Sessions Created
  - Availabilities Saved
  - Slots Finalized
  - Unique Active Users
- **Live Event Activity Feed:** Real-time stream updating every 2 seconds to show user actions (e.g., session creation, slot saves, finalizations).
- **Demo Data Seeding & One-Click Data Reset:** Option to populate simulated demo activity for evaluation or perform a complete data reset/purge of analytics logs.

### 📅 7. 1-Click Multi-Format Calendar Export
- **Google Calendar Direct Export:** 1-click link generator pre-populates event title, description, start/end timestamps, and participant notes directly into Google Calendar.
- **Universal iCalendar (`.ics`) File Download:** Generates standard `.ics` files compatible with Apple Calendar, Microsoft Outlook, Thunderbird, and mobile calendar apps.
- **Floating Finalized Dock:** When a meeting is finalized, a sticky floating banner provides direct 1-click export options across all devices.

### 📜 8. Recent Sessions & Local History Management
- **Dashboard Quick-Reentry:** Automatically remembers sessions created or visited on the device for fast access from the home page.
- **Clean Session Cards:** Shows session titles, date ranges, and creation timestamps.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 & TypeScript | Modern component architecture with type-safe state management |
| **Build Tooling** | Vite | Lightning-fast development server and optimized production bundler |
| **Styling & Icons** | Tailwind CSS & Lucide Icons | Utility-first responsive design system with sleek modern iconography |
| **Database** | Neon Serverless PostgreSQL | Scalable serverless Postgres cloud database (`@neondatabase/serverless`) |
| **ORM & Migrations** | Drizzle ORM & Drizzle Kit | Lightweight, type-safe SQL schema builder and migration toolkit |
| **Date & Time** | `date-fns` | Comprehensive date manipulation and formatting library |
| **Storage Architecture** | Dual-Layer Hybrid | Neon PostgreSQL primary cloud storage with automatic local fallback |

---

## 🗄️ Database Schema

The database architecture consists of 4 main tables configured with Drizzle ORM:

```
┌─────────────────┐       ┌─────────────────┐       ┌───────────────────┐
│    sessions     │ 1───* │  participants   │ 1───* │   availabilities  │
├─────────────────┤       ├─────────────────┤       ├───────────────────┤
│ id (UUID PK)    │       │ id (UUID PK)    │       │ id (UUID PK)      │
│ title           │       │ session_id (FK) │       │ participant_id(FK)│
│ creator_user_id │       │ user_id         │       │ start_slot        │
│ date_range      │       │ name            │       │ end_slot          │
│ finalized_slot  │       │ note            │       │ is_preferred      │
│ created_at      │       │ created_at      │       └───────────────────┘
└─────────────────┘       └─────────────────┘
                                                      ┌───────────────────┐
                                                      │  analytics_events │
                                                      ├───────────────────┤
                                                      │ id (UUID PK)      │
                                                      │ event_type        │
                                                      │ path              │
                                                      │ metadata          │
                                                      │ timestamp         │
                                                      └───────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- **Neon Database Account**: Optional for PostgreSQL persistence (falls back to local storage if unconfigured)

---

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/viktorShandrov/AlignUs.git
   cd AlignUs
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` file:
   ```bash
   cp .env.example .env
   ```
   Add your Neon PostgreSQL connection string in `.env`:
   ```env
   VITE_NEON_DATABASE_URL=postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
   ```

4. **Push Database Schema (Drizzle Kit):**
   ```bash
   npm run db:push
   ```

5. **Start the Vite Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 📖 Step-by-Step User Workflow

1. **Create a Meeting Session:**
   - Enter a session title (e.g., *"Sprint Planning & Sync"*).
   - Select start and end dates along with daily time windows (e.g., 9:00 AM - 5:00 PM).
   - Click **Create Session**.

2. **Share the Unique URL:**
   - Click the **Share** button in the header bar to copy the unique session link (`/session/<id>`).
   - Send the link to team members or participants (no login or account setup required).

3. **Mark Availability:**
   - Enter your display name when prompted.
   - Click or drag on the calendar grid to mark your available time slots.
   - Your choices are saved in real-time.

4. **Review Heatmap & Smart Recommendations:**
   - Switch between individual participant views and the combined group heatmap.
   - Adjust the meeting duration selector to find optimal 30m, 60m, or 90m slots.
   - View the **Top Pick** card for the highest group overlap.

5. **Finalize & Export:**
   - As the session host, click **Finalize & Share** on the preferred slot to lock the meeting time.
   - Export directly to **Google Calendar** or download a universal **`.ics`** calendar file.

---

## 💻 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local Vite development server with hot module replacement (HMR) |
| `npm run build` | `tsc && vite build` | Runs TypeScript compiler checks and builds production bundle in `/dist` |
| `npm run preview` | `vite preview` | Previews production build locally |
| `npm run lint` | `tsc --noEmit` | Executes static type-checking across TypeScript files |
| `npm run db:push` | `drizzle-kit push` | Applies Drizzle database schema migrations directly to Neon database |
| `npm run db:generate` | `drizzle-kit generate` | Generates SQL migration files from Drizzle schema definitions |

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
