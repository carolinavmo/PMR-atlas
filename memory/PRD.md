# PMR Medical Education Platform - Product Requirements Document

## Technical Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Translation:** Google Translate API via emergentintegrations

## What's Been Implemented

### Core Features (Complete)
- [x] JWT-based authentication with role management (Admin, Student)
- [x] Two-panel responsive layout with collapsible sidebar
- [x] Blue pastel theme with dark/light mode toggle
- [x] Disease pages with structured sections
- [x] Floating Table of Contents (non-overlapping)
- [x] Bookmarks and personal notes
- [x] Full-text search
- [x] Admin panel with CRUD operations

### Multilingual System (Complete)
- [x] Site-wide Language Dropdown (EN / PT / ES)
- [x] Portuguese from Portugal (not Brazil)
- [x] Full UI Translation - all interface elements
- [x] Disease content auto-translation

### Inline Editing System (Complete - Feb 28, 2026)
- [x] **Per-Section Inline Editing** - Each section (Definition, Epidemiology, etc.) editable individually
- [x] **Hover Edit Button** - Edit button appears on hover for admins only
- [x] **"Save This Language Only"** - Saves changes to current language (EN/PT/ES) only
- [x] **"Save + Translate All"** - Saves to current language AND auto-translates to other languages
- [x] **Confirmation Dialog** - Warning before overwriting translations
- [x] **"Last Edited" Indicator** - Shows who edited and when (visible to all users)
- [x] **Translation Globe Icon** - Appears next to "Last Edited" for translated sections
- [x] **Role-Based Access** - Only Admins see Edit button; Students see read-only content
- [x] **Per-Section Edit Metadata** - Stored in `{section_id}_edit_meta` field with editor name, timestamp
- [x] **API Endpoints** - `/api/diseases/{id}/inline-save` and `/api/diseases/{id}/inline-save-translate`

### Category Reordering (Complete)
- [x] **Drag-and-Drop Reordering** - Admins can drag categories in sidebar
- [x] **Admin Panel Reorder** - Also available in Admin > Categories tab
- [x] Changes save instantly and reflect across the app

### Compact Content Layout (Complete)
- [x] **Narrower TOC** - w-48 (was w-56), smaller text
- [x] **Wider Content Area** - Full width with right margin for TOC on xl screens
- [x] **Smaller Title** - text-2xl/3xl (was text-3xl/4xl)
- [x] **Compact Section Text** - text-sm with tighter spacing

### Hyphen Symbol Fix (Complete)
- [x] Only "- " at start of line becomes bullet
- [x] "-" in middle of text or without space is preserved as-is

## Test Credentials
- **Admin:** admin@pmr.edu / admin123
- **Viewer/Student:** test@test.com / password

## Remaining/Future Tasks

### P1 (High Priority)
- [ ] URL-based language prefix (/en/, /pt/) for SEO
- [ ] Password reset & email verification
- [ ] Dark/Light mode toggle UI implementation

### P2 (Medium Priority)
- [ ] Test Bookmarks & Notes end-to-end
- [ ] Test Full-Text Search end-to-end
- [ ] Translate category names dynamically
- [ ] Refactor DiseasePage.js into smaller components (800+ lines)

### P3 (Lower Priority)
- [ ] Export disease as PDF
- [ ] Collaborative editing
- [ ] Student progress tracking
