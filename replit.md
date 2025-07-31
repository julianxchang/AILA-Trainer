# AI Model Comparison Platform

## Overview

This is a full-stack web application designed for legal professionals to compare AI model responses side-by-side. The platform allows users to submit legal prompts and receive responses from multiple AI models (currently GPT-4 Turbo and Claude 3 Opus), then compare and rate these responses to help inform their AI tool selection decisions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design
- **Development Server**: Custom Vite integration for hot module replacement
- **Error Handling**: Centralized error middleware with structured responses

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Development Storage**: In-memory storage implementation for rapid prototyping
- **Session Management**: PostgreSQL-based session storage with connect-pg-simple

## Key Components

### Authentication System
- **Approach**: JWT-based authentication with localStorage persistence
- **User Management**: Simple user model with firm association
- **Demo Mode**: Fallback demo user for development and testing
- **Security**: Token-based authentication ready for production JWT validation

### Chat Session Management
- **Session Creation**: Users submit legal prompts that generate new chat sessions
- **AI Integration**: Simulated AI responses (ready for real API integration)
- **Response Storage**: Both model responses stored with session metadata
- **User Association**: All sessions linked to authenticated users

### Comparison System
- **Side-by-Side Display**: Two-panel interface for comparing AI responses
- **Voting Mechanism**: Users can vote for preferred responses
- **Rating System**: Numerical rating system for individual responses
- **Analytics**: Comparison data stored for analysis and insights

### UI Component System
- **Design System**: Consistent component library using Shadcn/ui
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Theme Support**: Light/dark mode with CSS custom properties
- **Accessibility**: ARIA-compliant components with keyboard navigation

## Data Flow

1. **User Authentication**: JWT token stored in localStorage, user context managed globally
2. **Prompt Submission**: User submits legal prompt → API creates chat session → AI models generate responses
3. **Response Display**: Responses fetched and displayed in side-by-side panels
4. **Comparison Recording**: User votes/ratings sent to API → stored in comparisons table
5. **Analytics**: Aggregated comparison data available for insights and reporting

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client for Neon
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React routing
- **zod**: Runtime type validation and schema definition

### UI Dependencies
- **@radix-ui/***: Comprehensive accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Modern icon library
- **class-variance-authority**: Component variant management

### Development Dependencies
- **tsx**: TypeScript execution for development server
- **esbuild**: Fast JavaScript bundler for production builds
- **vite**: Development server and build tool

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Development**: Hot reload with Vite middleware integration
- **Production**: Express serves static files and API routes
- **Database**: Environment-based DATABASE_URL configuration

### Hosting Considerations
- **Static Assets**: Frontend built as static files for CDN deployment
- **API Server**: Node.js server deployable to any platform supporting Express
- **Database**: Serverless PostgreSQL via Neon for scalable data storage
- **Session Storage**: PostgreSQL-backed sessions for production reliability

### Development Workflow
- **Local Development**: `npm run dev` starts integrated development server
- **Type Checking**: `npm run check` validates TypeScript across full stack
- **Database Management**: Drizzle Kit handles schema changes and migrations
- **Hot Reload**: Full-stack hot reload during development