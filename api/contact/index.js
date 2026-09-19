const { EmailClient } = require('@azure/communication-email');

const getEnv = (name) => process.env[name] || '';

const parseBody = (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.rawBody) {
    try {
      return JSON.parse(req.rawBody);
    } catch (error) {
      return null;
    }
  }
  return null;
};

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value || '');

const limit = (value, max) => value.slice(0, max);

module.exports = async function (context, req) {
  if (req.method && req.method.toUpperCase() !== 'POST') {
    context.res = { status: 405, body: { error: 'Method not allowed.' } };
    return;
  }

  const body = parseBody(req) || {};
  const name = limit((body.name || '').toString().trim(), 200);
  const email = limit((body.email || '').toString().trim(), 320);
  const phone = limit((body.phone || '').toString().trim(), 80);
  const message = limit((body.message || '').toString().trim(), 8000);

  if (!name || !email || !message || !isValidEmail(email)) {
    context.res = { status: 400, body: { error: 'Invalid form submission.' } };
    return;
  }

  const connectionString = getEnv('ACS_CONNECTION_STRING');
  const toEmail = getEnv('CONTACT_TO') || 'info@sydneysamil.org';
  const fromEmail = getEnv('CONTACT_FROM');

  if (!connectionString || !fromEmail) {
    context.res = {
      status: 500,
      body: { error: 'Email service is not configured.' },
    };
    return;
  }

  const subject = `Contact form: ${name}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    '',
    message,
  ]
    .filter((line) => line !== null)
    .join('\n');

  try {
    const client = new EmailClient(connectionString);
    const poller = await client.beginSend({
      senderAddress: fromEmail,
      replyTo: [{ address: email, displayName: name }],
      recipients: {
        to: [{ address: toEmail }],
      },
      content: {
        subject,
        plainText: text,
      },
    });
    const result = await poller.pollUntilDone();
    const status = (result && result.status) || '';

    if (status && status !== 'Succeeded') {
      context.log.warn(`ACS email send finished with status ${status}`);
      context.res = { status: 502, body: { error: 'Email provider rejected request.' } };
      return;
    }

    context.res = { status: 202, body: { ok: true } };
  } catch (error) {
    context.log.error('ACS email send failed', error);
    context.res = { status: 500, body: { error: 'Unable to reach email provider.' } };
  }
};
