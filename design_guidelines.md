# Design Guidelines: Car Wash Booking App

## 1. Brand Identity

**Purpose**: A premium self-service car wash booking app that makes scheduling and paying for car washes effortless and fast.

**Aesthetic Direction**: **Luxurious/refined with sporty energy**
- Clean, spacious layouts that evoke the feeling of a freshly washed car
- High contrast between dark surfaces and bright accent colors
- Smooth animations that feel premium and responsive
- Crisp edges and precise spacing - nothing feels cluttered
- **Memorable Element**: A satisfying water droplet animation that plays after successful payment/booking

**Differentiation**: Apps in this space feel utilitarian and cheap. This app will feel like a premium service - think Tesla app meets luxury hotel booking. Every interaction should feel smooth and intentional.

---

## 2. Navigation Architecture

**Root Navigation**: Tab Bar (3 tabs)

**Tab Structure**:
1. **Home** (House icon) - Main booking flow
2. **Reservar** (Plus icon, center position) - Quick-book floating action
3. **Mis Citas** (Calendar icon) - Appointment management

**Screen List**:
- Home Screen (Home tab)
- Vehicle Selection Screen (modal)
- Service Customization Screen (modal)
- Schedule Selection Screen (modal)
- Payment Screen (modal)
- Booking Confirmation Screen (modal)
- My Appointments Screen (Mis Citas tab)
- Appointment Detail Screen (stack)
- Profile/Settings Screen (header button on Home)

**No authentication required** - Local storage for user data and booking history.

---

## 3. Screen-by-Screen Specifications

### Home Screen
**Purpose**: Dashboard showing quick stats and starting the booking flow

**Layout**:
- **Header**: Transparent, left button (Settings/Profile icon), title "Car Wash", no right button
- **Content**: Scrollable view with cards
  - Welcome card with user's name and avatar
  - Subscription status card (if user has active pass)
  - "Quick Book" prominent CTA button
  - Recent bookings (last 2-3)
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

**Components**: Avatar, status cards, CTA button, history list

### Vehicle Selection Screen
**Purpose**: Choose vehicle size (first step in booking flow)

**Layout**:
- **Header**: Navigation header with "Cancelar" left button, title "Selecciona tu Vehículo"
- **Content**: Non-scrollable, centered layout
  - Three large, tappable cards arranged vertically
  - Each card shows: Vehicle icon, size label (Pequeño/Camioneta/Grande), base price
- **Footer**: "Continuar" button (disabled until selection made)
- **Safe Area**: Top: Spacing.xl, Bottom: insets.bottom + Spacing.xl

**Modal Presentation**: Slides up from bottom, fills screen

### Service Customization Screen
**Purpose**: Choose wash type and add-ons

**Layout**:
- **Header**: Navigation header with back button, title "Personaliza tu Lavado"
- **Content**: Scrollable form
  - Section 1: Wash type (Basic/Complete) - toggle buttons
  - Section 2: Add-ons - checkboxes list (Detallado de rines, Motor, Interior completo, etc.)
  - Section 3: Subscription offer card (highlighted, "20 lavadas/mes")
  - Live price calculator at bottom of scroll
- **Safe Area**: Top: Spacing.xl, Bottom: insets.bottom + Spacing.xl
- **Footer Button**: "Elegir Horario" button floats above content

**Components**: Toggle buttons, checkboxes, promotional card, price summary

### Schedule Selection Screen
**Purpose**: Choose date and time

**Layout**:
- **Header**: Navigation header with back button, title "¿Cuándo lo traes?"
- **Content**: Scrollable
  - Calendar selector (horizontal week view with scrollable dates)
  - Time slot grid (available times shown as pills)
- **Footer**: "Continuar al Pago" button
- **Safe Area**: Top: Spacing.xl, Bottom: insets.bottom + Spacing.xl

**Components**: Calendar component, time slot grid

### Payment Screen
**Purpose**: Process payment

**Layout**:
- **Header**: Navigation header with close button, title "Confirmar Pago"
- **Content**: Scrollable form
  - Order summary card (vehicle, services, date/time, total)
  - Payment method selector (cards list)
  - "Agregar Método de Pago" button
- **Footer**: "Pagar Ahora" prominent button (green/success color)
- **Safe Area**: Top: Spacing.xl, Bottom: insets.bottom + Spacing.xl

