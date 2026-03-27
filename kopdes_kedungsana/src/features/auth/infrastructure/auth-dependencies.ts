import { LoginUseCase } from "../application/login-use-case";
import { HardcodedAuthRepository } from "./hardcoded-auth-repository";

export const authDependencies = {
  loginUseCase: new LoginUseCase(new HardcodedAuthRepository()),
};
