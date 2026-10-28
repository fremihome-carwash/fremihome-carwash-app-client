import { Colors } from "@/constants/theme";
import type { Booking } from "@/lib/storage";

export type BookingDisplayStatus = {
  label: string;
  color: string;
  /** Si true, el cliente puede reagendar (ej. rechazada por la empresa). */
  canReschedule: boolean;
};

export function getBookingDisplayStatus(b: Booking): BookingDisplayStatus {
  // El backend devuelve `bookingStatus` con el status real. Fallback al
  // `status` legacy para bookings viejos.
  const real = b.bookingStatus ?? (b.status === "completed" ? "completed" : b.status === "cancelled" ? "cancelled" : "accepted");

  switch (real) {
    case "pending":
      return { label: "Esperando confirmación", color: Colors.warning, canReschedule: false };
    case "accepted":
      return { label: "Confirmada", color: Colors.success, canReschedule: false };
    case "in_progress":
      return { label: "En curso", color: Colors.accent, canReschedule: false };
    case "completed":
      return { label: "Completada", color: Colors.accent, canReschedule: false };
    case "cancelled":
      if (b.cancelledBy === "company") {
        return { label: "Rechazada por la empresa", color: Colors.error, canReschedule: true };
      }
      return { label: "Cancelada", color: Colors.error, canReschedule: false };
    default:
      return { label: "Confirmada", color: Colors.success, canReschedule: false };
  }
}
