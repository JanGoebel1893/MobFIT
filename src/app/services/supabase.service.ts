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

    const { error: signInError } = await this.supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;

    const { error: profileError } = await this.supabase.from("profiles").insert({
      id: data.user!.id,
      username,
      age,
      height
    });

    if(profileError) throw profileError;
  }

  async signIn(email: string, password: string, remember: boolean) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;

    if (!remember) {
      await this.supabase.auth.updateUser({});
      sessionStorage.setItem('supabase_no_persist', 'true');
    } else {
      sessionStorage.removeItem('supabase_no_persist');
    }

    return data;
  }

  async getUser() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }
}
