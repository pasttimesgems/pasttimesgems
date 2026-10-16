// English / Arabic text for the shop. Static page text is tagged with
// data-i18n (textContent), data-i18n-html (trusted markup from this file),
// data-i18n-ph (placeholder) or data-i18n-aria (aria-label).

const STRINGS = {
  en: {
    'nav.collection': 'Collection', 'nav.heritage': 'Heritage', 'nav.order': 'How to order',
    'lang.switch': 'عربي', 'lang.switchLabel': 'اقرأ الموقع بالعربية',
    'aria.saved': 'Show saved pieces', 'aria.bag': 'Open your bag', 'intro.skip': 'Skip',
    'hero.eyebrow': 'Fine pearls · Precious stones · Doha',
    'hero.title': 'Natural pearls, precious stones and <em>fine jewellery</em>',
    'hero.sub': 'A private collection in Doha. Every piece is chosen by hand, described honestly and delivered in person.',
    'hero.cta': 'View the collection', 'hero.story': 'Our story', 'hero.scroll': 'Scroll to collection',
    'marquee.a': 'Natural pearls', 'marquee.b': 'Precious gems', 'marquee.c': 'Handcrafted jewellery',
    'perk.1': 'Prices in Qatari riyal', 'perk.2': 'Delivery across Doha', 'perk.3': 'Order in one tap on WhatsApp', 'perk.4': 'Private viewings on request',
    'cat.jewellery': 'Jewellery', 'cat.gems': 'Gems', 'cat.pearls': 'Pearls', 'cat.all': 'All', 'cat.saved': 'Saved',
    'catnote.jewellery': 'Rings, necklaces and earrings in gold', 'catnote.gems': 'Loose precious stones with reports', 'catnote.pearls': 'Natural and cultured, strands and single pearls',
    'spot.eyebrow': 'In the spotlight', 'spot.title': 'Selected <em>pieces</em>',
    'spot.prev': 'Previous piece', 'spot.next': 'Next piece', 'spot.view': 'View details',
    'col.eyebrow': 'The collection', 'col.title': 'Pieces available now',
    'search': 'Search pieces', 'sort.featured': 'Featured', 'sort.new': 'Newest', 'sort.low': 'Price: low to high', 'sort.high': 'Price: high to low',
    'loading': 'Opening the vault…',
    'empty.none': 'New pieces are being polished. Please check back soon.',
    'empty.saved': 'Tap the heart on any piece to save it here.',
    'empty.search': 'No pieces match that search.',
    'empty.error': 'We could not open the collection just now. Please refresh in a moment.',
    'her.eyebrow': 'The house', 'her.title': 'Chosen by eye, <em>kept for generations</em>',
    'her.p1': "Pearls were Qatar's first treasure. We continue that tradition with a small, carefully chosen collection: natural pearls, certified stones and jewellery made to be worn every day and passed on.",
    'her.p2': 'Every piece is inspected in person, described honestly and delivered by hand in Doha.',
    'hero.wa': 'Speak to us on WhatsApp', 'cat.shop': 'Shop',
    'her.quote': '“Pearls were Qatar’s first treasure. We choose each one as carefully as the divers who found them.”',
    'her.l1': 'Every piece described honestly', 'her.l2': 'Prices shown in Qatari riyal', 'her.l3': 'Personal delivery or viewing in Doha',
    'steps.eyebrow': 'How to order', 'steps.title': 'Simple, personal, on WhatsApp',
    'steps.1t': 'Choose your pieces', 'steps.1p': 'Add what you love to your bag. Prices are in QAR.',
    'steps.2t': 'Send on WhatsApp', 'steps.2p': 'Your order is written out for you. Just press send.',
    'steps.3t': 'We confirm & deliver', 'steps.3p': 'We reply to confirm, then arrange delivery or a viewing. Pay cash or bank transfer.',
    'foot.loc': 'Doha, Qatar', 'foot.small': 'All prices in Qatari riyal (QAR)',
    'badge.featured': 'Featured', 'badge.sold': 'Sold', 'badge.reserved': 'Reserved',
    'quick': 'Quick view', 'add': 'Add to bag', 'save': 'Save', 'addTo': 'Add {name} to bag',
    'pm.zoom': 'Hover to zoom', 'pm.ask': 'Ask about this piece on WhatsApp', 'pm.more': 'You may also like',
    'pm.fewer': 'Fewer', 'pm.moreQty': 'More', 'pm.save': 'Save this piece', 'close': 'Close',
    'spec.material': 'Material', 'spec.weight': 'Size / weight', 'spec.origin': 'Origin', 'spec.status': 'Status',
    'status.available': 'Available', 'status.reserved': 'Reserved', 'status.sold': 'Sold',
    'bag.title': 'Your bag', 'bag.close': 'Close bag', 'bag.empty': 'Your bag is waiting for its first treasure.', 'bag.browse': 'Browse the collection',
    'bag.total': 'Total', 'bag.hint': 'Fill in your details and we will prepare the WhatsApp message.',
    'f.name': 'Full name', 'f.phone': 'Phone', 'f.delivery': 'Delivery', 'f.home': 'Home delivery in Doha', 'f.pickup': 'Pick up / private viewing',
    'f.address': 'Area / address', 'f.addressPh': 'e.g. West Bay, Zone 61', 'f.notes': 'Notes', 'f.notesPh': 'Ring size, gift wrap, best time to call…',
    'f.send': 'Send order on WhatsApp', 'f.small': 'No online payment. We confirm your order on WhatsApp first.',
    'remove': 'Remove', 'bar.view': 'View bag', 'pieces.one': '1 piece', 'pieces.many': '{n} pieces',
    'toast.added': '{name} added to your bag', 'toast.saved': '{name} saved', 'toast.unsaved': 'Removed from saved',
    'toast.saveHint': 'Tap the heart on any piece to save it.', 'toast.noNumber': 'The shop number is not set yet, so choose the shop in WhatsApp.',
    'toast.ready': 'Order {ref} is ready in WhatsApp. Press send to place it.',
    'wa.hello': 'Hello {shop}, I have a question.',
    'wa.ask': 'Hello {shop}, I\'m interested in "{name}" ({price}). Is it available?',
    'wa.order': 'New order · {shop}', 'wa.ref': 'Order ref', 'wa.qty': 'Qty', 'wa.total': 'Total',
    'wa.name': 'Name', 'wa.phone': 'Phone', 'wa.delivery': 'Delivery', 'wa.address': 'Address', 'wa.notes': 'Notes',
  },
  ar: {
    'nav.collection': 'المجموعة', 'nav.heritage': 'إرثنا', 'nav.order': 'طريقة الطلب',
    'lang.switch': 'EN', 'lang.switchLabel': 'Read the site in English',
    'aria.saved': 'القطع المحفوظة', 'aria.bag': 'افتح حقيبتك', 'intro.skip': 'تخطي',
    'hero.eyebrow': 'لؤلؤ فاخر · أحجار كريمة · الدوحة',
    'hero.title': 'لؤلؤ طبيعي وأحجار كريمة و<em>مجوهرات راقية</em>',
    'hero.sub': 'مجموعة خاصة في الدوحة. نختار كل قطعة بأيدينا، ونصفها بصدق، ونسلّمها شخصياً.',
    'hero.cta': 'تصفّح المجموعة', 'hero.story': 'حكايتنا', 'hero.scroll': 'انتقل إلى المجموعة',
    'marquee.a': 'لؤلؤ طبيعي', 'marquee.b': 'أحجار كريمة', 'marquee.c': 'مجوهرات يدوية',
    'perk.1': 'الأسعار بالريال القطري', 'perk.2': 'توصيل في جميع أنحاء الدوحة', 'perk.3': 'اطلب بلمسة عبر واتساب', 'perk.4': 'معاينة خاصة عند الطلب',
    'cat.jewellery': 'مجوهرات', 'cat.gems': 'أحجار كريمة', 'cat.pearls': 'لؤلؤ', 'cat.all': 'الكل', 'cat.saved': 'المحفوظة',
    'catnote.jewellery': 'خواتم وقلائد وأقراط من الذهب', 'catnote.gems': 'أحجار كريمة منفردة مع تقارير', 'catnote.pearls': 'طبيعي ومستزرع، عقود ولآلئ منفردة',
    'spot.eyebrow': 'تحت الأضواء', 'spot.title': 'قطع <em>مختارة</em>',
    'spot.prev': 'القطعة السابقة', 'spot.next': 'القطعة التالية', 'spot.view': 'التفاصيل',
    'col.eyebrow': 'المجموعة', 'col.title': 'القطع المتوفرة الآن',
    'search': 'ابحث عن قطعة', 'sort.featured': 'المميزة', 'sort.new': 'الأحدث', 'sort.low': 'السعر: من الأقل', 'sort.high': 'السعر: من الأعلى',
    'loading': 'نفتح الخزانة…',
    'empty.none': 'نلمّع قطعاً جديدة، عُد قريباً.',
    'empty.saved': 'اضغط على القلب في أي قطعة لحفظها هنا.',
    'empty.search': 'لا توجد قطع تطابق البحث.',
    'empty.error': 'تعذّر فتح المجموعة الآن، حدّث الصفحة بعد قليل.',
    'her.eyebrow': 'الدار', 'her.title': 'نختارها بأعيننا، <em>وتبقى لأجيال</em>',
    'her.p1': 'كان اللؤلؤ أول كنوز قطر. نواصل هذا الإرث بمجموعة صغيرة مختارة بعناية: لؤلؤ طبيعي وأحجار موثّقة ومجوهرات تُلبس كل يوم وتُورَّث.',
    'her.p2': 'نفحص كل قطعة بأنفسنا، ونصفها بصدق، ونسلّمها يداً بيد في الدوحة.',
    'hero.wa': 'تواصل معنا عبر واتساب', 'cat.shop': 'تسوّق',
    'her.quote': '«كان اللؤلؤ أول كنوز قطر. نختار كل لؤلؤة بعناية الغواصين الذين وجدوها.»',
    'her.l1': 'وصف صادق لكل قطعة', 'her.l2': 'الأسعار بالريال القطري', 'her.l3': 'توصيل شخصي أو معاينة في الدوحة',
    'steps.eyebrow': 'طريقة الطلب', 'steps.title': 'بسيطة وشخصية، عبر واتساب',
    'steps.1t': 'اختر قطعك', 'steps.1p': 'أضف ما يعجبك إلى حقيبتك. الأسعار بالريال القطري.',
    'steps.2t': 'أرسل عبر واتساب', 'steps.2p': 'نكتب طلبك لك جاهزاً، فقط اضغط إرسال.',
    'steps.3t': 'نؤكد ونوصّل', 'steps.3p': 'نرد لتأكيد الطلب، ثم نرتب التوصيل أو المعاينة. الدفع نقداً أو بتحويل بنكي.',
    'foot.loc': 'الدوحة، قطر', 'foot.small': 'جميع الأسعار بالريال القطري',
    'badge.featured': 'مميزة', 'badge.sold': 'مُباعة', 'badge.reserved': 'محجوزة',
    'quick': 'نظرة سريعة', 'add': 'أضف إلى الحقيبة', 'save': 'احفظ', 'addTo': 'أضف {name} إلى الحقيبة',
    'pm.zoom': 'مرّر للتكبير', 'pm.ask': 'اسأل عن هذه القطعة عبر واتساب', 'pm.more': 'قد يعجبك أيضاً',
    'pm.fewer': 'أقل', 'pm.moreQty': 'أكثر', 'pm.save': 'احفظ هذه القطعة', 'close': 'إغلاق',
    'spec.material': 'الخامة', 'spec.weight': 'الحجم / الوزن', 'spec.origin': 'المنشأ', 'spec.status': 'الحالة',
    'status.available': 'متوفرة', 'status.reserved': 'محجوزة', 'status.sold': 'مُباعة',
    'bag.title': 'حقيبتك', 'bag.close': 'أغلق الحقيبة', 'bag.empty': 'حقيبتك تنتظر أول كنز.', 'bag.browse': 'تصفّح المجموعة',
    'bag.total': 'المجموع', 'bag.hint': 'أدخل بياناتك وسنجهّز رسالة واتساب.',
    'f.name': 'الاسم الكامل', 'f.phone': 'رقم الهاتف', 'f.delivery': 'الاستلام', 'f.home': 'توصيل إلى المنزل في الدوحة', 'f.pickup': 'استلام / معاينة خاصة',
    'f.address': 'المنطقة / العنوان', 'f.addressPh': 'مثال: الخليج الغربي، منطقة 61', 'f.notes': 'ملاحظات', 'f.notesPh': 'مقاس الخاتم، تغليف هدية، أفضل وقت للاتصال…',
    'f.send': 'أرسل الطلب عبر واتساب', 'f.small': 'لا دفع إلكتروني. نؤكد طلبك عبر واتساب أولاً.',
    'remove': 'إزالة', 'bar.view': 'عرض الحقيبة', 'pieces.one': 'قطعة واحدة', 'pieces.many': '{n} قطع',
    'toast.added': 'أُضيفت {name} إلى حقيبتك', 'toast.saved': 'حُفظت {name}', 'toast.unsaved': 'أُزيلت من المحفوظة',
    'toast.saveHint': 'اضغط على القلب في أي قطعة لحفظها.', 'toast.noNumber': 'رقم المتجر غير مضبوط بعد، اختر المتجر في واتساب.',
    'toast.ready': 'الطلب {ref} جاهز في واتساب. اضغط إرسال لإتمامه.',
    'wa.hello': 'مرحباً {shop}، لدي استفسار.',
    'wa.ask': 'مرحباً {shop}، أنا مهتم بـ "{name}" ({price}). هل هي متوفرة؟',
    'wa.order': 'طلب جديد · {shop}', 'wa.ref': 'رقم الطلب', 'wa.qty': 'الكمية', 'wa.total': 'المجموع',
    'wa.name': 'الاسم', 'wa.phone': 'الهاتف', 'wa.delivery': 'الاستلام', 'wa.address': 'العنوان', 'wa.notes': 'ملاحظات',
  },
};

const LANG_KEY = 'ptg-lang';
let lang = 'en';
try {
  lang = localStorage.getItem(LANG_KEY) || ((navigator.language || '').startsWith('ar') ? 'ar' : 'en');
} catch { /* storage blocked */ }
if (!STRINGS[lang]) lang = 'en';

export const getLang = () => lang;

export function t(key, vars = {}) {
  const s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

// Arabic name/description when the admin entered one, otherwise the English.
export const localName = (p) => (lang === 'ar' && p?.name_ar) || p?.name || '';
export const localDesc = (p) => (lang === 'ar' && p?.description_ar) || p?.description || '';

export function applyStatic(root = document) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of root.querySelectorAll('[data-i18n-ph]')) el.placeholder = t(el.dataset.i18nPh);
  for (const el of root.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
}

export function setLang(next) {
  lang = STRINGS[next] ? next : 'en';
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* storage blocked */ }
  applyStatic();
}
