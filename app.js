const form = document.querySelector('#booking-form');
const dateInput = document.querySelector('#date');
const status = document.querySelector('#form-status');
const whatsappNumber = '14436768470';

const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
dateInput.min = today.toISOString().split('T')[0];

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const fullName = document.querySelector('#name').value.trim();
  const name = fullName.split(' ')[0];
  const service = document.querySelector('#service').value.split(' - ')[0];
  const barber = document.querySelector('#barber').value;
  const time = document.querySelector('#time').value;
  const date = new Date(`${dateInput.value}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const message = [
    'New booking request - Cosmic Styles LLC',
    `Name: ${fullName}`,
    `Service: ${service}`,
    `Barber: ${barber}`,
    `Date: ${date}`,
    `Time: ${time}`,
    '',
    'Please confirm this appointment.'
  ].join('\n');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank', 'noopener');
  status.textContent = `Thanks, ${name}. Your ${service.toLowerCase()} request for ${date} is on its way.`;
  form.querySelector('button').textContent = 'Open WhatsApp';
});
