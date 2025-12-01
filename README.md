# Article Management System

Full-stack application for managing articles with React frontend and Node.js backend.

## Tech Stack

**Frontend**: React 19, Vite, React Quill New (WYSIWYG editor), WebSocket  
**Backend**: Node.js, Express, PostgreSQL, Sequelize ORM, WebSocket (ws), Multer  
**Database**: PostgreSQL with Sequelize migrations

## Prerequisites

- Node.js v18 or higher
- npm
- PostgreSQL 12 or higher (installed and running)

## Installation

### 1. Install Dependencies

```bash
npm install 

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Database Setup

**Important:** You need to set up PostgreSQL before running the application.

**Quick Setup:**

1. Install PostgreSQL (if not already installed)
2. Create database:
   ```bash
   psql postgres
   CREATE DATABASE articles_db;
   \q
   ```

3. Create `.env` file in the project root:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=articles_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   PORT=3000
   ```

4. Run migrations:
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed:all
   cd ..
   ```

## Running the Application

### Quick Start (Recommended)

**Windows:**
```bash
# Start both servers
start-servers.bat

# Stop servers (in another terminal)
stop-servers.bat
```

**macOS/Linux:**
```bash
# Make scripts executable (first time only)
chmod +x start-servers.sh stop-servers.sh

# Start both servers
./start-servers.sh

# Stop servers: Press Ctrl+C or run in another terminal:
./stop-servers.sh
```

### Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Access

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- WebSocket: ws://localhost:3000/ws

## API Endpoints

### Articles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles?workspaceId=<id>` | List articles (optionally filter by workspace) |
| GET | `/api/articles/:id` | Get specific article |
| POST | `/api/articles` | Create new article |
| PUT | `/api/articles/:id` | Update article |
| DELETE | `/api/articles/:id` | Delete article |

### Attachments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/articles/:id/attachments` | Upload file attachment |
| GET | `/api/articles/:id/attachments/:attachmentId` | View/download attachment |
| DELETE | `/api/articles/:id/attachments/:attachmentId` | Delete attachment |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles/:id/comments` | List comments for an article |
| POST | `/api/articles/:id/comments` | Create a comment |
| PUT | `/api/articles/:id/comments/:commentId` | Update a comment |
| DELETE | `/api/articles/:id/comments/:commentId` | Delete a comment |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces` | List workspaces with article counts |
| POST | `/api/workspaces` | Create a workspace |
| PUT | `/api/workspaces/:id` | Update workspace metadata |
| DELETE | `/api/workspaces/:id` | Delete workspace (must be empty) |

### Create Article Example

```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -d '{"title":"My Article","content":"<p>Content here</p>","author":"Author Name"}'
```

## Project Structure

```
├── backend/
│   ├── server.js              # Express + WebSocket server
│   ├── config/
│   │   ├── database.js        # Sequelize configuration (ES modules)
│   │   └── database.cjs       # Sequelize CLI configuration
│   ├── models/
│   │   ├── index.js           # Sequelize connection
│   │   ├── Article.js         # Article model
│   │   ├── Attachment.js      # Attachment blobs
│   │   ├── Workspace.js       # Workspace metadata
│   │   └── Comment.js         # Article comments
│   ├── migrations/
│   │   └── *-create-articles-table.cjs  # Database migrations
│   ├── routes/
│   │   ├── articles.js        # Article + comment routes
│   │   └── workspaces.js      # Workspace CRUD routes
│   ├── utils/
│   │   ├── fileSystem.js      # File operations for attachments
│   │   ├── websocket.js       # WebSocket notifications
│   │   └── notifications.js   # Notification utilities
│   └── data/
│       └── attachments/       # File attachments storage
├── src/
│   ├── App.jsx                # Main app + WebSocket integration
│   ├── components/
│   │   ├── ArticleList.jsx
│   │   ├── ArticleView.jsx    # + attachment display
│   │   ├── ArticleEditor.jsx  # + file upload UI
│   │   ├── WorkspaceSwitcher.jsx
│   │   └── CommentSection.jsx
│   │   └── NotificationDisplay.jsx  # Real-time notifications
│   ├── hooks/
│   │   └── useWebSocket.js    # WebSocket hook
│   └── *.css                  # Component styles
└── package.json
```

