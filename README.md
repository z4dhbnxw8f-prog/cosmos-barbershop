# Cosmic Styles LLC

A static barbershop booking page. Open `index.html` directly in a browser, or run `npm run dev` to serve this folder at `http://localhost:4173`.

Booking requests can be sent by email through Formspree or opened as a pre-filled WhatsApp request.

To activate email requests, create a Formspree form that sends to the shop email, then replace `REPLACE_WITH_YOUR_FORM_ID` in `index.html` with its form ID (for example, `xabcdefg`).

On Vercel, booking requests can also notify the shop by email. Configure these environment variables before deploying:

- `RESEND_API_KEY`
- `BOOKING_FROM_EMAIL`

Booking email notifications default to `Okoukoni.cosmas@yahoo.com`. Set `BOOKING_NOTIFICATION_EMAIL` in Vercel if you want to override it.
