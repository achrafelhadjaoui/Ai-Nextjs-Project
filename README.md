# Farisly AI Platform

A modern dashboard platform for managing Farisly AI app settings and saved replies.

## Features

- 🌑 Dark mode only design
- 📱 Responsive layout
- 🎨 Clean, minimalist UI using Inter font
- 🔐 Secure login system
- 📊 Dashboard with extension installation
- 💬 Saved replies management
- 🛠️ Settings panel
- 👤 User profile management
- 🔄 Collapsible sidebar

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Icons:** Lucide React
- **Font:** Inter

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── dashboard/          # Dashboard page
│   ├── saved-replies/      # Saved replies management
│   ├── support/            # Support page
│   ├── panel/              # Settings panel
│   ├── profile/            # User profile
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Login page
│   └── globals.css         # Global styles
├── components/
│   ├── Sidebar.tsx         # Collapsible sidebar
│   └── DashboardLayout.tsx # Dashboard layout wrapper
└── public/                 # Static assets
```

## Deployment

### Production URLs

- **App Dashboard:** app.farisly.com
- **Landing Page:** farisly.com

## License

All rights reserved © 2024 Farisly AI
