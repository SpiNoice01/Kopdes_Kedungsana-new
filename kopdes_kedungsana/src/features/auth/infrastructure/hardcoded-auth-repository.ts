import type { AuthRepository, LoginPayload, LoginResult } from "../domain/auth-repository";

const hardcodedUser = {
  id: "admin-001",
  name: "Admin Kopdes Kedungsana",
  email: "admin@kopdeskedungsana.id",
  phone: "081234567890",
  password: "Kopdes@123",
};

const normalizeIdentifier = (identifier: string): string => {
  const trimmed = identifier.trim().toLowerCase();
  const digitsOnly = trimmed.replace(/[^\d]/g, "");

  if (digitsOnly.length >= 10) {
    return digitsOnly;
  }

  return trimmed;
};

export class HardcodedAuthRepository implements AuthRepository {
  async login(payload: LoginPayload): Promise<LoginResult> {
    const incomingIdentifier = normalizeIdentifier(payload.identifier);
    const expectedEmail = hardcodedUser.email.toLowerCase();
    const expectedPhone = hardcodedUser.phone;

    const isEmailMatch = incomingIdentifier === expectedEmail;
    const isPhoneMatch = incomingIdentifier === expectedPhone;
    const isPasswordMatch = payload.password === hardcodedUser.password;

    if ((isEmailMatch || isPhoneMatch) && isPasswordMatch) {
      return {
        success: true,
        user: {
          id: hardcodedUser.id,
          name: hardcodedUser.name,
          email: hardcodedUser.email,
          phone: hardcodedUser.phone,
        },
      };
    }

    return {
      success: false,
      message: "Email/nomor telepon atau kata sandi tidak valid.",
    };
  }
}
