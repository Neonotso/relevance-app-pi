# Relevance Task App

A React-based task management application that uses a relevance-based review system to help you prioritize and organize your tasks.

## Features

- **Smart Relevance Scoring**: Tasks are automatically scored based on deadlines, recency, and review status
- **Review Mode**: Triage tasks one at a time with thoughtful prompts
- **Task States**:
  - **Vault**: Stored tasks that aren't currently active
  - **Active**: Tasks currently in focus
  - **Today**: Pick up to 3 tasks for today (with visual indicators)
  - **Archive**: Completed or retired tasks
- **Snooze Functionality**: Delay tasks for 1 week, 2 weeks, 1 month, or 3 months
- **Tag System**: Categorize tasks as music, admin, personal, or custom tags
- **Daily Reset**: Automatically marks inactive tasks as vault after 14 days

## How to Use

The app is running at: **http://localhost:5173**

### Keyboard Shortcuts
- In review mode, tap actions to classify tasks
- Swipe left/right to dismiss tasks
- Navigate between tabs using the bottom navigation bar

### Task Actions
1. **Review**: Start a review session to triage tasks
2. **Today**: Pick tasks for the day (max 3)
3. **Active**: View and add current tasks
4. **Vault**: Browse archived/cached tasks
5. **Archive**: View completed tasks

## Files

- `src/App.jsx` - Main application code
- `src/main.jsx` - React entry point
- `vite.config.js` - Vite configuration
- `index.html` - HTML template
- `dist/` - Built output

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Technical Details

- Built with React 18
- Vite for bundling
- No external dependencies (pure React)
- Local storage for persistence (in a real deployment)
