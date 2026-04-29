# Lebanon Tourism Web Application

## Overview
A comprehensive Lebanon Tourism web application featuring tourist destinations, transport booking, interactive maps, and trip management.

## Current State
- **Frontend**: Fully functional React/Vite application with Tailwind CSS
- **Backend**: Express.js API with graceful database fallback
- **Database**: Ready for PostgreSQL (currently using in-memory storage)

## Features Implemented
1. **Interactive Map** - Leaflet-based map showing all points of interest with clickable markers
2. **POI Details** - Detailed pages for each destination with booking functionality
3. **Transport Booking** - Vehicle selection with price calculator and PDF ticket download
4. **Date Picker** - Calendar-based date selection for bookings
5. **PDF Downloads** - Generate tickets for transport and POI bookings using jsPDF
6. **Chatbot** - Integrated chatbot assistant in the navigation bar
7. **21 Destinations** - Curated list of tourist spots across 6 Lebanese regions

## Tech Stack
- React 18 with TypeScript
- Vite for development/bundling
- Tailwind CSS + shadcn/ui components
- Leaflet for maps (react-leaflet)
- jsPDF + html2canvas for PDF generation
- Express.js backend
- Drizzle ORM (PostgreSQL ready)

## Database Setup
To enable persistent data storage:
1. Open the Database tab in your Replit workspace
2. Create a new PostgreSQL database
3. The app will automatically detect DATABASE_URL and switch from in-memory to PostgreSQL storage

## File Structure
```
LebanonTourismER-1/
├── client/src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route pages (Home, Explore, Transport, etc.)
│   └── lib/            # Data and utilities
├── server/
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Storage interface with DB fallback
│   └── database-storage.ts # PostgreSQL implementation
└── shared/
    └── schema.ts       # Database schema (Drizzle)
```

## API Endpoints
- `POST /api/transport/book` - Create transport booking
- `GET /api/transport/bookings` - List all bookings
- `GET /api/transport/bookings/:id` - Get booking by ID
- `PATCH /api/transport/bookings/:id/status` - Update booking status

## Recent Changes (Nov 30, 2025)
- Added SSR-safe map component with loading state
- Improved transport booking validation (requires car, name, valid distance)
- Created in-memory storage fallback for when database is not available
- Added API routes for transport booking CRUD operations
