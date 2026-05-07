// ===== BOOKING SYSTEM =====
const state = {
  date: null, time: null, lane: null,
  players: 2, addons: [],
  name: '', phone: '', email: '', notes: '',
  step: 1
};

const SLOTS = ['06:00–07:00','07:00–08:00','08:00–09:00','09:00–10:00',
  '10:00–11:00','11:00–12:00','14:00–15:00','15:00–16:00',
  '16:00–17:00','17:00–18:00','18:00–19:00','19:00–20:00','20:00–21:00','21:00–22:00'];
// Simulate some taken slots (weekends busier)
const TAKEN = ['06:00–07:00','10:00–11:00','17:00–18:00','18:00–19:00'];
const PRICES = { lane: 800, bowling: 400, coaching: 600, equipment: 300 };
const ADDON_NAMES = { bowling: 'Bowling Machine', coaching: 'Coaching Session', equipment: 'Equipment Hire' };

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

// ---- Calendar ----
function renderCalendar() {
  const label = document.getElementById('calMonthLabel');
  if (!label) return;
  const months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  label.textContent = `${months[calMonth]} ${calYear}`;

  const days = document.getElementById('calDays');
  days.innerHTML = '';
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  for (let i = 0; i < offset; i++) {
    const el = document.createElement('div');
    el.className = 'cal-cell empty';
    days.appendChild(el);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    el.className = 'cal-cell';
    el.textContent = d;
    const date = new Date(calYear, calMonth, d);
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (isPast) el.classList.add('past');
    if (isToday) el.classList.add('today');
    if (state.date && state.date.toDateString() === date.toDateString()) el.classList.add('selected');
    if (!isPast) {
      el.addEventListener('click', () => {
        state.date = date;
        document.getElementById('selectedDateLabel').textContent =
          `— ${date.toLocaleDateString('en-GB', {weekday:'short',day:'numeric',month:'short'})}`;
        renderCalendar();
        renderSlots();
        document.getElementById('step1Next').disabled = !(state.date && state.time);
      });
    }
    days.appendChild(el);
  }
}

function renderSlots() {
  const grid = document.getElementById('slotsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const isWeekend = state.date && [0,6].includes(state.date.getDay());
  const taken = isWeekend ? [...TAKEN,'11:00–12:00','15:00–16:00'] : TAKEN;
  SLOTS.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'slot-btn';
    btn.textContent = s;
    if (taken.includes(s)) { btn.classList.add('slot-taken'); btn.textContent = s + ' ✗'; }
    else if (state.time === s) btn.classList.add('slot-selected');
    else btn.addEventListener('click', () => {
      state.time = s;
      renderSlots();
      document.getElementById('step1Next').disabled = !(state.date && state.time);
    });
    grid.appendChild(btn);
  });
}

// ---- Navigation ----
function goToStep(n) {
  document.querySelectorAll('.booking-step').forEach(el => el.classList.add('hidden'));
  document.getElementById(`step${n}`).classList.remove('hidden');
  document.querySelectorAll('.bstep').forEach((el, i) => {
    el.classList.remove('active','done');
    if (i + 1 === n) el.classList.add('active');
    else if (i + 1 < n) el.classList.add('done');
  });
  state.step = n;
}

function buildSummary() {
  const addonTotal = state.addons.reduce((t, a) => t + PRICES[a], 0);
  const total = PRICES.lane + addonTotal;
  const addonRows = state.addons.map(a =>
    `<div class="summary-row"><span>${ADDON_NAMES[a]}</span><span>NPR ${PRICES[a]}</span></div>`).join('');
  document.getElementById('bookingSummary').innerHTML = `
    <div class="summary-row"><span>Date</span><span>${state.date?.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span></div>
    <div class="summary-row"><span>Time</span><span>${state.time}</span></div>
    <div class="summary-row"><span>Lane</span><span>Lane ${state.lane}</span></div>
    <div class="summary-row"><span>Players</span><span>${state.players}</span></div>
    ${addonRows}
    <div class="summary-row"><span>Name</span><span>${state.name}</span></div>
    <div class="summary-row"><span>Phone</span><span>${state.phone}</span></div>
    <div class="summary-row"><span>Total (pay at venue)</span><span>NPR ${total}</span></div>
  `;
}

function init() {
  if (!document.getElementById('step1')) return;

  renderCalendar();
  renderSlots();

  document.getElementById('calPrev')?.addEventListener('click', () => {
    calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar();
  });
  document.getElementById('calNext')?.addEventListener('click', () => {
    calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar();
  });

  // Step 1 → 2
  document.getElementById('step1Next')?.addEventListener('click', () => goToStep(2));

  // Lane selection
  document.querySelectorAll('.lane-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.lane-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.lane = card.dataset.lane;
      document.getElementById('step2Next').disabled = false;
    });
  });

  // Players counter
  document.getElementById('playersMinus')?.addEventListener('click', () => {
    if (state.players > 1) { state.players--; document.getElementById('playersCount').textContent = state.players; }
  });
  document.getElementById('playersPlus')?.addEventListener('click', () => {
    if (state.players < 12) { state.players++; document.getElementById('playersCount').textContent = state.players; }
  });

  // Addons
  document.querySelectorAll('.addon-item input').forEach(input => {
    input.addEventListener('change', () => {
      state.addons = Array.from(document.querySelectorAll('.addon-item input:checked')).map(i => i.value);
    });
  });

  document.getElementById('step2Next')?.addEventListener('click', () => goToStep(3));
  document.getElementById('step2Back')?.addEventListener('click', () => goToStep(1));

  // Step 3 validation
  document.getElementById('step3Next')?.addEventListener('click', () => {
    state.name = document.getElementById('bookName')?.value.trim();
    state.phone = document.getElementById('bookPhone')?.value.trim();
    state.email = document.getElementById('bookEmail')?.value.trim();
    state.notes = document.getElementById('bookNotes')?.value.trim();
    if (!state.name || !state.phone) {
      alert('Please fill in your name and phone number.'); return;
    }
    buildSummary();
    goToStep(4);
  });
  document.getElementById('step3Back')?.addEventListener('click', () => goToStep(2));
  document.getElementById('step4Back')?.addEventListener('click', () => goToStep(3));

  // Confirm
  document.getElementById('confirmBooking')?.addEventListener('click', () => {
    const ref = 'CS' + Date.now().toString().slice(-6);
    document.getElementById('bookingRef').textContent = ref;
    document.querySelectorAll('.booking-step').forEach(el => el.classList.add('hidden'));
    document.getElementById('stepSuccess').classList.remove('hidden');
    document.querySelectorAll('.bstep').forEach(el => el.classList.add('done'));
  });
}

document.addEventListener('DOMContentLoaded', init);
