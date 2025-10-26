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
npm install --legacy-peer-deps
cd backend && npm install && cd ..
```

## Running the Application

### Quick Start (Recommended)

**Windows:**
```bash
start-servers.bat
```

**macOS/Linux:**
```bash
chmod +x start-servers.sh
./start-servers.sh
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
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Dependencies issue:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
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

- Articles stored as individual JSON files in `backend/data/`
- Filenames: `{timestamp}-{title-slug}.json`
- React Quill New used for React 19 compatibility
- Use `--legacy-peer-deps` flag for npm install due to React 19
