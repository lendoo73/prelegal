# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation supports all 11 Common Paper document types via an AI chat interface. Users describe what they need, the AI detects the document type, gathers fields conversationally, and shows a live preview with a download button when complete.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter 
to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. 
You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, 
allowing for a users table with sign up and sign in.  
The frontend is statically built (`output: 'export'`) and served via FastAPI.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

### Completed (KAN-5)
- Mutual NDA form with live preview and PDF download
- 93 automated tests (Vitest unit tests + Playwright e2e)

### Completed (KAN-6 / PL-4)
- Docker multi-stage build (Node frontend + Python backend)
- FastAPI backend (uv project) with SQLite (fresh DB each container start)
- Next.js static export served by FastAPI at localhost:8000
- Auth routes: POST /api/auth/signup, POST /api/auth/signin, POST /api/auth/signout, GET /api/auth/me
- Start/stop scripts for Mac, Linux, Windows
- `bcrypt<4.0.0` pinned to maintain passlib compatibility

### Completed (KAN-7 / PL-5)
- AI chat interface replaces manual form for Mutual NDA creation
- Split-pane layout: chat on left, live NDA preview on right
- Uses LiteLLM via OpenRouter with Cerebras inference (gpt-oss-120b model)
- Structured outputs for reliable field extraction from conversation
- Live preview updates as AI extracts fields from chat
- AI greets user, asks questions conversationally, and confirms when complete
- Download button appears when all required fields are gathered
- 6 backend unit tests for the chat endpoint (mocked LLM)

### Completed (KAN-8 / PL-6)
- Support for all 11 document types from catalog.json
- Two-phase AI chat: document type detection phase, then per-document field collection phase
- AI detects document type from user requests and routes to per-document system prompt
- If user requests an unsupported document type, AI explains and offers the closest alternative
- Dedicated NDA preview component (`NdaPreview`) for Mutual NDA
- Generic preview component (`GenericDocumentPreview`) for all other document types
- AI always asks a follow-on question when more information is needed
- AI says "Your document is ready for downloading" when all required fields are collected
- Auto-focus chat input after every message send
- 11 additional backend unit tests for the multi-document endpoint (17 total)
- 69 frontend unit tests pass; frontend builds clean

### Planned (PL-7)
- Functional user authentication with JWT tokens in HttpOnly cookies
- User signup and signin with email/password (bcrypt password hashing)
- Document persistence - users can save documents to their account
- My Documents modal to view, load, and delete saved documents
- User menu with sign out functionality
- New Document button to start fresh
- Auth context for managing user state across the app
- Protected document save/load endpoints

### Current API Endpoints
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in and receive JWT cookie
- `POST /api/auth/signout` - Clear auth cookie
- `GET /api/auth/me` - Get current user info
- `POST /api/chat` - Multi-document AI chat: detection phase (doc_type=null) + field collection phase (doc_type known)
- `POST /api/chat/nda` - Legacy Mutual NDA-specific chat endpoint (kept for backward compatibility)
- `GET /api/health` - Health check
