/**
 * User types for client-side use.
 */
export interface UserPublic {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
}

export interface UserProfile extends UserPublic {
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface SessionInfo {
  user: UserPublic;
  isAuthenticated: true;
}

export interface NoSession {
  user: null;
  isAuthenticated: false;
}

export type AuthState = SessionInfo | NoSession;
