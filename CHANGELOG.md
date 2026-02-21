# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-02-21

### 🎉 Initial Release

ClawPanel v1.0.0 is the first stable release of the OpenClaw Mission Control Dashboard.

### ✨ Features

#### Dashboard
- Real-time overview of gateway status, sessions, agents, and cron jobs
- Auto-refresh every 30 seconds
- Navigation cards to all sections
- System health indicators

#### Authentication
- Secure Basic Authentication middleware
- Login page with credential validation
- Session persistence via localStorage
- Protected routes requiring authentication

#### Sessions Management
- View all active agent sessions
- Display session key, agent ID, kind, token usage, and age
- Filter sessions by type (direct, cron, subagent)
- Kill individual sessions with confirmation dialog
- Auto-refresh every 30 seconds

#### Agent Control
- List all configured agents with status
- Display agent metadata (model, workspace, emoji)
- Spawn new agent sessions with custom tasks
- Kill all sessions for an agent
- Status badges for running, idle, and error states

#### Cron Job Scheduler
- Create, view, and delete cron jobs
- Human-readable schedule descriptions
- Next/last run tracking with timestamps
- Error message display for failed jobs
- Built-in cron schedule helper with examples
- Auto-refresh every 60 seconds

#### Workspace Browser
- Browse files and directories
- Breadcrumb navigation
- View file metadata (size, modification time)
- Directory/file sorting
- File download/view functionality

#### GitHub Integration
- Browse issues and pull requests
- Filter by state (open/closed/all)
- View issue/PR details with labels and assignees
- Direct links to GitHub
- Support for multiple repositories

#### Settings Editor
- Edit openclaw.json directly in the browser
- Live JSON validation
- Automatic backup creation on save
- Real-time save status indicator
- Reset to saved configuration

### 🔌 API Endpoints

All API endpoints protected by Basic Authentication:

- `GET /health` - Health check (no auth required)
- `GET /api/gateway/status` - Gateway status
- `POST /api/gateway/restart` - Restart gateway
- `GET /api/sessions` - List sessions
- `POST /api/sessions/:key/kill` - Kill session
- `GET /api/agents` - List agents
- `POST /api/agents/:id/spawn` - Spawn agent
- `POST /api/agents/:id/kill` - Kill agent sessions
- `GET /api/cron` - List cron jobs
- `POST /api/cron` - Create cron job
- `DELETE /api/cron/:id` - Delete cron job
- `GET /api/config` - Get openclaw.json
- `POST /api/config` - Update openclaw.json
- `GET /api/github/repos` - List repositories
- `GET /api/github/:owner/:repo/issues` - Get issues
- `GET /api/github/:owner/:repo/pulls` - Get pull requests
- `GET /api/workspace?path=` - Browse directory
- `GET /api/files/:path` - Read file
- `POST /api/files/:path` - Write file

### 🛠️ Tech Stack

**Backend:**
- Express.js 5.2+ with TypeScript 5.9+
- Basic Auth middleware for security
- CORS enabled for frontend integration
- Child process execution for OpenClaw CLI integration

**Frontend:**
- React 19.2+ with TypeScript 5.9+
- Vite 7.3+ build tool
- Tailwind CSS 4.2+ for styling
- React Query 5.90+ for data fetching
- React Router DOM 7.13+ for routing
- Lucide React for icons
- Date-fns for date formatting

### 📁 Project Structure

```
clawpanel/
├── src/                    # Backend source
│   ├── index.ts           # Express server
│   ├── middleware/        # Auth & error handlers
│   ├── routes/            # API routes
│   ├── services/          # OpenClaw CLI wrapper
│   └── types/             # TypeScript definitions
├── frontend/              # React frontend
│   ├── src/
│   │   ├── pages/         # 8 page components
│   │   ├── components/    # UI components
│   │   ├── services/      # API client functions
│   │   ├── context/       # React contexts
│   │   └── types/         # TypeScript definitions
│   └── vite.config.ts
├── docs/
│   └── API.md             # API documentation
├── README.md
├── CONTRIBUTING.md
└── CHANGELOG.md
```

### 📖 Documentation

- Comprehensive README with setup instructions
- API documentation with request/response examples
- Contributing guidelines
- Changelog (this file)

### 🔐 Security

- Basic Authentication on all API routes
- Environment variable configuration for credentials
- Path traversal prevention in file operations
- Backup creation before config changes

### 🐛 Known Limitations

- GitHub integration requires GitHub CLI to be installed and authenticated
- WebSocket real-time updates are not yet implemented
- File upload functionality is not yet available
- Resource monitoring (CPU, Memory, Disk) displays placeholder values

---

## [Unreleased]

### Planned Features

- WebSocket support for real-time updates
- File upload via workspace browser
- Resource monitoring (CPU, Memory, Disk usage)
- Dark mode UI
- Multi-language support
- Plugin system for extensibility
- Enhanced logging view
- Agent execution log streaming

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2026-02-21 | Initial release |

---

For detailed API documentation, see [docs/API.md](docs/API.md).

For contributing guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).
