import type { AuthRepository, LoginPayload, LoginResult } from "../domain/auth-repository";

export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(payload: LoginPayload): Promise<LoginResult> {
    const identifier = payload.identifier.trim();
    const password = payload.password.trim();

    if (!identifier || !password) {
      return {
        success: false,
        message: "Email/nomor telepon dan kata sandi wajib diisi.",
      };
    }

    return this.authRepository.login({ identifier, password });
  }
}
