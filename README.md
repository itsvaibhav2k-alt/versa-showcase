# Versa

A mobile executive assistant project built with React Native, Expo, TypeScript, and Supabase.

Versa organizes tasks, communications, calendar context, and team coordination in a single mobile interface. The repository includes application screens, database migrations, tests, and n8n workflow definitions for integrations.

## Explore the code

- `app` — Expo Router screens and navigation
- `lib` — shared application logic and services
- `supabase` — database migrations and local development seed data
- `n8n/workflows` — automation workflow definitions
- `docs/PRODUCT_SPECS.md` — product specification and intended workflows

## Local development

Use Node.js and npm. Configure `.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from your own development Supabase project. Never place a service-role or secret key in an `EXPO_PUBLIC_` variable.

```sh
npm ci
npm start
```

Use the Expo development tools to open the app on a supported simulator or device. The repository also provides native and web commands:

```sh
npm run ios
npm run android
npm run web
```

Native builds require the appropriate Xcode or Android toolchain. Provider-backed features and n8n workflows require separate configuration; importing this source does not connect those services.

## Checks

```sh
npm run lint
npx tsc --noEmit
npm test
```

## About this repository

This is a public source snapshot. Private development history, hardcoded credentials, and third-party design-reference screenshots are not included. Use a disposable development database when trying seed data or integration scripts.
