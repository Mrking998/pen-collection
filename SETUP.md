# Pen Collection — Backend Setup

This adds a real backend to your site: a contact form that actually saves and
emails messages, a product/inventory system you manage from `/admin.html`,
and online checkout with Paystack.

It's built as Vercel serverless functions (the `/api` folder) plus a
Postgres database — no separate server to run. Your existing pages,
`style.css`, and `site.js` are untouched except for `index.html`, which gets
one new stylesheet line and three new `<script>` tags at the bottom.

## 1. Add these files to your repo

Copy everything in this folder into your project, keeping the same
structure:

```
api/                  → new
db/                   → new (SQL files, not deployed — just for setup)
assets/products.js    → new
assets/cart.js        → new
assets/backend.js     → new
assets/checkout.js    → new
assets/order-confirmed.js → new
assets/admin.js       → new
assets/backend.css    → new
checkout.html         → new
order-confirmed.html  → new
admin.html            → new
package.json          → new (or merge if you already have one)
index.html            → REPLACES your current index.html (only addition:
                         one <link> and three <script> tags — nothing
                         removed or changed)
```

Do **not** copy over your existing `assets/style.css` or `assets/site.js` —
those aren't included here and shouldn't be touched.

Commit and push to GitHub as usual; Vercel will redeploy automatically.

## 2. Create the database

In your Vercel dashboard → your project → **Storage** tab → **Create
Database** → choose **Postgres**. Follow the prompts and connect it to this
project. Vercel automatically adds the `POSTGRES_URL` environment variable
for you — you don't need to copy/paste a connection string.

## 3. Run the schema

Still in the Storage tab, open the database and use its **Query** tab to run
the contents of `db/schema.sql` (paste it in and run). This creates the
`products`, `orders`, `order_items`, and `messages` tables.

Optional but recommended: also run `db/seed.sql` afterwards — it pre-fills
the 8 pieces already shown on your homepage, with placeholder prices
(₦85,000–₦98,000) you can correct in `/admin.html` afterwards. If you skip
this, the homepage keeps showing the existing static cards until you add
products yourself.

## 4. Set environment variables

Project → **Settings** → **Environment Variables**. Add each of these
(see `.env.example` for the full list with comments):

| Variable | Where to get it |
|---|---|
| `ADMIN_PASSWORD` | Make one up — this logs into `/admin.html` |
| `ADMIN_SESSION_SECRET` | Any long random string (32+ characters) |
| `ADMIN_EMAIL` | `jacket.md@gmail.com` (or wherever you want enquiries sent) |
| `RESEND_API_KEY` | Free account at resend.com → API Keys |
| `FROM_EMAIL` | Can leave as `Pen Collection <onboarding@resend.dev>` to start |
| `PAYSTACK_SECRET_KEY` | paystack.com dashboard → Settings → API Keys & Webhooks (use the **test** key first) |
| `PAYSTACK_PUBLIC_KEY` | Same page |

Redeploy after adding variables (Vercel usually prompts you to).

## 5. Connect the Paystack webhook

Paystack dashboard → **Settings** → **API Keys & Webhooks** → set the
webhook URL to:

```
https://your-domain.com/api/webhook/paystack
```

This is what marks an order "paid" and reduces stock the moment a customer
pays. There's also a fallback check built into the confirmation page, so
checkout still works even before you set this up — but orders won't
auto-update without it.

## 6. Test it

1. Visit `/admin.html`, log in with `ADMIN_PASSWORD`.
2. Confirm your products show up under the Products tab (from the seed data
   or ones you add). Edit a price or add a new piece.
3. Visit the homepage — the Collection section should now be pulling from
   the database, with "Add To Cart" buttons.
4. Add something to your bag, go to checkout, and pay with a
   [Paystack test card](https://paystack.com/docs/payments/test-payments/)
   while you're using test keys.
5. Check the Orders tab in `/admin.html` — the order should show as "paid".
6. Try the contact form on the homepage — the message should appear under
   the Messages tab, and you should get an email (once `RESEND_API_KEY` is
   set and, ideally, a sending domain is verified in Resend — the
   `onboarding@resend.dev` address works for testing but has a low sending
   limit).

## 7. Go live

Once test payments work end-to-end, swap `PAYSTACK_SECRET_KEY` and
`PAYSTACK_PUBLIC_KEY` for your **live** keys in Vercel's environment
variables, and update the webhook URL in Paystack's live-mode settings too
(test and live webhooks are configured separately).

## Notes

- Prices are stored in **kobo** (₦1 = 100 kobo) so Paystack — which always
  expects kobo — never needs a conversion at checkout time. The admin form
  takes naira and converts automatically.
- Stock is re-checked and re-validated server-side at checkout — a customer
  can never buy more than what's actually in stock, even if they tamper
  with the page.
- If you ever want to wipe test orders before going live, you can run
  `DELETE FROM orders; DELETE FROM order_items;` in the Postgres Query tab.
