import { LoginUseCase } from "../application/login-use-case";
import { SupabaseAuthRepository } from "./supabase-auth-repository";

export const authDependencies = {
  loginUseCase: new LoginUseCase(new SupabaseAuthRepository()),
};
