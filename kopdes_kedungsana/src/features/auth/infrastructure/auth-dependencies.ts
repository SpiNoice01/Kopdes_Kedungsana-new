import { LoginUseCase } from "../application/login-use-case";
import { AuthSessionUseCase } from "../application/auth-session-use-case";
import { SupabaseAuthRepository } from "./supabase-auth-repository";

const authRepository = new SupabaseAuthRepository();

export const authDependencies = {
  loginUseCase: new LoginUseCase(authRepository),
  authSessionUseCase: new AuthSessionUseCase(authRepository),
};
