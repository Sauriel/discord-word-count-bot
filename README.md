# Discord Word Count Bot

Ein Discord-Bot zum Tracken von geschriebenen Wörtern mit TypeScript.

## Installation

```bash
npm install
```

## Konfiguration

Erstelle eine `.env` Datei im Hauptverzeichnis mit folgenden Werten:

```env
DISCORD_TOKEN=dein_discord_bot_token
DISCORD_APP_ID=deine_discord_app_id
DISCORD_CHANNEL_IDS=channel_id1,channel_id2
```

## Development

### TypeScript entwickeln (mit Hot Reload)

```bash
npm run dev
```

### Build erstellen

```bash
npm run build
```

### Produktion starten

```bash
npm start
```

### Watch Mode (automatisches Kompilieren bei Änderungen)

```bash
npm run watch
```

## Befehle

- **/w [ZAHL]** - Anzahl der geschriebenen Wörter an diesem Tag (wird addiert oder bei negativen Zahlen abgezogen)
- **/wgoal [ZAHL]** - Setze ein Tagesziel für die Anzahl der geschriebenen Wörter
- **/wstat** - Zeige Statistiken über die geschriebenen Wörter an
- **/wweek** - Zeige Wochenstatistiken an (Gesamtstatistik für letzte 7 Tage oder seit Montag)
- **/wmyweek** - Zeige deine persönlichen Wochenstatistiken an
- **/wb** - Gebe mit deinen geschriebenen Wörtern an

## Projektstruktur

```
.
├── src/                    # TypeScript Quellcode
│   ├── index.ts           # Haupt-Bot-Datei
│   └── commands/          # Bot-Befehle
│       ├── count.ts       # Word-Count-Logik
│       └── db.ts          # Datenbank-Logik
├── dist/                  # Kompilierter JavaScript-Code (nicht im Git)
├── database.sql           # SQLite Datenbank
├── tsconfig.json          # TypeScript Konfiguration
├── eslint.config.js       # ESLint Konfiguration
└── package.json           # NPM Dependencies und Scripts
```

## Migration von JavaScript zu TypeScript

Das Projekt wurde von JavaScript auf TypeScript migriert. Die alten `.js` Dateien im Root-Verzeichnis können entfernt werden, da der Code jetzt in `src/` liegt und nach `dist/` kompiliert wird.
