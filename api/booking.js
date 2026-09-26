import nodemailer from 'nodemailer';

const requiredFields = ['name', 'email', 'phone', 'service', 'date', 'time'];
const reservationTtlSeconds = 60 * 60 * 24 * 90;
const hasRedisConfig = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const escapeHtml = (value) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const redisCommand = async (command) => {
  if (!hasRedisConfig) return null;

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

const buildBookingText = (booking) => {
  const fields = {
    Name: booking.name,
    Email: booking.email,
    Phone: booking.phone,
    Service: booking.service,
    'Service details': booking.serviceDescription || booking.service_description,
    Price: booking.price,
    Date: booking.date,
    Time: booking.time,
    Notes: booking.notes
  };

  return Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');
};

const sendEmailWithGmail = async (booking) => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailAppPassword) {
    throw new Error('Gmail SMTP is not configured.');
  }

  const recipient = process.env.BOOKING_NOTIFICATION_EMAIL || 'Okoukoni.cosmas@yahoo.com';
  const fromAddress = process.env.BOOKING_FROM_EMAIL || gmailUser;
  const text = buildBookingText(booking);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword
    }
  });

  await transporter.sendMail({
    from: `Cosmic Styles <${fromAddress}>`,
    to: recipient,
    replyTo: booking.email,
    subject: `New booking request: ${booking.name}`,
    text,
    html: `<h2>New booking request</h2><pre>${escapeHtml(text)}</pre>`
  });
};

const sendEmailWithResend = async (booking) => {
  const recipient = process.env.BOOKING_NOTIFICATION_EMAIL || 'Okoukoni.cosmas@yahoo.com';
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.BOOKING_FROM_EMAIL;

  if (!resendApiKey || !fromAddress) {
    throw new Error('Resend is not configured.');
  }

  const text = buildBookingText(booking);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [recipient],
      reply_to: booking.email,
      subject: `New booking request: ${booking.name}`,
      text,
      html: `<h2>New booking request</h2><pre>${escapeHtml(text)}</pre>`
    })
  });

  const result = await response.json();
  if (!response.ok || !result.id) {
    throw new Error(`Booking email request failed with ${response.status} (${result.name || 'invalid_response'})`);
  }
};

const sendEmail = async (booking) => {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    await sendEmailWithGmail(booking);
    return;
  }

  if (process.env.RESEND_API_KEY && process.env.BOOKING_FROM_EMAIL) {
    await sendEmailWithResend(booking);
    return;
  }

  throw new Error('No email service is configured. Add Gmail SMTP or Resend env vars.');
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const booking = request.body || {};
  const missingFields = requiredFields.filter((field) => !String(booking[field] || '').trim());
  if (missingFields.length) return response.status(400).json({ error: `Missing fields: ${missingFields.join(', ')}` });

  if (!booking.reserveOnly && !(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) && !(process.env.RESEND_API_KEY && process.env.BOOKING_FROM_EMAIL)) {
    return response.status(503).json({ error: 'Booking email is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD or Resend env vars.' });
  }

  let reserved = false;
  const reservationKey = `booking:${booking.date}:${booking.time}`.replaceAll(/[^a-zA-Z0-9:_-]/g, '_');

  try {
    if (hasRedisConfig) {
      const reservation = await redisCommand(['SET', reservationKey, JSON.stringify(booking), 'NX', 'EX', String(reservationTtlSeconds)]);
      if (reservation?.result !== 'OK') {
        return response.status(409).json({ error: 'That appointment is already reserved.' });
      }
      reserved = true;
    }

    if (booking.reserveOnly) {
      return response.status(200).json({ reserved: true });
    }

    await sendEmail(booking);
    return response.status(200).json({ delivered: true });
  } catch (error) {
    try {
      if (reserved && hasRedisConfig) await redisCommand(['DEL', reservationKey]);
    } catch (cleanupError) {
      console.error(cleanupError);
    }
    console.error(error);
    return response.status(502).json({ error: 'Unable to deliver booking notifications.' });
  }
}
