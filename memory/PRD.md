# PMR Medical Education Platform - Product Requirements Document

## Technical Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Translation:** Google Translate API via emergentintegrations

## What's Been Implemented

### Core Features (Complete)
- [x] JWT-based authentication with role management
- [x] Two-panel responsive layout with collapsible sidebar
- [x] Blue pastel theme with dark/light mode toggle
- [x] Disease pages with structured sections
- [x] Floating Table of Contents
- [x] Bookmarks and personal notes
- [x] Full-text search
- [x] Admin panel with CRUD operations

### Multilingual System (Complete)
- [x] Site-wide Language Dropdown (🇬🇧 EN / 🇵🇹 PT / 🇪🇸 ES)
- [x] Portuguese from Portugal (not Brazil)
- [x] Full UI Translation - all interface elements
- [x] Disease content auto-translation

### Category Reordering (Complete)
- [x] **Sidebar Reorder Buttons** - Up/Down arrows appear on hover for admins
- [x] **Admin Panel Reorder** - Also available in Admin > Categories tab
- [x] Changes save instantly and reflect across the app

### Compact Content Layout (Complete)
- [x] **Narrower TOC** - w-48 (was w-56), smaller text
- [x] **Wider Content Area** - max-w-4xl (was max-w-3xl)
- [x] **Smaller Title** - text-2xl/3xl (was text-3xl/4xl)
- [x] **Compact Section Text** - text-sm with tighter spacing

### Hyphen Symbol Fix (Complete)
- [x] Only "- " at start of line becomes bullet
- [x] "-" in middle of text or without space is preserved as-is

## Test Credentials
- Admin: admin@pmr.edu / admin123

## Remaining/Future Tasks

### P1 (High Priority)
- [ ] URL-based language prefix (/en/, /pt/) for SEO
- [ ] Password reset & email verification

### P2 (Medium Priority)
- [ ] Translate category names dynamically
- [ ] Refactor DiseasePage.js into smaller components

### P3 (Lower Priority)
- [ ] Export disease as PDF
- [ ] Collaborative editing
