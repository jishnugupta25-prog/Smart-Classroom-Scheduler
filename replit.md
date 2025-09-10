# Overview

This is a full-stack Smart Classroom Scheduler application built for educational institutions to manage classroom bookings and scheduling. The system provides role-based access for Faculty, Students, and Admins with features like room booking, calendar visualization, and booking management. It's designed with a modern tech stack using React for the frontend and Express.js with PostgreSQL for the backend.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built using **React** with **TypeScript** and follows a component-based architecture:

- **Routing**: Uses Wouter for lightweight client-side routing with protected routes based on user authentication
- **State Management**: Leverages React Query (@tanstack/react-query) for server state management and caching
- **Styling**: Implements Tailwind CSS with shadcn/ui components for consistent, accessible UI design
- **Form Handling**: Uses React Hook Form with Zod validation for type-safe form management
- **Authentication**: Context-based authentication system with role-based access control

Key architectural decisions:
- **Component Organization**: Components are organized by feature (layout, calendar, ui) with reusable UI components
- **Type Safety**: Full TypeScript implementation with shared schemas between client and server
- **Responsive Design**: Mobile-first approach with responsive navigation and layouts

## Backend Architecture
The server-side uses **Node.js** with **Express.js** following RESTful API principles:

- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Passport.js with local strategy and session-based authentication
- **Session Management**: Express sessions with PostgreSQL session store
- **API Structure**: RESTful endpoints organized by resource (users, rooms, bookings)

Key architectural decisions:
- **In-Memory Fallback**: Implements memory storage as fallback for development/testing environments
- **Schema Validation**: Uses Zod schemas for runtime validation of API requests
- **Password Security**: Implements secure password hashing using Node.js crypto module with scrypt
- **Role-Based Access**: Middleware-based authorization for different user roles (faculty, student, admin)

## Data Storage Solutions
The application uses **PostgreSQL** as the primary database with the following schema design:

- **Users Table**: Stores user credentials, roles, and profile information
- **Rooms Table**: Contains classroom information (name, capacity)
- **Bookings Table**: Manages booking records with foreign key relationships to users and rooms

Key design decisions:
- **UUID Primary Keys**: Uses PostgreSQL's gen_random_uuid() for secure, distributed-friendly IDs
- **Referential Integrity**: Implements foreign key constraints with cascade delete for data consistency
- **Status Tracking**: Booking status enum (pending, confirmed, cancelled) for workflow management

## Authentication and Authorization
The system implements a comprehensive auth system:

- **Session-Based Authentication**: Uses Express sessions for stateful authentication
- **Role-Based Access Control**: Three distinct roles with different permissions:
  - **Faculty**: Can create/cancel their own bookings, view full calendar
  - **Students**: Read-only access to calendar and booking details
  - **Admin**: Full access to room management and all bookings
- **Protected Routes**: Frontend route protection based on authentication status and user roles

## External Dependencies

### Frontend Dependencies
- **@radix-ui/**: Comprehensive set of accessible UI primitives for building the component library
- **@tanstack/react-query**: Powerful data synchronization library for server state management
- **wouter**: Lightweight routing library chosen for minimal bundle size
- **react-hook-form**: Performant form library with minimal re-renders
- **zod**: Schema validation library for type-safe data validation
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **date-fns**: Date manipulation library for calendar and booking features

### Backend Dependencies
- **drizzle-orm**: Type-safe SQL query builder and ORM for PostgreSQL integration
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon database connections
- **passport**: Authentication middleware with local strategy support
- **express-session**: Session middleware for maintaining user sessions
- **connect-pg-simple**: PostgreSQL session store for persistent sessions
- **bcryptjs**: Password hashing library for secure credential storage

### Development Tools
- **vite**: Fast build tool and development server for the frontend
- **tsx**: TypeScript execution environment for the backend
- **esbuild**: Bundler for production builds
- **drizzle-kit**: CLI tool for database migrations and schema management

### Database Service
- **PostgreSQL**: Primary database system, likely hosted on Neon or similar serverless PostgreSQL provider
- **Connection**: Uses DATABASE_URL environment variable for database connectivity