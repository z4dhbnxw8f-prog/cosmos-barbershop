# Cosmic Styles LLC

A static barbershop website. Run `npm run dev` to serve it locally.

- **Request by email** opens the customer’s configured email app with a message addressed to `Okoukoni.cosmas@yahoo.com`.
- **Request on WhatsApp** opens a prefilled message to `14436768470`.

Both messages contain the selected service, price, custom service details, date, time in Eastern Time, name, email, phone, and any notes. Customers must press Send. The shop confirms appointments manually; opening a message does not reserve a time or save a booking to the dashboard.

No email service activation or API key is required. The browser or operating system controls the email-app prompt; an email handler must be configured. The public form does not call the existing server booking endpoint.
