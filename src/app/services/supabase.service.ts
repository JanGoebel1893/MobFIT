import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../../environments/environment";
import { todayLocalDateString } from "../shared/utils/local-date.utils";

@Injectable({ providedIn: "root" })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          lock: async (name, acquireTimeout, fn) => fn(),
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        }
      }
    );
  }

  /** Postgres-/REST-Fehler nach außen geben (sonst „speichert nicht“ ohne Hinweis). */
  private throwIfDbError(context: string, error: { message: string; details?: string; hint?: string } | null): void {
    if (!error) return;
    console.error(`[MobFIT ${context}]`, error.message, error.details ?? "", error.hint ?? "");
    throw new Error(error.message || context);
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

    this.throwIfDbError("profiles.insert", profileError);
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;

    return data;
  }

  async getUser() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut({ scope: "global" });
    if (error) {
      const { error: localErr } = await this.supabase.auth.signOut({ scope: "local" });
      if (localErr) throw localErr;
    }
  }

  async getProfile(userId: string) {
    return await this.supabase
      .from('profiles')
      .select('username, age, height')
      .eq('id', userId)
      .single();
  }

  async getLatestHealthEntry(userId: string) {
    return await this.supabase
      .from('health_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  async upsertHealthEntry(userId: string, data: {
    calories: number | null;
    sleep_hours: number | null;
    sleep_mins: number | null;
    weight_kg: number | null;
    water: number | null;
  }) {
    const today = todayLocalDateString();
    const { error } = await this.supabase
      .from('health_entries')
      .upsert(
        { user_id: userId, date: today, ...data },
        { onConflict: 'user_id,date' }
      );
    this.throwIfDbError("health_entries.upsert", error);
  }

  async getGoalTargets(userId: string) {
    return await this.supabase
      .from('goal_targets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
  }

  async upsertGoalTargets(userId: string, data: {
    steps: number | null;
    jog_km: number | null;
    bike_min: number | null;
    activity_min: number | null;
  }) {
    const { error } = await this.supabase
      .from('goal_targets')
      .upsert(
        { user_id: userId, ...data },
        { onConflict: 'user_id' }
      );
    this.throwIfDbError("goal_targets.upsert", error);
  }

  /** Heutigen Tages-Gesamtwert laden (Summe aller Einträge) */
  async getTodayActivitySums(userId: string) {
    const today = todayLocalDateString();
    return await this.supabase
      .from('activity_logs')
      .select('steps, jog_km, bike_min, activity_min')
      .eq('user_id', userId)
      .eq('date', today);
  }

  /** Neuen Aktivitäts-Eintrag hinzufügen */
  async addActivityLog(userId: string, data: {
    steps?: number | null;
    jog_km?: number | null;
    bike_min?: number | null;
    activity_min?: number | null;
  }) {
    const today = todayLocalDateString();
    const { error } = await this.supabase
      .from('activity_logs')
      .insert({ user_id: userId, date: today, ...data });
    this.throwIfDbError("activity_logs.insert", error);
  }

  async getActivityLogsRange(userId: string, since: string) {
    return await this.supabase
      .from('activity_logs')
      .select('date, steps, jog_km, bike_min, activity_min')
      .eq('user_id', userId)
      .gte('date', since)
      .order('date', { ascending: true });
  }

  /** Health-Einträge der letzten N Tage/Wochen für den Chart */
  async getHealthEntriesRange(userId: string, since: string) {
    return await this.supabase
      .from('health_entries')
      .select('date, calories, sleep_hours, sleep_mins, weight_kg, water')
      .eq('user_id', userId)
      .gte('date', since)
      .order('date', { ascending: true });
  }
}
