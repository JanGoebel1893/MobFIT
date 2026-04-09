import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  async signUp(email: string, password: string, username: string, age: number, height: number) {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;

    const { error: profileError } = await this.supabase.from("profiles").insert({
      id: data.user!.id,
      username,
      age,
      height
    });

    if(profileError) throw profileError;
  }
}
