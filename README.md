# StudyAI — AI-Powered School PDF Study Tool

Upload any school PDF and get AI summaries, practice questions, key study areas, and highlighted notes — powered by Google Gemini.

---

## Features

- **AI Summary** — Chapter-by-chapter or topic-by-topic breakdown
- **Question Generator** — Multiple choice, theory, true/false, fill in the blanks
- **Study Areas** — Key concepts identified by AI
- **Highlighted PDF** — Download your PDF with important sentences annotated
- **Paystack Payment** — First PDF free daily, ₦1,500/week for unlimited access

---

## Tech Stack

- **Frontend** — Next.js 14 (App Router), Tailwind CSS
- **AI** — Google Gemini 1.5 Flash
- **PDF Processing** — pdf-lib
- **Database** — Supabase (PostgreSQL)
- **Payment** — Paystack
- **Deployment** — Vercel

---

## Setup Instructions

### 1. Clone and install

```bash
git clone https://github.com/cyberrar-kia/studyai-gemini.git
cd studyai-gemini
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:

| Variable | Where to get it |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings |
| `SUPABASE_SERVICE_KEY` | Supabase project settings → Service Role key |
| `PAYSTACK_SECRET_KEY` | [Paystack Dashboard](https://dashboard.paystack.com) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL after deployment |

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor
3. Run the contents of `supabase/schema.sql`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel project settings
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL
5. Deploy

---

## Payment Flow

1. User uploads first PDF of the day → **Free**
2. Second upload onwards → Paystack payment page (₦1,500)
3. After successful payment → 7 days of unlimited access
4. Payment tracked by IP address in Supabase

---

## Adding New Question Types

Edit `/app/api/questions/route.ts` and add a new key to the `prompts` object.

---

## File Structure

```
app/
  page.tsx              # Landing page with upload
  study/page.tsx        # Study tabs (Summary, Questions, etc.)
  api/
    analyze/route.ts    # Gemini summary generation
    questions/route.ts  # Gemini question generation
    study-areas/route.ts # Gemini study area identification
    highlight/route.ts  # PDF highlighting with pdf-lib
    payment/
      check/route.ts    # Check daily upload limit
      initialize/route.ts # Paystack payment init
      verify/route.ts   # Paystack payment verification
supabase/
  schema.sql            # Database schema
.env.example            # Environment variables template
```
