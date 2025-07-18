# Visitor Management System - Local Development Setup

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git installed

## Quick Start

1. **Clone or download the project files**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/visitor_management
   SESSION_SECRET=your-secret-key-here-change-this-in-production
   NODE_ENV=development
   ```

4. **Set up the database**:
   ```bash
   # Create database
   createdb visitor_management
   
   # Push schema to database
   npm run db:push
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   - Open http://localhost:5000 in your browser
   - Default admin login: `admin` / `admin123`

## Database Setup

### PostgreSQL Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### Database Configuration

1. **Create a database user** (optional):
   ```sql
   sudo -u postgres psql
   CREATE USER visitor_user WITH PASSWORD 'your_password';
   CREATE DATABASE visitor_management OWNER visitor_user;
   GRANT ALL PRIVILEGES ON DATABASE visitor_management TO visitor_user;
   ```

2. **Update DATABASE_URL** in `.env`:
   ```env
   DATABASE_URL=postgresql://visitor_user:your_password@localhost:5432/visitor_management
   ```

## Project Structure

```
visitor-management/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities (OCR, API client)
│   └── index.html
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── auth.ts            # Authentication logic
│   ├── storage.ts         # Database operations
│   └── db.ts              # Database connection
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema and validation
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── drizzle.config.ts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check TypeScript
- `npm run db:push` - Push schema changes to database

## Features

### Frontend
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui components
- Mobile-first responsive design
- Camera integration for ID capture
- OCR text extraction using Tesseract.js
- Real-time dashboard with statistics

### Backend
- Express.js with TypeScript
- PostgreSQL database with Drizzle ORM
- Session-based authentication
- RESTful API endpoints
- Role-based access control (admin/user)

### Database Schema
- Users table with role-based permissions
- Visitors table for guest management
- Vehicles table for vehicle tracking
- Activity logs for audit trail
- Session storage for authentication

## Default Admin Account

The system creates a default admin account on first run:
- Username: `admin`
- Password: `admin123`
- Role: `admin`

**Change this password immediately in production!**

## Development Tips

1. **Database changes**: After modifying `shared/schema.ts`, run `npm run db:push` to update the database schema.

2. **Adding new pages**: Create components in `client/src/pages/` and register them in `client/src/App.tsx`.

3. **API endpoints**: Add new routes in `server/routes.ts` and corresponding storage methods in `server/storage.ts`.

4. **Authentication**: Use `requireAuth` middleware for protected routes and `requireAdmin` for admin-only routes.

5. **Hot reload**: The development server automatically reloads on file changes.

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set production environment variables**:
   ```env
   NODE_ENV=production
   DATABASE_URL=your_production_database_url
   SESSION_SECRET=strong_random_secret_key
   ```

3. **Start the production server**:
   ```bash
   npm start
   ```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify database and user exist
- Check firewall/network settings

### OCR Not Working
- Ensure camera permissions are granted
- Test on HTTPS (required for camera access)
- Check browser console for errors

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run check`
- Verify all dependencies are installed

## License

MIT License - See LICENSE file for details