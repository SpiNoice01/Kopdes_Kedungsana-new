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
}
