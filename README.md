# QR Attendance System

A modern QR code-based attendance system built with MERN stack, designed for educational institutions.

## Features

- **Teacher Interface**: Create sessions, generate QR codes, monitor attendance in real-time
- **Student Interface**: Scan QR codes to mark attendance
- **Admin Interface**: View reports, manage users and courses
- **Real-time Updates**: Live attendance tracking using WebSockets
- **Secure**: JWT authentication with role-based access control

## Tech Stack

- **Frontend**: React, TypeScript, Material-UI, Socket.io-client
- **Backend**: Node.js, Express, TypeScript, Socket.io
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Deployment**: Vercel (Frontend), Vercel Functions (Backend)

## Quick Start

1. Install dependencies:

```bash
npm run install-all
```

2. Set up environment variables:

- Copy `backend/.env.example` to `backend/.env`
- Copy `frontend/.env.example` to `frontend/.env`

3. Start development servers:

```bash
npm run dev
```

## Project Structure

```
qr-attendance-system/
├── backend/          # Node.js/Express API
├── frontend/         # React application
├── docs/            # Documentation
└── scripts/         # Deployment scripts
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token

### Sessions

- `POST /api/sessions` - Create attendance session
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/close` - Close session
- `GET /api/sessions/:id/qr` - Get QR code data

### Attendance

- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/history` - Get attendance history
- `GET /api/attendance/session/:id` - Get session attendance

## Development

This project uses a monorepo structure with separate frontend and backend applications that can be developed and deployed independently.

