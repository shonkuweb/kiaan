# Kiaan Agro Care & Nursery

Mobile-first Next.js storefront recreated from the supplied homepage, collection, product details, and cart references. Includes responsive layouts, plant search, a browser-persisted cart and wishlist, navigation drawers, a care guide, and WhatsApp order enquiries.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:3000. For production:

```sh
npm run build
npm start
```

## VPS deployment

Use a supported Node.js LTS release. Build on the server, run `npm start` through your process manager (for example systemd or PM2), and reverse-proxy port 3000 through Nginx with HTTPS. The project also produces Next.js standalone output. If using the standalone output directly, copy `public` and `.next/static` into `.next/standalone/public` and `.next/standalone/.next/static`, then run `.next/standalone/server.js`.

## Scope

The storefront includes the homepage, `/collections/adenium`, and `/products/[id]`, with a shared navbar, footer, store provider, and full-height cart modal. Product data is in `app/lib/products.ts`. The collection supports color/price filters, sorting, and grid switching. Product pages include a gallery, quantity selection, related products, and expandable details. This is a frontend implementation; a complete ecommerce backend is not connected. Cart and wishlist are stored locally in the visitor's browser. The checkout button explains the pending online checkout integration and offers WhatsApp enquiries; payment, inventory, accounts, and order processing are not connected. Newsletter forms open an email subscription request and do not claim a server-side signup. Review content, contact details, and ratings reproduce the design and should be verified before launch. Policy and social-link dialogs identify pending launch details.

## Media and R2

`public/images` contains artwork extracted from the user's supplied mockups; all text and controls are HTML. New collection photos are extracted without controls; some older homepage photos and the red detail photo retain reference heart badges, covered by interactive wishlist buttons. Original standalone artwork can replace these assets later.

The hero editor at `/admin/settings` uploads JPG, PNG and WebP images (up to 8 MB) through a server route to `kiaan/hero/` in R2. It previews the confirmed public URL, then saves the image URL and text to `kiaan/settings/hero.json`. The homepage reads the saved banner; its other slides remain unchanged. If R2 is unavailable, the storefront retains the original banner.

Set the server-only variables listed in `.env.example` in ignored `.env.local` or your host's secrets. Never expose access keys through client components or `NEXT_PUBLIC_` variables. Local credentials are stored only in ignored `.env.local`.

Until admin authentication is implemented, upload and banner-save routes accept only same-origin localhost requests in development and reject all production writes. Connect authenticated administrator sessions before enabling production editing. Inventory, categories, orders and visibility remain browser drafts. Manage categories at `/admin/categories`; inventory tabs and the add-product category selector follow this list. New workspaces start with Adenium and Agrocare products, and older product drafts migrate to Adenium. Categories containing products cannot be removed.
