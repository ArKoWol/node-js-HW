# Article Management System

Full-stack application for managing articles with React frontend and Node.js backend.

## Tech Stack

**Frontend**: React 19, Vite, React Quill New (WYSIWYG editor)  
**Backend**: Node.js, Express, File-based storage (JSON)

## Prerequisites

- Node.js v18 or higher
- npm

## Installation

```bash
# Install frontend dependencies (use --legacy-peer-deps due to React 19)
npm install --legacy-peer-deps

# Install backend dependencies
cd backend
npm install
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

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List all articles |
| GET | `/api/articles/:id` | Get specific article |
| POST | `/api/articles` | Create new article |

### Create Article Example

```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -d '{"title":"My Article","content":"<p>Content here</p>","author":"Author Name"}'
```

## Project Structure

```
├── backend/
│   ├── server.js           # Express server
│   ├── routes/
│   │   └── articles.js     # API routes
│   ├── utils/
│   │   └── fileSystem.js   # File operations
│   └── data/               # Article storage (JSON files)
├── src/
│   ├── App.jsx             # Main app component
│   ├── components/
│   │   ├── ArticleList.jsx
│   │   ├── ArticleView.jsx
│   │   └── ArticleEditor.jsx
│   └── *.css               # Component styles
└── package.json
```

## Features

### Backend
- RESTful API with Express
- File-based storage (JSON)
- Input validation (title, content)
- Error handling
- CORS enabled

### Frontend
- Article list view (card grid)
- Article detail view
- WYSIWYG editor for creating articles
- Form validation
- Error handling with user-friendly messages
- Loading states
- Responsive design

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
npm start        # Start server
npm run dev      # Start with auto-restart
```

## Notes

- Articles are stored as individual JSON files in `backend/data/`
- Filename format: `{timestamp}-{title-slug}.json`
- Sample data included for testing
