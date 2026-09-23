const dateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const dashboardDate = document.querySelector('#dashboard-date');
const bookedToday = document.querySelector('#booked-today');
const openToday = document.querySelector('#open-today');
const upcomingTotal = document.querySelector('#upcoming-total');
const bookingList = document.querySelector('#booking-list');
const dashboardStatus = document.querySelector('#dashboard-status');
const refreshButton = document.querySelector('#refresh-dashboard');
const loginPanel = document.querySelector('#login-panel');
const bookingPanel = document.querySelector('#booking-panel');
const loginForm = document.querySelector('#login-form');
const loginStatus = document.querySelector('#login-status');

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const parseDate = (value) => new Date(value);

const renderBookings = (bookings, totalDailySlots) => {
  const today = todayKey();
  const bookingsToday = bookings.filter((booking) => {
    const date = parseDate(booking.date);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === today;
  });

  dashboardDate.textContent = dateFormatter.format(new Date());
  bookedToday.textContent = String(bookingsToday.length).padStart(2, '0');
  openToday.textContent = String(Math.max(totalDailySlots - bookingsToday.length, 0)).padStart(2, '0');
  upcomingTotal.textContent = String(bookings.length).padStart(2, '0');
  dashboardStatus.textContent = bookings.length ? `${bookings.length} reservation${bookings.length === 1 ? '' : 's'} found.` : 'No reservations have been made yet.';
  bookingList.replaceChildren();

  if (!bookings.length) {
    bookingList.innerHTML = '<div class="empty-state">New bookings will appear here.</div>';
    return;
  }

  bookings.forEach((booking) => {
    const row = document.createElement('article');
    row.className = 'booking-row';
    const date = parseDate(booking.date);
    row.innerHTML = `<div><strong>${booking.name}</strong><span>${booking.email}</span></div><div><strong>${Number.isNaN(date.valueOf()) ? booking.date : dateFormatter.format(date)}</strong><span>${booking.time}</span></div><div><strong>${booking.service}</strong><span>${booking.phone}</span></div><div><strong>${booking.price === 'Custom' ? 'Custom' : `$${booking.price}`}</strong><span>${booking.notes || 'No notes'}</span></div><button class="cancel-button" type="button">Cancel</button>`;
    row.querySelector('.cancel-button').addEventListener('click', async () => {
      if (!window.confirm(`Cancel ${booking.name}'s appointment?`)) return;
      const params = new URLSearchParams({ date: booking.date, time: booking.time });
      const response = await fetch(`/api/dashboard?${params}`, { method: 'DELETE', headers: { Accept: 'application/json' } });
      if (!response.ok) {
        dashboardStatus.textContent = 'Unable to cancel that appointment.';
        return;
      }
      await loadDashboard();
    });
    bookingList.append(row);
  });
};

const loadDashboard = async () => {
  refreshButton.disabled = true;
  dashboardStatus.textContent = 'Loading reservations...';
  try {
    const response = await fetch('/api/dashboard', { headers: { Accept: 'application/json' } });
    const payload = await response.json();
    if (response.status === 401) {
      loginPanel.hidden = false;
      bookingPanel.hidden = true;
      return;
    }
    if (!response.ok) throw new Error(payload.error || 'Unable to load dashboard');
    loginPanel.hidden = true;
    bookingPanel.hidden = false;
    renderBookings(payload.bookings, payload.totalDailySlots);
  } catch (error) {
    dashboardStatus.textContent = error.message;
    bookingList.innerHTML = '<div class="empty-state">The local dashboard could not load booking data.</div>';
  } finally {
    refreshButton.disabled = false;
  }
};

refreshButton.addEventListener('click', loadDashboard);
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginStatus.textContent = 'Signing in...';
  const response = await fetch('/api/dashboard', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: document.querySelector('#admin-password').value })
  });
  if (!response.ok) {
    loginStatus.textContent = 'Incorrect password.';
    return;
  }
  loginForm.reset();
  await loadDashboard();
});
loadDashboard();
