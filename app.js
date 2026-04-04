/* ══════════════════════════════════════════════════════════════
   LIVEORDER PRO — app.js
   Logique : produits, calcul prix, validation, soumission AJAX
══════════════════════════════════════════════════════════════ */

// ─── CONFIGURATION ────────────────────────────────────────────
// ⚙️ Modifier ici : produits, endpoint Formspree, lien Stripe
const CONFIG = {
  products: {
    QZ01: { price: 39,  name: 'Produit QZ01' },
    DR02: { price: 119, name: 'Produit DR02' },
    JB07: { price: 59,  name: 'Produit JB07' },
    AL11: { price: 24,  name: 'Produit AL11' },
  },
  defaultShipping: {
    price: 6.00,
    label: 'Relais Standard',
  },
  // 🔧 Remplacer par votre endpoint Formspree
  formspreeEndpoint: 'https://formspree.io/f/TON_FORM_ID',
  // 🔧 Remplacer par votre lien Stripe
  stripeLink: 'https://buy.stripe.com/TON_LIEN_STRIPE',
};

// ─── STATE ────────────────────────────────────────────────────
let state = {
  productPrice: 0,
  productName:  null,
  productRef:   null,
  shippingPrice: CONFIG.defaultShipping.price,
  shippingLabel: CONFIG.defaultShipping.label,
  paymentMode:   'stripe',
};

// ─── HELPERS DOM ──────────────────────────────────────────────
const $  = id  => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ─── REFS DOM ─────────────────────────────────────────────────
const referenceInput    = $('reference');
const amountCard        = $('amountCard');
const amountDisplay     = $('amountDisplay');
const amountCurrency    = $('amountCurrency');
const amountHint        = $('amountHint');
const refIcon           = $('refIcon');

const shippingBtns      = $$('[data-shipping-price]');
const paymentBtns       = $$('[data-payment-mode]');
const resetBtn          = $('resetAllBtn');

const form              = $('orderForm');
const submitBtn         = $('submitBtn');
const submitBtnText     = submitBtn ? submitBtn.querySelector('.cta-btn-text') : null;

const successState      = $('successState');

// Summary
const summaryRef        = $('summaryRef');
const summaryName       = $('summaryName');
const summaryAmount     = $('summaryAmount');
const summaryShipping   = $('summaryShipping');
const summaryTotal      = $('summaryTotal');
const summaryPayMode    = $('summaryPaymentMode');

// Hidden fields
const hiddenAmount        = $('hiddenAmount');
const hiddenShipping      = $('hiddenShipping');
const hiddenTotal         = $('hiddenTotal');
const hiddenShippingLabel = $('hiddenShippingLabel');
const hiddenPaymentMode   = $('hiddenPaymentMode');

// Tous les liens Stripe
const allStripeLinks = [
  $('stripePaymentLink'),
  $('sidebarStripeLink'),
  $('successStripeLink'),
];

// ─── FORMATAGE ────────────────────────────────────────────────
const euro = v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);

// ─── MISE À JOUR DES LIENS STRIPE ─────────────────────────────
function syncStripeLinks() {
  allStripeLinks.forEach(el => { if (el) el.href = CONFIG.stripeLink; });
}

// ─── MISE À JOUR DE LA VUE ────────────────────────────────────
function updateView() {
  const total = state.productPrice + state.shippingPrice;
  const hasProduct = state.productPrice > 0;

  // — Carte montant —
  amountCard.classList.toggle('has-value', hasProduct);
  amountDisplay.textContent  = hasProduct ? state.productPrice.toFixed(0) : '—';
  amountCurrency.textContent = hasProduct ? '€' : '';
  amountHint.textContent     = hasProduct
    ? `✓ Référence reconnue — ${state.productName}`
    : 'Entrez votre référence ci-dessous';

  // — Sidebar récapitulatif —
  summaryRef.textContent  = state.productRef  || '—';
  summaryName.textContent = state.productName || 'Entrez une référence';
  summaryAmount.textContent   = hasProduct ? euro(state.productPrice) : '—';
  summaryShipping.textContent = euro(state.shippingPrice);
  summaryTotal.textContent    = hasProduct ? euro(total) : '—';
  summaryPayMode.textContent  = state.paymentMode === 'stripe'
    ? 'Carte bancaire (Stripe)'
    : 'Validation manuelle';

  // — Champs cachés (envoyés avec Formspree) —
  hiddenAmount.value        = state.productPrice.toFixed(2);
  hiddenShipping.value      = state.shippingPrice.toFixed(2);
  hiddenTotal.value         = total.toFixed(2);
  hiddenShippingLabel.value = state.shippingLabel;
  hiddenPaymentMode.value   = state.paymentMode;
}

// ─── RÉFÉRENCE PRODUIT ────────────────────────────────────────
referenceInput.addEventListener('input', () => {
  const ref     = referenceInput.value.trim().toUpperCase();
  const product = CONFIG.products[ref];

  if (product) {
    // Référence reconnue ✓
    state.productPrice = product.price;
    state.productName  = product.name;
    state.productRef   = ref;
    referenceInput.classList.add('valid');
    referenceInput.classList.remove('invalid');
    refIcon.textContent = '✓';
    refIcon.style.color = 'var(--green)';
    clearError('reference');
  } else if (ref.length > 0) {
    // Référence inconnue ✗
    state.productPrice = 0;
    state.productName  = null;
    state.productRef   = null;
    referenceInput.classList.add('invalid');
    referenceInput.classList.remove('valid');
    refIcon.textContent = '✗';
    refIcon.style.color = 'var(--red)';
  } else {
    // Champ vide
    state.productPrice = 0;
    state.productName  = null;
    state.productRef   = null;
    referenceInput.classList.remove('valid', 'invalid');
    refIcon.textContent = '';
    clearError('reference');
  }

  updateView();
});

