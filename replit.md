# Video Generation Platform

## Overview

This is a full-stack video generation platform that enables users to create AI-generated videos using text prompts. The application integrates with the Luma Dream Machine API to generate high-quality videos from text descriptions. Built with React, Express, and PostgreSQL, it provides a modern, responsive interface for video creation with real-time status tracking and progress monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with **React** using TypeScript and follows a modern component-based architecture:

- **UI Framework**: Utilizes Shadcn/ui components built on Radix UI primitives for consistent, accessible design
- **Styling**: TailwindCSS with custom CSS variables for theming and responsive design
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

The application features a single-page video generator interface with real-time status updates, video preview capabilities, and download functionality.

### Backend Architecture
The server-side uses **Express.js** with TypeScript in an ESM environment:

- **Framework**: Express.js with middleware for JSON parsing, CORS, and error handling
- **API Design**: RESTful API structure with centralized route management
- **Validation**: Zod schemas shared between client and server for consistent data validation
- **External Integration**: Luma Dream Machine API for video generation services
- **Development**: Hot-reload development server with Vite integration

### Data Storage Solutions
The application uses a **PostgreSQL** database with Drizzle ORM:

- **Database**: PostgreSQL hosted on Neon Database service
- **ORM**: Drizzle ORM for type-safe database queries and schema management
- **Migrations**: Drizzle Kit for database schema migrations
- **In-Memory Storage**: Temporary memory storage implementation for development/testing

### Authentication and Authorization
Currently implements a basic session management system:

- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple
- **Security**: Basic middleware for request logging and error handling

### External Service Integrations

**Luma Dream Machine API**: Primary video generation service that converts text prompts into high-quality videos. The integration supports:
- Text-to-video generation with customizable prompts
- Multiple duration options (5-10 seconds)
- 16:9 aspect ratio output
- Real-time status tracking and progress monitoring
- Asynchronous video processing with polling mechanism

**Neon Database**: Serverless PostgreSQL database service for production data storage with automatic scaling and connection pooling.

### Design Patterns and Architectural Decisions

**Shared Schema Approach**: Common TypeScript types and Zod validation schemas are shared between client and server in a dedicated `shared/` directory, ensuring type safety and consistency across the full stack.

**Component-Based UI**: The frontend uses a modular component architecture with reusable UI components, custom hooks for business logic, and clear separation of concerns between presentation and data management layers.

**API-First Design**: The backend exposes a clean REST API that can be consumed by multiple clients, with proper error handling, request/response validation, and structured JSON responses.

**Real-Time Updates**: Implements polling-based real-time updates for video generation status, providing users with immediate feedback on processing progress without requiring page refreshes.