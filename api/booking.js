const requiredFields = ['name', 'email', 'phone', 'service', 'date', 'time'];
const bookingFormEndpoint = process.env.BOOKING_FORM_ENDPOINT || 'https://formsubmit.co/ajax/Okoukoni.cosmas@yahoo.com';
const reservationTtlSeconds = 60 * 60 * 24 * 90;

const escapeHtml = (value) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const redisCommand = async (command) => {
  const response = await fetch(process.env.KV_REST_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) throw new Error(`Redis request failed with ${response.status}`);
  return response.json();
};

const sendEmail = async (booking) => {
  const response = await fetch(bookingFormEndpoint, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      service: booking.service,
      service_description: booking.serviceDescription,
      price: booking.price,
      date: booking.date,
      time: booking.time,
      notes: booking.notes,
      _replyto: booking.email,
      _subject: `New booking request: ${booking.name}`
    })
  });

  if (!response.ok) throw new Error(`Booking email request failed with ${response.status}`);
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const booking = request.body || {};
  const missingFields = requiredFields.filter((field) => !String(booking[field] || '').trim());
  if (missingFields.length) return response.status(400).json({ error: `Missing fields: ${missingFields.join(', ')}` });

  const notificationConfig = ['KV_REST_API_URL', 'KV_REST_API_TOKEN'];
  if (notificationConfig.some((key) => !process.env[key])) {
    return response.status(503).json({ error: 'Booking notifications are not configured.' });
  }

  const reservationKey = `booking:${booking.date}:${booking.time}`.replaceAll(/[^a-zA-Z0-9:_-]/g, '_');

  try {
    const reservation = await redisCommand(['SET', reservationKey, JSON.stringify(booking), 'NX', 'EX', String(reservationTtlSeconds)]);
    if (reservation.result !== 'OK') {
      return response.status(409).json({ error: 'That appointment is already reserved.' });
    }

    if (booking.reserveOnly) {
      return response.status(200).json({ reserved: true });
    }

    await sendEmail(booking);
    return response.status(200).json({ delivered: true });
  } catch (error) {
    try {
      await redisCommand(['DEL', reservationKey]);
    } catch (cleanupError) {
      console.error(cleanupError);
    }
    console.error(error);
    return response.status(502).json({ error: 'Unable to deliver booking notifications.' });
  }
}