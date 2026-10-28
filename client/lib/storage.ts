import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";

// ───────────────────────────────────────────────────────────────────────────
// Tipos (mismas shapes que antes, NO se cambian — el server las respeta)
// ───────────────────────────────────────────────────────────────────────────

export type VehicleSize = "small" | "suv" | "large";
export type WashType = "basic" | "complete" | "premium" | "detail" | "full";

export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface PackageAddOn {
  addOnId: string;
  includedUses: number;
}

export interface PackageDuration {
  id: string;
  label: string;
  days: number;
  washesIncluded: number;
  prices: Record<VehicleSize, number>;
}

export interface Package {
  id: string;
  name: string;
  washType: WashType;
  description: string;
  durations: PackageDuration[];
  addOnsIncluded: PackageAddOn[];
  perks: string[];
  popular?: boolean;
  color: string;
}

export interface Membership {
  id: string;
  packageId: string;
  durationId: string;
  vehicleSize: VehicleSize;
  activatedAt: string;
  expirationDate: string;
  washesRemaining: number;
  addOnUsage: Record<string, number>;
}

export type BookingStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Booking {
  id: string;
  vehicleSize: VehicleSize;
  washType: WashType;
  addOns: string[];
  date: string;
  time: string;
  totalPrice: number;
  status: "upcoming" | "completed" | "cancelled";
  bookingStatus?: BookingStatus;
  cancelReason?: string;
  cancelledBy?: "client" | "company";
  createdAt: string;
  companyId?: string;
  companyName?: string;
  usedMembership?: boolean;
  pendingReschedule?: boolean;
  rescheduleDeadline?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlate?: string;
  addressLabel?: string;
  comments?: string;
  feedbackRating?: number;
  feedbackCleanliness?: string;
  feedbackPunctuality?: string;
  feedbackExtras?: string[];
  feedbackComment?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface SavedVehicle {
  id: string;
  brand: string;
  model: string;
  color: string;
  size: VehicleSize;
  plate?: string;
}

export interface UserAddress {
  street: string;
  city: string;
  zipCode: string;
}

export interface SavedAddress {
  id: string;
  alias: string;
  state: string;
  city: string;
  colony: string;
  coto?: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  reference?: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Catálogo dinámico — se carga UNA SOLA VEZ del server vía loadCatalog().
// `let` para mantener live-binding ES module: consumidores que hacen
// `import { PACKAGES }` ven el valor actualizado tras la carga.
//
// El CatalogGate (en App.tsx) llama loadCatalog() al arrancar y bloquea la
// UI hasta que está listo. Después de eso ya no se vuelve a pedir.
// ───────────────────────────────────────────────────────────────────────────

export let AVAILABLE_STATES: string[] = [];
export let AVAILABLE_CITIES: string[] = [];
export let AVAILABLE_COLONIES: string[] = [];

export interface UserData {
  name: string;
  phone?: string;
  email?: string;
  address?: UserAddress;
  addresses: SavedAddress[];
  vehicles: SavedVehicle[];
  memberships: Membership[];
  membership?: Membership;
  hasSubscription: boolean;
  subscriptionWashesLeft: number;
}

export let VEHICLE_PRICES: Record<VehicleSize, number> = {
  small: 0,
  suv: 0,
  large: 0,
};

export let WASH_TYPE_PRICES: Record<WashType, number> = {
  basic: 0,
  complete: 0,
  premium: 0,
  detail: 0,
  full: 0,
};

export interface ServiceOption {
  id: string;
  name: string;
  price: number;
  includedIn: WashType[];
  minMinutes: number;
  maxMinutes: number;
}

export let ALL_SERVICES: ServiceOption[] = [];
export let ADD_ONS: AddOn[] = [];
export let PACKAGES: Package[] = [];

/** Tipos de lavado creados desde plataforma (modelo nuevo, reemplaza el enum hardcoded). */
export interface WashOfferingService {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  sizeModifiers: Record<string, number>;
  minMinutes: number;
  maxMinutes: number;
}

export interface WashOffering {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  color: string;
  basePrice: number;
  discountPct: number;
  discountAmount: number;
  services: WashOfferingService[];
}

export let WASH_OFFERINGS: WashOffering[] = [];

export let SUBSCRIPTION_PRICE = 0;
export let SUBSCRIPTION_WASHES = 0;

// ───────────────────────────────────────────────────────────────────────────
// loadCatalog() — UNA SOLA llamada por vida de la app
// ───────────────────────────────────────────────────────────────────────────

interface CatalogResponse {
  vehicleSizes: { slug: string; basePrice: number }[];
  washTypes: { slug: string; additionalCost: number }[];
  vehiclePrices: Record<string, number>;
  washTypePrices: Record<string, number>;
  services: ServiceOption[];
  addOns: AddOn[];
  packages: Package[];
  washOfferings?: WashOffering[];
  availableStates: string[];
  availableCities: string[];
  availableColonies: string[];
  subscription: { price: number; washes: number };
}

let catalogLoaded = false;
let catalogPromise: Promise<void> | null = null;

/**
 * Idempotente — múltiples llamadas durante la vida de la app comparten
 * la misma promesa (un único HTTP hit en cold start).
 */
export function loadCatalog(): Promise<void> {
  if (catalogLoaded) return Promise.resolve();
  if (catalogPromise) return catalogPromise;
  catalogPromise = (async () => {
    try {
      const data = await api<CatalogResponse>("/api/client/catalog");
      PACKAGES = data.packages;
      ADD_ONS = data.addOns;
      ALL_SERVICES = data.services;
      WASH_OFFERINGS = data.washOfferings ?? [];
      VEHICLE_PRICES = { small: 0, suv: 0, large: 0, ...(data.vehiclePrices as Record<VehicleSize, number>) };
      WASH_TYPE_PRICES = {
        basic: 0,
        complete: 0,
        premium: 0,
        detail: 0,
        full: 0,
        ...(data.washTypePrices as Record<WashType, number>),
      };
      AVAILABLE_STATES = data.availableStates;
      AVAILABLE_CITIES = data.availableCities;
      AVAILABLE_COLONIES = data.availableColonies;
      SUBSCRIPTION_PRICE = data.subscription.price;
      SUBSCRIPTION_WASHES = data.subscription.washes;
      catalogLoaded = true;
    } catch (err) {
      console.error("loadCatalog failed", err);
      // Dejamos la promesa nula para permitir reintento al próximo llamado.
      catalogPromise = null;
      throw err;
    }
  })();
  return catalogPromise;
}

export function isCatalogLoaded(): boolean {
  return catalogLoaded;
}

// ───────────────────────────────────────────────────────────────────────────
// HTTP helper — replaces AsyncStorage I/O
// ───────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "client_token";

async function authHeader(): Promise<HeadersInit> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiUrl();
  const url = new URL(path, baseUrl);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(await authHeader()),
    ...(init?.headers ?? {}),
  };
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ───────────────────────────────────────────────────────────────────────────
// Disponibilidad por empresa — usado en el flujo de agendado.
// El cliente eligió wash type + servicios; aquí buscamos qué empresas pueden
// atender ese pedido y qué slots tienen libres en una fecha concreta.
// ───────────────────────────────────────────────────────────────────────────

export interface AvailableCompany {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface CompanySlot {
  time: string;
}

export async function fetchAvailableCompanies(
  washType: string,
  addOns: string[],
  dateISO?: string,
  packageId?: string,
): Promise<AvailableCompany[]> {
  try {
    const params = new URLSearchParams();
    if (packageId) {
      params.set("packageId", packageId);
    } else {
      params.set("washType", washType);
      if (addOns.length) params.set("services", addOns.join(","));
    }
    if (dateISO) {
      const d = new Date(dateISO);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      params.set("date", `${y}-${m}-${day}`);
    }
    return await api<AvailableCompany[]>(`/api/client/companies-available?${params.toString()}`);
  } catch (err) {
    console.error("fetchAvailableCompanies failed", err);
    return [];
  }
}

export interface CompanyPaymentMethod {
  id: string;
  label: string;
  icon: string;
}

export async function fetchCompanyPaymentMethods(companyId: string): Promise<CompanyPaymentMethod[]> {
  try {
    return await api<CompanyPaymentMethod[]>(
      `/api/client/companies/${encodeURIComponent(companyId)}/payment-methods`,
    );
  } catch (err) {
    console.error("fetchCompanyPaymentMethods failed", err);
    return [];
  }
}

export async function fetchPlatformPaymentMethods(): Promise<CompanyPaymentMethod[]> {
  try {
    return await api<CompanyPaymentMethod[]>(`/api/client/payment-methods`);
  } catch (err) {
    console.error("fetchPlatformPaymentMethods failed", err);
    return [];
  }
}

export async function fetchCompanySlots(companyId: string, dateISO: string): Promise<CompanySlot[]> {
  try {
    // Normalizar fecha a YYYY-MM-DD (en local) — el server lo valida con regex.
    const d = new Date(dateISO);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const date = `${y}-${m}-${day}`;
    return await api<CompanySlot[]>(`/api/client/companies/${encodeURIComponent(companyId)}/slots?date=${date}`);
  } catch (err) {
    console.error("fetchCompanySlots failed", err);
    return [];
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Bookings
// ───────────────────────────────────────────────────────────────────────────

export async function getBookings(): Promise<Booking[]> {
  try {
    return await api<Booking[]>("/api/client/bookings");
  } catch {
    return [];
  }
}

export async function saveBooking(booking: Booking): Promise<void> {
  try {
    await api<Booking>("/api/client/bookings", {
      method: "POST",
      body: JSON.stringify(booking),
    });
  } catch (err) {
    console.error("Failed to save booking", err);
  }
}

export async function updateBooking(updatedBooking: Booking): Promise<void> {
  try {
    await api<Booking>(`/api/client/bookings/${updatedBooking.id}`, {
      method: "PUT",
      body: JSON.stringify(updatedBooking),
    });
  } catch (err) {
    console.error("Failed to update booking", err);
  }
}

// ───────────────────────────────────────────────────────────────────────────
// User profile (name, phone, email, vehicles, addresses, memberships, …)
// ───────────────────────────────────────────────────────────────────────────

const defaultUserData: UserData = {
  name: "Usuario",
  vehicles: [],
  addresses: [],
  memberships: [],
  hasSubscription: false,
  subscriptionWashesLeft: 0,
};

export async function getUserData(): Promise<UserData> {
  try {
    const data = await api<UserData>("/api/client/profile");
    return { ...defaultUserData, ...data };
  } catch {
    return defaultUserData;
  }
}

export async function saveUserData(userData: UserData): Promise<void> {
  try {
    await api<UserData>("/api/client/profile", {
      method: "PUT",
      body: JSON.stringify({
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
      }),
    });
  } catch (err) {
    console.error("Failed to save user data", err);
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Vehicles
// ───────────────────────────────────────────────────────────────────────────

export async function saveVehicle(vehicle: Omit<SavedVehicle, "id">): Promise<SavedVehicle> {
  return api<SavedVehicle>("/api/client/vehicles", {
    method: "POST",
    body: JSON.stringify(vehicle),
  });
}

export async function getSavedVehicles(): Promise<SavedVehicle[]> {
  try {
    return await api<SavedVehicle[]>("/api/client/vehicles");
  } catch {
    return [];
  }
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  await api(`/api/client/vehicles/${vehicleId}`, { method: "DELETE" });
}

// ───────────────────────────────────────────────────────────────────────────
// Addresses
// ───────────────────────────────────────────────────────────────────────────

export async function saveAddress(address: Omit<SavedAddress, "id">): Promise<SavedAddress> {
  return api<SavedAddress>("/api/client/addresses", {
    method: "POST",
    body: JSON.stringify(address),
  });
}

export async function getSavedAddresses(): Promise<SavedAddress[]> {
  try {
    return await api<SavedAddress[]>("/api/client/addresses");
  } catch {
    return [];
  }
}

export async function deleteAddress(addressId: string): Promise<void> {
  await api(`/api/client/addresses/${addressId}`, { method: "DELETE" });
}

// ───────────────────────────────────────────────────────────────────────────
// Memberships
// ───────────────────────────────────────────────────────────────────────────

export async function activateMembership(
  packageId: string,
  durationId: string,
  vehicleSize: VehicleSize,
): Promise<UserData> {
  const pkg = PACKAGES.find((p) => p.id === packageId);
  if (!pkg) throw new Error("Package not found");
  const duration = pkg.durations.find((d) => d.id === durationId);
  if (!duration) throw new Error("Duration not found");
  const addOnUsage: Record<string, number> = {};
  pkg.addOnsIncluded.forEach((a) => {
    addOnUsage[a.addOnId] = a.includedUses;
  });
  return api<UserData>("/api/client/memberships/activate", {
    method: "POST",
    body: JSON.stringify({
      packageId,
      durationDays: duration.days,
      washesIncluded: duration.washesIncluded,
      vehicleSize,
      addOnUsage,
    }),
  });
}

export async function cancelMembership(membershipId: string): Promise<UserData> {
  return api<UserData>(`/api/client/memberships/${membershipId}/cancel`, { method: "POST" });
}

export async function useMembershipWash(membershipId: string): Promise<UserData | null> {
  try {
    return await api<UserData>(`/api/client/memberships/${membershipId}/use-wash`, { method: "POST" });
  } catch {
    return null;
  }
}

export async function useMembershipAddOn(
  membershipId: string,
  addOnId: string,
): Promise<UserData | null> {
  try {
    return await api<UserData>(`/api/client/memberships/${membershipId}/use-addon`, {
      method: "POST",
      body: JSON.stringify({ addOnId }),
    });
  } catch {
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Pure helpers — siguen siendo cliente-only (no necesitan server)
// ───────────────────────────────────────────────────────────────────────────

export function getEstimatedTime(washType: WashType, addOnIds: string[]): { min: number; max: number } {
  const includedIds = getIncludedServiceIds(washType);
  const allServiceIds = [...new Set([...includedIds, ...addOnIds])];
  let min = 0;
  let max = 0;
  for (const id of allServiceIds) {
    const service = ALL_SERVICES.find((s) => s.id === id);
    if (service) {
      min += service.minMinutes;
      max += service.maxMinutes;
    }
  }
  return { min, max };
}

export function getIncludedServiceIds(washType: WashType): string[] {
  return ALL_SERVICES.filter((s) => s.includedIn.includes(washType)).map((s) => s.id);
}

export function getExtraServices(): ServiceOption[] {
  return ALL_SERVICES.filter((s) => s.includedIn.length === 0);
}

export function getActiveMemberships(userData: UserData): { package: Package; membership: Membership; daysRemaining: number }[] {
  const now = new Date();
  return userData.memberships
    .filter((m) => {
      const expDate = new Date(m.expirationDate);
      return expDate > now && m.washesRemaining > 0;
    })
    .map((m) => {
      const pkg = PACKAGES.find((p) => p.id === m.packageId);
      const expDate = new Date(m.expirationDate);
      const daysRemaining = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return pkg ? { package: pkg, membership: m, daysRemaining } : null;
    })
    .filter((item): item is { package: Package; membership: Membership; daysRemaining: number } => item !== null);
}

export function getActiveMembership(userData: UserData): { package: Package; membership: Membership } | null {
  const actives = getActiveMemberships(userData);
  if (actives.length === 0) return null;
  return { package: actives[0].package, membership: actives[0].membership };
}

export function getMembershipAddOnRemaining(membership: Membership, addOnId: string): number {
  return membership.addOnUsage[addOnId] || 0;
}

export function getDaysRemaining(expirationDate: string): number {
  const now = new Date();
  const expDate = new Date(expirationDate);
  return Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function getNextMonthDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatPrice(price: number): string {
  return `$${price.toLocaleString("es-MX")}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

export function getVehicleName(size: VehicleSize): string {
  switch (size) {
    case "small":
      return "Pequeño";
    case "suv":
      return "Camioneta";
    case "large":
      return "Grande";
  }
}

export function getWashTypeName(type: WashType | string): string {
  switch (type) {
    case "basic":
      return "Básico";
    case "complete":
      return "Completo";
    case "premium":
      return "Premium";
    case "detail":
      return "Detallado";
    case "full":
      return "Full";
  }
  // wash_offerings nuevos (slug dinámico desde plataforma).
  const offering = WASH_OFFERINGS.find((o) => o.slug === type);
  return offering?.name ?? type;
}

/** Precio del tipo de lavado (legacy o wash_offering) para el tamaño dado.
 *  Devuelve null si no se puede resolver — el caller debe ocultar el campo. */
export function getWashTypePriceForSize(type: WashType | string, size: VehicleSize): number | null {
  const legacyAdd = WASH_TYPE_PRICES[type as WashType];
  const legacyBase = VEHICLE_PRICES[size];
  if (typeof legacyAdd === "number" && typeof legacyBase === "number" && legacyAdd > 0) {
    return legacyBase + legacyAdd;
  }
  const offering = WASH_OFFERINGS.find((o) => o.slug === type);
  if (!offering) return null;
  const perVisit = offering.services.reduce((sum, s) => {
    const mod = Number(s.sizeModifiers?.[size] ?? 0);
    return sum + Number(s.price ?? 0) + mod;
  }, 0);
  const subtotal = Number(offering.basePrice ?? 0) + perVisit;
  const discount = Math.min(
    subtotal,
    subtotal * (Number(offering.discountPct ?? 0) / 100) + Number(offering.discountAmount ?? 0),
  );
  return Math.max(0, subtotal - discount);
}

export function getAddOnName(addOnId: string): string {
  const addon = ADD_ONS.find((a) => a.id === addOnId);
  return addon?.name || addOnId;
}