// ─── SÉLECTION LIVRAISON ──────────────────────────────────────
shippingBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    shippingBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.shippingPrice = parseFloat(btn.dataset.shippingPrice) || 0;
    state.shippingLabel = btn.dataset.shippingLabel || CONFIG.defaultShipping.label;
    updateView();
  });
});

// ─── SÉLECTION PAIEMENT ───────────────────────────────────────
paymentBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    paymentBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.paymentMode = btn.dataset.paymentMode || 'stripe';
    updateView();
  });
});

// ════════════════════════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════════════════════════

const RULES = {
  reference: {
    test: v => !!CONFIG.products[v.trim().toUpperCase()],
    msg:  'Référence non reconnue. Vérifiez le code annoncé en live.',
  },
  prenom: {
    test: v => v.trim().length >= 2,
    msg:  'Veuillez entrer votre prénom (2 caractères minimum).',
  },
  nom: {
    test: v => v.trim().length >= 2,
    msg:  'Veuillez entrer votre nom (2 caractères minimum).',
  },
  email: {
    test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    msg:  'Adresse email invalide.',
  },
  telephone: {
    test: v => v.replace(/[\s\-\.\(\)\+]/g, '').length >= 8,
    msg:  'Numéro de téléphone invalide.',
  },
  adresse1: {
    test: v => v.trim().length >= 5,
    msg:  'Adresse de livraison requise (5 caractères minimum).',
  },
  ville: {
    test: v => v.trim().length >= 2,
    msg:  'Ville requise.',
  },
  code_postal: {
    test: v => /^\d{4,6}$/.test(v.trim()),
    msg:  'Code postal invalide (4 à 6 chiffres).',
  },
};

function showError(id, msg) {
  const errEl = $(id + 'Error');
  const input  = $(id);
  if (errEl) errEl.textContent = msg;
  if (input) { input.classList.add('invalid'); input.classList.remove('valid'); }
}

function clearError(id) {
  const errEl = $(id + 'Error');
  const input  = $(id);
  if (errEl) errEl.textContent = '';
  if (input) input.classList.remove('invalid');
}

function validateAll() {
  let firstError = null;
  let allValid   = true;

  for (const [id, rule] of Object.entries(RULES)) {
    const input = $(id);
    if (!input) continue;

    const value = input.value || '';
    if (!rule.test(value)) {
      showError(id, rule.msg);
      if (!firstError) firstError = input;
      allValid = false;
    } else {
      clearError(id);
      input.classList.add('valid');
    }
  }

  // Scroll intelligent vers la première erreur
  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstError.focus({ preventScroll: true });
  }

  return allValid;
}

// Validation live au blur (meilleur UX : on ne punit pas pendant la frappe)
Object.keys(RULES).forEach(id => {
  const input = $(id);
  if (!input) return;

  input.addEventListener('blur', () => {
    const value = input.value || '';
    if (!value.trim()) { clearError(id); return; }

    if (!RULES[id].test(value)) {
      showError(id, RULES[id].msg);
    } else {
      clearError(id);
      // Ne pas reclasser 'reference' ici (géré séparément)
      if (id !== 'reference') {
        input.classList.add('valid');
        input.classList.remove('invalid');
      }
    }
  });
});

// ─── SOUMISSION AJAX ─────────────────────────────────────────
form.addEventListener('submit', async e => {
  e.preventDefault();

  if (!validateAll()) return;

  // État chargement
  submitBtn.disabled = true;
  if (submitBtnText) submitBtnText.textContent = 'Envoi en cours…';

  try {
    const formData = new FormData(form);

    const res = await fetch(CONFIG.formspreeEndpoint, {
      method:  'POST',
      body:    formData,
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      // Succès : afficher l'état de confirmation
      form.hidden         = true;
      successState.hidden = false;
      successState.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Erreur serveur');
    }
  } catch (err) {
    console.error('Erreur soumission:', err);
    submitBtn.disabled = false;
    if (submitBtnText) submitBtnText.textContent = 'Valider ma commande';
    alert('Une erreur est survenue lors de l\'envoi. Veuillez réessayer ou nous contacter directement.');
  }
});

// ─── RÉINITIALISATION ────────────────────────────────────────
resetBtn.addEventListener('click', () => {
  // Réinitialiser le formulaire HTML
  form.reset();
  form.hidden         = false;
  successState.hidden = true;

  // Réinitialiser le bouton
  submitBtn.disabled = false;
  if (submitBtnText) submitBtnText.textContent = 'Valider ma commande';

  // Réinitialiser le state
  state = {
    productPrice:  0,
    productName:   null,
    productRef:    null,
    shippingPrice: CONFIG.defaultShipping.price,
    shippingLabel: CONFIG.defaultShipping.label,
    paymentMode:   'stripe',
  };

  // Remettre les sélections par défaut
  shippingBtns.forEach((btn, i) => btn.classList.toggle('active', i === 0));
  paymentBtns.forEach((btn,  i) => btn.classList.toggle('active', i === 0));

  // Nettoyer les classes de validation et erreurs
  $$('.input').forEach(el => el.classList.remove('valid', 'invalid'));
  $$('.field-error').forEach(el => (el.textContent = ''));
  if (refIcon) { refIcon.textContent = ''; }

  updateView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ─── INIT ────────────────────────────────────────────────────
syncStripeLinks();
updateView();
