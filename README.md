# Academix - Academic Management System

A modern MERN-stack application for managing academic activities with role-based access control.

## Features

- 🔐 JWT-based authentication
- 👥 Three user roles: Student, Teacher, Club Coordinator
- 🎨 Dark/Light theme support
- 🛡️ Role-Based Access Control (RBAC)
- 📱 Responsive and modern UI
- 🚀 Built with React, Express, MongoDB, and Node.js

## Project Structure

```
clg_project/
├── backend/          # Express.js backend
│   ├── config/       # Database configuration
│   ├── middleware/   # Auth and RBAC middleware
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API routes
│   └── utils/        # Utility functions
└── frontend/         # React frontend
    ├── src/
    │   ├── components/  # React components
    │   ├── context/     # React contexts (Auth, Theme)
    │   └── pages/       # Page components
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## MongoDB Setup

### Option 1: Local MongoDB

1. **Install MongoDB** (if not already installed):
   - **macOS**: `brew install mongodb-community`
   - **Windows**: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - **Linux**: Follow [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB service**:
   - **macOS**: `brew services start mongodb-community` or `mongod`
   - **Windows**: MongoDB should start as a service automatically
   - **Linux**: `sudo systemctl start mongod` or `mongod`

3. **Verify MongoDB is running**:
   ```bash
   mongosh
   # or
   mongo
   ```

### Option 2: MongoDB Atlas (Cloud - Recommended for Development)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Get your connection string from Atlas dashboard
4. Update `.env` file with your Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/academix?retryWrites=true&w=majority
   ```

### Troubleshooting

If you see `ECONNREFUSED` error:
- Make sure MongoDB is running: `mongosh` or check MongoDB service status
- Verify your `MONGODB_URI` in `.env` file is correct
- For local MongoDB, ensure it's running on port 27017

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://dbuser:<db_password>@cluster0.3r3vneq.mongodb.net/academix?retryWrites=true&w=majority
JWT_SECRET=academix_super_secret_jwt_key_2024_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

   **Important**: Replace `<db_password>` with your actual MongoDB Atlas database password!

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Request/Response Examples

#### Register
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Student",
  "studentId": "STU001",
  "department": "Computer Science",
  "year": "2nd Year"
}
```

#### Login
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

## MongoDB Schemas

### User Schema
- name, email, password
- role (reference to Role)
- studentId, department, year (optional)
- isActive, lastLogin

### Role Schema
- name (Student, Teacher, Club Coordinator)
- permissions, description

### Course Schema
- courseCode, courseName, description
- credits, department
- teacher, students
- schedule, semester, year

### Assignment Schema
- title, description
- course, teacher
- dueDate, maxScore
- submissions array

### Club Schema
- name, description
- coordinator, members
- events array

## Protected Routes

The frontend includes protected routes based on user roles:
- `/dashboard` - Accessible to all authenticated users
- `/student/*` - Only for Students
- `/teacher/*` - Only for Teachers
- `/coordinator/*` - Only for Club Coordinators

## Theme System

The application supports both dark and light themes. Users can toggle between themes using the theme toggle button in the navigation.

## Development

### Backend
- Uses Express.js with ES6 modules
- JWT authentication with bcrypt password hashing
- Mongoose for MongoDB ODM
- Express-validator for input validation

### Frontend
- React 18 with Vite
- React Router for routing
- Context API for state management
- Axios for API calls
- React Icons for icons

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control middleware
- Input validation
- Protected API routes

## Next Steps

This is Week 1 implementation. Future features to be added:
- Course management
- Assignment submission and grading
- Club management
- Event management
- Notifications
- File uploads
- And more...

## License

ISC
