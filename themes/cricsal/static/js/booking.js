// ===== CRICSAL BOOKING SYSTEM =====

const state = {
  date: null, time: null, lane: null,
  players: 2, addons: [],
  name: '', phone: '', email: '', notes: '',
  user: null  // logged-in user object
};

const SLOTS = [
  '06:00–07:00','07:00–08:00','08:00–09:00','09:00–10:00',
  '10:00–11:00','11:00–12:00','12:00–13:00','13:00–14:00',
  '14:00–15:00','15:00–16:00','16:00–17:00','17:00–18:00',
  '18:00–19:00','19:00–20:00','20:00–21:00','21:00–22:00'
];
const BASE_TAKEN = ['06:00–07:00','10:00–11:00','17:00–18:00','18:00–19:00'];
const PRICES = { lane: 800, bowling: 400, coaching: 600, equipment: 300 };
const ADDON_NAMES = { bowling: 'Bowling Machine', coaching: 'Coaching Session', equipment: 'Equipment Hire' };

// Simulated user store (in a real app this hits an API)
const MOCK_USERS = [
  { phone: '9800000001', email: 'test@cricsal.com', password: 'test123', name: 'Aarav Sharma', bookings: 5 },
  { phone: '9800000002', email: 'demo@cricsal.com', password: 'demo123', name: 'Priya Thapa', bookings: 2 }
];

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

// =====================
//   CALENDAR
// =====================
function renderCalendar() {
  const label = document.getElementById('calMonthLabel');
  if (!label) return;
  const MONTHS = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  label.textContent = `${MONTHS[calMonth]} ${calYear}`;

  const container = document.getElementById('calDays');
  container.innerHTML = '';
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const total = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  today.setHours(0,0,0,0);

  for (let i = 0; i < offset; i++) {
    const el = document.createElement('div');
    el.className = 'cal-cell empty';
    container.appendChild(el);
  }
  for (let d = 1; d <= total; d++) {
    const date = new Date(calYear, calMonth, d);
    const el = document.createElement('div');
    el.className = 'cal-cell';
    el.textContent = d;
    if (date.toDateString() === today.toDateString()) el.classList.add('today');
    if (date < today) {
      el.classList.add('past');
    } else {
      if (state.date && state.date.toDateString() === date.toDateString()) el.classList.add('selected');
      el.addEventListener('click', () => selectDate(new Date(calYear, calMonth, d)));
    }
    container.appendChild(el);
  }
}

function selectDate(date) {
  state.date = date;
  state.time = null; // reset time when date changes
  const label = document.getElementById('selectedDateLabel');
  if (label) label.textContent = date.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  renderCalendar();
  renderSlots();
  updateStep1Next();
  updateLiveSummary();
}

// =====================
//   TIME SLOTS
// =====================
function renderSlots() {
  const grid = document.getElementById('slotsGrid');
  if (!grid) return;
  if (!state.date) {
    grid.innerHTML = '<p class="slot-placeholder">← Select a date to see available slots</p>';
    return;
  }
  const isWeekend = [0,6].includes(state.date.getDay());
  const taken = isWeekend ? [...BASE_TAKEN, '11:00–12:00','15:00–16:00','19:00–20:00'] : BASE_TAKEN;
  grid.innerHTML = '';
  SLOTS.forEach(slot => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot-btn';
    if (taken.includes(slot)) {
      btn.classList.add('slot-taken');
      btn.innerHTML = `${slot}<br><small>Full</small>`;
      btn.disabled = true;
    } else {
      btn.textContent = slot;
      if (state.time === slot) btn.classList.add('slot-selected');
      btn.addEventListener('click', () => {
        state.time = slot;
        renderSlots();
        updateStep1Next();
        updateLiveSummary();
      });
    }
    grid.appendChild(btn);
  });
}

function updateStep1Next() {
  const btn = document.getElementById('step1Next');
  if (btn) btn.disabled = !(state.date && state.time);
}