**Components**: Summary card, payment method list, secure payment badge

### Booking Confirmation Screen
**Purpose**: Success state after payment

**Layout**:
- **Header**: No navigation header
- **Content**: Centered, non-scrollable
  - Success icon/animation (water droplet)
  - "¡Reserva Confirmada!" message
  - Booking details card
  - "Ver Mis Citas" button
  - "Volver al Inicio" secondary button
- **Safe Area**: Top: insets.top + Spacing.xl, Bottom: insets.bottom + Spacing.xl

**Full-screen modal**

### My Appointments Screen
**Purpose**: View and manage bookings

**Layout**:
- **Header**: Default navigation header, title "Mis Citas", right button (Calendar filter)
- **Content**: Scrollable list
  - Tabs: "Próximas" / "Historial"
  - Appointment cards showing: date, time, vehicle, services, status
  - Empty state if no appointments
- **Safe Area**: Top: Spacing.xl, Bottom: tabBarHeight + Spacing.xl

**Components**: Tab selector, appointment cards list

### Appointment Detail Screen
**Purpose**: View details, reschedule, or cancel

**Layout**:
- **Header**: Navigation header with back button, title "Detalles de Cita"
- **Content**: Scrollable
  - Appointment info card
  - QR code (for check-in at location)
  - Action buttons: "Reprogramar", "Cancelar Cita"
- **Safe Area**: Top: Spacing.xl, Bottom: insets.bottom + Spacing.xl

**Components**: Detail card, QR code, action buttons

### Profile/Settings Screen
**Purpose**: User preferences and app settings

**Layout**:
- **Header**: Navigation header with close button, title "Perfil"
- **Content**: Scrollable form
  - User avatar (editable)
  - Display name field
  - Vehicle garage (saved vehicles)
  - Payment methods
  - Notification preferences
  - Theme toggle
- **Safe Area**: Top: Spacing.xl, Bottom: insets.bottom + Spacing.xl

---

## 4. Color Palette

**Primary**: #1E40AF (Deep Blue - conveys trust, premium service)
**Accent**: #06B6D4 (Cyan - water association, fresh, clean)
**Success**: #10B981 (Emerald - confirmations, subscription)
**Warning**: #F59E0B (Amber - pending states)
**Error**: #EF4444 (Red - cancellations, errors)

**Backgrounds**:
- Light Mode: #F8FAFC (off-white, clean)
- Dark Mode: #0F172A (deep navy, not pure black)

**Surface**:
- Light: #FFFFFF
- Dark: #1E293B

**Text**:
- Primary Light: #0F172A
- Primary Dark: #F1F5F9
- Secondary Light: #64748B
- Secondary Dark: #94A3B8

---

## 5. Typography

**Font**: Google Font "**Inter**" (modern, legible, premium feel)

**Type Scale**:
- Display: 32px, Bold (confirmation screens)
- H1: 24px, Bold (screen titles)
- H2: 20px, Semibold (section headers)
- Body: 16px, Regular (main content)
- Caption: 14px, Medium (labels, secondary info)
- Small: 12px, Regular (metadata)

**Accent Font**: "**Montserrat**" Bold for promotional elements (subscription offer)

---

## 6. Assets to Generate

1. **icon.png** - App icon: Water droplet forming a "C" shape on blue gradient circle
2. **splash-icon.png** - Same as app icon, used during launch
3. **empty-appointments.png** - Simple illustration: Empty calendar with water droplets - WHERE USED: My Appointments screen when no bookings exist
4. **empty-history.png** - Minimal illustration: Clean sparkle icon - WHERE USED: History tab when no past bookings
5. **vehicle-small.png** - Side view sedan outline, minimalist - WHERE USED: Vehicle selection cards
6. **vehicle-suv.png** - Side view SUV outline - WHERE USED: Vehicle selection cards
7. **vehicle-large.png** - Side view truck outline - WHERE USED: Vehicle selection cards
8. **success-droplet.png** - Animated water droplet (clean, blue gradient) - WHERE USED: Booking confirmation screen
9. **avatar-default.png** - Generic user silhouette on circular gradient - WHERE USED: Profile screen default avatar
10. **subscription-badge.png** - Premium badge illustration with "20x" - WHERE USED: Subscription offer card

All illustrations should use the app's color palette (blues and cyans) with clean, minimal line art style.