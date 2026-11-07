# Tutor proxy (optional)

Inside Claude, the Code Lab's tutor uses the viewer's Claude account through the page's `sample` capability and needs
no server. This proxy is for copies of the page opened **outside** Claude, such as the downloaded HTML file.

## Why a server

An API key must never be put in a web page: anyone could read it. The page sends only the conversation to this
server; the server adds the key (from an environment variable), calls the Claude API, and streams back the text.

## Run it

Node.js 18 or newer, no packages to install.

```sh
ANTHROPIC_API_KEY=sk-ant-...           # your key, kept on the server only
ALLOWED_ORIGIN=https://your-site.example
node server.mjs                         # listens on PORT (default 8787)
```

Then, in the Code Lab, open **Settings → Tutor → Use the tutor outside Claude** and enter the address, for example
`https://tutor.your-site.example/tutor`. The page accepts only `https://` addresses, or `http://localhost` for testing.

A file opened straight from disk sends the origin `null`. To allow it while testing on your own machine, add `null`
to `ALLOWED_ORIGIN`. Do not do that on a public server.

## Settings

| Variable | Default | Meaning |
|---|---|---|
| `ANTHROPIC_API_KEY` | (required) | The API key. Never commit it or put it in the page. |
| `ALLOWED_ORIGIN` | (none) | Comma-separated list of sites allowed to call the server. |
| `MODEL` | `claude-sonnet-5-5` | The model. Check the current names in the Claude API docs (docs.claude.com). |
| `MAX_TOKENS` | 1500 | The longest answer. |
| `RATE_PER_MINUTE` | 12 | Requests per minute from one address. |
| `PORT` | 8787 | Port to listen on. |

## Limits and honesty

- The request and response format is the Claude Messages API with streaming (`content_block_delta` events). The page's
  side of this protocol is tested against a local stand-in server; this file was not run against the live API from
  the environment where it was written, so test it once after deploying.
- The rate limit is kept in memory: it resets on restart and is per server process. Put the server behind a proper
  gateway if many people will use it.
- The server keeps no logs of conversations. Add logging only if your users agree to it.
