# ClawPanel

> OpenClaw Mission Control Dashboard

A modern, web-based dashboard for managing OpenClaw agents, sessions, cron jobs, and workspace configuration.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/openfugjoobot/clawpanel)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

## 🚀 Features

ClawPanel provides **8 comprehensive frontend pages** to manage your OpenClaw deployment:

### 📊 Dashboard
- Real-time overview of gateway status, active sessions, agents, and cron jobs
- Quick navigation cards to all sections
- Auto-refresh every 30 seconds
- System health monitoring

### 🔐 Login
- Secure Basic Authentication
- Session persistence via localStorage
- Clean, modern login interface
- Default credentials: `admin` / `changeme`

### 👥 Sessions
- View all active agent sessions
- Session details: key, agent ID, kind, token usage, age
- Kill sessions directly from the UI
- Filter by session type (direct, cron, subagent)

### 🤖 Agents
- List all configured agents with status
- Spawn new agent sessions with custom tasks
- Kill all sessions for an agent
- View agent metadata (model, workspace, emoji)
- Status indicators (running, idle, error)

### ⏰ Cron Jobs
- Create, view, and delete scheduled tasks
- Human-readable schedule descriptions
- Next/last run tracking
- Error message display
- Built-in cron schedule helper

### 📁 Workspace
- File browser for the workspace directory
- Navigate directories with breadcrumbs
- View file metadata (size, modification date)
- Quick file preview

### ⚙️ Settings
- Edit `openclaw.json` configuration directly
- JSON validation with live feedback
- Automatic backup creation on save
- Real-time save status indicator

### 🐙 GitHub
- Browse repository issues and pull requests
- View issue/PR details with labels and assignees
- Open items directly on GitHub
- Filter by state (open/closed/all)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (for backend)
- Node.js 22+ (for frontend with Vite 7)
- OpenClaw CLI installed and configured
- GitHub CLI (optional, for GitHub features)

### Installation

```bash
# Clone the repository
git clone https://github.com/openfugjoobot/clawpanel.git
cd clawpanel

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### Configuration

Create a `.env` file with the following variables:

```env
PORT=3000
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=changeme
GATEWAY_TOKEN=your_gateway_token_here
```

### Development

Run both backend and frontend in development mode:

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

The dashboard will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Production Build

```bash
# Build the backend
npm run build

# Build the frontend
cd frontend
npm run build

# Start the production server
npm start
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ClawPanel                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────────────────────────┐  │
│  │   Frontend   │      │           Backend                │  │
│  │   (Vite)     │◄────►│         (Express)                │  │
│  │  ┌─┬─┬─┐    │      │                                  │  │
│  │  │R│A│C│    │      │  ┌─────────┐    ┌─────────────┐   │  │
│  │  │e│x│o│    │      │  │  Auth   │    │   OpenClaw  │   │  │
│  │  │a│i│n│    │      │  │Middleware──►│    Service  │   │  │
│  │  │c│o│t│    │      │  └─────────┘    └──────┬──────┘   │  │
│  │  │t│s│s│    │      │                         │         │  │
│  │  │ │ │Q│    │      │  ┌──────────────────────┴──────┐  │  │
│  │  └─┴─┴─┘    │      │  │      CLI Commands          │  │  │
│  │             │      │  │  openclaw agents list      │  │  │
│  │ 8 Pages:    │      │  │  openclaw sessions list    │  │  │
│  │ • Dashboard │      │  │  openclaw cron list        │  │  │
│  │ • Sessions  │      │  │  openclaw gateway health   │  │  │
│  │ • Agents    │      │  └─────────────────────────────┘  │  │
│  │ • Cron      │      │                                   │  │
│  │ • Workspace │      └───────────────────────────────────┘  │
│  │ • GitHub    │                                             │
│  │ • Settings  │      ┌───────────────────────────────┐      │
│  │ • Login     │      │      openclaw.json            │      │
│  └─────────────┘      │   ┌─────────────────────┐     │      │
│                       │   │  Configuration      │     │      │
│                       │   └─────────────────────┘     │      │
│                       └───────────────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend:**
- React 19.2+
- TypeScript 5.9+
- Tailwind CSS 4.2+
- Vite 7.3+
- React Query 5.90+ (data fetching)
- React Router DOM 7.13+
- Lucide React (icons)
- Date-fns (date formatting)

