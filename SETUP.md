# Setting up Past Times Gems (free)

The site works straight away in **demo mode** with sample products. To let the
shop's staff add real products that every customer sees, connect it to a free
Supabase project. This takes about 15 minutes and is done once.

Everything below is on free plans. No card is needed.

---

## 1. Put the site online with GitHub Pages

1. In this repository on GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
3. Choose branch **main** and folder **/ (root)**, then **Save**.
4. After a minute the address appears at the top of that page, for example
   `https://pasttimesgems.github.io/pasttimesgems/`.

- Customer shop: that address.
- Admin page: the same address followed by `admin.html`.

> GitHub Pages is free for public repositories. On a free GitHub account the
> repository must be **public** for Pages to work. That is fine: there are no
> secrets in this code.

## 2. Create the free database (Supabase)

1. Go to <https://supabase.com>, sign up, and click **New project**.
   - Name: `pasttimesgems`
   - Database password: anything strong (save it somewhere, you rarely need it)
   - Region: choose the closest, e.g. *Middle East (Bahrain)* or *Central EU*.
2. Wait for the project to finish setting up.
3. Open **SQL Editor → New query**, paste the whole of
   [`supabase/schema.sql`](supabase/schema.sql), and press **Run**.
   This creates the products table, shop settings, the photo storage, and the
   rules that let only admins make changes.

## 3. Create the admin logins

Only the people you add here can open the admin page.

1. In Supabase open **Authentication → Sign In / Providers** and turn **off**
   *Allow new users to sign up*. (So nobody can make their own account.)
2. Open **Authentication → Users → Add user → Create new user**.
   Enter the staff member's email and a password, and tick
   *Auto Confirm User*. Repeat for each person.
3. Back in **SQL Editor**, run one line per person:

   ```sql
   insert into public.admins (email) values ('owner@example.com');
   ```

To remove someone later: delete them in **Authentication → Users** and run
`delete from public.admins where email = 'their@email.com';`

## 4. Connect the website to the database

1. In Supabase open **Project Settings → API** (or **Data API**). Copy:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public** key (a long text starting with `eyJ...`)
2. In this repository open [`assets/js/config.js`](assets/js/config.js),
   click the pencil icon to edit, and paste them in:

   ```js
   supabaseUrl: 'https://abcd1234.supabase.co',
   supabaseAnonKey: 'eyJ...',
   whatsappNumber: '97455512345',
   ```

3. Commit the change. GitHub Pages updates the site in about a minute.

> The anon key is meant to be public. It can only do what the rules from step 2
> allow: anyone can read visible products; only listed admins can change them.
> Never paste the **service_role** key anywhere in this code.

## 5. Set the WhatsApp number for orders

Orders are sent to WhatsApp, so this number receives them.

- Use **country code + number, digits only**. For Qatar that is `974` then the
  8-digit number, e.g. `97455512345`. No `+`, spaces or leading zeros.
- You can set it in `config.js` (step 4) **or** later on the admin page under
  **Shop settings** (the admin setting wins).
- A free **WhatsApp Business** app on the shop's phone is recommended, so you
  can add a business profile, opening hours and quick replies. It is not
  required; a normal WhatsApp number works too.

## 6. Add your first product

1. Open `…/admin.html` and sign in with an admin email from step 3.
2. Press **+ Add product**, choose a photo, fill in the name, category and
   price in QAR, and **Save**.
3. Open the shop page. The product is there.

Tips:
- Photos are shrunk automatically before upload so the free storage lasts.
- Mark a piece **Sold** to keep it on show with a "Sold" badge, or untick
  **Visible** to hide it without deleting it.
- **Featured** pieces are shown first.

---

## How ordering works

1. A customer adds pieces to their bag and fills in name, phone and address.
2. Pressing **Send order on WhatsApp** opens WhatsApp with the full order
   already written (items, quantities, prices in QAR, total, customer details
   and an order reference like `PTG-B1RNDP`).
3. The customer presses send. The shop replies to confirm and arranges payment
   (cash or bank transfer) and delivery.

There is no card payment and nothing is charged online.

## Free plan limits worth knowing

- **Supabase free**: 500 MB database, 1 GB file storage, plenty for a shop.
  A free project is **paused after 7 days with no activity**; normal customer
  visits count as activity. If it ever pauses, sign in to Supabase and press
  *Restore*.
- **GitHub Pages**: free for public repositories, 100 GB bandwidth a month.

## Using your own domain (optional)

You can point a domain such as `pasttimesgems.qa` at GitHub Pages under
**Settings → Pages → Custom domain**. Buying the domain itself costs money;
everything else stays free.
