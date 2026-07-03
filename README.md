# icwebsvc

A simple REST API service for issuer and ticker data.

## Local development

Install dependencies:

```bash
npm install
```

Run the app locally with Express:

```bash
npm start
```

## Cloudflare Workers + R2

This repository includes a Cloudflare Worker at `src/worker.js` that loads CSV data from an R2 bucket.

### Configure R2

1. Create or use an existing Cloudflare R2 bucket named `rws`.
2. Upload the CSV files to the `ws/` folder inside the `rws` bucket.

### Wrangler configuration

The Worker has an R2 binding configured in `wrangler.toml`:

```toml
[[r2_buckets]]
name = "RWS"
bucket_name = "rws"
```

### Deploy

Use wrangler to deploy the Worker:

```bash
npm run worker:deploy
```

Use `npm run worker:dev` to test locally with Wrangler.

## Notes

- The Worker code avoids `node:fs` and `node:path` and reads CSV content from R2.
- Local Node.js use still works because the shared CSV helper falls back to reading actual files from `data/` when passed a file path.
 
