# AI Video Studio

Free AI image and video generation using public HuggingFace Spaces via the Gradio async API.

## Free Models

| Type | Model | HF Space |
|------|-------|----------|
| Image | FLUX.1 Schnell | `black-forest-labs/FLUX.1-schnell` |
| Image | FLUX.2 Dev | `black-forest-labs/FLUX.2-dev` |
| Image | Hailuo H3 Image | `MiniMaxAI/minimax-h3-image` |
| Video | Hailuo H3 Turbo | `observantdistressed/minimax-h3-turbo` |
| Video | LTX Video 2.5 | `iis007/ltx-2-5-video-studio` |

## Architecture

Generation routes use Gradio's **async queue API** so Vercel functions don't time out:

```
POST /gradio_api/call/<api_name>   →  { event_id }
GET  /gradio_api/call/<api_name>/<event_id>  →  SSE stream
```

The SSE stream is consumed until a `complete` event arrives, then the output file is
downloaded and uploaded to Vercel Blob for private storage per visitor.

## Environment Variables

```
DATABASE_URL=     # Neon (PostgreSQL) connection string
BLOB_READ_WRITE_TOKEN=  # Vercel Blob token
HF_TOKEN=         # HuggingFace token (optional – increases rate limits on Spaces)
```

## Database

Run this in your Neon console once:

```sql
CREATE TABLE visitors (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  visits INT DEFAULT 1
);

CREATE TABLE generations (
  id BIGSERIAL PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES visitors(id),
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  pathname TEXT NOT NULL,
  content_type TEXT NOT NULL,
  aspect_ratio TEXT,
  duration INT,
  sequence_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON generations (visitor_id, created_at DESC);
```

## Deploy

1. Fork / push this repo to GitHub
2. Import into Vercel
3. Add environment variables
4. Deploy

The HF Spaces wake up cold in ~30 seconds – the first generation after a long pause
may fail; a retry succeeds once the Space is warm.
