# Meeting Creator

A "when2meet"-style group scheduling app. One person creates an event with a
passcode and a valid date/day window; anyone with the Event ID and passcode
can join and submit their own availability; the group can then see where
everyone's availability overlaps.

- **Backend:** Django + Django REST Framework, PostgreSQL
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS

## Project structure

```
.
├── events/               # DRF app: Event/Availability models, views, serializers
├── meeting_scheduler/    # Django project settings/urls
├── manage.py
├── requirements.txt
├── .env.example          # copy to .env and fill in real values
└── meet-creator/         # Next.js frontend
    └── app/
        ├── create/       # create an event
        ├── join/         # join an existing event
        ├── availability/ # pick dates/times, see group overlap
        └── lib/          # shared API client, session storage, time helpers
```

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL 14+, installed and running

## Backend setup

From the repo root:

```bash
python3 -m venv venv
source venv/bin/activate        # Windows (PowerShell): .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copy the example env file and fill in real values:

```bash
cp .env.example .env
```

| Variable                | Description                                                        |
| ------------------------ | -------------------------------------------------------------------- |
| `SECRET_KEY`             | Django secret key. Generate one, don't reuse a committed value.     |
| `DEBUG`                  | `True` for local dev.                                               |
| `DB_NAME`                | Postgres database name (default `meeting_creator`).                 |
| `DB_USER` / `DB_PASSWORD`| Postgres role and password.                                         |
| `DB_HOST` / `DB_PORT`    | Usually `localhost` / `5432`.                                       |
| `CORS_ALLOWED_ORIGINS`   | Optional, comma-separated. Extra frontend origins to allow, on top of `http://localhost:3000` / `http://127.0.0.1:3000`. |

Create the database and role if they don't already exist (matching whatever
you put in `.env`):

```bash
psql -U postgres -c "CREATE USER meeting_user WITH PASSWORD 'yourpassword';"
psql -U postgres -c "CREATE DATABASE meeting_creator OWNER meeting_user;"
```

Apply migrations and start the server:

```bash
python manage.py migrate
python manage.py runserver
```

The API is now at `http://127.0.0.1:8000/` (DRF's browsable API works, so
you can poke around `/events/` directly in a browser).

Run the test suite:

```bash
python manage.py test events
```

## Frontend setup

In a separate terminal:

```bash
cd meet-creator
npm install
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000" > .env.local
npm run dev
```

Open `http://localhost:3000`.

## How it works

1. **Create** an event: a name, your username, a passcode, which days of the
   week are eligible, and a from/to time-of-day window. After creating, you
   get an **Event ID** and a shareable join link — send both the ID/link and
   the passcode to whoever you want to invite.
2. **Join**: anyone with the Event ID, a username, and the correct passcode
   can join from any device/browser.
3. **Set availability**: everyone picks specific dates (restricted to the
   event's allowed days and date window) and a time range per date.
4. **Group availability**: the app computes, per date, how many people
   overlap on each sub-interval of time, so you can see at a glance which
   windows work for the most people.

## Known limitations

- The API has no authentication (`authentication_classes = []` on both
  viewsets) — anyone who knows a username can act as that user.
- Passcodes are stored as plain text on the `Event` model, not hashed.
- There's no server-side validation that submitted availability actually
  falls inside the event's configured day/date/time window.

These are flagged deliberately rather than fixed, since they change how the
app is meant to be used/deployed rather than being straightforward bugs —
worth addressing before deploying this anywhere with real users.
