/* ==========================================================================
   Drelle's Gym — site interactions + demo membership sign-up
   Everything here is front-end only: no payment is processed and no data
   leaves the browser. A "membership" is stored in localStorage so the site
   can show the visitor their digital pass.
   ========================================================================== */
(function () {
    'use strict';

    /* ---------- Icons (Lucide-style, 24×24 stroke) ---------- */

    const ICONS = {
        clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
        trainer: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
        users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
        dumbbell: '<path d="M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12"/>',
        calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        trending: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
        wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
        check: '<path d="M20 6 9 17l-5-5"/>',
        star: '<path fill="currentColor" stroke="none" d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/>',
        x: '<path d="M18 6 6 18M6 6l12 12"/>',
        info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
        card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
        phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
        store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>',
        arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
        zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
        flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
        crown: '<path d="M2 5l3 12h14l3-12-6 6-4-7-4 7z"/><path d="M5 21h14"/>',
        mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
        pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        pass: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-1.5 1.6-2 3-2s2.5.5 3 2M15 10h3M15 13h3"/>'
    };

    const svg = (name) =>
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;

    /* ---------- Data ---------- */

    const PLANS = {
        basic: {
            name: 'Basic', monthly: 29, icon: 'zap',
            perks: ['Unlimited gym access', 'Locker room facilities', '1 guest pass / month']
        },
        premium: {
            name: 'Premium', monthly: 49, icon: 'flame',
            perks: ['All Basic features', 'Unlimited group classes', 'Free fitness assessment', '2 guest passes / month']
        },
        elite: {
            name: 'Elite', monthly: 79, icon: 'crown',
            perks: ['All Premium features', 'Personal locker', 'Priority class booking', '5 guest passes / month', '1 PT session / month']
        }
    };
    const ANNUAL_DISCOUNT = 0.2;
    const PROMOS = {
        DRELLE10: { rate: 0.10, label: '10% off your first payment' },
        NEWYOU: { rate: 0.15, label: '15% off your first payment' }
    };
    const STORE_KEY = 'drelles-gym-member';
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Helpers ---------- */

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    const round2 = (n) => Math.round(n * 100) / 100;
    const money = (n) => {
        n = round2(n);
        return '$' + (Number.isInteger(n) ? n : n.toFixed(2));
    };
    const annualTotal = (key) => Math.round(PLANS[key].monthly * 12 * (1 - ANNUAL_DISCOUNT));
    const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const pad = (n) => String(n).padStart(2, '0');
    const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const parseISODate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const fmtExpiry = (s) => { const d = parseISODate(s); return `${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`; };
    const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
    const addPeriod = (d, billing) => {
        const r = new Date(d);
        if (billing === 'annual') r.setFullYear(r.getFullYear() + 1);
        else r.setMonth(r.getMonth() + 1);
        return r;
    };

    const luhn = (num) => {
        let sum = 0, dbl = false;
        for (let i = num.length - 1; i >= 0; i--) {
            let d = +num[i];
            if (dbl) { d *= 2; if (d > 9) d -= 9; }
            sum += d;
            dbl = !dbl;
        }
        return sum % 10 === 0;
    };
    const cardBrand = (digits) => {
        if (/^4/.test(digits)) return 'Visa';
        if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
        if (/^3[47]/.test(digits)) return 'Amex';
        if (/^6/.test(digits)) return 'Discover';
        return '';
    };

    /* ---------- Storage (falls back to memory if localStorage is blocked) ---------- */

    let memoryMember = null;
    const store = {
        get() {
            try {
                const raw = localStorage.getItem(STORE_KEY);
                if (raw) return JSON.parse(raw);
            } catch (e) { /* ignore */ }
            return memoryMember;
        },
        set(v) {
            memoryMember = v;
            try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch (e) { /* ignore */ }
        },
        clear() {
            memoryMember = null;
            try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
        }
    };
    const getMember = () => {
        const m = store.get();
        return m && PLANS[m.plan] && m.id && m.name ? m : null;
    };

    /* ---------- Static enhancements ---------- */

    function hydrateIcons(root = document) {
        $$('[data-icon]', root).forEach((el) => { el.innerHTML = svg(el.dataset.icon); });
        $$('[data-stars]', root).forEach((el) => {
            const n = +el.dataset.stars || 5;
            el.classList.add('stars');
            el.setAttribute('role', 'img');
            el.setAttribute('aria-label', `${n} out of 5 stars`);
            el.innerHTML = svg('star').repeat(n);
        });
        $$('[data-year]', root).forEach((el) => { el.textContent = new Date().getFullYear(); });
    }

    function initNav() {
        const nav = $('.site-nav');
        if (!nav) return;
        const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        const toggle = $('.nav-toggle', nav);
        const setOpen = (open) => {
            nav.classList.toggle('open', open);
            if (toggle) {
                toggle.setAttribute('aria-expanded', String(open));
                toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            }
        };
        if (toggle) toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
        $$('.nav-links a', nav).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    }

    function initReveal() {
        const els = $$('.reveal');
        if (!('IntersectionObserver' in window)) {
            els.forEach((el) => el.classList.add('is-visible'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        els.forEach((el) => io.observe(el));
    }

    /* ---------- Plans section (index page) ---------- */

    let pageBilling = 'monthly';

    function setPageBilling(billing) {
        pageBilling = billing;
        $$('[data-billing]').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.billing === billing)));
        $$('.plan-card[data-plan]').forEach((card) => {
            const key = card.dataset.plan;
            const amount = $('.amount', card);
            const billed = $('.plan-billed', card);
            if (billing === 'annual') {
                const total = annualTotal(key);
                amount.textContent = Math.round(total / 12);
                billed.textContent = `Billed ${money(total)} yearly · save ${money(PLANS[key].monthly * 12 - total)}`;
            } else {
                amount.textContent = PLANS[key].monthly;
                billed.textContent = 'Billed monthly · cancel anytime';
            }
        });
    }

    function initPlans() {
        const buttons = $$('[data-billing]');
        if (!buttons.length) return;
        buttons.forEach((btn) => btn.addEventListener('click', () => setPageBilling(btn.dataset.billing)));
        setPageBilling('monthly');
    }

    /* ---------- Member-aware UI ---------- */

    function refreshMemberUI() {
        const m = getMember();

        $$('[data-nav-cta]').forEach((slot) => {
            slot.innerHTML = m
                ? '<button type="button" class="btn btn-ghost btn-sm" data-open-pass><span class="member-dot" aria-hidden="true"></span>My Pass</button>'
                : '<button type="button" class="btn btn-primary btn-sm" data-open-signup>Join Now</button>';
        });

        $$('.plan-card[data-plan]').forEach((card) => {
            const key = card.dataset.plan;
            const isCurrent = !!m && m.plan === key;
            card.classList.toggle('is-current', isCurrent);

            const popular = $('.plan-badge:not(.current)', card);
            if (popular) popular.hidden = isCurrent;
            let current = $('.plan-badge.current', card);
            if (isCurrent && !current) {
                current = document.createElement('span');
                current.className = 'plan-badge current';
                current.textContent = 'Your plan';
                card.prepend(current);
            } else if (!isCurrent && current) {
                current.remove();
            }

            const btn = $('[data-plan-btn]', card);
            if (!btn) return;
            if (isCurrent) {
                btn.textContent = 'View my pass';
                btn.className = 'btn btn-ghost btn-block';
                btn.removeAttribute('data-open-signup');
                btn.setAttribute('data-open-pass', '');
            } else {
                btn.textContent = `${m ? 'Switch to' : 'Join'} ${PLANS[key].name}`;
                btn.className = 'btn btn-block ' + (card.classList.contains('featured') ? 'btn-primary' : 'btn-ghost');
                btn.removeAttribute('data-open-pass');
                btn.setAttribute('data-open-signup', '');
            }
        });

        $$('[data-member-only]').forEach((el) => { el.hidden = !m; });
        $$('[data-guest-only]').forEach((el) => { el.hidden = !!m; });
    }

    /* ---------- Toasts + confetti ---------- */

    let toastWrap;
    function toast(message, type = 'success') {
        const t = document.createElement('div');
        t.className = 'toast' + (type === 'error' ? ' error' : '');
        t.innerHTML = svg(type === 'error' ? 'info' : 'check') + `<span>${escapeHTML(message)}</span>`;
        toastWrap.appendChild(t);
        setTimeout(() => {
            t.classList.add('is-leaving');
            setTimeout(() => t.remove(), 260);
        }, 3400);
    }

    function confetti() {
        if (reduceMotion) return;
        const layer = document.createElement('div');
        layer.className = 'confetti-layer';
        const colors = ['#ff5a1f', '#ffb547', '#ffffff', '#2fd27a', '#ff8a5c'];
        for (let i = 0; i < 80; i++) {
            const piece = document.createElement('i');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.background = colors[i % colors.length];
            piece.style.setProperty('--dx', (Math.random() * 240 - 120) + 'px');
            piece.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
            piece.style.setProperty('--dur', (2 + Math.random() * 1.6) + 's');
            piece.style.setProperty('--wait', (Math.random() * 0.5) + 's');
            if (Math.random() > 0.55) {
                piece.style.width = '7px';
                piece.style.height = '7px';
                piece.style.borderRadius = '50%';
            }
            layer.appendChild(piece);
        }
        document.body.appendChild(layer);
        setTimeout(() => layer.remove(), 4600);
    }

    /* ---------- Member pass card ---------- */

    function barcode(text) {
        let seed = 7;
        for (const ch of text) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
        const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
        let x = 0, bars = '';
        while (x < 96) {
            const w = 1 + Math.floor(rnd() * 3);
            bars += `<rect x="${x}" y="0" width="${w}" height="30"/>`;
            x += w + 1 + Math.floor(rnd() * 2);
        }
        return `<svg viewBox="0 0 ${x} 30" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
    }

    function passHTML(m) {
        const plan = PLANS[m.plan];
        const label = `${plan.name} membership pass for ${m.name}, member ID ${m.id}`;
        return `
            <div class="member-pass" data-plan="${m.plan}" role="img" aria-label="${escapeHTML(label)}">
                <div class="pass-top">
                    <img src="drelle.png" alt="">
                    <span class="pass-tier">${plan.name}</span>
                </div>
                <div>
                    <div class="pass-meta"><span>Member</span></div>
                    <div class="pass-name">${escapeHTML(m.name)}</div>
                </div>
                <div class="pass-bottom">
                    <div class="pass-meta">
                        <span>Member ID<b>${escapeHTML(m.id)}</b></span>
                        <span>Valid thru<b>${fmtExpiry(m.renewDate)}</b></span>
                    </div>
                    <div class="pass-barcode">${barcode(m.id)}</div>
                </div>
            </div>`;
    }

    /* ---------- Modal plumbing ---------- */

    let activeModal = null;
    let lastFocus = null;

    function openModal(modal, focusEl) {
        // Switching straight from one modal to another keeps the original trigger as the focus target.
        if (activeModal) closeModal(true);
        else lastFocus = document.activeElement;
        activeModal = modal;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        const nav = $('.site-nav');
        if (nav) nav.classList.remove('open');
        requestAnimationFrame(() => { if (focusEl) focusEl.focus({ preventScroll: true }); });
    }

    function closeModal(keepFocus) {
        if (!activeModal || activeModal.dataset.locked === 'true') return;
        activeModal.classList.remove('is-open');
        activeModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        activeModal = null;
        if (!keepFocus && lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    }

    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    document.addEventListener('keydown', (e) => {
        if (!activeModal) return;
        if (e.key === 'Escape') {
            closeModal();
            return;
        }
        if (e.key !== 'Tab') return;
        const items = $$(FOCUSABLE, activeModal).filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !activeModal.contains(document.activeElement))) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });

    document.addEventListener('click', (e) => {
        const signupTrigger = e.target.closest('[data-open-signup]');
        if (signupTrigger) {
            e.preventDefault();
            Signup.open(signupTrigger.dataset.plan);
            return;
        }
        const passTrigger = e.target.closest('[data-open-pass]');
        if (passTrigger) {
            e.preventDefault();
            Pass.open();
            return;
        }
        if (e.target.closest('[data-close-modal]')) closeModal();
    });

    /* ==========================================================================
       Sign-up flow
       ========================================================================== */

    const Signup = (() => {
        let modal, dialog, form, layout, summaryBody, backBtn, nextBtn, actions;
        let state = { plan: 'premium', billing: 'monthly', method: 'card', promo: null };
        let step = 1;
        let completed = false;

        const field = (name) => $(`[data-field="${name}"]`, form);
        const val = (name) => {
            const el = form.elements[name];
            return el && typeof el.value === 'string' ? el.value.trim() : '';
        };

        function build() {
            const planOptions = Object.keys(PLANS).map((key) => `
                <label class="option-card">
                    <input type="radio" name="plan" value="${key}">
                    <span class="option-inner">
                        <span class="option-title">${PLANS[key].name} ${svg(PLANS[key].icon)}</span>
                        <span class="option-price" data-option-price="${key}"></span>
                        <span class="option-meta" data-option-meta="${key}"></span>
                    </span>
                </label>`).join('');

            const goals = ['Lose weight', 'Build muscle', 'Get stronger', 'Improve endurance', 'Stay active']
                .map((g) => `<label class="chip"><input type="radio" name="goal" value="${g}"><span>${g}</span></label>`).join('');

            modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'signupModal';
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML = `
                <div class="modal-backdrop" data-close-modal></div>
                <div class="modal-dialog" role="dialog" aria-modal="true" aria-label="Membership sign-up">
                    <button type="button" class="modal-close" data-close-modal aria-label="Close sign-up">${svg('x')}</button>
                    <div class="signup-layout">
                        <form class="signup-main" novalidate>
                            <ol class="stepper" aria-label="Sign-up progress">
                                <li data-indicator="1">Plan</li>
                                <li data-indicator="2">Details</li>
                                <li data-indicator="3">Payment</li>
                                <li data-indicator="4">Done</li>
                            </ol>

                            <section class="step" data-step="1">
                                <h2 class="step-title" tabindex="-1">Choose your plan</h2>
                                <p class="step-sub">Pick a membership and when you'd like to start.</p>
                                <div class="notice warn" data-current-note hidden></div>
                                <fieldset class="fieldset field" data-field="plan">
                                    <legend class="field-label">Membership</legend>
                                    <div class="option-grid">${planOptions}</div>
                                    <span class="field-error"></span>
                                </fieldset>
                                <fieldset class="fieldset">
                                    <legend class="field-label">Billing</legend>
                                    <div class="option-grid two">
                                        <label class="option-card">
                                            <input type="radio" name="billing" value="monthly">
                                            <span class="option-inner">
                                                <span class="option-title">Monthly</span>
                                                <span class="option-meta">Cancel anytime</span>
                                            </span>
                                        </label>
                                        <label class="option-card">
                                            <input type="radio" name="billing" value="annual">
                                            <span class="option-inner">
                                                <span class="option-title">Annual <span class="save-badge">Save 20%</span></span>
                                                <span class="option-meta">Billed once a year</span>
                                            </span>
                                        </label>
                                    </div>
                                </fieldset>
                                <div class="field" data-field="startDate">
                                    <label class="field-label" for="su-start">Start date</label>
                                    <input class="input" type="date" id="su-start" name="startDate">
                                    <span class="field-error"></span>
                                </div>
                            </section>

                            <section class="step" data-step="2">
                                <h2 class="step-title" tabindex="-1">Your details</h2>
                                <p class="step-sub">We'll use these to set up your member profile.</p>
                                <div class="field" data-field="name">
                                    <label class="field-label" for="su-name">Full name</label>
                                    <input class="input" id="su-name" name="name" autocomplete="name" placeholder="e.g. Juan Dela Cruz">
                                    <span class="field-error"></span>
                                </div>
                                <div class="field-row">
                                    <div class="field" data-field="email">
                                        <label class="field-label" for="su-email">Email</label>
                                        <input class="input" id="su-email" name="email" type="email" autocomplete="email" placeholder="you@example.com">
                                        <span class="field-error"></span>
                                    </div>
                                    <div class="field" data-field="phone">
                                        <label class="field-label" for="su-phone">Mobile number</label>
                                        <input class="input" id="su-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="0917 123 4567">
                                        <span class="field-error"></span>
                                    </div>
                                </div>
                                <fieldset class="fieldset field">
                                    <legend class="field-label">Main fitness goal <span class="optional">(optional)</span></legend>
                                    <div class="chip-group">${goals}</div>
                                </fieldset>
                            </section>

                            <section class="step" data-step="3">
                                <h2 class="step-title" tabindex="-1">Payment</h2>
                                <p class="step-sub">Choose how you'd like to pay.</p>
                                <div class="notice">${svg('info')}<span><strong>Demo mode:</strong> no real payment is made and nothing leaves your browser. For cards, use <code>4242 4242 4242 4242</code> with any future expiry and CVC.</span></div>
                                <fieldset class="fieldset">
                                    <legend class="sr-only">Payment method</legend>
                                    <div class="option-grid">
                                        <label class="option-card"><input type="radio" name="method" value="card"><span class="option-inner method">${svg('card')}Card</span></label>
                                        <label class="option-card"><input type="radio" name="method" value="ewallet"><span class="option-inner method">${svg('phone')}E-wallet</span></label>
                                        <label class="option-card"><input type="radio" name="method" value="desk"><span class="option-inner method">${svg('store')}Pay at gym</span></label>
                                    </div>
                                </fieldset>

                                <div data-pay-panel="card">
                                    <div class="field" data-field="cardName">
                                        <label class="field-label" for="su-card-name">Name on card</label>
                                        <input class="input" id="su-card-name" name="cardName" autocomplete="cc-name">
                                        <span class="field-error"></span>
                                    </div>
                                    <div class="field" data-field="cardNumber">
                                        <label class="field-label" for="su-card-number">Card number</label>
                                        <div class="input-wrap">
                                            <input class="input" id="su-card-number" name="cardNumber" autocomplete="cc-number" inputmode="numeric" placeholder="1234 5678 9012 3456" maxlength="23">
                                            <span class="card-brand" data-card-brand></span>
                                        </div>
                                        <span class="field-error"></span>
                                    </div>
                                    <div class="field-row">
                                        <div class="field" data-field="cardExp">
                                            <label class="field-label" for="su-card-exp">Expiry</label>
                                            <input class="input" id="su-card-exp" name="cardExp" autocomplete="cc-exp" inputmode="numeric" placeholder="MM/YY" maxlength="5">
                                            <span class="field-error"></span>
                                        </div>
                                        <div class="field" data-field="cardCvc">
                                            <label class="field-label" for="su-card-cvc">CVC</label>
                                            <input class="input" id="su-card-cvc" name="cardCvc" autocomplete="cc-csc" inputmode="numeric" placeholder="123" maxlength="4">
                                            <span class="field-error"></span>
                                        </div>
                                    </div>
                                </div>

                                <div data-pay-panel="ewallet" hidden>
                                    <div class="field" data-field="wallet">
                                        <label class="field-label" for="su-wallet">E-wallet mobile number <span class="optional">(GCash / Maya)</span></label>
                                        <input class="input" id="su-wallet" name="wallet" type="tel" inputmode="tel" placeholder="0917 123 4567">
                                        <span class="field-error"></span>
                                    </div>
                                </div>

                                <div data-pay-panel="desk" hidden>
                                    <div class="desk-panel field"><strong>Pay on your first visit.</strong> We'll hold your membership for 7 days. Just show your digital pass at the front desk and settle the payment there.</div>
                                </div>

                                <div class="field" data-field="terms">
                                    <label class="checkbox"><input type="checkbox" name="terms"><span>I agree to the membership terms and gym rules.</span></label>
                                    <span class="field-error"></span>
                                </div>
                            </section>

                            <section class="step" data-step="processing">
                                <div class="processing" role="status">
                                    <div class="spinner" aria-hidden="true"></div>
                                    <p data-processing-text>Processing payment…</p>
                                </div>
                            </section>

                            <section class="step" data-step="4">
                                <div class="success" data-success></div>
                            </section>

                            <div class="step-actions">
                                <button type="button" class="btn btn-ghost" data-back>Back</button>
                                <button type="submit" class="btn btn-primary" data-next>Continue</button>
                            </div>
                        </form>

                        <aside class="signup-aside" aria-label="Order summary">
                            <h3 class="summary-heading">Order summary</h3>
                            <div data-summary-body></div>
                            <div class="promo">
                                <div class="field" data-promo-form>
                                    <label class="field-label" for="su-promo">Promo code</label>
                                    <div class="promo-row">
                                        <input class="input" id="su-promo" autocomplete="off" placeholder="Enter code">
                                        <button type="button" class="btn btn-ghost btn-sm" data-promo-apply>Apply</button>
                                    </div>
                                    <span class="field-error" id="su-promo-err"></span>
                                    <div class="promo-hint">Try <code>DRELLE10</code> or <code>NEWYOU</code></div>
                                </div>
                                <div class="promo-applied" data-promo-applied hidden>
                                    <span data-promo-label></span>
                                    <button type="button" class="link-btn" data-promo-remove>Remove</button>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>`;
            document.body.appendChild(modal);

            dialog = $('.modal-dialog', modal);
            form = $('form', modal);
            layout = $('.signup-layout', modal);
            summaryBody = $('[data-summary-body]', modal);
            backBtn = $('[data-back]', modal);
            nextBtn = $('[data-next]', modal);
            actions = $('.step-actions', modal);

            $$('.field-error', form).forEach((el, i) => { el.id = `su-err-${i}`; });

            form.addEventListener('submit', (e) => { e.preventDefault(); next(); });
            backBtn.addEventListener('click', () => goTo(step - 1));
            form.addEventListener('change', onChange);
            form.addEventListener('input', onInput);

            $('[data-promo-apply]', modal).addEventListener('click', applyPromo);
            $('#su-promo', modal).addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); applyPromo(); }
            });
            $('#su-promo', modal).addEventListener('input', () => $('[data-promo-form]', modal).classList.remove('has-error'));
            $('[data-promo-remove]', modal).addEventListener('click', () => {
                state.promo = null;
                renderPromo();
                renderSummary();
                $('#su-promo', modal).focus();
            });
        }

        /* --- state <-> inputs --- */

        function syncInputs() {
            ['plan', 'billing', 'method'].forEach((name) => {
                $$(`input[name="${name}"]`, form).forEach((r) => { r.checked = r.value === state[name]; });
            });
            showPayPanel();
            updateOptionPrices();
            renderPromo();
            renderSummary();
        }

        function onChange(e) {
            const t = e.target;
            if (t.name === 'plan' || t.name === 'billing') {
                state[t.name] = t.value;
                clearError(field('plan'));
                updateOptionPrices();
                renderSummary();
            } else if (t.name === 'method') {
                state.method = t.value;
                showPayPanel();
                renderSummary();
            } else if (t.name === 'terms') {
                clearError(field('terms'));
            }
        }

        function onInput(e) {
            const t = e.target;
            const f = t.closest('.field');
            if (f) clearError(f);

            if (t.name === 'cardNumber') {
                const digits = t.value.replace(/\D/g, '').slice(0, 19);
                t.value = digits.replace(/(.{4})/g, '$1 ').trim();
                $('[data-card-brand]', form).textContent = cardBrand(digits);
            } else if (t.name === 'cardExp') {
                let d = t.value.replace(/\D/g, '').slice(0, 4);
                if (d.length >= 3) d = d.slice(0, 2) + '/' + d.slice(2);
                t.value = d;
            } else if (t.name === 'cardCvc') {
                t.value = t.value.replace(/\D/g, '').slice(0, 4);
            }
        }

        function showPayPanel() {
            $$('[data-pay-panel]', form).forEach((p) => { p.hidden = p.dataset.payPanel !== state.method; });
        }

        function updateOptionPrices() {
            Object.keys(PLANS).forEach((key) => {
                const price = $(`[data-option-price="${key}"]`, form);
                const meta = $(`[data-option-meta="${key}"]`, form);
                if (state.billing === 'annual') {
                    price.innerHTML = `${money(Math.round(annualTotal(key) / 12))}<small>/mo</small>`;
                    meta.textContent = `${money(annualTotal(key))} billed yearly`;
                } else {
                    price.innerHTML = `${money(PLANS[key].monthly)}<small>/mo</small>`;
                    meta.textContent = 'Billed monthly';
                }
            });
        }

        /* --- pricing --- */

        function totals() {
            const p = PLANS[state.plan];
            const list = state.billing === 'annual' ? p.monthly * 12 : p.monthly;
            const annualOff = state.billing === 'annual' ? list - annualTotal(state.plan) : 0;
            const sub = list - annualOff;
            const promoOff = state.promo ? round2(sub * PROMOS[state.promo].rate) : 0;
            return { list, annualOff, promoOff, total: round2(sub - promoOff) };
        }

        function renderSummary() {
            const p = PLANS[state.plan];
            const t = totals();
            const annual = state.billing === 'annual';
            summaryBody.innerHTML = `
                <div class="summary-plan">
                    <span class="plan-icon">${svg(p.icon)}</span>
                    <div>
                        <div class="summary-plan-name">${p.name}</div>
                        <div class="summary-plan-meta">${annual ? 'Annual' : 'Monthly'} membership</div>
                    </div>
                </div>
                <ul class="summary-perks">${p.perks.map((x) => `<li>${x}</li>`).join('')}</ul>
                <div class="summary-lines">
                    <div class="summary-line"><span>${p.name} · ${annual ? '12 months' : '1 month'}</span><span>${money(t.list)}</span></div>
                    ${t.annualOff ? `<div class="summary-line discount"><span>Annual saving (20%)</span><span>−${money(t.annualOff)}</span></div>` : ''}
                    ${t.promoOff ? `<div class="summary-line discount"><span>Promo ${state.promo}</span><span>−${money(t.promoOff)}</span></div>` : ''}
                    <div class="summary-line discount"><span>Joining fee</span><span>Waived</span></div>
                </div>
                <div class="summary-total">
                    <span>${state.method === 'desk' ? 'Due at first visit' : 'Due today'}</span>
                    <strong>${money(t.total)}</strong>
                </div>
                <p class="summary-note">${annual ? `Renews yearly at ${money(annualTotal(state.plan))}.` : `Then ${money(p.monthly)}/month. Cancel anytime.`}</p>`;
            updateNextLabel();
        }

        function renderPromo() {
            const applied = $('[data-promo-applied]', modal);
            const formEl = $('[data-promo-form]', modal);
            if (state.promo) {
                $('[data-promo-label]', modal).textContent = `${state.promo} · ${PROMOS[state.promo].label}`;
                applied.hidden = false;
                formEl.hidden = true;
            } else {
                applied.hidden = true;
                formEl.hidden = false;
                formEl.classList.remove('has-error');
                $('#su-promo', modal).value = '';
            }
        }

        function applyPromo() {
            const formEl = $('[data-promo-form]', modal);
            const input = $('#su-promo', modal);
            const code = input.value.trim().toUpperCase();
            const err = $('#su-promo-err', modal);
            if (!code || !PROMOS[code]) {
                err.textContent = code ? `"${code}" isn't a valid code.` : 'Enter a promo code.';
                formEl.classList.add('has-error');
                input.setAttribute('aria-describedby', err.id);
                input.focus();
                return;
            }
            state.promo = code;
            renderPromo();
            renderSummary();
            toast(`Promo ${code} applied: ${PROMOS[code].label}.`);
        }

        /* --- validation --- */

        function setError(f, msg) {
            f.classList.add('has-error');
            const err = $('.field-error', f);
            err.textContent = msg;
            const input = $('input:checked', f) || $('input', f);
            if (input && input.type !== 'radio') {
                input.setAttribute('aria-invalid', 'true');
                input.setAttribute('aria-describedby', err.id);
            }
        }

        function clearError(f) {
            if (!f || !f.classList.contains('has-error')) return;
            f.classList.remove('has-error');
            $$('input', f).forEach((i) => i.removeAttribute('aria-invalid'));
        }

        // rules: [[fieldName, errorMessage | null], ...]
        function check(rules) {
            let firstBad = null;
            rules.forEach(([name, msg]) => {
                const f = field(name);
                if (!f) return;
                if (msg) {
                    setError(f, msg);
                    if (!firstBad) firstBad = f;
                } else {
                    clearError(f);
                }
            });
            if (firstBad) {
                const input = $('input:checked', firstBad) || $('input', firstBad);
                if (input) input.focus();
                return false;
            }
            return true;
        }

        function validateStep1() {
            const member = getMember();
            const start = val('startDate');
            const today = toISODate(new Date());
            let startErr = null;
            if (!start) startErr = 'Pick a start date.';
            else if (start < today) startErr = "Start date can't be in the past.";
            else if (start > toISODate(addDays(new Date(), 60))) startErr = 'Start date must be within the next 60 days.';

            const samePlan = member && member.plan === state.plan && member.billing === state.billing;
            const planErr = samePlan
                ? `You're already on ${PLANS[state.plan].name} (${state.billing}). Pick a different plan or billing cycle.`
                : null;
            return check([['plan', planErr], ['startDate', startErr]]);
        }

        function validateStep2() {
            const name = val('name');
            const email = val('email');
            const phone = val('phone').replace(/\D/g, '');
            return check([
                ['name', !name ? 'Enter your full name.' : (name.length < 3 || !/[a-z]/i.test(name)) ? 'That name looks too short.' : null],
                ['email', !email ? 'Enter your email address.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? 'Enter a valid email, like you@example.com.' : null],
                ['phone', !phone ? 'Enter your mobile number.' : (phone.length < 10 || phone.length > 13) ? 'Enter a valid mobile number (10–13 digits).' : null]
            ]);
        }

        function expiryError(v) {
            const m = /^(\d{2})\/(\d{2})$/.exec(v);
            if (!m) return 'Use the MM/YY format.';
            const month = +m[1];
            const year = 2000 + +m[2];
            if (month < 1 || month > 12) return 'Month must be between 01 and 12.';
            const now = new Date();
            if (new Date(year, month, 0, 23, 59, 59) < now) return 'This card has expired.';
            if (year > now.getFullYear() + 20) return 'Check the expiry year.';
            return null;
        }

        function validateStep3() {
            const rules = [];
            if (state.method === 'card') {
                const num = val('cardNumber').replace(/\D/g, '');
                rules.push(['cardName', val('cardName').length < 3 ? 'Enter the name on the card.' : null]);
                rules.push(['cardNumber', !num ? 'Enter your card number.' : (num.length < 13 || !luhn(num)) ? "That card number isn't valid. Try 4242 4242 4242 4242." : null]);
                rules.push(['cardExp', expiryError(val('cardExp'))]);
                rules.push(['cardCvc', /^\d{3,4}$/.test(val('cardCvc')) ? null : 'Enter the 3 or 4 digit code.']);
            } else if (state.method === 'ewallet') {
                const w = val('wallet').replace(/\D/g, '');
                rules.push(['wallet', (w.length < 10 || w.length > 13) ? 'Enter the mobile number linked to your e-wallet.' : null]);
            }
            rules.push(['terms', form.elements.terms.checked ? null : 'Please accept the membership terms to continue.']);
            return check(rules);
        }

        /* --- navigation --- */

        function updateNextLabel() {
            if (!nextBtn) return;
            if (step === 1) nextBtn.innerHTML = `Continue ${svg('arrow')}`;
            else if (step === 2) nextBtn.innerHTML = `Continue to payment ${svg('arrow')}`;
            else if (step === 3) nextBtn.textContent = state.method === 'desk' ? 'Reserve my membership' : `Pay ${money(totals().total)}`;
        }

        function goTo(n, moveFocus = true) {
            step = n;
            const num = n === 'processing' ? 3 : n;
            $$('.step', form).forEach((s) => s.classList.toggle('is-active', s.dataset.step === String(n)));
            $$('[data-indicator]', form).forEach((li) => {
                const i = +li.dataset.indicator;
                li.classList.toggle('is-done', i < num || n === 4);
                li.classList.toggle('is-active', i === num);
                if (i === num) li.setAttribute('aria-current', 'step');
                else li.removeAttribute('aria-current');
            });
            backBtn.hidden = n === 1;
            actions.hidden = n === 'processing' || n === 4;
            layout.classList.toggle('is-complete', n === 4);
            updateNextLabel();
            dialog.scrollTop = 0;
            if (moveFocus) {
                const title = $('.step.is-active .step-title', form);
                if (title) title.focus({ preventScroll: true });
            }
        }

        function next() {
            if (step === 1 && validateStep1()) goTo(2);
            else if (step === 2 && validateStep2()) goTo(3);
            else if (step === 3 && validateStep3()) submit();
        }

        function submit() {
            const t = totals();
            const isDesk = state.method === 'desk';
            const text = $('[data-processing-text]', form);
            text.textContent = isDesk ? 'Reserving your membership…' : 'Processing payment…';
            modal.dataset.locked = 'true';
            goTo('processing', false);

            setTimeout(() => { text.textContent = 'Creating your digital pass…'; }, 1100);
            setTimeout(() => {
                const previous = getMember();
                const start = parseISODate(val('startDate'));
                const digits = val('cardNumber').replace(/\D/g, '');
                const member = {
                    id: previous ? previous.id : 'DG-' + Math.floor(100000 + Math.random() * 900000),
                    plan: state.plan,
                    billing: state.billing,
                    name: val('name'),
                    email: val('email'),
                    phone: val('phone'),
                    goal: val('goal'),
                    startDate: val('startDate'),
                    renewDate: toISODate(addPeriod(start, state.billing)),
                    method: state.method,
                    cardBrand: state.method === 'card' ? (cardBrand(digits) || 'Card') : null,
                    cardLast4: state.method === 'card' ? digits.slice(-4) : null,
                    paid: isDesk ? 0 : t.total,
                    due: isDesk ? t.total : 0,
                    promo: state.promo,
                    joinedAt: new Date().toISOString()
                };
                store.set(member);
                modal.dataset.locked = 'false';
                completed = true;
                renderSuccess(member, !!previous);
                goTo(4);
                refreshMemberUI();
                confetti();
            }, 2300);
        }

        function renderSuccess(m, switched) {
            const p = PLANS[m.plan];
            const first = m.name.split(/\s+/)[0];
            const start = fmtDate(parseISODate(m.startDate));
            $('[data-success]', form).innerHTML = `
                <div class="success-icon">${svg('check')}</div>
                <h2 class="step-title" tabindex="-1">${switched ? 'Plan updated!' : `Welcome to the family, ${escapeHTML(first)}!`}</h2>
                <p class="step-sub">${switched ? `You're now on ${p.name}` : `Your ${p.name} membership is all set`}, starting ${start}. Here's your digital member pass.</p>
                ${passHTML(m)}
                <div class="next-steps">
                    <div><strong>Show your pass</strong>Scan it at the front desk on your first visit.</div>
                    <div>${m.method === 'desk'
                        ? `<strong>Pay ${money(m.due)} at the desk</strong>We'll hold your spot for 7 days.`
                        : `<strong>Receipt sent</strong>A confirmation goes to ${escapeHTML(m.email)} (demo).`}</div>
                    <div><strong>Free PT session</strong>A coach will reach out within 24 hours to book it.</div>
                </div>
                <div class="success-actions">
                    <button type="button" class="btn btn-primary" data-close-modal>Done</button>
                    <button type="button" class="btn btn-ghost" data-open-pass>View membership details</button>
                </div>`;
        }

        /* --- public --- */

        function open(planKey) {
            if (!modal) build();
            if (completed) {
                form.reset();
                state = { plan: 'premium', billing: 'monthly', method: 'card', promo: null };
                $('[data-card-brand]', form).textContent = '';
                completed = false;
            }

            const member = getMember();
            if (PLANS[planKey]) state.plan = planKey;
            state.billing = pageBilling;

            // Pre-fill details for existing members switching plans.
            if (member) {
                if (!val('name')) form.elements.name.value = member.name;
                if (!val('email')) form.elements.email.value = member.email;
                if (!val('phone')) form.elements.phone.value = member.phone;
                if (member.goal && !val('goal')) {
                    const goal = $$('input[name="goal"]', form).find((r) => r.value === member.goal);
                    if (goal) goal.checked = true;
                }
            }

            const note = $('[data-current-note]', form);
            if (member) {
                note.innerHTML = `${svg('info')}<span>You're currently on <strong>${PLANS[member.plan].name} (${member.billing})</strong>. Finishing this will switch your membership and keep your member ID.</span>`;
                note.hidden = false;
            } else {
                note.hidden = true;
            }

            const startInput = form.elements.startDate;
            const today = toISODate(new Date());
            startInput.min = today;
            startInput.max = toISODate(addDays(new Date(), 60));
            if (!startInput.value || startInput.value < today) startInput.value = today;

            $$('.field.has-error', modal).forEach(clearError);
            modal.dataset.locked = 'false';
            syncInputs();
            goTo(1, false);
            openModal(modal, $('.step.is-active .step-title', form));
        }

        return { open };
    })();

    /* ==========================================================================
       Member pass modal
       ========================================================================== */

    const Pass = (() => {
        let modal, body, confirmTimer;

        function build() {
            modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'passModal';
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML = `
                <div class="modal-backdrop" data-close-modal></div>
                <div class="modal-dialog narrow" role="dialog" aria-modal="true" aria-labelledby="pass-title">
                    <button type="button" class="modal-close" data-close-modal aria-label="Close">${svg('x')}</button>
                    <div class="pass-modal-body" data-pass-body></div>
                </div>`;
            document.body.appendChild(modal);
            body = $('[data-pass-body]', modal);

            modal.addEventListener('click', (e) => {
                const cancelBtn = e.target.closest('[data-cancel-membership]');
                if (cancelBtn) cancel(cancelBtn);
                if (e.target.closest('[data-change-plan]')) {
                    const m = getMember();
                    Signup.open(m && m.plan === 'premium' ? 'elite' : 'premium');
                }
            });
        }

        function render(m) {
            const p = PLANS[m.plan];
            const start = parseISODate(m.startDate);
            const daysToStart = Math.ceil((start - parseISODate(toISODate(new Date()))) / 86400000);
            const status = daysToStart > 0
                ? `Starts in ${daysToStart} day${daysToStart === 1 ? '' : 's'}`
                : 'Active';
            const payment = m.method === 'card'
                ? `${escapeHTML(m.cardBrand || 'Card')} •••• ${escapeHTML(m.cardLast4 || '')}`
                : m.method === 'ewallet' ? 'E-wallet' : `${money(m.due)} due at front desk`;

            body.innerHTML = `
                <h2 class="step-title" id="pass-title" tabindex="-1">Your membership</h2>
                <p class="step-sub">Show this pass at the front desk to check in.</p>
                ${passHTML(m)}
                <dl class="pass-details">
                    <div><dt>Plan</dt><dd>${p.name} · ${m.billing === 'annual' ? 'Annual' : 'Monthly'}</dd></div>
                    <div><dt>Status</dt><dd>${status}</dd></div>
                    <div><dt>Start date</dt><dd>${fmtDate(start)}</dd></div>
                    <div><dt>${m.billing === 'annual' ? 'Renews' : 'Next billing'}</dt><dd>${fmtDate(parseISODate(m.renewDate))}</dd></div>
                    <div><dt>Email</dt><dd>${escapeHTML(m.email)}</dd></div>
                    <div><dt>Payment</dt><dd>${payment}</dd></div>
                </dl>
                <div class="pass-actions">
                    <button type="button" class="btn btn-ghost btn-sm" data-change-plan>Change plan</button>
                    <button type="button" class="btn btn-danger-ghost btn-sm" data-cancel-membership>Cancel membership</button>
                </div>
                <p class="summary-note" style="text-align:center;margin-top:18px">Demo data is saved only in this browser.</p>`;
        }

        function cancel(btn) {
            if (btn.dataset.confirm !== 'true') {
                btn.dataset.confirm = 'true';
                btn.textContent = 'Click again to confirm';
                clearTimeout(confirmTimer);
                confirmTimer = setTimeout(() => {
                    btn.dataset.confirm = '';
                    btn.textContent = 'Cancel membership';
                }, 4000);
                return;
            }
            clearTimeout(confirmTimer);
            store.clear();
            closeModal();
            refreshMemberUI();
            toast('Membership cancelled. Hope to see you back soon!');
        }

        function open() {
            const m = getMember();
            if (!m) {
                Signup.open();
                return;
            }
            if (!modal) build();
            render(m);
            openModal(modal, $('#pass-title', modal));
        }

        return { open };
    })();

    /* ---------- Boot ---------- */

    toastWrap = document.createElement('div');
    toastWrap.className = 'toast-wrap';
    toastWrap.setAttribute('role', 'status');
    toastWrap.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastWrap);

    hydrateIcons();
    initNav();
    initPlans();
    initReveal();
    refreshMemberUI();

    // Keep tabs in sync if the membership changes in another tab.
    window.addEventListener('storage', (e) => { if (e.key === STORE_KEY) refreshMemberUI(); });

    // Deep link: index.html#join opens the sign-up straight away.
    if (location.hash === '#join') Signup.open();
})();
