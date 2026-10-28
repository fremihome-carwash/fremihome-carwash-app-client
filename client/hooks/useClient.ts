/**
 * react-query hooks para todas las consultas /api/client/*.
 *
 * Diseñado como capa OPT-IN sobre `lib/storage.ts`: las screens existentes
 * pueden seguir usando las funciones async directas. Las screens nuevas o
 * refactorizadas usan estos hooks para obtener caching + invalidación
 * automática y elimina las llamadas duplicadas al server.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

import {
  activateMembership,
  cancelMembership,
  deleteAddress,
  deleteVehicle,
  getBookings,
  getSavedAddresses,
  getSavedVehicles,
  getUserData,
  saveAddress,
  saveBooking,
  saveUserData,
  saveVehicle,
  updateBooking,
  useMembershipAddOn,
  useMembershipWash,
  type Booking,
  type SavedAddress,
  type SavedVehicle,
  type UserData,
  type VehicleSize,
} from "@/lib/storage";

// ─── Query keys (centralizadas para invalidar consistente) ─────────────────

export const clientKeys = {
  all: ["client"] as const,
  profile: () => [...clientKeys.all, "profile"] as const,
  bookings: () => [...clientKeys.all, "bookings"] as const,
  vehicles: () => [...clientKeys.all, "vehicles"] as const,
  addresses: () => [...clientKeys.all, "addresses"] as const,
};

// ─── Queries ───────────────────────────────────────────────────────────────

export function useUserData(opts?: Partial<UseQueryOptions<UserData>>) {
  return useQuery<UserData>({
    queryKey: clientKeys.profile(),
    queryFn: () => getUserData(),
    staleTime: 30_000,
    ...opts,
  });
}

export function useBookings(opts?: Partial<UseQueryOptions<Booking[]>>) {
  return useQuery<Booking[]>({
    queryKey: clientKeys.bookings(),
    queryFn: () => getBookings(),
    staleTime: 10_000,
    ...opts,
  });
}

export function useSavedVehicles(opts?: Partial<UseQueryOptions<SavedVehicle[]>>) {
  return useQuery<SavedVehicle[]>({
    queryKey: clientKeys.vehicles(),
    queryFn: () => getSavedVehicles(),
    staleTime: 60_000,
    ...opts,
  });
}

export function useSavedAddresses(opts?: Partial<UseQueryOptions<SavedAddress[]>>) {
  return useQuery<SavedAddress[]>({
    queryKey: clientKeys.addresses(),
    queryFn: () => getSavedAddresses(),
    staleTime: 60_000,
    ...opts,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────

export function useSaveUserData(opts?: UseMutationOptions<void, Error, UserData>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserData) => saveUserData(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.profile() }),
    ...opts,
  });
}

export function useSaveBooking(opts?: UseMutationOptions<void, Error, Booking>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: Booking) => saveBooking(b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.bookings() });
      qc.invalidateQueries({ queryKey: clientKeys.profile() });
    },
    ...opts,
  });
}

export function useUpdateBooking(opts?: UseMutationOptions<void, Error, Booking>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: Booking) => updateBooking(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.bookings() }),
    ...opts,
  });
}

export function useSaveVehicle(
  opts?: UseMutationOptions<SavedVehicle, Error, Omit<SavedVehicle, "id">>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: Omit<SavedVehicle, "id">) => saveVehicle(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.vehicles() });
      qc.invalidateQueries({ queryKey: clientKeys.profile() });
    },
    ...opts,
  });
}

export function useDeleteVehicle(opts?: UseMutationOptions<void, Error, string>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.vehicles() });
      qc.invalidateQueries({ queryKey: clientKeys.profile() });
    },
    ...opts,
  });
}

export function useSaveAddress(
  opts?: UseMutationOptions<SavedAddress, Error, Omit<SavedAddress, "id">>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: Omit<SavedAddress, "id">) => saveAddress(a),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.addresses() });
      qc.invalidateQueries({ queryKey: clientKeys.profile() });
    },
    ...opts,
  });
}

export function useDeleteAddress(opts?: UseMutationOptions<void, Error, string>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.addresses() });
      qc.invalidateQueries({ queryKey: clientKeys.profile() });
    },
    ...opts,
  });
}

export function useActivateMembership(
  opts?: UseMutationOptions<
    UserData,
    Error,
    { packageId: string; durationId: string; vehicleSize: VehicleSize }
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ packageId, durationId, vehicleSize }) =>
      activateMembership(packageId, durationId, vehicleSize),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.profile() }),
    ...opts,
  });
}

export function useCancelMembership(opts?: UseMutationOptions<UserData, Error, string>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelMembership(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.profile() }),
    ...opts,
  });
}

export function useUseMembershipWash(
  opts?: UseMutationOptions<UserData | null, Error, string>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => useMembershipWash(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.profile() }),
    ...opts,
  });
}

export function useUseMembershipAddOn(
  opts?: UseMutationOptions<UserData | null, Error, { membershipId: string; addOnId: string }>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, addOnId }) => useMembershipAddOn(membershipId, addOnId),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.profile() }),
    ...opts,
  });
}
