# Medical Intake Form Application

## Overview

This is a React-based medical intake form application designed for healthcare services. The application features a comprehensive patient intake form that collects personal information, insurance details, clinical history, and reasons for referral. The form is built with privacy in mind, containing Protected Health Information (PHI) and operating as a frontend-only solution that submits data to an external API endpoint.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application is built using React with TypeScript and leverages modern development practices:

**Component Structure**: Uses a modular component architecture with reusable UI components built on Radix UI primitives. The main form is structured in `IntakeForm.tsx` with supporting components like `FormField`, `FormResponse`, and `SubmitButton` for better maintainability.

**Styling System**: Implements Tailwind CSS for styling with a custom design system configuration. Uses CSS variables for theming support and includes a professional theme variant with customizable colors and radius settings.

**Form Management**: Utilizes React Hook Form with Zod validation for robust form handling. The form includes complex validation logic for conditional fields and multi-step data collection.

**State Management**: Uses TanStack Query (React Query) for server state management, though the current implementation is primarily frontend-focused with external API submission.

### Data Management
**Form Schema**: Comprehensive form validation using Zod schemas that cover all aspects of patient intake including personal information, insurance details, clinical history, and reasons for referral.

**Data Flow**: Form data is collected client-side and submitted via POST request to an external endpoint (`https://us-central1-phitest-api.cloudfunctions.net/forwardToMake`) for processing.

**Privacy Considerations**: The application is designed to handle PHI (Protected Health Information) with no local storage or backend persistence, ensuring HIPAA compliance requirements are met.

### Build and Development System
**Development Stack**: Uses Vite as the build tool with TypeScript support, providing fast development experience and optimized production builds.

**Server Architecture**: Includes an Express.js server setup for development purposes, though the production application operates as a static frontend.

**Database Integration**: Configured with Drizzle ORM for PostgreSQL integration, though currently unused in favor of external API submission. The setup suggests potential future backend integration capabilities.

### UI/UX Design Patterns
**Design System**: Built on top of shadcn/ui components providing consistent styling and behavior across the application.

**Responsive Design**: Implements mobile-first responsive design patterns using Tailwind CSS utilities.

**Accessibility**: Uses Radix UI primitives which provide built-in accessibility features and ARIA compliance.

**Form UX**: Features multi-section form layout with conditional field display, progress indication, and comprehensive validation feedback.

## External Dependencies

### UI and Styling
- **Radix UI**: Complete suite of unstyled, accessible UI primitives for building the component system
- **Tailwind CSS**: Utility-first CSS framework for styling and responsive design
- **shadcn/ui**: Pre-built component library built on Radix UI and Tailwind CSS
- **Lucide React**: Icon library for consistent iconography

### Form Management
- **React Hook Form**: Library for building performant forms with easy validation
- **Zod**: TypeScript-first schema validation for form data validation
- **@hookform/resolvers**: Validation resolvers for integrating Zod with React Hook Form

### Data and API Management
- **TanStack Query**: Data fetching and caching library for managing server state
- **Axios**: HTTP client for making API requests to external services

### Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking for enhanced development experience
- **ESBuild**: Fast JavaScript bundler used by Vite

### Database (Configured but Unused)
- **Drizzle ORM**: TypeScript ORM for PostgreSQL database operations
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon database
- **Drizzle Kit**: CLI tool for database migrations and schema management

### External API Integration
- **Google Cloud Functions**: External API endpoint for form submission processing (`phitest-api.cloudfunctions.net`)
- **Make.com Integration**: Form data is forwarded to Make.com for workflow automation

### Development Environment
- **Replit**: Cloud-based development environment with integrated tools and plugins
- **Express.js**: Node.js web framework for development server setup