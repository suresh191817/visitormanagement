# Visitor Management System

A comprehensive visitor management system with OCR capabilities for ID card scanning and real-time tracking.

## Features

- **Mobile-First Design**: Optimized for mobile devices with touch-friendly interface
- **OCR Integration**: Automatic text extraction from ID cards and license plates
- **Real-Time Dashboard**: Live statistics and status tracking
- **Role-Based Access**: Admin and user permissions
- **Camera Integration**: Direct camera capture for ID scanning
- **Vehicle Tracking**: Complete vehicle entry/exit management
- **Activity Logging**: Comprehensive audit trail
- **Session Management**: Secure authentication system

## Quick Start

1. **Prerequisites**:
   - Node.js 18+
   - PostgreSQL 14+

2. **Installation**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Database Setup**:
   ```bash
   createdb visitor_management
   npm run db:push
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

6. **Access Application**:
   - URL: http://localhost:5000
   - Default admin: `admin` / `admin123`

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui
- Vite for build tooling
- TanStack Query for state management
- Tesseract.js for OCR
- Wouter for routing

### Backend
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Session-based authentication
- bcrypt for password hashing

### Development Tools
- TypeScript with strict mode
- ESLint for code quality
- Drizzle Kit for database management

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Visitors
- `GET /api/visitors` - Get all visitors
- `POST /api/visitors` - Create new visitor
- `GET /api/visitors/inside` - Get visitors currently inside
- `POST /api/visitors/:id/exit` - Mark visitor exit

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `POST /api/vehicles` - Register new vehicle
- `GET /api/vehicles/inside` - Get vehicles currently inside
- `POST /api/vehicles/:id/exit` - Mark vehicle exit

### Statistics
- `GET /api/stats` - Get dashboard statistics
- `GET /api/activity-logs` - Get activity logs

### Admin Only
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `POST /api/users/:id/deactivate` - Deactivate user

## Database Schema

### Users
- Authentication and role management
- Admin and regular user roles

### Visitors
- Personal information and ID details
- Entry/exit timestamps
- Status tracking (IN/OUT)

### Vehicles
- Vehicle information and owner details
- Entry/exit timestamps
- Status tracking (IN/OUT)

### Activity Logs
- Comprehensive audit trail
- All entry/exit activities
- User action tracking

## Development

### Project Structure
```
├── client/           # React frontend
├── server/           # Express backend  
├── shared/           # Shared types and schemas
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── vite.config.ts    # Vite configuration
└── drizzle.config.ts # Database configuration
```

### Key Commands
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run db:push` - Database schema update

### OCR Configuration
The system uses Tesseract.js for OCR with enhanced algorithms for:
- ID card text extraction
- License plate recognition
- Smart text filtering
- Confidence scoring

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
SESSION_SECRET=strong-random-secret
```

## Security

- Session-based authentication
- Password hashing with bcrypt
- Role-based access control
- Environment variable protection
- Input validation with Zod

## License

MIT License - See LICENSE file for details