/* ══════════════════════════════════════════════════════════════
   LIVEORDER PRO — app.js v7.0
   Architecture : State-driven · Progressive Steps · CRO-First
   Improved     : Scroll reveals · Smooth counters · Haptic UX
                  Robust validation · Cleaner DOM cache
                  Delivery module ready · Pickup / Locker / Map
══════════════════════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════════════════════════════
// CONFIG — Edit products, endpoints, and social proof here
// ════════════════════════════════════════════════════════════════
const CONFIG = {
  products: {
    QZ01: { price: 39,  name: 'Produit QZ01' },
    DR02: { price: 119, name: 'Produit DR02' },
    JB07: { price: 59,  name: 'Produit JB07' },
    AL11: { price: 24,  name: 'Produit AL11' },
  },

  shipping: {
    default: { price: 6.00, label: 'Relais Standard' },
  },

  formspreeEndpoint: 'https://formspree.io/f/TON_FORM_ID',
  stripeLink:        'https://buy.stripe.com/TON_LIEN_STRIPE',

  socialProof: {
    baseOrders:  32,
    baseViewers: 135,
    urgencyBase: 8,
  },

  popupFirstDelay:   9000,
  popupMinInterval: 18000,
  popupMaxInterval: 34000,
  popupDisplayMs:    4800,

  popupNames: [
    'Emma','Lucas','Camille','Théo','Lina','Nathan','Sarah','Julien',
    'Inès','Maxime','Léa','Enzo','Manon','Hugo','Clara','Baptiste',
    'Jade','Tom','Anaïs','Louis','Alice','Romain','Zoé','Antoine',
    'Nora','Alexandre','Eva','Raphaël','Laura','Matteo','Chloé','Axel',
    'Ambre','Valentin','Nina','Arthur','Elisa','Clément','Mia','Paul',
    'Lucie','Adrien','Yasmine','Quentin','Sofia','Kevin','Léonie','Ethan',
    'Margot','Nicolas','Alix','Simon','Inaya','Pierre','Céline','Thomas',
    'Elina','Florian','Marie','Dylan','Charlotte','Mathis','Océane','Robin',
  ],

  popupTemplates: [
    n => `${n} vient de réserver`,
    n => `${n} a effectué une commande`,
    n => `${n} vient de commander`,
    n => `${n} a réservé un article`,
    n => `${n} vient de passer commande`,
    n => `${n} a sécurisé son article`,
    (n, ref) => ref ? `${n} vient de commander ${ref}` : `${n} vient de commander`,
    (n, ref) => ref ? `${n} a réservé — ${ref}` : `${n} a réservé`,
  ],

  delivery: {
    enabled: true,
    defaultMode: 'relay',          // home | relay | locker
    defaultCarrier: 'mondial_relay',

    carriers: {
      mondial_relay: {
        name: 'Mondial Relay',
        supports: ['relay', 'locker'],
      },
      chronopost: {
        name: 'Chronopost',
        supports: ['relay', 'locker', 'home'],
      },
    },

    // Mock data ready to be replaced by real endpoints / backend proxy
    mockPoints: {
      mondial_relay: [
        {
          id: 'MR-001',
          name: 'Locker Centre Ville',
          address: '10 Rue Centrale',
          zip: '34000',
          city: 'Montpellier',
          lat: 43.6112,
          lng: 3.8767,
          distanceKm: 0.8,
          type: 'locker',
          hours: '24h/24',
          label: 'Locker Centre Ville — 10 Rue Centrale, 34000 Montpellier',
        },
        {
          id: 'MR-002',
          name: 'Relais Tabac Express',
          address: '5 Avenue de la Gare',
          zip: '34000',
          city: 'Montpellier',
          lat: 43.6139,
          lng: 3.8731,
          distanceKm: 1.2,
          type: 'relay',
          hours: '09:00–19:00',
          label: 'Relais Tabac Express — 5 Avenue de la Gare, 34000 Montpellier',
        },
        {
          id: 'MR-003',
          name: 'Locker Port Marianne',
          address: '42 Avenue du Mondial',
          zip: '34000',
          city: 'Montpellier',
          lat: 43.6034,
          lng: 3.8944,
          distanceKm: 2.1,
          type: 'locker',
          hours: '24h/24',
          label: 'Locker Port Marianne — 42 Avenue du Mondial, 34000 Montpellier',
        },
      ],

      chronopost: [
        {
          id: 'CH-001',
          name: 'Chrono Relais Comédie',
          address: '12 Place de la Comédie',
          zip: '34000',
          city: 'Montpellier',
          lat: 43.6083,
          lng: 3.8795,
          distanceKm: 0.6,
          type: 'relay',
          hours: '08:30–20:00',
          label: 'Chrono Relais Comédie — 12 Place de la Comédie, 34000 Montpellier',
        },
        {
          id: 'CH-002',
          name: 'Chronopost Locker Sud',
          address: '78 Rue du Sud',
          zip: '34070',
          city: 'Montpellier',
          lat: 43.5983,
          lng: 3.8712,
          distanceKm: 1.9,
          type: 'locker',
          hours: '24h/24',
          label: 'Chronopost Locker Sud — 78 Rue du Sud, 34070 Montpellier',
        },
        {
          id: 'CH-003',
          name: 'Chrono Shop Gare',
          address: '3 Boulevard de Strasbourg',
          zip: '34000',
          city: 'Montpellier',
          lat: 43.6048,
          lng: 3.8808,
          distanceKm: 1.4,
          type: 'relay',
          hours: '09:00–18:30',
          label: 'Chrono Shop Gare — 3 Boulevard de Strasbourg, 34000 Montpellier',
        },
      ],
    },
  },
};

// ════════════════════════════════════════════════════════════════
// STATE — Single source of truth
// ════════════════════════════════════════════════════════════════
const state = {
  currentStep:   1,
  productRef:    '',
  productName:   '',
  productPrice:  0,
  isKnownRef:    false,
  quantity:      1,
  shippingPrice: CONFIG.shipping.default.price,
  shippingLabel: CONFIG.shipping.default.label,
  paymentMode:   'stripe',

  // Enhanced delivery state
  deliveryMode: CONFIG.delivery.defaultMode,
  carrierCode:  CONFIG.delivery.defaultCarrier,
  carrierName:  CONFIG.delivery.carriers[CONFIG.delivery.defaultCarrier]?.name || 'Mondial Relay',
  pickupPoint:  null,
  deliveryModuleEnabled: false,
  pickupPointsLoaded: false,
  pickupLoading: false,

  get subtotal()   { return this.productPrice * this.quantity; },
  get total()      { return this.productPrice > 0 ? this.subtotal + this.shippingPrice : 0; },
  get hasProduct() { return this.productPrice > 0; },
};

// ════════════════════════════════════════════════════════════════
// DOM — Lazily cached selectors (singleton pattern)
// ════════════════════════════════════════════════════════════════
const _domCache = {};

function $id(id) {
  if (!_domCache[id]) _domCache[id] = document.getElementById(id);
  return _domCache[id];
}
function $qs(sel) { return document.querySelector(sel); }
function $qsa(sel) { return document.querySelectorAll(sel); }

const DOM = {
  liveViewers:    () => $id('liveViewers'),
  heroOrderCount: () => $id('heroOrderCount'),
  progressBar:    () => $id('progressBar'),
  resetBtn:       () => $id('resetAllBtn'),

  form:         () => $id('orderForm'),
  submitBtn:    () => $id('submitBtn'),
  submitBtnTxt: () => $id('submitBtnText'),
  successState: () => $id('successState'),
  stepNav:      () => $id('stepNav'),

  referenceInput:   () => $id('reference'),
  refIcon:          () => $id('refIcon'),
  refHint:          () => $id('refHint'),
  customPriceField: () => $id('customPriceField'),
  prixInput:        () => $id('prix_unitaire'),
  quantiteInput:    () => $id('quantite'),
  qtyMinus:         () => $id('qtyMinus'),
  qtyPlus:          () => $id('qtyPlus'),
  amountCard:       () => $id('amountCard'),
  amountDisplay:    () => $id('amountDisplay'),
  amountCurrency:   () => $id('amountCurrency'),
  amountHint:       () => $id('amountHint'),
  amountQtyDisplay: () => $id('amountQtyDisplay'),
  urgencyStrip:     () => $id('urgencyStrip'),
  urgencyText:      () => $id('urgencyText'),
  step1Next:        () => $id('step1Next'),

  step2:      () => $id('step2'),
  step1Sum:   () => $id('step1Summary'),
  step2Next:  () => $id('step2Next'),

  step3:      () => $id('step3'),
  step2Sum:   () => $id('step2Summary'),
  step3Next:  () => $id('step3Next'),
  shippingOpts: () => $qsa('[data-shipping-price]'),

  step4:           () => $id('step4'),
  summaryRef:      () => $id('summaryRef'),
  summaryName:     () => $id('summaryName'),
  summaryQty:      () => $id('summaryQty'),
  summaryAmount:   () => $id('summaryAmount'),
  summaryShipping: () => $id('summaryShipping'),
  summaryTotal:    () => $id('summaryTotal'),
  paymentOpts:     () => $qsa('[data-payment-mode]'),

  sbRef:      () => $id('sbRef'),
  sbName:     () => $id('sbName'),
  sbAmount:   () => $id('sbAmount'),
  sbShipping: () => $id('sbShipping'),
  sbTotal:    () => $id('sbTotal'),
  sbPayCta:   () => $id('sidebarStripeLink'),

  hiddenAmount:        () => $id('hiddenAmount'),
  hiddenQuantity:      () => $id('hiddenQuantity'),
  hiddenShipping:      () => $id('hiddenShipping'),
  hiddenTotal:         () => $id('hiddenTotal'),
  hiddenShippingLabel: () => $id('hiddenShippingLabel'),
  hiddenPaymentMode:   () => $id('hiddenPaymentMode'),

  // Enhanced delivery hidden inputs (optional)
  hiddenCarrierCode:      () => $id('carrier_code'),
  hiddenCarrierName:      () => $id('carrier_name'),
  hiddenDeliveryType:     () => $id('delivery_type'),
  hiddenPickupPointId:    () => $id('pickup_point_id'),
  hiddenPickupPointName:  () => $id('pickup_point_name'),
  hiddenPickupPointAddr:  () => $id('pickup_point_address'),
  hiddenPickupPointZip:   () => $id('pickup_point_zip'),
  hiddenPickupPointCity:  () => $id('pickup_point_city'),
  hiddenPickupPointDist:  () => $id('pickup_point_distance'),
  hiddenPickupPointLabel: () => $id('pickup_point_label'),

  // Enhanced delivery UI (optional / future-safe)
  deliveryModeBtns:  () => $qsa('[data-delivery-mode]'),
  carrierBtns:       () => $qsa('[data-carrier]'),
  pickupPanel:       () => $id('pickupPanel') || $id('pickup-panel'),
  pickupList:        () => $id('pickupList') || $id('pickup-list'),
  pickupMap:         () => $id('pickupMap') || $id('map'),
  pickupSummary:     () => $id('pickupSummary') || $id('pickup-summary'),
  pickupStatus:      () => $id('pickupStatus') || $id('pickup-status'),
  pickupEmpty:       () => $id('pickupEmpty') || $id('pickup-empty'),
  pickupLoading:     () => $id('pickupLoading') || $id('pickup-loading'),
  pickupSelectedBox: () => $id('pickupSelectedBox') || $id('pickup-selected-box'),
  pickupSelectedName:() => $id('pickupSelectedName') || $id('pickup-selected-name'),
  pickupSelectedMeta:() => $id('pickupSelectedMeta') || $id('pickup-selected-meta'),

  mbbTotal: () => $id('mbbTotal'),
  mbbCta:   () => $id('mbbCta'),

  stripeLinks: () => [
    $id('stripePaymentLink'),
    $id('sidebarStripeLink'),
    $id('successStripeLink'),
  ],

  purchasePopup: () => $id('purchasePopup'),
  ppName:        () => $id('ppName'),
  ppProduct:     () => $id('ppProduct'),
  ppTime:        () => $id('ppTime'),

  sn:     (n) => $id(`sn${n}`),
  snLine: (n) => $id(`snLine${n}`),
};

// ════════════════════════════════════════════════════════════════
// FORMATTERS
// ════════════════════════════════════════════════════════════════
const fmt = {
  euro: v => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(v),
  km:   v => `${Number(v).toFixed(1).replace('.', ',')} km`,
};

// ════════════════════════════════════════════════════════════════
// DELIVERY MODULE INTERNALS
// ════════════════════════════════════════════════════════════════
let pickupMapInstance = null;
let pickupMarkers = [];
let currentPickupPoints = [];

// ════════════════════════════════════════════════════════════════
// MICRO-INTERACTION UTILITIES
// ════════════════════════════════════════════════════════════════

function animateNumber(el, from, to, duration = 320) {
  if (!el) return;
  if (from === to || isNaN(from) || isNaN(to)) {
    el.textContent = (to === 0 || isNaN(to)) ? '—' : Math.round(to);
    return;
  }
  const start = performance.now();
  const tick  = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = p < .5 ? 2*p*p : -1 + (4-2*p)*p;
    el.textContent = Math.round(from + (to - from) * ease);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = Math.round(to);
  };
  requestAnimationFrame(tick);
}

function bump(el, cls = 'bump') {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 440);
}

function flashPriceCard(newVal) {
  const el = DOM.amountDisplay();
  if (!el) return;
  const prev = parseFloat(el.dataset.prevVal || '0');
  el.dataset.prevVal = newVal;

  el.classList.add('animating');
  setTimeout(() => {
    el.classList.remove('animating');
    animateNumber(el, prev, newVal);
  }, 120);
}

// ════════════════════════════════════════════════════════════════
// RIPPLE EFFECT — attached to .js-ripple elements
// ════════════════════════════════════════════════════════════════
function initRipple() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.js-ripple');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top  - size / 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple-circle';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 620);
  });
}

// ════════════════════════════════════════════════════════════════
// RENDER — Sync all UI from state
// ════════════════════════════════════════════════════════════════
function render() {
  const {
    hasProduct, productPrice, productName, productRef,
    subtotal, total, shippingPrice, quantity, paymentMode
  } = state;

  const ac = DOM.amountCard();
  if (ac) {
    const wasActive = ac.classList.contains('has-value');
    ac.classList.toggle('has-value', hasProduct);
    if (hasProduct && !wasActive) flashPriceCard(productPrice);
  }

  const ad = DOM.amountDisplay();
  if (ad) {
    if (hasProduct) {
      const prev = parseFloat(ad.dataset.prevVal || '0');
      if (prev !== productPrice) flashPriceCard(productPrice);
      else ad.textContent = Math.round(productPrice);
    } else {
      ad.textContent = '—';
      ad.dataset.prevVal = '0';
    }
  }

  const curr = DOM.amountCurrency();
  if (curr) curr.textContent = hasProduct ? '€' : '';

  const ah = DOM.amountHint();
  if (ah) ah.textContent = hasProduct
    ? `✓ ${productName || productRef} — ${fmt.euro(subtotal)}`
    : 'Entrez votre référence';

  const aqd = DOM.amountQtyDisplay();
  if (aqd) {
    const prev = aqd.textContent;
    const next = `×${quantity}`;
    if (prev !== next) {
      aqd.textContent = next;
      bump(aqd);
    }
  }

  const sr = DOM.summaryRef(); if (sr) sr.textContent = productRef || '—';
  const sn = DOM.summaryName(); if (sn) sn.textContent = productName || productRef || '—';
  const sq = DOM.summaryQty();
  if (sq) {
    sq.textContent = `×${quantity}`;
    sq.style.display = quantity > 1 ? '' : 'none';
  }
  const sa = DOM.summaryAmount(); if (sa) sa.textContent = hasProduct ? fmt.euro(subtotal) : '—';
  const ss = DOM.summaryShipping(); if (ss) ss.textContent = fmt.euro(shippingPrice);
  const st = DOM.summaryTotal();
  if (st) {
    const next = hasProduct ? fmt.euro(total) : '—';
    if (st.textContent !== next) {
      st.textContent = next;
      bump(st, 'bump');
    }
  }

  const sbr = DOM.sbRef(); if (sbr) sbr.textContent = productRef || '—';
  const sbn = DOM.sbName(); if (sbn) sbn.textContent = productName || (productRef ? productRef : 'Entrez une référence');
  const sba = DOM.sbAmount(); if (sba) sba.textContent = hasProduct ? fmt.euro(subtotal) : '—';
  const sbsh = DOM.sbShipping(); if (sbsh) sbsh.textContent = fmt.euro(shippingPrice);
  const sbt = DOM.sbTotal();
  if (sbt) {
    const next = hasProduct ? fmt.euro(total) : '—';
    if (sbt.textContent !== next) {
      sbt.textContent = next;
      bump(sbt, 'bump');
    }
  }

  const sbCta = DOM.sbPayCta();
  if (sbCta) sbCta.classList.toggle('hidden', !hasProduct);

  const mt = DOM.mbbTotal();
  if (mt) {
    const next = hasProduct ? fmt.euro(total) : '—';
    if (mt.textContent !== next) {
      mt.textContent = next;
      bump(mt, 'bump');
    }
  }

  const ha = DOM.hiddenAmount(); if (ha) ha.value = productPrice.toFixed(2);
  const hq = DOM.hiddenQuantity(); if (hq) hq.value = quantity;
  const hs = DOM.hiddenShipping(); if (hs) hs.value = shippingPrice.toFixed(2);
  const ht = DOM.hiddenTotal(); if (ht) ht.value = total.toFixed(2);
  const hsl = DOM.hiddenShippingLabel(); if (hsl) hsl.value = state.shippingLabel;
  const hpm = DOM.hiddenPaymentMode(); if (hpm) hpm.value = paymentMode;

  syncDeliveryHiddenFields();
  renderPickupSummary();

  updateProgress();
}

// ════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ════════════════════════════════════════════════════════════════
const PROGRESS_FIELDS = ['reference','prenom','nom','email','telephone','adresse1','ville','code_postal'];

function updateProgress() {
  const filled = PROGRESS_FIELDS.filter(id => {
    const el = document.getElementById(id);
    return el && el.value.trim().length > 0;
  }).length;
  const pb = DOM.progressBar();
  const pct = Math.round(filled / PROGRESS_FIELDS.length * 100);
  if (pb) {
    pb.style.width = `${pct}%`;
    pb.parentElement?.setAttribute('aria-valuenow', pct);
  }
}

// ════════════════════════════════════════════════════════════════
// STEP NAVIGATION
// ════════════════════════════════════════════════════════════════
function goToStep(n) {
  const prev = state.currentStep;
  state.currentStep = n;

  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step${i}`);
    if (!el) continue;
    if (i === n) {
      el.hidden = false;
      requestAnimationFrame(() => {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = '';
      });
    } else if (i > n) {
      el.hidden = true;
    }
  }

  for (let i = 1; i <= 4; i++) {
    const sni = DOM.sn(i);
    if (!sni) continue;
    sni.classList.remove('active', 'done');
    sni.removeAttribute('aria-current');
    if (i === n) {
      sni.classList.add('active');
      sni.setAttribute('aria-current', 'step');
    } else if (i < n) {
      sni.classList.add('done');
    }
  }

  for (let i = 1; i <= 3; i++) {
    const ln = DOM.snLine(i);
    if (ln) ln.classList.toggle('filled', i < n);
  }

  updateMobileBar(n);

  if (n > prev) {
    const stepEl = document.getElementById(`step${n}`);
    if (stepEl) {
      setTimeout(() => {
        const topbarH = DOM.progressBar()?.parentElement?.offsetHeight || 58;
        const y = stepEl.getBoundingClientRect().top + window.scrollY - topbarH - 16;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 60);
    }
  }
}

function updateMobileBar(step) {
  const btn = DOM.mbbCta();
  if (!btn) return;
  const labels = {
    1: 'Continuer →',
    2: 'Continuer →',
    3: 'Continuer →',
    4: 'Valider la commande →',
  };
  btn.textContent = labels[step] || 'Commander →';
  btn.setAttribute('aria-label', labels[step] || 'Commander');
}

// ════════════════════════════════════════════════════════════════
// STEP SUMMARIES
// ════════════════════════════════════════════════════════════════
function renderStep1Summary() {
  const el = DOM.step1Sum();
  if (!el) return;
  const ref   = state.productRef || '—';
  const total = state.hasProduct ? fmt.euro(state.total) : '—';
  el.innerHTML = `
    <span class="ss-check" aria-hidden="true">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
    <span class="ss-text">${escapeHtml(ref)} · Qté ${state.quantity} · ${total}</span>
    <span class="ss-edit" data-edit="1" role="button" tabindex="0" aria-label="Modifier l'étape produit">Modifier</span>
  `;
  const edit = el.querySelector('[data-edit]');
  if (edit) {
    edit.addEventListener('click', () => goToStep(1));
    edit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') goToStep(1); });
  }
}

function renderStep2Summary() {
  const el = DOM.step2Sum();
  if (!el) return;
  const prenom = document.getElementById('prenom')?.value || '';
  const email  = document.getElementById('email')?.value || '';
  el.innerHTML = `
    <span class="ss-check" aria-hidden="true">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
    <span class="ss-text">${escapeHtml(prenom)} · ${escapeHtml(email)}</span>
    <span class="ss-edit" data-edit="2" role="button" tabindex="0" aria-label="Modifier les coordonnées">Modifier</span>
  `;
  const edit = el.querySelector('[data-edit]');
  if (edit) {
    edit.addEventListener('click', () => goToStep(2));
    edit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') goToStep(2); });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ════════════════════════════════════════════════════════════════
// FIELD VALIDATION
// ════════════════════════════════════════════════════════════════
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.textContent = msg;
  el.classList.add('visible');
  const inputId = id.replace('Error', '');
  const input   = document.getElementById(inputId);
  if (input) { input.classList.add('invalid'); input.classList.remove('valid'); }
  return true;
}

function clearErr(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  el.classList.remove('visible');
  const inputId = id.replace('Error', '');
  const input   = document.getElementById(inputId);
  if (input) input.classList.remove('invalid');
}

function markValid(id) {
  const input = document.getElementById(id);
  if (input) { input.classList.add('valid'); input.classList.remove('invalid'); }
}

// ════════════════════════════════════════════════════════════════
// STEP VALIDATION
// ════════════════════════════════════════════════════════════════
function validateStep(step) {
  let ok = true;

  if (step === 1) {
    const ref = DOM.referenceInput()?.value.trim() || '';
    if (!ref) {
      showErr('referenceError', 'Veuillez entrer une référence produit.');
      DOM.referenceInput()?.focus();
      ok = false;
    }
    if (ok && !state.isKnownRef) {
      const p = parseFloat(DOM.prixInput()?.value) || 0;
      if (p <= 0 && !DOM.customPriceField()?.hidden) {
        showErr('prix_unitaireError', 'Veuillez entrer un prix valide.');
        DOM.prixInput()?.focus();
        ok = false;
      }
    }
  }

  if (step === 2) {
    const fields = ['prenom','nom','email','telephone'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const v = el.value.trim();
      if (!v) {
        showErr(`${id}Error`, 'Ce champ est requis.');
        if (ok) { el.focus(); ok = false; }
      } else {
        if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
          showErr('emailError', 'Email invalide.');
          if (ok) { el.focus(); ok = false; }
        }
        if (id === 'telephone' && v.replace(/\s/g,'').length < 8) {
          showErr('telephoneError', 'Numéro trop court.');
          if (ok) { el.focus(); ok = false; }
        }
      }
    });
  }

  if (step === 3) {
    const fields = ['adresse1','ville','code_postal'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const v = el.value.trim();
      if (!v) {
        showErr(`${id}Error`, 'Ce champ est requis.');
        if (ok) { el.focus(); ok = false; }
      } else {
        if (id === 'code_postal' && v.replace(/\s/g,'').length < 4) {
          showErr('code_postalError', 'Code postal invalide.');
          if (ok) { el.focus(); ok = false; }
        }
      }
    });

    if (ok && state.deliveryModuleEnabled && state.deliveryMode !== 'home' && !state.pickupPoint) {
      const status = DOM.pickupStatus();
      if (status) {
        status.textContent = 'Veuillez sélectionner un point relais ou un locker avant de continuer.';
      } else {
        alert('Veuillez sélectionner un point relais ou un locker avant de continuer.');
      }
      ok = false;
    }
  }

  return ok;
}

// ════════════════════════════════════════════════════════════════
// REFERENCE HANDLER
// ════════════════════════════════════════════════════════════════
function handleReference() {
  const raw   = DOM.referenceInput()?.value.trim() || '';
  const upper = raw.toUpperCase();
  const prod  = CONFIG.products[upper];

  state.productRef = raw;

  const icon = DOM.refIcon();
  const hint = DOM.refHint();
  const inp  = DOM.referenceInput();
  const cpf  = DOM.customPriceField();
  const us   = DOM.urgencyStrip();
  const ut   = DOM.urgencyText();

  if (prod) {
    state.isKnownRef   = true;
    state.productName  = prod.name;
    state.productPrice = prod.price;

    if (inp) { inp.classList.add('valid'); inp.classList.remove('invalid'); }
    if (icon) { icon.textContent = '✓'; icon.style.color = 'var(--green)'; }
    if (hint) { hint.textContent = `${prod.name} — ${fmt.euro(prod.price)} reconnu`; hint.style.color = 'var(--green)'; }
    if (cpf) cpf.hidden = true;

    if (us) {
      us.hidden = false;
      const urgencyPhrases = [
        `Article ${upper} — réservation active`,
        `Prix confirmé : ${fmt.euro(prod.price)}`,
        `Article reconnu — en attente de paiement`,
      ];
      if (ut) ut.textContent = urgencyPhrases[Math.floor(Math.random() * urgencyPhrases.length)];
    }
  } else if (raw.length >= 2) {
    state.isKnownRef   = false;
    state.productName  = raw;
    state.productPrice = 0;

    if (inp) inp.classList.remove('valid','invalid');
    if (icon) { icon.textContent = ''; icon.style.color = ''; }
    if (hint) { hint.textContent = 'Référence libre — entrez le prix ci-dessous.'; hint.style.color = ''; }
    if (cpf) cpf.hidden = false;
    if (us) us.hidden = true;
  } else {
    state.isKnownRef   = false;
    state.productName  = '';
    state.productPrice = 0;

    if (inp) inp.classList.remove('valid','invalid');
    if (icon) { icon.textContent = ''; icon.style.color = ''; }
    if (hint) { hint.textContent = 'Référence vue en live. Toute description acceptée.'; hint.style.color = ''; }
    if (cpf) cpf.hidden = true;
    if (us) us.hidden = true;
  }

  clearErr('referenceError');
  render();
  updateProgress();
}

function handlePriceInput() {
  const p = parseFloat(DOM.prixInput()?.value) || 0;
  state.productPrice = p > 0 ? p : 0;
  clearErr('prix_unitaireError');
  render();
}

// ════════════════════════════════════════════════════════════════
// QUANTITY
// ════════════════════════════════════════════════════════════════
function setQuantity(n) {
  state.quantity = Math.max(1, Math.min(99, n));
  const qi = DOM.quantiteInput();
  if (qi) qi.value = state.quantity;
  render();
}

// ════════════════════════════════════════════════════════════════
// STEP NEXT BUTTONS
// ════════════════════════════════════════════════════════════════
function bindStepNextButtons() {
  DOM.step1Next()?.addEventListener('click', () => {
    if (!validateStep(1)) return;
    renderStep1Summary();
    goToStep(2);
    setTimeout(() => document.getElementById('prenom')?.focus(), 420);
  });

  DOM.step2Next()?.addEventListener('click', () => {
    if (!validateStep(2)) return;
    renderStep2Summary();
    goToStep(3);
    setTimeout(() => document.getElementById('adresse1')?.focus(), 420);
  });

  DOM.step3Next()?.addEventListener('click', async () => {
    if (!validateStep(3)) return;

    if (state.deliveryModuleEnabled && state.deliveryMode !== 'home' && !state.pickupPointsLoaded) {
      await loadPickupPoints();
      if (!state.pickupPoint) return;
    }

    render();
    goToStep(4);
  });
}

// ════════════════════════════════════════════════════════════════
// MOBILE BAR CTA — context-aware
// ════════════════════════════════════════════════════════════════
function initMobileBar() {
  DOM.mbbCta()?.addEventListener('click', () => {
    const s = state.currentStep;
    if (s < 4) {
      document.getElementById(`step${s}Next`)?.click();
    } else {
      DOM.submitBtn()?.scrollIntoView({ behavior:'smooth', block:'center' });
    }
  });
}

// ════════════════════════════════════════════════════════════════
// LEGACY SHIPPING OPTIONS
// ════════════════════════════════════════════════════════════════
function initShipping() {
  DOM.shippingOpts().forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.shippingOpts().forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      state.shippingPrice = parseFloat(btn.dataset.shippingPrice);
      state.shippingLabel = btn.dataset.shippingLabel;
      render();
    });
  });
}

// ════════════════════════════════════════════════════════════════
// PAYMENT OPTIONS
// ════════════════════════════════════════════════════════════════
function initPayment() {
  DOM.paymentOpts().forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.paymentOpts().forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
        b.querySelector('.po-radio')?.classList.remove('checked');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      btn.querySelector('.po-radio')?.classList.add('checked');
      state.paymentMode = btn.dataset.paymentMode;
      render();
    });
  });
}

// ════════════════════════════════════════════════════════════════
// INLINE VALIDATION
// ════════════════════════════════════════════════════════════════
function initInlineValidation() {
  const rules = {
    email:       { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: 'Email invalide.' },
    telephone:   { minLen: 8, msg: 'Numéro trop court.' },
    code_postal: { minLen: 4, msg: 'Code postal invalide.' },
  };
  const required = ['prenom','nom','email','telephone','adresse1','ville','code_postal'];

  required.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => {
      const v = el.value.trim();
      const errId = `${id}Error`;
      if (!v) { showErr(errId, 'Ce champ est requis.'); return; }
      const rule = rules[id];
      if (rule?.regex && !rule.regex.test(v)) { showErr(errId, rule.msg); return; }
      if (rule?.minLen && v.replace(/\s/g,'').length < rule.minLen) { showErr(errId, rule.msg); return; }
      clearErr(errId);
      markValid(id);
      updateProgress();

      if (state.deliveryModuleEnabled && ['adresse1','ville','code_postal'].includes(id) && state.deliveryMode !== 'home') {
        debouncedLoadPickupPoints();
      }
    });

    el.addEventListener('input', () => {
      clearErr(`${id}Error`);
      updateProgress();

      if (state.deliveryModuleEnabled && ['adresse1','ville','code_postal'].includes(id) && state.deliveryMode !== 'home') {
        debouncedLoadPickupPoints();
      }
    });
  });
}

// ════════════════════════════════════════════════════════════════
// AUTOSAVE — localStorage
// ════════════════════════════════════════════════════════════════
function initAutosave() {
  const KEY = 'lo_draft';
  const FIELDS = ['prenom','nom','email','telephone','adresse1','adresse2','ville','code_postal','pseudo'];

  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && saved[id]) el.value = saved[id];
    });
    if (Object.keys(saved).length) updateProgress();
  } catch (_) {}

  FIELDS.forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      try {
        const draft = {};
        FIELDS.forEach(fid => {
          const fel = document.getElementById(fid);
          if (fel?.value) draft[fid] = fel.value;
        });
        localStorage.setItem(KEY, JSON.stringify(draft));
      } catch (_) {}
    });
  });
}

// ════════════════════════════════════════════════════════════════
// SOCIAL PROOF
// ════════════════════════════════════════════════════════════════
function initSocialProof() {
  const { baseOrders, baseViewers } = CONFIG.socialProof;

  let orders  = baseOrders;
  let viewers = baseViewers + Math.floor(Math.random() * 20);

  const oc = DOM.heroOrderCount();
  if (oc) oc.textContent = orders;

  function updateViewers(newVal) {
    const el = DOM.liveViewers();
    if (!el) return;
    const old = parseInt(el.textContent) || viewers;
    animateNumber(el, old, newVal, 500);
  }

  updateViewers(viewers);

  setInterval(() => {
    if (Math.random() < .14) {
      orders += Math.floor(Math.random() * 3) + 1;
      const el = DOM.heroOrderCount();
      if (el) el.textContent = orders;
    }
  }, 13000);

  setInterval(() => {
    const delta = Math.floor(Math.random() * 7) - 3;
    viewers = Math.max(75, viewers + delta);
    updateViewers(viewers);
  }, 8000);
}

// ════════════════════════════════════════════════════════════════
// PURCHASE POPUP
// ════════════════════════════════════════════════════════════════
function initPurchasePopup() {
  const popup = DOM.purchasePopup();
  if (!popup) return;

  const names     = CONFIG.popupNames;
  const templates = CONFIG.popupTemplates;
  const refs      = Object.keys(CONFIG.products);

  let namePool = [], tmplPool = [];

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function refillNamePool() { namePool = shuffle(names); }
  function refillTmplPool() { tmplPool = shuffle([...Array(templates.length).keys()]); }

  refillNamePool();
  refillTmplPool();

  function nextName()     { if (!namePool.length) refillNamePool(); return namePool.pop(); }
  function nextTemplate() { if (!tmplPool.length) refillTmplPool(); return templates[tmplPool.pop()]; }

  function showNext() {
    const name   = nextName();
    const tpl    = nextTemplate();
    const useRef = Math.random() < 0.4;
    const ref    = useRef ? refs[Math.floor(Math.random() * refs.length)] : null;
    const msg    = tpl(name, ref);

    const pn = DOM.ppName();
    const pp = DOM.ppProduct();
    const pt = DOM.ppTime();
    if (pn) pn.textContent = name;
    if (pp) {
      const body = msg.startsWith(name) ? msg.slice(name.length).trim() : msg;
      pp.textContent = body;
    }
    if (pt) pt.textContent = "à l'instant";

    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), CONFIG.popupDisplayMs);

    const next = CONFIG.popupMinInterval
      + Math.floor(Math.random() * (CONFIG.popupMaxInterval - CONFIG.popupMinInterval));
    setTimeout(showNext, next + CONFIG.popupDisplayMs + 400);
  }

  setTimeout(showNext, CONFIG.popupFirstDelay);
}

// ════════════════════════════════════════════════════════════════
// STRIPE LINKS — sync
// ════════════════════════════════════════════════════════════════
function syncStripeLinks() {
  DOM.stripeLinks().forEach(el => { if (el) el.href = CONFIG.stripeLink; });
}

// ════════════════════════════════════════════════════════════════
// SCROLL REVEAL
// ════════════════════════════════════════════════════════════════
function initScrollReveal() {
  const targets = document.querySelectorAll('.social-card, .social-hub-head');
  if (!targets.length || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('revealed'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.classList.contains('social-card')
          ? Array.from(el.parentElement?.children || []).indexOf(el) * 80
          : 0;
        setTimeout(() => {
          el.classList.add('reveal', 'revealed');
        }, delay);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => io.observe(el));
}

// ════════════════════════════════════════════════════════════════
// HAPTIC SCALE
// ════════════════════════════════════════════════════════════════
function initHapticScale() {
  const ctaSelectors = '.step-next, .cta-btn, .mob-cta, .hero-cta';
  document.querySelectorAll(ctaSelectors).forEach(btn => {
    btn.addEventListener('touchstart', () => { btn.style.transform = 'scale(0.97)'; }, { passive: true });
    btn.addEventListener('touchend', () => { btn.style.transform = ''; }, { passive: true });
    btn.addEventListener('touchcancel', () => { btn.style.transform = ''; }, { passive: true });
  });
}

// ════════════════════════════════════════════════════════════════
// KEYBOARD NAVIGATION
// ════════════════════════════════════════════════════════════════
function initKeyboardNav() {
  DOM.referenceInput()?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); DOM.step1Next()?.click(); }
  });

  ['prenom','nom','email','telephone'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const inputs = ['prenom','nom','email','telephone'];
        const idx = inputs.indexOf(id);
        if (idx < inputs.length - 1) {
          document.getElementById(inputs[idx + 1])?.focus();
        } else {
          DOM.step2Next()?.click();
        }
      }
    });
  });
}

// ════════════════════════════════════════════════════════════════
// ENHANCED DELIVERY MODULE
// ════════════════════════════════════════════════════════════════
function initEnhancedDeliveryModule() {
  const hasModeButtons = DOM.deliveryModeBtns().length > 0;
  const hasCarrierButtons = DOM.carrierBtns().length > 0;
  const hasPickupPanel = !!DOM.pickupPanel();
  const hasPickupList = !!DOM.pickupList();

  state.deliveryModuleEnabled = !!(hasModeButtons || hasCarrierButtons || hasPickupPanel || hasPickupList);

  if (!state.deliveryModuleEnabled) return;

  DOM.deliveryModeBtns().forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.deliveryModeBtns().forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-checked', 'false');
      });

      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-checked', 'true');

      state.deliveryMode = btn.dataset.deliveryMode || CONFIG.delivery.defaultMode;
      state.pickupPoint = null;
      state.pickupPointsLoaded = false;

      applyDeliveryPreset();
      togglePickupPanel();
      render();

      if (state.deliveryMode !== 'home') {
        debouncedLoadPickupPoints();
      }
    });
  });

  DOM.carrierBtns().forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.carrierBtns().forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-checked', 'false');
      });

      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-checked', 'true');

      state.carrierCode = btn.dataset.carrier || CONFIG.delivery.defaultCarrier;
      state.carrierName = CONFIG.delivery.carriers[state.carrierCode]?.name || state.carrierCode;
      state.pickupPoint = null;
      state.pickupPointsLoaded = false;

      applyDeliveryPreset();
      render();

      if (state.deliveryMode !== 'home') {
        debouncedLoadPickupPoints();
      }
    });
  });

  togglePickupPanel();
  applyDeliveryPreset();
  render();
}

function applyDeliveryPreset() {
  const presets = {
    home:   { price: 8.90, label: 'Domicile Premium' },
    relay:  { price: 6.00, label: state.carrierName ? `${state.carrierName} — Point relais` : 'Relais Standard' },
    locker: { price: 6.90, label: state.carrierName ? `${state.carrierName} — Locker` : 'Relais Express' },
  };

  const chosen = presets[state.deliveryMode] || presets.relay;
  state.shippingPrice = chosen.price;
  state.shippingLabel = chosen.label;
}

function togglePickupPanel() {
  const panel = DOM.pickupPanel();
  if (!panel) return;
  panel.hidden = state.deliveryMode === 'home';
}

function setPickupLoading(isLoading) {
  state.pickupLoading = isLoading;
  const loading = DOM.pickupLoading();
  const status = DOM.pickupStatus();

  if (loading) loading.hidden = !isLoading;
  if (status) status.textContent = isLoading ? 'Recherche des points proches…' : '';
}

function setPickupEmpty(visible, message = '') {
  const empty = DOM.pickupEmpty();
  const status = DOM.pickupStatus();

  if (empty) {
    empty.hidden = !visible;
    if (message) empty.textContent = message;
  }

  if (status && visible && message) status.textContent = message;
}

function getAddressSeed() {
  const address = document.getElementById('adresse1')?.value?.trim() || '';
  const zip     = document.getElementById('code_postal')?.value?.trim() || '';
  const city    = document.getElementById('ville')?.value?.trim() || '';
  return { address, zip, city };
}

function canLoadPickupPoints() {
  const { address, zip, city } = getAddressSeed();
  return Boolean(address && zip && city);
}

async function loadPickupPoints() {
  if (!state.deliveryModuleEnabled) return;
  if (state.deliveryMode === 'home') return;

  if (!canLoadPickupPoints()) {
    setPickupEmpty(true, 'Renseignez l’adresse, la ville et le code postal pour charger les points proches.');
    renderPickupList([]);
    destroyPickupMarkers();
    return;
  }

  setPickupLoading(true);
  setPickupEmpty(false);

  try {
    const points = await fetchPickupPointsMockAware();
    currentPickupPoints = points;
    state.pickupPointsLoaded = true;

    if (!points.length) {
      setPickupEmpty(true, 'Aucun point relais ou locker trouvé pour cette adresse.');
      renderPickupList([]);
      destroyPickupMarkers();
      state.pickupPoint = null;
      render();
      return;
    }

    renderPickupList(points);
    renderPickupMap(points);

    if (DOM.pickupStatus()) {
      DOM.pickupStatus().textContent = `${points.length} point${points.length > 1 ? 's' : ''} trouvé${points.length > 1 ? 's' : ''} à proximité.`;
    }
  } catch (err) {
    console.error('[LiveOrder] Pickup load error:', err);
    setPickupEmpty(true, 'Impossible de charger les points pour le moment.');
    renderPickupList([]);
    destroyPickupMarkers();
  } finally {
    setPickupLoading(false);
  }
}

async function fetchPickupPointsMockAware() {
  // Hook to replace later with real API / backend proxy.
  // Example future:
  // return await fetch('/api/pickup-points?...').then(r => r.json());

  const carrier = state.carrierCode || CONFIG.delivery.defaultCarrier;
  const raw = CONFIG.delivery.mockPoints[carrier] || [];

  const filtered = raw.filter(point => {
    if (state.deliveryMode === 'home') return false;
    if (state.deliveryMode === 'relay') return point.type === 'relay' || point.type === 'locker';
    if (state.deliveryMode === 'locker') return point.type === 'locker';
    return true;
  });

  const seeded = filtered.map((point, idx) => ({
    ...point,
    distanceKm: typeof point.distanceKm === 'number'
      ? point.distanceKm
      : Number((0.7 + (idx * 0.6)).toFixed(1)),
    carrierCode: carrier,
    carrierName: CONFIG.delivery.carriers[carrier]?.name || carrier,
    deliveryType: state.deliveryMode,
  }));

  return new Promise(resolve => {
    setTimeout(() => resolve(seeded), 650);
  });
}

function renderPickupList(points) {
  const list = DOM.pickupList();
  if (!list) return;

  list.innerHTML = '';

  points.forEach(point => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'pickup-item';
    item.dataset.pickupId = point.id;
    item.setAttribute('aria-label', `${point.name}, ${point.address}, ${point.city}`);
    item.innerHTML = `
      <span class="pickup-item-head">
        <strong class="pickup-item-name">${escapeHtml(point.name)}</strong>
        <span class="pickup-item-distance">${fmt.km(point.distanceKm)}</span>
      </span>
      <span class="pickup-item-meta">
        <span>${escapeHtml(point.address)}, ${escapeHtml(point.zip)} ${escapeHtml(point.city)}</span>
        <span>${point.type === 'locker' ? 'Locker' : 'Point relais'} · ${escapeHtml(point.carrierName)}</span>
      </span>
      ${point.hours ? `<span class="pickup-item-hours">${escapeHtml(point.hours)}</span>` : ''}
    `;

    item.addEventListener('click', () => {
      selectPickupPoint(point);
      highlightPickupListSelection();
    });

    list.appendChild(item);
  });

  highlightPickupListSelection();
}

function highlightPickupListSelection() {
  const list = DOM.pickupList();
  if (!list) return;

  list.querySelectorAll('.pickup-item').forEach(el => {
    const isActive = state.pickupPoint && el.dataset.pickupId === state.pickupPoint.id;
    el.classList.toggle('is-selected', isActive);
    el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function renderPickupSummary() {
  const box  = DOM.pickupSelectedBox();
  const name = DOM.pickupSelectedName();
  const meta = DOM.pickupSelectedMeta();
  const sum  = DOM.pickupSummary();

  if (!state.deliveryModuleEnabled) return;

  if (box) box.hidden = !state.pickupPoint;
  if (sum) sum.hidden = !state.pickupPoint;

  if (!state.pickupPoint) {
    if (name) name.textContent = '';
    if (meta) meta.textContent = '';
    return;
  }

  if (name) name.textContent = state.pickupPoint.name;
  if (meta) {
    meta.textContent = `${state.pickupPoint.address}, ${state.pickupPoint.zip} ${state.pickupPoint.city} · ${fmt.km(state.pickupPoint.distanceKm)}`;
  }
}

function selectPickupPoint(point) {
  state.pickupPoint = {
    id: point.id,
    name: point.name,
    address: point.address,
    zip: point.zip,
    city: point.city,
    distanceKm: point.distanceKm,
    label: point.label || `${point.name} — ${point.address}, ${point.zip} ${point.city}`,
    type: point.type,
    carrierCode: point.carrierCode || state.carrierCode,
    carrierName: point.carrierName || state.carrierName,
  };

  if (DOM.pickupStatus()) {
    DOM.pickupStatus().textContent = `${point.name} sélectionné.`;
  }

  highlightPickupListSelection();
  focusPickupMarker(point.id);
  render();
}

function renderPickupMap(points) {
  const mapEl = DOM.pickupMap();
  if (!mapEl) return;

  if (!window.L) {
    mapEl.innerHTML = `
      <div style="padding:16px;border:1px solid rgba(0,0,0,.08);border-radius:14px;background:#fff;">
        Carte indisponible : Leaflet n’est pas chargé.
      </div>
    `;
    return;
  }

  const first = points[0];
  const initialLat = first?.lat || 43.6112;
  const initialLng = first?.lng || 3.8767;

  if (!pickupMapInstance) {
    pickupMapInstance = window.L.map(mapEl).setView([initialLat, initialLng], 13);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(pickupMapInstance);
  } else {
    pickupMapInstance.setView([initialLat, initialLng], 13);
  }

  destroyPickupMarkers();

  points.forEach(point => {
    const marker = window.L.marker([point.lat, point.lng]).addTo(pickupMapInstance);
    marker.on('click', () => selectPickupPoint(point));
    marker._pickupId = point.id;
    pickupMarkers.push(marker);
  });

  setTimeout(() => pickupMapInstance.invalidateSize(), 80);
}

function destroyPickupMarkers() {
  if (!pickupMapInstance) return;
  pickupMarkers.forEach(marker => {
    try { pickupMapInstance.removeLayer(marker); } catch (_) {}
  });
  pickupMarkers = [];
}

function focusPickupMarker(pickupId) {
  if (!pickupMapInstance || !pickupId) return;
  const marker = pickupMarkers.find(m => m._pickupId === pickupId);
  if (!marker) return;
  const latLng = marker.getLatLng();
  pickupMapInstance.flyTo(latLng, 15, { duration: 0.55 });
}

function syncDeliveryHiddenFields() {
  const carrierCodeEl = DOM.hiddenCarrierCode();
  const carrierNameEl = DOM.hiddenCarrierName();
  const deliveryTypeEl = DOM.hiddenDeliveryType();
  const pointIdEl = DOM.hiddenPickupPointId();
  const pointNameEl = DOM.hiddenPickupPointName();
  const pointAddrEl = DOM.hiddenPickupPointAddr();
  const pointZipEl = DOM.hiddenPickupPointZip();
  const pointCityEl = DOM.hiddenPickupPointCity();
  const pointDistEl = DOM.hiddenPickupPointDist();
  const pointLabelEl = DOM.hiddenPickupPointLabel();

  if (carrierCodeEl) carrierCodeEl.value = state.carrierCode || '';
  if (carrierNameEl) carrierNameEl.value = state.carrierName || '';
  if (deliveryTypeEl) deliveryTypeEl.value = state.deliveryMode || '';

  if (pointIdEl) pointIdEl.value = state.pickupPoint?.id || '';
  if (pointNameEl) pointNameEl.value = state.pickupPoint?.name || '';
  if (pointAddrEl) pointAddrEl.value = state.pickupPoint?.address || '';
  if (pointZipEl) pointZipEl.value = state.pickupPoint?.zip || '';
  if (pointCityEl) pointCityEl.value = state.pickupPoint?.city || '';
  if (pointDistEl) pointDistEl.value = state.pickupPoint?.distanceKm ?? '';
  if (pointLabelEl) pointLabelEl.value = state.pickupPoint?.label || '';
}

let pickupDebounceTimer = null;
function debouncedLoadPickupPoints() {
  clearTimeout(pickupDebounceTimer);
  pickupDebounceTimer = setTimeout(() => {
    loadPickupPoints();
  }, 360);
}

// ════════════════════════════════════════════════════════════════
// FORM SUBMIT
// ════════════════════════════════════════════════════════════════
DOM.form()?.addEventListener('submit', async e => {
  e.preventDefault();

  if (!validateStep(3) && state.currentStep >= 3) return;

  const btn    = DOM.submitBtn();
  const btnTxt = DOM.submitBtnTxt();
  const pb     = DOM.progressBar();

  btn.disabled = true;
  btn.classList.add('loading');
  if (btnTxt) btnTxt.style.opacity = '0';
  if (pb) pb.style.width = '95%';

  try {
    const res = await fetch(CONFIG.formspreeEndpoint, {
      method: 'POST',
      body:    new FormData(DOM.form()),
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      DOM.form().hidden = true;
      DOM.successState().hidden = false;
      DOM.stepNav().style.display = 'none';
      DOM.successState().scrollIntoView({ behavior:'smooth', block:'start' });
      if (pb) pb.style.width = '100%';
      pb?.parentElement?.setAttribute('aria-valuenow', 100);
      try { localStorage.removeItem('lo_draft'); } catch (_) {}
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Erreur serveur (${res.status})`);
    }
  } catch (err) {
    console.error('[LiveOrder] Submit error:', err);
    btn.disabled = false;
    btn.classList.remove('loading');
    if (btnTxt) {
      btnTxt.style.opacity = '1';
      btnTxt.textContent = 'Valider ma commande';
    }
    if (pb) pb.style.width = '90%';

    document.querySelector('.submit-err')?.remove();
    const errEl = document.createElement('div');
    errEl.className = 'submit-err';
    errEl.setAttribute('role', 'alert');
    errEl.style.cssText = `
      margin-top:12px; padding:12px 16px;
      background:var(--red-bg); border:1px solid var(--red-border);
      border-radius:var(--r-sm); font-size:.79rem; color:var(--red);
      text-align:center; font-weight:400; animation: fadeUp .3s ease both;
    `;
    errEl.textContent = 'Une erreur est survenue. Vérifiez votre connexion et réessayez.';
    btn.insertAdjacentElement('afterend', errEl);
    setTimeout(() => errEl.remove(), 7000);
  }
});

// ════════════════════════════════════════════════════════════════
// RESET
// ════════════════════════════════════════════════════════════════
DOM.resetBtn()?.addEventListener('click', resetAll);

function resetAll() {
  [
    'prenom','nom','email','telephone','adresse1','adresse2','ville','code_postal','pseudo',
    'reference','prix_unitaire','quantite',
    'carrier_code','carrier_name','delivery_type','pickup_point_id',
    'pickup_point_name','pickup_point_address','pickup_point_zip',
    'pickup_point_city','pickup_point_distance','pickup_point_label'
  ].forEach(id => { delete _domCache[id]; });

  DOM.form().reset();
  DOM.form().hidden = false;
  DOM.successState().hidden = true;
  DOM.stepNav().style.display = '';
  DOM.submitBtn().disabled = false;
  DOM.submitBtn().classList.remove('loading');

  const btnTxt = DOM.submitBtnTxt();
  if (btnTxt) {
    btnTxt.style.opacity = '1';
    btnTxt.textContent = 'Valider ma commande';
  }

  Object.assign(state, {
    currentStep: 1,
    productRef: '',
    productName: '',
    productPrice: 0,
    isKnownRef: false,
    quantity: 1,
    shippingPrice: CONFIG.shipping.default.price,
    shippingLabel: CONFIG.shipping.default.label,
    paymentMode: 'stripe',

    deliveryMode: CONFIG.delivery.defaultMode,
    carrierCode: CONFIG.delivery.defaultCarrier,
    carrierName: CONFIG.delivery.carriers[CONFIG.delivery.defaultCarrier]?.name || 'Mondial Relay',
    pickupPoint: null,
    pickupPointsLoaded: false,
    pickupLoading: false,
  });

  DOM.shippingOpts().forEach((b, i) => {
    b.classList.toggle('active', i === 0);
    b.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
  });

  DOM.paymentOpts().forEach((b, i) => {
    b.classList.toggle('active', i === 0);
    b.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
    b.querySelector('.po-radio')?.classList.toggle('checked', i === 0);
  });

  DOM.deliveryModeBtns().forEach((b, i) => {
    const isDefault = (b.dataset.deliveryMode || '') === CONFIG.delivery.defaultMode || i === 0;
    b.classList.toggle('active', isDefault);
    b.setAttribute('aria-pressed', isDefault ? 'true' : 'false');
    b.setAttribute('aria-checked', isDefault ? 'true' : 'false');
  });

  DOM.carrierBtns().forEach((b, i) => {
    const isDefault = (b.dataset.carrier || '') === CONFIG.delivery.defaultCarrier || i === 0;
    b.classList.toggle('active', isDefault);
    b.setAttribute('aria-pressed', isDefault ? 'true' : 'false');
    b.setAttribute('aria-checked', isDefault ? 'true' : 'false');
  });

  DOM.customPriceField()?.setAttribute('hidden', '');
  if (DOM.customPriceField()) DOM.customPriceField().hidden = true;
  if (DOM.urgencyStrip()) DOM.urgencyStrip().hidden = true;

  const hint = DOM.refHint();
  if (hint) {
    hint.textContent = 'Référence vue en live. Toute description acceptée.';
    hint.style.color = '';
  }

  const icon = DOM.refIcon();
  if (icon) {
    icon.textContent = '';
    icon.style.color = '';
  }

  const ri = DOM.referenceInput();
  if (ri) ri.classList.remove('valid','invalid');

  document.querySelectorAll('.inp').forEach(el => el.classList.remove('valid','invalid'));
  document.querySelectorAll('.field-err').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
  document.querySelectorAll('.step-summary').forEach(el => el.innerHTML = '');

  const pickupList = DOM.pickupList();
  if (pickupList) pickupList.innerHTML = '';
  setPickupEmpty(false, '');
  const status = DOM.pickupStatus();
  if (status) status.textContent = '';
  renderPickupSummary();
  destroyPickupMarkers();
  togglePickupPanel();

  goToStep(1);
  setQuantity(1);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ════════════════════════════════════════════════════════════════
// EVENT BINDINGS
// ════════════════════════════════════════════════════════════════
DOM.referenceInput()?.addEventListener('input', handleReference);
DOM.prixInput()?.addEventListener('input', handlePriceInput);
DOM.prixInput()?.addEventListener('blur',  handlePriceInput);
DOM.qtyMinus()?.addEventListener('click',  () => setQuantity(state.quantity - 1));
DOM.qtyPlus()?.addEventListener('click',   () => setQuantity(state.quantity + 1));

// ════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════
(function init() {
  syncStripeLinks();
  render();
  updateProgress();
  initSocialProof();
  initPurchasePopup();
  initMobileBar();
  initShipping();
  initPayment();
  initInlineValidation();
  initAutosave();
  bindStepNextButtons();
  initRipple();
  initKeyboardNav();
  initScrollReveal();
  initHapticScale();
  initEnhancedDeliveryModule();
  goToStep(1);
})();
