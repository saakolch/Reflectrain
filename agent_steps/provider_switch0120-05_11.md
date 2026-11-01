# Provider switch + output contract fixes (~20:05 Asia/Shanghai, 1 Nov 2026)

## What changed and why

The user swapped DeepSeek direct for OpenRouter (`OPENROUTER_API_KEY` +
`HARNESS_MODEL_ID_OPENROUTER`). Three things had to change, all found by running the model,
not by reading code.

### 1. Provider abstraction

`lib/ai.ts` now resolves a target in priority order: OpenRouter → DeepSeek → mock. Harness ids look like
`openrouter/deepseek/deepseek-v4-flash`; the API wants `deepseek/deepseek-v4-flash`, so the `openrouter/`
prefix is stripped in `lib/env.ts`. Reason: the prefix is a harness routing convention, not part of the
model id; sending it returns 404 and the app would silently show mock output.

### 2. The model does not honour the JSON schema exactly

Real output used `friction[].description` instead of `text`, nested the sprint review under
`sprint.review`, and returned `energy: ""`. The normaliser accepted all of it. Reason: a schema in a
prompt is a request, not a guarantee; the parsing layer is the contract enforcement point.

### 3. Truncation looked like success

With `max_tokens: 4000` the model sometimes hit the limit mid-string (`finish_reason: "length"`), the
JSON failed to parse, and the app quietly served mock data — a silent lie. Now: `finish_reason=length`
throws, the call is retried once in strict mode (shorter strings, higher budget), and only then falls
back to mock with the error written into the summary.

### 4. Language drift

`AI_LANG=en` was only in the system prompt; the model answered in Chinese and Russian. Added an explicit
`LANGUAGE: English` line to the user message, adjacent to the dump.

### 5. Middleware blocked API routes

The "no credentials → rewrite to /setup" rule applied to `/api/*` too, so the analyze endpoint returned
HTML. API paths now pass through and answer with JSON (401 / 503 / 400 themselves).

## Verified

Two consecutive real runs against `deepseek/deepseek-v4-flash` via OpenRouter:
insights 3 and 1, tasks 4 and 3, friction 5 and 4, sprint progress/resistance/changes filled, English output.

## Known limits

- 24–40 s per weekly call. Fine on a weekly rhythm, too slow for a fast daily loop; the UI shows a
  spinner, and daily dumps are shorter so they land faster.
- Friction tags are model-chosen; the same obstacle can be `cognitive` one day and `emotional` the next.
  Acceptable now, worth a fixed taxonomy later if you ever chart them.
