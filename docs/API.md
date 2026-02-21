# ClawPanel API Documentation

This document describes all REST API endpoints available in the ClawPanel backend.

## Authentication

All `/api/*` endpoints require **Basic Authentication**.

### Authentication Header

```http
Authorization: Basic base64(username:password)
```

### Example with cURL

```bash
curl -u admin:changeme http://localhost:3000/api/gateway/status
```

### Failed Authentication

If authentication fails, the API returns:

```json
{
  "error": "Authentication required"
}
```

With HTTP status `401 Unauthorized` and header:
```
WWW-Authenticate: Basic realm="Dashboard"
```

---

## Health Check

### GET /health

Health check endpoint that does not require authentication.

**Response:**

```json
{
  "status": "ok"
}
```

**Status Codes:**
- `200 OK` - Server is running

---

## Gateway

### GET /api/gateway/status

Returns the current gateway health status.

**Response:**

```json
{
  "status": "online",
  "pid": 12345,
  "uptime": 3600,
  "version": "1.0.0",
  "startedAt": "2024-01-15T10:30:00Z"
}
```

**Fields:**
- `status` - Current status: `online`, `offline`, or `error`
- `pid` - Process ID of the gateway
- `uptime` - Uptime in seconds
- `version` - Gateway version
- `startedAt` - ISO 8601 timestamp when gateway started

**Status Codes:**
- `200 OK` - Success
- `503 Service Unavailable` - Gateway is offline
- `401 Unauthorized` - Invalid credentials

---

### POST /api/gateway/restart

Restarts the OpenClaw gateway service.

**Response:**

```json
{
  "message": "Gateway restart initiated",
  "output": "gateway restarted successfully"
}
```

**Status Codes:**
- `200 OK` - Restart initiated
- `500 Internal Server Error` - Failed to restart
- `401 Unauthorized` - Invalid credentials

---

## Sessions

### GET /api/sessions

Returns a list of all active sessions.

**Response:**

```json
[
  {
    "key": "agent:docs:subagent:abc123",
    "id": "agent:docs:subagent",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastActivity": "2024-01-15T11:30:00Z",
    "requestCount": 42,
    "metadata": {
      "channel": "telegram",
      "model": "kimi-k2.5"
    }
  }
]
```

**Fields:**
- `key` - Unique session identifier
- `id` - Session ID
- `createdAt` - ISO 8601 timestamp when session was created
- `lastActivity` - ISO 8601 timestamp of last activity
- `requestCount` - Number of requests processed
- `metadata` - Additional session metadata (optional)

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Failed to fetch sessions
- `401 Unauthorized` - Invalid credentials

---

### POST /api/sessions/:key/kill

Terminates a specific session by its key.

**Path Parameters:**
- `key` - The session key to kill

**Response:**

```json
{
  "message": "Session kill command executed",
  "output": "Killed session agent:docs:subagent:abc123"
}
```

**Status Codes:**
- `200 OK` - Session terminated
- `400 Bad Request` - Invalid session key
- `500 Internal Server Error` - Failed to kill session
- `401 Unauthorized` - Invalid credentials

---

## Agents

### GET /api/agents

Returns a list of all configured agents.

**Response:**

```json
[
  {
    "id": "docs",
    "name": "Documentation Agent",
    "status": "idle",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z",
    "task": "Update README",
    "metadata": {
      "emoji": "📄",
      "model": "kimi-k2.5",
      "workspace": "default"
    }
  }
]
```

**Fields:**
- `id` - Unique agent ID
- `name` - Agent display name
- `status` - Current status: `idle`, `running`, `error`, or `completed`
- `createdAt` - ISO 8601 timestamp when agent was created
- `updatedAt` - ISO 8601 timestamp of last update
- `task` - Current or last task (optional)
- `metadata` - Additional agent metadata (optional)

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Failed to fetch agents
- `401 Unauthorized` - Invalid credentials

---

### POST /api/agents/:id/spawn

Spawns a new session for the specified agent.

**Path Parameters:**
- `id` - The agent ID to spawn

**Request Body:**

```json
{
  "task": "Create documentation for the new feature"
}
```

**Fields:**
- `task` (required) - The task for the agent to perform

**Response:**

```json
{
  "sessionKey": "agent:docs:subagent:xyz789"
}
```

