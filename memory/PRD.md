# PMR Medical Education Platform - Product Requirements Document

## Original Problem Statement
Create a full-stack web application for a Medical Education Platform focused on Physical Medicine and Rehabilitation (PMR).

## Technical Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI components
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** JWT-based with role management
- **Translation:** Google Translate API via emergentintegrations

## What's Been Implemented

### Core Features (Complete)
- [x] JWT-based authentication with role management (admin, editor, student)
- [x] Two-panel responsive layout with collapsible sidebar
- [x] Blue pastel theme with dark/light mode toggle
- [x] Disease pages with structured sections
- [x] Floating Table of Contents with scroll spy
- [x] Bookmarks and personal notes functionality
- [x] Full-text search across diseases
- [x] Admin panel with CRUD operations

### Multilingual System (Complete - Feb 2025)
- [x] **Site-wide Language Dropdown** - Dropdown selector with 🇬🇧 EN / 🇵🇹 PT / 🇪🇸 ES
- [x] **Portuguese from Portugal** - Changed from 🇧🇷 Brazil to 🇵🇹 Portugal flag
- [x] **Full UI Translation** - All interface elements translated:
  - Sidebar navigation (Dashboard, Bookmarks, My Notes, etc.)
  - Table of Contents (On This Page, section names)
  - Buttons (Save, Notes, Edit, Done, Add more text)
  - Disease content (titles, definitions, all sections)
  - Search placeholders
  - Login/Register pages
  - Admin panel
- [x] **Language Persistence** - Selected language persists during navigation
- [x] **Auto-translation on Save** - Content translated to all languages when saving

### Category Reordering (Complete - Feb 2025)
- [x] **Admin Category Reorder** - Up/Down arrow buttons to reorder categories
- [x] **Backend API** - `/api/categories/reorder` endpoint for bulk ordering
- [x] **Real-time UI Update** - Categories reorder instantly in sidebar

### Other Recent Features
- [x] Rich Text Editor with formatting toolbar
- [x] "Add More Text" button in each section
- [x] Media Upload from computer
- [x] Disease Search Bar for quick switching

## Architecture

```
/app
├── backend/
│   ├── server.py         # FastAPI with all endpoints
│   └── .env              # MONGO_URL, JWT_SECRET, EMERGENT_LLM_KEY
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── LanguageContext.js  # UI_TRANSLATIONS + language state
│   │   ├── components/
│   │   │   └── layout/MainLayout.js  # Language dropdown in header
│   │   └── pages/
│   │       ├── DiseasePage.js
│   │       ├── DashboardPage.js
│   │       ├── AdminPage.js (with category reorder)
│   │       └── LoginPage.js
│   └── tailwind.config.js
└── test_reports/
```

## API Endpoints
- `PUT /api/categories/reorder` - Bulk reorder categories (admin only)
- `POST /api/translate-disease/{id}` - Translate disease content
- All standard CRUD endpoints for diseases, categories, users

## Test Credentials
- Admin: admin@pmr.edu / admin123

## Remaining/Future Tasks

### P1 (High Priority)
- [ ] URL-based language prefix (/en/, /pt/, /es/) for SEO
- [ ] Password reset functionality
- [ ] Email verification

### P2 (Medium Priority)
- [ ] Translate category names dynamically
- [ ] Refactor DiseasePage.js into smaller components
- [ ] Add more PMR diseases to seed data

### P3 (Lower Priority)
- [ ] Export disease as PDF
- [ ] Collaborative editing
- [ ] Progress tracking for students
