import type { UserRole } from '../services/auth';

export const DEFAULT_ROUTE_BY_ROLE: Record<UserRole, string> = {
  TRAVELER: '/traveller/home',
  BUDDY: '/buddy/dashboard',
  ADMIN: '/admin/dashboard',
};