**Status Codes:**
- `200 OK` - Agent spawned successfully
- `400 Bad Request` - Task is required
- `500 Internal Server Error` - Failed to spawn agent
- `401 Unauthorized` - Invalid credentials

---

### POST /api/agents/:id/kill

Kills all sessions for the specified agent.

**Path Parameters:**
- `id` - The agent ID to kill sessions for

**Response:**

```json
{
  "message": "Agent docs sessions killed successfully"
}
```

**Status Codes:**
- `200 OK` - Sessions killed successfully
- `500 Internal Server Error` - Failed to kill sessions
- `401 Unauthorized` - Invalid credentials

---

## Cron Jobs

### GET /api/cron

Returns a list of all configured cron jobs.

**Response:**

```json
[
  {
    "id": "1",
    "name": "Daily Report",
    "schedule": "0 0 * * *",
    "command": "Generate daily report",
    "agent": "docs",
    "status": "ok",
    "lastRun": "2024-01-14T00:00:00Z",
    "nextRun": "2024-01-15T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-14T00:00:00Z",
    "errorMessage": null
  }
]
```

**Fields:**
- `id` - Cron job ID
- `name` - Job display name
- `schedule` - Cron expression (e.g., `0 0 * * *`)
- `command` - Command/task to execute
- `agent` - Target agent ID
- `status` - Job status: `ok`, `error`, or `pending`
- `lastRun` - ISO 8601 timestamp of last execution (or null)
- `nextRun` - ISO 8601 timestamp of next scheduled execution (or null)
- `createdAt` - ISO 8601 timestamp when job was created
- `updatedAt` - ISO 8601 timestamp of last update
- `errorMessage` - Error message if status is `error` (optional)

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Failed to fetch cron jobs
- `401 Unauthorized` - Invalid credentials

---

### POST /api/cron

Creates a new cron job.

**Request Body:**

```json
{
  "name": "Daily Report",
  "schedule": "0 0 * * *",
  "command": "Generate daily report",
  "agent": "docs"
}
```

**Fields:**
- `name` (required) - Job display name
- `schedule` (required) - Cron expression
- `command` (required) - Task/command to execute
- `agent` (required) - Target agent ID

**Response:**

```json
{
  "message": "Cron job added successfully",
  "output": "Added job 'Daily Report'"
}
```

**Status Codes:**
- `200 OK` - Job created successfully
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Failed to create job
- `401 Unauthorized` - Invalid credentials

---

### DELETE /api/cron/:id

Deletes a cron job by its ID.

**Path Parameters:**
- `id` - The cron job ID to delete

**Response:**

```json
{
  "message": "Cron job deleted successfully",
  "output": "Deleted job 1"
}
```

**Status Codes:**
- `200 OK` - Job deleted successfully
- `500 Internal Server Error` - Failed to delete job
- `401 Unauthorized` - Invalid credentials

---

## Configuration

### GET /api/config

Returns the contents of `openclaw.json`.

**Response:**

```json
{
  "agents": [
    {
      "id": "docs",
      "name": "Documentation Agent",
      "emoji": "📄",
      "model": "kimi-k2.5"
    }
  ],
  "cron": [],
  "settings": {
    "defaultWorkspace": "/home/user/.openclaw/workspace"
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Config file not found
- `500 Internal Server Error` - Failed to read config (includes JSON parse errors)
- `401 Unauthorized` - Invalid credentials

---

### POST /api/config

Updates the `openclaw.json` file (with automatic backup).

**Request Body:**

The complete JSON configuration object.

```json
{
  "agents": [
    {
      "id": "docs",
      "name": "Documentation Agent",
      "emoji": "📄"
    }
  ],
  "cron": []
}
```

**Response:**

```json
{
  "message": "Config updated successfully",
  "backup": "/home/user/.openclaw/openclaw.json.backup.2024-01-15T10.30.00.000Z"
}
```

**Fields:**
- `backup` - Path to the automatically created backup file

**Status Codes:**
- `200 OK` - Config updated successfully
- `500 Internal Server Error` - Failed to update config
- `401 Unauthorized` - Invalid credentials

---

## GitHub Integration

### GET /api/github/repos

Returns a list of preconfigured repositories.

**Response:**

```json
[
  {
    "owner": "openfugjoobot",
    "name": "clawpanel",
    "description": "OpenClaw Mission Control Dashboard"
  }
]
```

**Status Codes:**
- `200 OK` - Success
- `503 Service Unavailable` - GitHub CLI not available
- `401 Unauthorized` - Invalid credentials

---

### GET /api/github/:owner/:repo/issues

Returns issues for a specific repository.

**Path Parameters:**
- `owner` - Repository owner/organization
- `repo` - Repository name

**Response:**

```json
[
  {
    "id": 1234567890,
    "number": 1,
    "title": "Feature request",
    "state": "open",
    "html_url": "https://github.com/openfugjoobot/clawpanel/issues/1",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T12:00:00Z",
    "user": {
      "login": "username",
      "avatar_url": "https://avatars.githubusercontent.com/u/12345"
    },
    "labels": [
      {
        "name": "enhancement",
        "color": "a2eeef"
      }
    ],
    "comments": 5
  }
]
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Missing owner or repo
- `503 Service Unavailable` - GitHub CLI not available or error
- `401 Unauthorized` - Invalid credentials