**Backend:**
- Express.js 5.2+
- TypeScript 5.9+
- Basic Auth (authentication)
- CORS enabled
- WebSocket support (prepared)

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | No |
| GET | `/api/gateway/status` | Gateway status | Yes |
| POST | `/api/gateway/restart` | Restart gateway | Yes |
| GET | `/api/sessions` | List active sessions | Yes |
| POST | `/api/sessions/:key/kill` | Kill a session | Yes |
| GET | `/api/agents` | List agents | Yes |
| POST | `/api/agents/:id/spawn` | Spawn agent | Yes |
| POST | `/api/agents/:id/kill` | Kill agent sessions | Yes |
| GET | `/api/cron` | List cron jobs | Yes |
| POST | `/api/cron` | Create cron job | Yes |
| DELETE | `/api/cron/:id` | Delete cron job | Yes |
| GET | `/api/config` | Get openclaw.json | Yes |
| POST | `/api/config` | Update openclaw.json | Yes |
| GET | `/api/github/repos` | List repositories | Yes |
| GET | `/api/github/:owner/:repo/issues` | Get issues | Yes |
| GET | `/api/github/:owner/:repo/pulls` | Get pull requests | Yes |
| GET | `/api/workspace?path=` | Browse workspace | Yes |
| GET | `/api/files/:path` | Read file content | Yes |
| POST | `/api/files/:path` | Write file content | Yes |

For detailed API documentation, see [docs/API.md](docs/API.md).

---

## 🔐 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Backend server port | `3000` | No |
| `DASHBOARD_USERNAME` | Admin username | `admin` | Yes |
| `DASHBOARD_PASSWORD` | Admin password | `changeme` | Yes |
| `GATEWAY_TOKEN` | OpenClaw gateway token | - | No |
| `OPENCLAW_WORKSPACE` | Workspace path | `~/.openclaw/workspace` | No |

**Frontend Environment Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE` | Backend API URL | `http://localhost:3000` |

---

## 📸 Screenshots

> Screenshots will be added in future releases.

```
[Screenshot: Dashboard Overview]
[Screenshot: Sessions Management]
[Screenshot: Agent Control]
[Screenshot: Cron Job Scheduler]
[Screenshot: Workspace Browser]
[Screenshot: GitHub Integration]
[Screenshot: Settings Editor]
```

---

## 📝 Development

### Backend Development

```bash
# Start with hot reload
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Frontend Development

```bash
cd frontend

# Start Vite dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Project Structure

```
clawpanel/
├── src/
│   ├── index.ts              # Express server entry
│   ├── middleware/
│   │   ├── auth.ts           # Basic auth middleware
│   │   └── error.ts          # Error handler
│   ├── routes/
│   │   ├── agents.ts         # Agent management
│   │   ├── config.ts         # Config management
│   │   ├── cron.ts           # Cron job management
│   │   ├── gateway.ts        # Gateway control
│   │   ├── github.ts         # GitHub integration
│   │   ├── sessions.ts       # Session management
│   │   └── workspace.ts      # File browser
│   ├── services/
│   │   └── openclaw.ts       # OpenClaw CLI wrapper
│   └── types/
│       └── index.ts          # TypeScript types
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # React router setup
│   │   ├── main.tsx          # Entry point
│   │   ├── pages/
│   │   │   ├── Agents.tsx
│   │   │   ├── Cron.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── GitHub.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Sessions.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Workspace.tsx
│   │   ├── components/
│   │   │   └── ui/           # Reusable UI components
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── useApi.ts
│   │   ├── services/
│   │   │   ├── agents.ts
│   │   │   ├── api.ts
│   │   │   ├── config.ts
│   │   │   ├── cron.ts
│   │   │   ├── gateway.ts
│   │   │   ├── github.ts
│   │   │   ├── sessions.ts
│   │   │   └── workspace.ts
│   │   └── types/
│   │       └── index.ts
│   ├── index.html
│   └── vite.config.ts
├── docs/
│   └── API.md                # API documentation
├── package.json
├── .env
└── README.md
```

---

## 💫 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📜 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## License

ISC License - See [LICENSE](LICENSE) for details.

---

Built with ❤️ for the OpenClaw community.
