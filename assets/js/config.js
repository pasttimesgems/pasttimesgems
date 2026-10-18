// Shop settings. Fill these in once (see SETUP.md). Everything here is safe to
// publish: the Supabase "anon" key is designed to be public, and the database
// rules in supabase/schema.sql decide who can change what.
//
// While supabaseUrl / supabaseAnonKey are empty the site runs in DEMO MODE:
// sample products are shown and admin changes are kept only in your browser.

export const CONFIG = {
  shopName: 'Past Times Gems',
  tagline: 'Jewellery · Gems · Pearls',
  location: 'Doha, Qatar',

  // From Supabase: Project Settings → API
  supabaseUrl: '',
  supabaseAnonKey: '',

  // WhatsApp number that receives orders: country code + number, digits only.
  // Example for Qatar: '97455512345'. Can also be changed later in the admin page.
  whatsappNumber: '97433460196',

  // Social pages shown in the footer. Instagram can also be changed in the admin page.
  instagram: 'past_timesofficial',
  facebook: 'https://www.facebook.com/profile.php?id=61592552664510',
  currency: 'QAR',
};
