# AlignUs 📅⚡

> A modern, high-performance, real-time group meeting scheduler built with React, Vite, Tailwind CSS, Drizzle ORM, and Neon PostgreSQL.

AlignUs allows teams and groups to effortlessly coordinate meeting times across dates and time slots with interactive availability heatmaps, automatic top-slot recommendations, and 1-click calendar exports.

---

## ✨ Features

- 📅 **Interactive Availability Grid:** Drag-and-drop or tap to mark available and preferred time slots.
- ⚡ **Optimistic UI & Real-Time Sync:** Instant client-side visual feedback with background server sync and automatic retry on network errors.
- 🔥 **Heatmap & Smart Slot Matching:** Real-time visual overlap density heatmap and intelligent best-time recommendations based on participant attendance.
- 🔐 **Browser-Bound Identity Protection:** Each browser is assigned a persistent unique User ID in `localStorage`, preventing participants in different browsers from overwriting or hijacking each other's selections.
- 🚫 **Unique Name Enforcement:** Prevents duplicate display names within the same session.
- 📅 **1-Click Calendar Export:** Export finalized or recommended meeting slots directly to Google Calendar or download `.ics` calendar files.
- 🐘 **Neon Postgres + Drizzle ORM:** Serverless PostgreSQL backend integration with automatic fallback to local storage if unconfigured.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm` or `yarn`
- A [Neon Database](https://neon.tech/) account (for serverless PostgreSQL storage)

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/viktorShandrov/AlignUs.git
   cd AlignUs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Add your Neon Database connection string in `.env`:
   ```env
   VITE_NEON_DATABASE_URL=postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
   ```

4. **Push Database Schema:**
   Push the database tables (`sessions`, `participants`, `availabilities`) to your Neon database using Drizzle Kit:
   ```bash
   npx drizzle-kit push
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 📖 How to Use AlignUs

1. **Create a Session:**
   - Enter a session title (e.g., *"Team Weekly Sync"*).
   - Select the date range and daily time boundaries (e.g., 8:00 AM – 8:00 PM).
   - Click **Create Session**.

2. **Share the Session Link:**
   - Click the **Share** button in the navigation bar to copy the unique session link.
   - Send the link to your participants.

3. **Enter Your Availability:**
   - Type your name in the **Your Name** field.
   - Click or drag on the calendar grid to mark your available time slots.
   - Toggle **Preferred ⭐** mode to mark high-priority slots.
   - Your selections are auto-saved in real-time.

4. **Find the Best Meeting Time:**
   - Switch to **Heatmap View** or view the **Top Pick** card to instantly see where attendance is highest.
   - Select a meeting duration (30 min, 60 min, etc.) to filter optimal time windows.
   - Click **Finalize & Share** to lock in the meeting time and export to Google Calendar or iCal.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Database & ORM:** Neon PostgreSQL (`@neondatabase/serverless`), Drizzle ORM
- **Migrations & Tools:** Drizzle Kit
- **Hosting / Deployment:** Compatible with Vercel, Netlify, or static hosts

---

## 📜 Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite local development server |
| `npm run build` | Compiles TypeScript and builds production bundle |
| `npm run preview` | Previews production build locally |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run db:push` | Pushes Drizzle schema directly to Neon DB |
| `npm run db:generate` | Generates SQL migration files |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
