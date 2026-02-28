# PMR Medical Education Platform - Product Requirements Document

## Original Problem Statement
Create a full-stack web application for a Medical Education Platform focused on Physical Medicine and Rehabilitation (PMR).

## Core Requirements
- **Authentication:** Secure email/password login with role-based access (Admin, Editor, Student)
- **Layout:** Two-panel layout with fixed, collapsible left sidebar and main content panel
- **Design:** Clean, academic, book-style with blue pastel color scheme
- **Sidebar:** PMR categories organized alphabetically with search and tag-based filtering
- **Disease Page:** Structured sections with markdown support, embedded images, references
- **Admin Panel:** Full CRUD for diseases/categories, WYSIWYG editor, image uploads, version history
- **Additional Features:** Responsive design, dark/light mode, bookmarking, notes, full-text search

## Technical Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI components
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** JWT-based with role management
- **Translation:** Google Translate API via emergentintegrations (OpenAI GPT-4.1-mini)

## What's Been Implemented

### Core Features (Complete)
- [x] JWT-based authentication with role management (admin, editor, student)
- [x] Two-panel responsive layout with collapsible sidebar
- [x] Blue pastel theme with dark/light mode toggle
- [x] Disease pages with structured sections (Definition, Epidemiology, etc.)
- [x] Floating Table of Contents with scroll spy
- [x] Bookmarks and personal notes functionality
- [x] Full-text search across diseases
- [x] Admin panel with CRUD operations
- [x] Version history for diseases

### Multilingual System (Complete - Feb 2025)
- [x] **Site-wide Language Dropdown** - Dropdown selector in header showing 🇬🇧 EN / 🇧🇷 PT / 🇪🇸 ES
- [x] **Clear Active Language Indicator** - Checkmark (✓) shows current language
- [x] **Dynamic Content Re-rendering** - Content updates without page reload
- [x] **Language Persistence** - Selected language persists during navigation (localStorage)
- [x] **Auto-translation on Demand** - Diseases translated via LLM when switching languages
- [x] **Translation Fields in API** - Backend returns translated fields (name_pt, definition_pt, etc.)

### Recent Implementations
- [x] **Rich Text Editor** - Full formatting toolbar (Bold, Italic, Underline, Bullet/Numbered lists)
- [x] **"Add More Text" Button** - In each section to add more content
- [x] **Media Upload** - Support for both URL and local file upload
- [x] **Disease Search Bar** - Quick switch search at top of disease page

## Architecture

```
/app
├── backend/
│   ├── server.py         # FastAPI with all endpoints + translation
│   └── .env              # MONGO_URL, JWT_SECRET, EMERGENT_LLM_KEY
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/
│   │   │   │   ├── RichTextEditor.js  # Rich text with markdown
│   │   │   │   └── SectionMedia.js    # Media upload/display
│   │   │   ├── layout/
│   │   │   │   └── MainLayout.js      # Two-panel layout + language dropdown
│   │   │   ├── DiseaseSearch.js       # Quick search component
│   │   │   └── LanguageToggle.js      # Language switcher (legacy)
│   │   ├── contexts/
│   │   │   ├── AuthContext.js
│   │   │   ├── ThemeContext.js
│   │   │   └── LanguageContext.js     # Global language state
│   │   └── pages/
│   │       ├── DiseasePage.js         # Main disease view with translation
│   │       ├── DashboardPage.js
│   │       └── AdminPage.js
│   └── tailwind.config.js
└── test_reports/
```

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/categories` - List all categories
- `GET /api/diseases` - List diseases (with search/filter)
- `GET /api/diseases/{id}` - Get single disease (includes translated fields)
- `PUT /api/diseases/{id}` - Update disease (admin/editor)
- `POST /api/translate-disease/{id}` - Auto-translate disease content to target language
- `GET /api/bookmarks` - User's bookmarks
- `GET /api/notes` - User's notes

## Test Credentials
- Admin: admin@pmr.edu / admin123

## Remaining/Future Tasks

### P1 (High Priority)
- [ ] URL-based language prefix (/en/, /pt/, /es/) for SEO
- [ ] Password reset functionality
- [ ] Email verification

### P2 (Medium Priority)
- [ ] Refactor DiseasePage.js into smaller components
- [ ] Add more PMR diseases to seed data
- [ ] Image optimization for media uploads
- [ ] Translate sidebar categories and UI labels

### P3 (Lower Priority)
- [ ] Export disease as PDF
- [ ] Collaborative editing
- [ ] Progress tracking for students
