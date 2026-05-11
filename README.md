# MobFIT

Web-Frontend für **MobFIT** – ein Fitness- und Gesundheits-Dashboard mit persönlichen Zielen, Tagesaktivität und Health-Tracking. Die App spricht mit einem **Supabase**-Backend (Auth + Postgres).

## Funktionen

- **Registrierung & Login** mit E-Mail/Passwort (Supabase Auth)
- **Health-Dashboard**: Kalorien, Schlaf, Gewicht, Wasser; Bearbeitung im Modal; Wochen-/Monats-Charts mit Vergleich zur Vorperiode
- **My Goals**: Tagesfortschritt (Schritte, Joggen, Radfahren, Aktivitätsminuten), Ziele setzen, Fortschritt eintragen; Charts analog zu Health
- **Rechtliches**: Impressum & Datenschutz (öffentliche Routen)
- **Abmelden** über Route `/logout` (Supabase `signOut`)

## Tech-Stack

| Bereich | Technologie |
|--------|-------------|
| Framework | [Angular](https://angular.dev) 19 (Standalone Components) |
| Backend | [Supabase](https://supabase.com) (`@supabase/supabase-js`) |
| Icons | [lucide-angular](https://lucide.dev) |
| Styling | Komponenten-CSS, gemeinsame Layout-Styles unter `src/app/shared/styles/` |

## Voraussetzungen

- **Node.js** (LTS empfohlen, z. B. 20.x)
- **npm** (mit Node mitgeliefert)

## Installation

```bash
git clone <repository-url>
cd MobFIT
npm install
```

## Supabase konfigurieren

Die Verbindung erfolgt über `src/environments/environment.ts` (Entwicklung) bzw. `src/environments/environment.prod.ts` (Production-Build).

Trage dort ein:

- `supabaseUrl` – Project URL aus dem Supabase-Dashboard  
- `supabaseKey` – z. B. der **anon public** API-Key (nie den Service-Role-Key im Frontend)

**Hinweis:** Geheime Keys nicht in öffentliche Repos committen. Für Teams eignen sich z. B. lokale Overrides, CI-Secrets oder `environment.prod.ts` nur mit Platzhaltern im Repo und echte Werte beim Deploy.

Erwartete **Datenbank-/Auth-Struktur** (Auszug, muss zu euren Supabase-Tabellen passen):

- `profiles` – Nutzerprofil (u. a. `username`, `age`, `height`)
- `health_entries` – Tageswerte (`user_id`, `date`, Kalorien, Schlaf, Gewicht, Wasser). Für **Upsert** im Frontend muss es einen **eindeutigen Constraint auf `(user_id, date)`** geben (z. B. `UNIQUE (user_id, date)`).
- `goal_targets` – Ziele pro Nutzer (Upsert per `user_id`)
- `activity_logs` – Aktivität (`steps`, `jog_km`, `bike_min`, `activity_min`). Die App legt **mehrere Zeilen pro Tag** an (Fortschritt mehrfach hinzufügen); eine **Unique-Constraint nur auf `(user_id, date)`** würde zweite Einträge blockieren.

### Row Level Security (RLS)

Wenn nur Ziele speichern gehen, Health- oder Aktivitätsdaten aber nicht: fast immer **fehlende oder zu strenge RLS-Policies** für `health_entries` und `activity_logs` (oder Constraint-Konflikt wie oben).

Im SQL-Editor (nur als Orientierung, an eure Tabellen anpassen):

```sql
-- Beispiel: eingeloggte Nutzer dürfen eigene Zeilen lesen/schreiben
create policy "health_own_select" on health_entries for select using (auth.uid() = user_id);
create policy "health_own_insert" on health_entries for insert with check (auth.uid() = user_id);
create policy "health_own_update" on health_entries for update using (auth.uid() = user_id);

create policy "activity_own_select" on activity_logs for select using (auth.uid() = user_id);
create policy "activity_own_insert" on activity_logs for insert with check (auth.uid() = user_id);
create policy "activity_own_update" on activity_logs for update using (auth.uid() = user_id);
```

Nach einem fehlgeschlagenen Speichern zeigt die App jetzt die **Fehlermeldung von Supabase** (z. B. „new row violates row-level security policy“).

## Routing / Startseite

Nach **Login**, **Registrierung** oder Aufruf von `/` **mit bestehender Session** landet man auf **`/my-goals`** (Konstante `DEFAULT_AUTHENTICATED_ROUTE` in `src/app/core/auth.constants.ts`).

## Entwicklung

```bash
npm start
```

Entspricht `ng serve` (Standard: **http://localhost:4200/**, Hot Reload).

```bash
ng serve --configuration development
```

Explizit die Development-Build-Konfiguration nutzen (siehe `angular.json`).

## Production-Build

```bash
npm run build
```

Ausgabe: `dist/mobfit/`. Für Production werden per `fileReplacements` die Umgebungswerte aus `environment.prod.ts` eingebunden – dort `supabaseUrl` und `supabaseKey` vor dem Deploy setzen.

## Projektstruktur (Auszug)

```
src/app/
├── core/            # z. B. DEFAULT_AUTHENTICATED_ROUTE
├── pages/           # Routen-Seiten (login, register, health, my-goals, …)
├── shared/          # Wiederverwendbare UI (Modals, Cards, Top-Nav, …)
├── services/        # u. a. SupabaseService
├── guards/          # authGuard, redirectGuard, logoutGuard
└── shared/utils/    # Hilfen (z. B. lokales Datum, Formular-Validierung)
```

## Wichtige Routen

| Pfad | Beschreibung |
|------|----------------|
| `/login`, `/register` | Anmeldung / Registrierung |
| `/health` | Health-Dashboard (Auth) |
| `/my-goals` | Ziele & Aktivität (Auth) |
| `/logout` | Abmeldung (Guard ruft `signOut` auf) |
| `/datenschutz`, `/impressum` | Statische Infoseiten |

## Angular CLI

Projekt erzeugt mit Angular CLI **19.2.x**. Weitere Befehle: [Angular CLI – Dokumentation](https://angular.dev/tools/cli).