## Features

### Backend
- RESTful API with Express
- **PostgreSQL database with Sequelize ORM**
- Database migrations for easy setup
- Workspace-aware article organization (General/Product/Engineering by default)
- Default workspaces are provisioned via `npm run db:seed:all`
- Nested comment persistence with CRUD endpoints
- Input validation (title, content, files)
- Error handling
- CORS enabled
- **📎 File attachments with Multer**
  - Support for images (JPG, PNG, GIF, WEBP) and PDFs
  - File type validation
  - 10MB size limit
  - Secure file storage
- **🔔 WebSocket real-time notifications**
  - Article creation/update/deletion notifications
  - File attachment notifications
  - Auto-reconnection
  - Multi-client broadcast

### Frontend
- Article list view (card grid)
- Article detail view
- Workspace switcher with contextual article filtering
- WYSIWYG editor for creating/editing articles
- Form validation
- Error handling with user-friendly messages
- Loading states
- Responsive design
- **📎 File attachment features**
  - Upload files to articles (images & PDFs)
  - View attachments at top of article (Outlook-style)
  - Click to open attachments in new tab
  - Delete attachments
  - File type and size validation
- **🔔 Real-time notifications**
  - Toast-style notifications
  - Auto-dismiss after 5 seconds
  - Manual close option
  - Color-coded by notification type
  - WebSocket connection status indicator
  - Auto-refresh on updates

## Validation Rules

**Title:**
- Required
- Maximum 200 characters

**Content:**
- Required
- Maximum 1MB

**Author:**
- Optional (defaults to "Anonymous")

## Sample Data

The application includes 3 pre-loaded sample articles demonstrating various content types and formatting.

## Troubleshooting

**Port already in use:**

macOS/Linux:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

Windows:
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Dependencies issue:**

macOS/Linux:
```bash
rm -rf node_modules package-lock.json backend/node_modules backend/package-lock.json
npm install --legacy-peer-deps
cd backend && npm install
```

Windows:
```bash
rmdir /s /q node_modules
del package-lock.json
rmdir /s /q backend\node_modules
del backend\package-lock.json
npm install --legacy-peer-deps
cd backend && npm install
```

**Backend not responding:**
- Check backend terminal for errors
- Verify port 3000 is available
- Restart backend server

**Frontend not loading:**
- Ensure backend is running first
- Check browser console for errors
- Try clearing browser cache

## Development

**Frontend scripts:**
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run linter
```

**Backend scripts:**
```bash
npm start                 # Start server
npm run dev              # Start with auto-restart
npm run db:migrate       # Run database migrations
npm run db:migrate:undo  # Undo last migration
npm run db:migrate:status # Check migration status
```

## Notes

- **Articles are stored in PostgreSQL database** using Sequelize ORM
- File attachments are stored directly in the PostgreSQL `attachments` table (BLOB)
- Attachment metadata lives alongside the binary payload inside the same table
- Attachment filename format: `{articleId}_{timestamp}_{originalName}`
- WebSocket runs on the same port as HTTP server at path `/ws`
- Database uses UUID for article IDs with automatic timestamps
- Comments and workspaces are fully persisted in PostgreSQL (see migrations `3-5`)
- Migrations ensure database schema consistency across environments

## New Features Guide

### Using File Attachments

1. **Upload files:**
   - Create or edit an article
   - Click "Add File" button in the editor
   - Select an image (JPG, PNG, GIF, WEBP) or PDF (max 10MB)
   - File uploads immediately and appears in the list

2. **View attachments:**
   - Open any article
   - Attachments are displayed at the top
   - Click any attachment to view/download it

3. **Delete attachments:**
   - Edit the article
   - Click the 🗑️ button next to any attachment

### Real-Time Notifications

- Notifications appear automatically in the top-right corner
- They show when:
  - Articles are created, updated, or deleted
  - Files are attached or removed
- Notifications auto-dismiss after 5 seconds
- Click ✕ to dismiss manually
- WebSocket status indicator in header shows connection status

