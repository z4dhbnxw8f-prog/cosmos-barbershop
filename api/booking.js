const requiredFields = ['name', 'email', 'phone', 'service', 'date', 'time'];
const defaultBookingNotificationEmail = 'Okoukoni.cosmas@yahoo.com';

const escapeHtml = (value) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const sendEmail = async (booking) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.BOOKING_FROM_EMAIL,
      to: [process.env.BOOKING_NOTIFICATION_EMAIL || defaultBookingNotificationEmail],
      subject: `New booking request: ${booking.name}`,
      html: `<h2>New Cosmic Styles booking request</h2><p><strong>Name:</strong> ${escapeHtml(booking.name)}</p><p><strong>Email:</strong> ${escapeHtml(booking.email)}</p><p><strong>Phone:</strong> ${escapeHtml(booking.phone)}</p><p><strong>Service:</strong> ${escapeHtml(booking.service)}${booking.price ? ` ($${escapeHtml(booking.price)})` : ''}</p><p><strong>Date:</strong> ${escapeHtml(booking.date)}</p><p><strong>Time:</strong> ${escapeHtml(booking.time)}</p>${booking.notes ? `<p><strong>Notes:</strong> ${escapeHtml(booking.notes)}</p>` : ''}`
    })
  });

  if (!response.ok) throw new Error(`Resend request failed with ${response.status}`);
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const booking = request.body || {};
  const missingFields = requiredFields.filter((field) => !String(booking[field] || '').trim());
  if (missingFields.length) return response.status(400).json({ error: `Missing fields: ${missingFields.join(', ')}` });

  const notificationConfig = ['RESEND_API_KEY', 'BOOKING_FROM_EMAIL'];
  if (notificationConfig.some((key) => !process.env[key])) {
    return response.status(503).json({ error: 'Booking notifications are not configured.' });
  }

  try {
    await sendEmail(booking);
    return response.status(200).json({ delivered: true });
  } catch (error) {
    console.error(error);
    return response.status(502).json({ error: 'Unable to deliver booking notifications.' });
  }
}