// =====================
//   STEPS NAVIGATION
// =====================
function goToStep(n) {
  // Hide all steps
  document.querySelectorAll('.booking-step').forEach(el => el.classList.add('hidden'));
  // Show target step
  const target = document.getElementById(n === 'success' ? 'stepSuccess' : `step${n}`);
  if (target) target.classList.remove('hidden');
  // Update step nav indicators
  document.querySelectorAll('.bstep').forEach((el, i) => {
    el.classList.remove('active','done');
    const stepNum = parseInt(n);
    if (i + 1 === stepNum) el.classList.add('active');
    else if (i + 1 < stepNum) el.classList.add('done');
  });
  // Scroll form into view
  document.getElementById('bookingStepsWrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =====================
//   LIVE SUMMARY (sidebar)
// =====================
function updateLiveSummary() {
  const wrap = document.getElementById('liveSummary');
  const content = document.getElementById('liveSummaryContent');
  if (!wrap || !content) return;
  const lines = [];
  if (state.date) lines.push(`<div class="ls-row"><span>Date</span><strong>${state.date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</strong></div>`);
  if (state.time) lines.push(`<div class="ls-row"><span>Time</span><strong>${state.time}</strong></div>`);
  if (state.lane) lines.push(`<div class="ls-row"><span>Lane</span><strong>Lane ${state.lane}</strong></div>`);
  if (state.addons.length) lines.push(`<div class="ls-row"><span>Add-ons</span><strong>${state.addons.map(a=>ADDON_NAMES[a]).join(', ')}</strong></div>`);
  const addonTotal = state.addons.reduce((t,a) => t + PRICES[a], 0);
  const total = PRICES.lane + addonTotal;
  if (state.date) lines.push(`<div class="ls-row ls-total"><span>Est. Total</span><strong>NPR ${total}</strong></div>`);
  if (lines.length > 0) {
    content.innerHTML = lines.join('');
    wrap.style.display = '';
  } else {
    wrap.style.display = 'none';
  }
}

// =====================
//   BOOKING SUMMARY (step 4)
// =====================
function buildConfirmSummary() {
  const addonTotal = state.addons.reduce((t,a) => t + PRICES[a], 0);
  const total = PRICES.lane + addonTotal;
  const addonRows = state.addons.map(a =>
    `<div class="summary-row"><span>${ADDON_NAMES[a]}</span><span>NPR ${PRICES[a]}</span></div>`).join('');
  const el = document.getElementById('bookingSummary');
  if (!el) return;
  el.innerHTML = `
    <div class="summary-row"><span>Date</span><span>${state.date?.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span></div>
    <div class="summary-row"><span>Time</span><span>${state.time}</span></div>
    <div class="summary-row"><span>Lane</span><span>Lane ${state.lane}</span></div>
    <div class="summary-row"><span>Players</span><span>${state.players}</span></div>
    ${addonRows}
    <div class="summary-row"><span>Name</span><span>${state.name}</span></div>
    <div class="summary-row"><span>Phone</span><span>${state.phone}</span></div>
    ${state.email ? `<div class="summary-row"><span>Email</span><span>${state.email}</span></div>` : ''}
    <div class="summary-row summary-total"><span>Total (pay at venue)</span><span>NPR ${total}</span></div>
  `;
}

// =====================
//   AUTH
// =====================
function showLoggedInBanner(user) {
  const banner = document.getElementById('loggedInBanner');
  const nameEl = document.getElementById('loggedInName');
  if (banner && nameEl) {
    nameEl.textContent = `Welcome back, ${user.name}! (${user.bookings} past bookings)`;
    banner.classList.remove('hidden');
  }
  // Pre-fill details
  if (user.name) { const el = document.getElementById('bookName'); if(el) el.value = user.name; }
  if (user.phone) { const el = document.getElementById('bookPhone'); if(el) el.value = user.phone; }
  if (user.email) { const el = document.getElementById('bookEmail'); if(el) el.value = user.email; }
  state.name = user.name;
  state.phone = user.phone;
  state.email = user.email || '';
}

function showBookingSteps() {
  document.getElementById('authChoice')?.classList.add('hidden');
  document.getElementById('loginPanel')?.classList.add('hidden');
  document.getElementById('registerPanel')?.classList.add('hidden');
  document.getElementById('bookingStepsWrap')?.classList.remove('hidden');
  renderCalendar();
  renderSlots();
}

// =====================
//   INIT
// =====================
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('authChoice')) return;

  // --- AUTH CHOICE ---
  document.getElementById('authLoginBtn')?.addEventListener('click', () => {
    document.getElementById('authChoice').classList.add('hidden');
    document.getElementById('loginPanel').classList.remove('hidden');
  });

  document.getElementById('authGuestBtn')?.addEventListener('click', () => {
    state.user = null;
    showBookingSteps();
  });

  document.getElementById('continueAsGuest2')?.addEventListener('click', () => {
    state.user = null;
    showBookingSteps();
  });

  document.getElementById('authRegisterLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('authChoice').classList.add('hidden');
    document.getElementById('registerPanel').classList.remove('hidden');
  });

  // --- LOGIN ---
  document.getElementById('doLogin')?.addEventListener('click', () => {
    const id = document.getElementById('loginId')?.value.trim();
    const pass = document.getElementById('loginPass')?.value.trim();
    const user = MOCK_USERS.find(u => (u.phone === id || u.email === id) && u.password === pass);
    if (user) {
      state.user = user;
      showBookingSteps();
      showLoggedInBanner(user);
    } else {
      alert('Invalid credentials. Try: phone 9800000001, password test123');
    }
  });

  document.getElementById('backToChoice')?.addEventListener('click', () => {
    document.getElementById('loginPanel').classList.add('hidden');
    document.getElementById('authChoice').classList.remove('hidden');
  });

  // --- REGISTER ---
  document.getElementById('doRegister')?.addEventListener('click', () => {
    const name = document.getElementById('regName')?.value.trim();
    const phone = document.getElementById('regPhone')?.value.trim();
    const pass = document.getElementById('regPass')?.value.trim();
    if (!name || !phone || !pass) { alert('Please fill in name, phone and password.'); return; }
    const newUser = { name, phone, email: document.getElementById('regEmail')?.value.trim(), password: pass, bookings: 0 };
    MOCK_USERS.push(newUser);
    state.user = newUser;
    showBookingSteps();
    showLoggedInBanner(newUser);
  });

  document.getElementById('backToChoice2')?.addEventListener('click', () => {
    document.getElementById('registerPanel').classList.add('hidden');
    document.getElementById('authChoice').classList.remove('hidden');
  });

  document.getElementById('signOutBtn')?.addEventListener('click', () => {
    state.user = null;
    document.getElementById('loggedInBanner')?.classList.add('hidden');
    document.getElementById('bookingStepsWrap')?.classList.add('hidden');
    document.getElementById('authChoice')?.classList.remove('hidden');
    // clear pre-filled fields
    ['bookName','bookPhone','bookEmail'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  });

  // --- CALENDAR NAV ---
  document.getElementById('calPrev')?.addEventListener('click', () => {
    calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar();
  });
  document.getElementById('calNext')?.addEventListener('click', () => {
    calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar();
  });

  // --- STEP 1 NEXT ---
  document.getElementById('step1Next')?.addEventListener('click', () => {
    if (!state.date || !state.time) return;
    goToStep(2);
  });

  // --- STEP 2 ---
  document.querySelectorAll('.lane-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.lane-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.lane = card.dataset.lane;
      document.getElementById('step2Next').disabled = false;
      updateLiveSummary();
    });
  });

  document.getElementById('playersMinus')?.addEventListener('click', () => {
    if (state.players > 1) { state.players--; document.getElementById('playersCount').textContent = state.players; }
  });
  document.getElementById('playersPlus')?.addEventListener('click', () => {
    if (state.players < 12) { state.players++; document.getElementById('playersCount').textContent = state.players; }
  });

  document.querySelectorAll('.addon-item input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      state.addons = Array.from(document.querySelectorAll('.addon-item input:checked')).map(i => i.value);
      updateLiveSummary();
    });
  });

  document.getElementById('step2Next')?.addEventListener('click', () => {
    if (!state.lane) return;
    goToStep(3);
  });

  document.getElementById('step2Back')?.addEventListener('click', () => goToStep(1));

  // --- STEP 3 ---
  document.getElementById('step3Next')?.addEventListener('click', () => {
    const name = document.getElementById('bookName')?.value.trim();
    const phone = document.getElementById('bookPhone')?.value.trim();
    if (!name) { document.getElementById('bookName')?.focus(); alert('Please enter your name.'); return; }
    if (!phone) { document.getElementById('bookPhone')?.focus(); alert('Please enter your phone number.'); return; }
    state.name = name;
    state.phone = phone;
    state.email = document.getElementById('bookEmail')?.value.trim() || '';
    state.notes = document.getElementById('bookNotes')?.value.trim() || '';
    buildConfirmSummary();
    goToStep(4);
  });

  document.getElementById('step3Back')?.addEventListener('click', () => goToStep(2));

  // --- STEP 4 ---
  document.getElementById('step4Back')?.addEventListener('click', () => goToStep(3));

  document.getElementById('confirmBooking')?.addEventListener('click', () => {
    const ref = 'CS' + Date.now().toString().slice(-6);
    document.getElementById('bookingRef').textContent = ref;
    goToStep('success');
    // Hide step nav on success
    document.querySelector('.booking-steps-nav')?.style.setProperty('display','none');
    document.getElementById('loggedInBanner')?.classList.add('hidden');
    updateLiveSummary(); // clear
  });
});