---

### GET /api/github/:owner/:repo/pulls

Returns pull requests for a specific repository.

**Path Parameters:**
- `owner` - Repository owner/organization
- `repo` - Repository name

**Response:**

```json
[
  {
    "id": 1234567890,
    "number": 2,
    "title": "Add new feature",
    "state": "open",
    "html_url": "https://github.com/openfugjoobot/clawpanel/pull/2",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T14:00:00Z",
    "user": {
      "login": "username",
      "avatar_url": "https://avatars.githubusercontent.com/u/12345"
    },
    "draft": false,
    "merged": false,
    "head": {
      "label": "username:feature-branch",
      "ref": "feature-branch"
    },
    "base": {
      "label": "openfugjoobot:main",
      "ref": "main"
    }
  }
]
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Missing owner or repo
- `503 Service Unavailable` - GitHub CLI not available or error
- `401 Unauthorized` - Invalid credentials

---

## Workspace

### GET /api/workspace

Returns directory contents for the workspace.

**Query Parameters:**
- `path` (optional) - Relative path from workspace root. Default: `/`

**Response:**

```json
{
  "files": [
    {
      "name": "documents",
      "type": "directory",
      "path": "/documents",
      "size": 0,
      "modifiedAt": "2024-01-15T10:00:00Z"
    },
    {
      "name": "README.md",
      "type": "file",
      "path": "/README.md",
      "size": 1024,
      "modifiedAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

**Fields:**
- `name` - File/directory name
- `type` - Either `file` or `directory`
- `path` - Relative path
- `size` - File size in bytes (for files)
- `modifiedAt` - ISO 8601 timestamp of last modification

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid path or path traversal attempt
- `404 Not Found` - Path not found
- `401 Unauthorized` - Invalid credentials

---

### GET /api/files/:path

Returns the content of a specific file.

**Path Parameters:**
- `path` - The file path (URL-encoded)

**Response:**

```json
{
  "content": "# README\n\nThis is the content..."
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid path or path traversal attempt
- `404 Not Found` - File not found
- `401 Unauthorized` - Invalid credentials

---

### POST /api/files/:path

Writes content to a file (with automatic backup if file exists).

**Path Parameters:**
- `path` - The file path (URL-encoded)

**Request Body:**

```json
{
  "content": "# New Content\n\nUpdated..."
}
```

**Fields:**
- `content` (required) - The file content to write

**Response:**

```json
{
  "message": "File saved successfully"
}
```

**Status Codes:**
- `200 OK` - File saved successfully
- `400 Bad Request` - Invalid path or path traversal attempt
- `500 Internal Server Error` - Failed to save file
- `401 Unauthorized` - Invalid credentials

---

## Error Responses

All endpoints may return these error responses:

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

**Caused by:** Missing or invalid Basic Auth credentials.

---

### 500 Internal Server Error

```json
{
  "error": "Failed to ...",
  "message": "Detailed error message"
}
```

**Caused by:** Server-side errors, OpenClaw CLI not found, or invalid JSON responses.

---

## Response Codes Summary

| Status | Meaning |
|--------|---------|
| 200 OK | Request successful |
| 400 Bad Request | Invalid parameters or missing required fields |
| 401 Unauthorized | Authentication required or invalid credentials |
| 404 Not Found | Resource not found |
| 500 Internal Server Error | Server error |
| 503 Service Unavailable | External service (gateway, GitHub CLI) unavailable |
