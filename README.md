# Past Times Gems

Website for **Past Times Gems**, Doha: jewellery, gems and pearls.

- **Customer shop** (`index.html`): an animated showroom inspired by Qatar's
  pearling heritage. Customers browse by category, search, view each piece, add
  to a bag and send the order on WhatsApp. Prices are in QAR.
- **Admin page** (`admin.html`): sign-in for listed staff only. Add, edit, hide,
  mark as sold or delete products, upload photos, and set the WhatsApp number
  and an announcement bar. Changes appear in the shop immediately.

It is a plain static site (HTML, CSS, JavaScript, no build step) hosted free on
GitHub Pages, with a free Supabase project as the shared database, login and
photo storage.

**First-time setup:** see [SETUP.md](SETUP.md).

Until Supabase is connected the site runs in demo mode with sample products, so
you can try everything. On the admin page use any email and the password `demo`.

## Files

| Path | What it is |
| --- | --- |
| `index.html`, `assets/css/shop.css`, `assets/js/shop.js` | Customer shop |
| `admin.html`, `assets/css/admin.css`, `assets/js/admin.js` | Admin page |
| `assets/js/config.js` | Shop name, Supabase keys, WhatsApp number |
| `assets/js/store.js` | Talks to Supabase (or the demo store) |
| `assets/js/effects.js` | Sliding scroll reveals and the hero parallax |
| `assets/js/guilloche.js` | Engraved line pattern used by the placeholders |
| `assets/js/art.js` | Engraved placeholder for pieces without a photo |
| `supabase/schema.sql` | Database tables and security rules |

## Try it locally

```sh
python3 -m http.server 8000
# open http://localhost:8000 and http://localhost:8000/admin.html
```
