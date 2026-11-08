import { supabase } from "@/src/utils/supabase-client";
import type { AuthRepository, LoginPayload, LoginResult } from "../domain/auth-repository";

export class SupabaseAuthRepository implements AuthRepository {
  async login(payload: LoginPayload): Promise<LoginResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.identifier,
      password: payload.password,
    });

    if (error || !data.user) {
      // Return a standard error message
      return {
        success: false,
        message: "Email atau kata sandi tidak valid. Pastikan akun sudah terdaftar.",
      };
    }

    // Extract custom user metadata if available, otherwise fallback
    const userMetadata = data.user.user_metadata || {};
    
    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || payload.identifier,
        name: userMetadata.full_name || userMetadata.name || "Administrator",
        phone: data.user.phone || "-",
      },
    };
  }

  async hasActiveSession(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  }

  async signOutLocal(): Promise<void> {
    await supabase.auth.signOut({ scope: "local" });
  }

  watchSessionEnd(onEnded: () => void): () => void {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) onEnded();
    });
    return () => listener.subscription.unsubscribe();
  }
}
