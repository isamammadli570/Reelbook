# Reelbook

A diary for the movies and series you watch, built with React Native and Expo. Log every viewing, rate and
review, follow series episode by episode, get a reminder when a new episode airs, and see your year in numbers.
Runs on Android, iOS and the web from one codebase.

> Screenshots: add them to `docs/screenshots/` and list them here.

## Features

- **Diary** — log a movie on any day, rewatch it, move entries to another date; series are tracked per episode
  with a season map and progress.
- **Ratings and reviews** — half-star ratings that follow each viewing, written reviews, and a rating sort.
- **Profile** — your own cover and avatar photo, four favourites, recently watched, shelves for movies,
  series, watchlist, reviews and custom lists.
- **Discover** — search movies, series and people; browse by genre; trending and new releases.
- **Title pages** — cast with person pages and filmographies, trailers, and where to stream, rent or buy
  in your country.
- **Calendar and reminders** — upcoming episodes of the series you follow, with local notifications on air day.
- **Stats** — watch time, monthly activity, top genres and highlights.
- **Accounts and sync** — local-first storage that syncs across devices through Supabase, with guest mode,
  password reset by emailed code, account deletion and JSON backups.
- **Settings** — Azerbaijani, English and Russian; spoiler hiding; haptics; in-app privacy policy.
- **Motion** — entrance, press and tab animations built on Reanimated, respecting reduced motion.

## Tech stack

| Area | Choice |
| --- | --- |
| App | Expo SDK 58, React Native 0.88, React 19, TypeScript (strict) |
| Navigation | Expo Router (file-based, `src/app`) |
| Styling | Uniwind (Tailwind CSS v4 for React Native) |
| Data | TanStack Query, axios, AsyncStorage |
| Backend | Supabase: Postgres with row-level security, Auth, Storage |
| Content | TMDB API; streaming data from JustWatch via TMDB |
| Forms and i18n | react-hook-form, i18next |
| Animation | react-native-reanimated, react-native-worklets |
| Native | expo-notifications, expo-image-picker, expo-image-manipulator, expo-haptics |
| Quality | ESLint, Vitest unit tests for the pure helpers |

## Project structure

```
src/
  app/          Routes only; each file re-exports a page
  pages/        Screens, with their own widgets
  widgets/      Shared building blocks (poster grid, sheets, rows)
  components/   UI primitives and motion
  api/          TMDB and Supabase calls
  hooks/        TanStack Query hooks per feature
  helpers/      Pure logic, unit tested (*.test.ts)
  services/     Sync between device and server
  i18n/         Translations: AZ, EN, RU
supabase/
  migrations/   SQL to run in order in the Supabase SQL editor
```

Layering is `api → hooks → pages/widgets`; screens never call the network directly.

## Getting started

Requirements: Node 24 and npm.

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

- `EXPO_PUBLIC_TMDB_TOKEN` — the "API Read Access Token" from [TMDB](https://www.themoviedb.org/settings/api).
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` — from your Supabase project (Project Settings → API).
  Use the publishable key, never the service role key.

`EXPO_PUBLIC_` values are compiled into the app, so treat them as public. Without the Supabase values the app
still runs, storing everything on the device.

### Supabase

1. Run the files in `supabase/migrations/` in order in the SQL editor.
2. Set up custom SMTP (Authentication → Emails) and add `{{ .Token }}` to the Reset Password template, so the
   app can reset passwords with a code.

### Run

```bash
npm start        # Expo dev server; open in Expo Go or press w for the web
npm run lint
npm run typecheck
npm run test:run
```

## Deploy

**Web (Vercel)** — `vercel.json` builds a single-page export (`npx expo export -p web` into `dist`). Import the
repository in Vercel and add the three `EXPO_PUBLIC_` variables in the project settings.

**Android APK (EAS)** — `eas.json` has a `preview` profile that builds an installable APK:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest env:set --environment preview --name EXPO_PUBLIC_TMDB_TOKEN --value "..." --visibility plaintext
npx eas-cli@latest build -p android --profile preview
```

Add the two Supabase variables the same way before building.

## Credits

This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability is provided by
JustWatch.

## License

[MIT](LICENSE) © Isa Mammadli
