import type { AuthUser } from "./auth-user";

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type LoginResult =
  | {
      success: true;
      user: AuthUser;
    }
  | {
      success: false;
      message: string;
    };

export interface AuthRepository {
  login(payload: LoginPayload): Promise<LoginResult>;
  /** True while this browser still holds a session. */
  hasActiveSession(): Promise<boolean>;
  /** Drops the session stored in this browser only (other devices stay signed in). */
  signOutLocal(): Promise<void>;
  /**
   * Calls `onEnded` when the session ends (signed out or no session left).
   * Returns a function that stops watching.
   */
  watchSessionEnd(onEnded: () => void): () => void;
}
