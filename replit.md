# replit.md

## Overview

This is a premium car wash booking mobile application built with Expo (React Native). The app enables users to book self-service car washes with a luxurious, refined user experience inspired by Tesla's app and luxury hotel booking interfaces.

**Core Functionality:**
- Vehicle selection (small, SUV, large) with tiered pricing
- Service customization (basic/complete wash types, add-ons)
- Schedule selection with date and time slots
- Payment processing with mock payment methods
- Appointment management (view, cancel bookings)
- User profile management
- Subscription system with wash credits

**Target Platform:** Cross-platform mobile app (iOS, Android, Web) using Expo

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** Expo SDK 54 with React Native 0.81.5
- Uses the new React Native architecture (`newArchEnabled: true`)
- React 19.1.0 with React Compiler enabled

**Navigation:** React Navigation v7
- Tab-based navigation with 5 tabs (Home, Appointments, Book, History, Packages)
- Native stack navigator for booking flow screens
- Modal presentation for booking wizard steps
- Booking flow: Vehicle Selection → Package Option (auto-skips if no active packages for vehicle size) → Service Customization → Schedule Selection → Payment (with integrated membership/package selection) → Confirmation
- BookingPackageOptionScreen: Checks active packages matching the selected vehicle size. If found, user can select one (navigates to ScheduleSelection with membershipId, skipping ServiceCustomization) or continue normally. If no matching packages, auto-redirects to ServiceCustomization.

**State Management:**
- TanStack React Query for server state and caching
- Local state with React hooks
- AsyncStorage for client-side data persistence

**Styling Approach:**
- Custom theming system with light/dark mode support
- Design tokens in `client/constants/theme.ts` (Colors, Spacing, BorderRadius, Typography)
- Reanimated for smooth animations
- Platform-specific adaptations (blur effects on iOS, solid backgrounds on Android)

**Key UI Components:**
- Themed components (ThemedText, ThemedView) for consistent styling
- Animated buttons and cards with spring physics
- Keyboard-aware scroll views for form screens
- Error boundary with development debugging tools

### Backend Architecture

**Server:** Express.js with TypeScript
- Runs on port 5000
- CORS configured for Replit domains and localhost development
- Static file serving for production builds

**Database:**
- Drizzle ORM configured for PostgreSQL
- Schema defined in `shared/schema.ts`
- Currently uses in-memory storage (`MemStorage`) as fallback
- Database migrations stored in `/migrations`

**API Pattern:**
- RESTful API endpoints prefixed with `/api`
- Centralized API client in `client/lib/query-client.ts`
- Zod schemas for validation (via drizzle-zod)

### Data Storage

**Client-Side Storage:**
- AsyncStorage for bookings, user data, saved vehicles, saved addresses
- Booking structure includes: vehicle size, wash type, add-ons, date/time, price, status, vehicleBrand, vehicleModel, vehicleColor, vehiclePlate, addressLabel
- User data includes: name, subscription status, remaining washes, saved vehicles, saved addresses
- SavedAddress: {id, alias, state, city, colony, street, exteriorNumber, interiorNumber?, reference?}
- SavedVehicle: {id, brand, model, color, size, plate?}
- Address form uses pre-configured select options for Estado (Jalisco), Ciudad (Tlajomulco de Zúñiga), and Fraccionamiento/Colonia (Villa California, Casa Fuerte, Adamar)
- Reusable SelectField component at client/components/SelectField.tsx
- Reusable SchedulePicker component at client/components/SchedulePicker.tsx (used in booking flow and reschedule modal)

**Server-Side Storage:**
- PostgreSQL database (when DATABASE_URL is configured)
- Users table with id, username, password fields

### Build & Deployment

**Development:**
- `npm run expo:dev` - Start Expo development server
- `npm run server:dev` - Start Express server with tsx

**Production:**
- Static web build with `expo:static:build`
- Server bundled with esbuild
- Custom build script handles Replit deployment domains

## External Dependencies

### Core Mobile Framework
- **Expo** (v54) - Cross-platform mobile framework
- **React Native** (0.81.5) - Native UI components

### Navigation & UI
- **@react-navigation** - Tab and stack navigation
- **expo-blur** - iOS blur effects
- **expo-glass-effect** - Liquid glass effects
- **expo-haptics** - Tactile feedback
- **expo-image** - Optimized image loading

### Animation
- **react-native-reanimated** (v4.1.1) - UI animations
- **react-native-gesture-handler** - Touch gestures

### Data & State
- **@tanstack/react-query** - Server state management
- **@react-native-async-storage/async-storage** - Local persistence
- **drizzle-orm** - Database ORM
- **drizzle-zod** - Schema validation

### Backend
- **express** - HTTP server
- **pg** - PostgreSQL client
- **ws** - WebSocket support
- **http-proxy-middleware** - Development proxy

### Development Tools
- **tsx** - TypeScript execution
- **esbuild** - JavaScript bundler
- **drizzle-kit** - Database migrations

### External Services
- PostgreSQL database (via DATABASE_URL environment variable)
- Replit deployment infrastructure