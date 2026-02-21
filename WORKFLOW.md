# WORKFLOW.md - AI Team Development Workflow

_8-Agent-Team with GitHub Projects Integration. One Repo = One Project._

---

## 🎯 Overview

**Principles:**
- **8-Phase Workflow** (strict quality gates, REQUIREMENTS never skipped)
- **One Repo = One Project** (GitHub Issues + Projects = Single Source of Truth)
- **8 Specialized Agents** (working in parallel, own workspaces)
- **Tool Reuse** (search for existing skills, don't reinvent)
- **DevOrchestrator coordinates, NEVER codes** (delegates to specialized agents)

**User:** user (language per preference)
**Organization:** https://github.com/openfugjoobot

---

## 🏗️ 8-Agent Team

| Agent | Role | Workspace | Phase |
|-------|------|-----------|-------|
| **DevOrchestrator** | Coordination, Management *(does NOT code)* | `workspace` | 0-8 |
| **ResearchAgent** | Tech Research, PoCs | `workspace-research` | 1 |
| **ArchitectAgent** | System Design, APIs | `workspace-architect` | 2 |
| **BackendAgent** | Server, APIs, DB | `workspace-backend` | 4 |
| **FrontendAgent** | UI/UX, Components | `workspace-frontend` | 4 |
| **QAAgent** | Tests, Code Review | `workspace-qa` | 5 |
| **DocsAgent** | Documentation | `workspace-docs` | 6 |
| **DevOpsAgent** | CI/CD, Deploy | `workspace-devops` | 7 |

**⚠️ Workspace Rules:**
- Only these 8 workspaces are valid
- `workspace-*-agent` (with suffix) = temporary → ignore/delete
- Agents work only in their workspace

---

## 📋 8-Phase Workflow

| Phase | Owner | Output | GitHub Action |
|-------|-------|--------|---------------|
| **0. REQUIREMENTS** 🔴 | DevOrchestrator + user | `REQUIREMENTS.md` | Create issue, Label `requirements`, Project: "Backlog" |
| **1. ANALYSIS** | ResearchAgent | `specs/analysis.md` | Status: `in progress`, Comment with results |
| **2. DESIGN** | ArchitectAgent | `specs/architecture.md` | Status: `in progress`, Link specs |
| **3. PLANNING** | DevOrchestrator | Subtasks with dependencies | Issues for subtasks, Labels, Milestone, Project: "Ready" |
| **4. IMPLEMENTATION** | Backend + Frontend (parallel) | Code + Tests | **PR Workflow**, Branch `feature/xyz`, Project: "In Progress" → "In Review" |
| **5. REVIEW** | QAAgent | Review Report | PR Review (inline), Label `qa-approved` or `qa-changes-requested` |
| **6. DOCUMENTATION** | DocsAgent | README, API Docs | Docs added in PR |
| **7. DEPLOYMENT** | DevOpsAgent | Live App | Release `v1.0.0`, Comment deployment status |
| **8. CLOSURE** | DevOrchestrator | Memory Update | Issue `closed`, Project: "Done", Retro |

**Phase 0 (REQUIREMENTS) is Mandatory:**
- Project goal (1 sentence), User Stories (3-5), Tech Stack, Deliverables, Exclusions, Success Criteria
- **⚠️ User must confirm in writing before Phase 1 starts!**

---

## 🔗 GitHub Integration

### Repository Structure
```
openfugjoobot/
├── project-a/          # One Repo = One Project
├── project-b/
└── project-c/
```

### Labels
- **Type:** `bug`, `feature`, `enhancement`, `documentation`
- **Priority:** `p0-critical`, `p1-high`, `p2-medium`, `p3-low`
- **Size:** `xs`, `s`, `m`, `l`, `xl`
- **Status:** `blocked`, `needs-review`, `qa-approved`

### GitHub Projects (per Repo)
- **Views:** Board (Kanban), Table, Roadmap
- **Columns:** Backlog → Ready → In Progress → In Review → Done
- **Custom Fields:** Priority, Size, Sprint, Agent
- **Automation:** Issue opened → Backlog | PR opened → In Review | PR merged → Done

### Branching & PR
```
main (protected)
  ↑
  ├── feature/xyz    # Feature branches
  └── hotfix/xyz     # Emergency fixes
```

**Rules:**
- No direct commits to `main`
- Every PR needs 1 approval (QAAgent)
- CI must be green
- After merge: delete branch

---

## 🎯 MVP Exception Workflow

**Until MVP (Minimum Viable Product):**
- ✅ Direct commits to `main` allowed
- ✅ No PRs required for bug fixes
- ✅ Fast iteration, quick fixes
- ⚠️ Still: No commits without testing locally

**After MVP launch:**
- 🔒 Strict PR Workflow
- 🔒 QAAgent must approve all PRs
- 🔒 Reviewer merges, not implementer
- 🔒 Branch protection on `main`

**MVP Definition:**
- All P0/P1 bugs fixed
- Basic auth working
- Dashboard functional
- No crashes on subpages

---

## 🛠️ Tooling & Setup

### Tool Reuse Requirement

**BEFORE project start:**
1. 🔍 **Search for existing skills** in `~/.openclaw/workspace/skills/`
2. 🔍 **Check TOOLS.md** for existing configurations
3. ✅ **Use existing tools** instead of building new
4. ❌ **Don't reinvent** what already exists

**If skill is missing:**
- `clawhub search <keyword>` → Find skill
- `clawhub install <skill>` → Install
- Only if really needed: Create new skill

### Standard Tools (always check)
| Tool | Usage |
|------|------------|
| `gh` | GitHub CLI for all Git operations |
| `blogwatcher` | RSS/Atom Feed monitoring |
| `weather` | Weather data (wttr.in) |
| `gog` | Google Workspace (Gmail, Calendar, Drive) |
| `qmd` | Local search/indexing |
| `clawhub` | Skill management |
| `mcporter` | MCP Server Integration |

### API Keys
Located in `~/.openclaw/credentials/.env`:
```bash
BRAVE_SEARCH_API_KEY      # Web search
OPENROUTER_API_KEY        # LLM models
GOG_CLIENT_ID/SECRET      # Google Workspace
GITHUB_TOKEN              # API access (if needed)
```

---

## 📚 Best Practices

### Architecture
- **One repo per project** (no mono-repos)
- **PR workflow** with reviews (no direct main commits)
- **Labels** by Type/Priority/Size (not by agent)
- **GitHub Projects** instead of external PM tools
- **YAGNI:** Create folders/files only when content exists

### Code Quality
- Never skip REQUIREMENTS phase
- No code without tests
- No deploy without green CI
- No secrets in commits (only env vars)
- `trash` > `rm` (recoverable is better than gone)

### API Integration
- Prefer official APIs
- Implement rate limiting & error handling
- Fallback mechanisms for critical dependencies
- Caching for frequent requests

---

## 🔄 Continuous Monitoring (24/7)

**Continuous Checks:**
1. 🚫 Blocked Tickets (>2h no activity)
2. 📋 GitHub Project board for phase changes
3. 📝 Open Reviews (pending >24h → reminder)
4. 🎫 New issues in repositories
5. 🔍 Memory maintenance (REVIEWED → MEMORY.md)
6. 🧹 Cleanup (temp files, orphaned processes)
7. 💾 Git check (commit uncommitted changes)

**Phase Transition Automation:**
| From | To | Action |
|------|------|--------|
| REQUIREMENTS | ANALYSIS | Spawn ResearchAgent |
| ANALYSIS | DESIGN | Spawn ArchitectAgent |
| DESIGN | PLANNING | Create subtasks |
| PLANNING | IMPLEMENTATION | Backend + Frontend in parallel |
| IMPLEMENTATION | REVIEW | Spawn QAAgent |
| REVIEW | DOCUMENTATION | Spawn DocsAgent |
| DOCUMENTATION | DEPLOYMENT | Spawn DevOpsAgent |
| DEPLOYMENT | CLOSURE | Retro + Cleanup |

---

## ✅ Decision Matrix

| Situation | Action |
|-----------|--------|
| Tech Stack <€10/month | ✅ Auto |
| Refactoring <50 LOC | ✅ Auto |
| Bugfixes | ✅ Auto |
| Agent spawn/retry | ✅ Auto |
| Architecture changes | ⚠️ INFO user |
| New dependencies | ⚠️ INFO user |
| Budget impact | ⚠️ INFO user |
| Agent timeouts | ⚠️ INFO user |
| Security relevant | 🛑 ASK user |
| Breaking changes | 🛑 ASK user |
| Costs >€50 | 🛑 ASK user |
| DB migrations | 🛑 ASK user |
| Unclear requirements | 🛑 ASK user |

---

## 📝 Memory Management

**Files:**
```
~/.openclaw/workspace/
├── MEMORY.md              # Long-term Memory (Main Session only)
├── memory/YYYY-MM-DD.md   # Daily notes
├── DECISION_LOG.md        # Architecture decisions
└── LEARNINGS.md           # Retro insights
```

**Rules:**
- Load MEMORY.md only in Main Session (private data)
- Daily notes = raw logs
- MEMORY.md = curated insights
- Project status is in GitHub Projects (no PROJECT_STATE.md)

---

## 🚀 Setup Checklist

- [ ] **Check skills:** Search tools in `skills/` and `TOOLS.md`
- [ ] **Create repo:** One repo per project
- [ ] **GitHub Project:** Board + views + automations
- [ ] **Labels:** Type, Priority, Size configured
- [ ] **Branch protection:** main protected, CI required
- [ ] **Workspaces:** 8 agent workspaces set up
- [ ] **PR template:** Create
- [ ] **Test run:** First ticket through the flow

**Effort:** 3-4 hours

---

**Summary:** Strict 8-phase model + 8 agents + GitHub best practices (One Repo = One Project) + Tool reuse = High quality software.

---

*Version: 2026-02-19*
*One Project per Repository | Tool Reuse | 24/7 Development*