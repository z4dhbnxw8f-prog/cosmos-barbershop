import crypto from 'node:crypto';

const totalDailySlots = 19;
const sessionCookieName = 'cosmic_admin_session';
const adminPassword = process.env.ADMIN_PASSWORD || '12345';

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

const readBookings = async () => {
  let cursor = '0';
  const keys = [];

  do {
    const scan = await redisCommand(['SCAN', cursor, 'MATCH', 'booking:*', 'COUNT', '100']);
    [cursor] = scan.result;
    keys.push(...scan.result[1]);
  } while (cursor !== '0');

  if (!keys.length) return [];
  const values = await redisCommand(['MGET', ...keys]);
  return values.result.filter(Boolean).map((value) => JSON.parse(value));
};

const sessionToken = () => crypto.createHmac('sha256', adminPassword).update('cosmic-admin-session').digest('hex');

const hasAdminSession = (request) => request.headers.cookie?.split(';').some((cookie) => cookie.trim() === `${sessionCookieName}=${sessionToken()}`);

const requireAdmin = (request, response) => {
  if (!hasAdminSession(request)) {
    response.status(401).json({ error: 'Admin login required.' });
    return false;
  }
  return true;
};

export default async function handler(request, response) {
  if (process.env.VERCEL_ENV === 'production') {
    return response.status(403).json({ error: 'Dashboard prototype is local-only.' });
  }

  if (request.method === 'POST') {
    if (request.body?.password !== adminPassword) return response.status(401).json({ error: 'Incorrect password.' });
    response.setHeader('Set-Cookie', `${sessionCookieName}=${sessionToken()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600`);
    return response.status(200).json({ authenticated: true });
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return response.status(503).json({ error: 'Redis storage is not configured.' });
  }

  try {
    if (!requireAdmin(request, response)) return;
    if (request.method === 'DELETE') {
      const url = new URL(request.url, 'http://localhost');
      const date = url.searchParams.get('date');
      const time = url.searchParams.get('time');
      if (!date || !time) return response.status(400).json({ error: 'Date and time are required.' });
      const reservationKey = `booking:${date}:${time}`.replaceAll(/[^a-zA-Z0-9:_-]/g, '_');
      await redisCommand(['DEL', reservationKey]);
      return response.status(200).json({ canceled: true });
    }

    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET, DELETE');
      return response.status(405).json({ error: 'Method not allowed' });
    }

    const bookings = await readBookings();
    bookings.sort((first, second) => new Date(`${first.date} ${first.time}`) - new Date(`${second.date} ${second.time}`));
    return response.status(200).json({ bookings, totalDailySlots });
  } catch (error) {
    console.error(error);
    return response.status(502).json({ error: 'Unable to read booking data.' });
  }
}
