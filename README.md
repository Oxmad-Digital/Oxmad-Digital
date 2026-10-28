This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Images — Cloudflare R2

All 31 images in `public/` have WebP equivalents in the `oxmad-digital-website`
bucket. Object names include `oxmad-digital`, a descriptive name and a content hash
for safe immutable caching. Original artwork is retained locally.

The bucket's public HTTPS domain is configured in `lib/media-config.json`:
`https://pub-1bdff9c4a25543dcb778d1e9424d69a9.r2.dev`.
To change domains, update `publicUrl` and rebuild. The S3 endpoint ending in
`r2.cloudflarestorage.com` is authenticated and cannot serve as this public URL.
Until a public domain is set, the site keeps using the original local images.
`NEXT_PUBLIC_R2_PUBLIC_URL` can override the domain at build time.

`lib/media.ts` centralizes the hero, service, brand and project image URLs.
`lib/media-manifest.json` records every source, object key, size and dimensions.
Next.js accepts only the configured host and `/images/oxmad-digital-*.webp` paths.
Heroes use quality 92, other raster images target quality 82, and logos use
lossless WebP. Already smaller WebP sources are retained without recompression.
The desktop home hero is encoded from its original lossless PNG. Service previews
are limited to 960px wide; hero and project dimensions are preserved.

To regenerate and upload assets (Node.js 20.19+ and curl with `--aws-sigv4`):

```bash
npm run media:prepare
# In an ignored .env.r2 file, set R2_ENDPOINT, R2_BUCKET,
# R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY. Never use NEXT_PUBLIC_ for credentials.
node --env-file=.env.r2 scripts/upload-r2-media.mjs
```

Generated WebPs are stored in the ignored `.r2-media/` directory. Uploads set
`Content-Type: image/webp` and one-year immutable caching, then verify each object's
size and content type. No S3 credentials are needed by the deployed site. The intro
animation samples the logo through Next.js's same-origin image endpoint, so no R2
CORS configuration is required.

## Client area — `/espace-client`

Clients sign in by magic link (no password) and find their quotes and invoices, their
change requests and a shared drive. The admin manages it under `/admin/clients` and
`/admin/demandes`. Tables are in `db/schema.sql`: run `npm run db:setup` after pulling.
New clients start with five drive folders: Logos, Documents, Images, Icônes and
Illustrations. Run `npm run drive:setup` once for existing clients; it adds only
missing root folders, preserving existing files and folders. Deleted folders are
not recreated when browsing the drive.

- **Accounts**: create a client in `/admin/clients`, add the people who need access and
  tick "Envoyer l'invitation". Anyone can then ask for a new link from
  `/espace-client/connexion` with their email. Links last 20 minutes, are single-use and
  open a confirmation page, so mail scanners that follow links don't use them up.
- **Requests**: the client picks a type (correction, amélioration, mini-fonctionnalité,
  autre). The admin qualifies it: *Incluse — planifiée*, or *Hors maintenance* when it
  needs a quote (new page, new section, major feature), then *En cours* → *Livrée*. Each
  change is logged in the thread and can be emailed to the client.
- **Quotes / invoices**: PDFs generated elsewhere, uploaded from the client's admin page
  with number, amount, dates and status. Unpaid invoices past their due date show as late.
- **Drive**: nested folders per client. Clients can delete their own uploads, not the
  studio's. Request attachments are stored the same way but kept out of the drive.

Files go to a **private** R2 bucket, separate from the public media bucket. Browsers upload
straight to it through presigned URLs (signed in `lib/r2.ts`, 250 MB per file), so the
hosting's request size limit doesn't apply. Downloads go through `/api/portal/…`, which
checks access and redirects to a 5-minute signed URL.

Setup:

1. Create a bucket (e.g. `oxmad-digital-clients`), without public access.
2. Create an R2 API token with *Object Read & Write* on this bucket only.
3. Add its CORS policy (bucket → Settings → CORS policy), listing every origin that uploads:

   ```json
   [{
     "AllowedOrigins": ["https://www.oxmad-digital.mg", "http://localhost:3000"],
     "AllowedMethods": ["PUT"],
     "AllowedHeaders": ["content-type"],
     "MaxAgeSeconds": 3600
   }]
   ```

4. Set in `.env.local` and in the hosting environment:
   `R2_ENDPOINT`, `R2_PRIVATE_BUCKET`, `R2_PRIVATE_ACCESS_KEY_ID`, `R2_PRIVATE_SECRET_ACCESS_KEY`
   (the token's S3 credentials, separate from the media ones), plus the
   existing `DATABASE_URL`, `ADMIN_SESSION_SECRET` (also signs client sessions) and `RESEND_*`.
   `APP_URL` sets the origin of emailed links; it defaults to the production site, or
   `http://localhost:3000` in development.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
