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
- `health_entries` – Tageswerte (`user_id`, `date`, Kalorien, Schlaf, Gewicht, Wasser)
- `goal_targets` – Ziele pro Nutzer
- `activity_logs` – Aktivität pro Tag (`steps`, `jog_km`, `bike_min`, `activity_min`)

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

```
src/app/
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
