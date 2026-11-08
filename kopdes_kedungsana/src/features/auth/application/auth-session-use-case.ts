import type { AuthRepository } from "../domain/auth-repository";

/**
 * Session checks used by the admin panel: block the panel when the session
 * has expired, and clear the local session on logout / re-login.
 */
export class AuthSessionUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  hasActiveSession(): Promise<boolean> {
    return this.authRepository.hasActiveSession();
  }

  signOutLocal(): Promise<void> {
    return this.authRepository.signOutLocal();
  }

  watchSessionEnd(onEnded: () => void): () => void {
    return this.authRepository.watchSessionEnd(onEnded);
  }
}
