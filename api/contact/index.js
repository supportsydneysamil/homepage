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

module.exports = async function (context, req) {
  if (req.method && req.method.toUpperCase() !== 'POST') {
    context.res = { status: 405, body: { error: 'Method not allowed.' } };
    return;
  }

  const body = parseBody(req) || {};
  const name = (body.name || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const message = (body.message || '').toString().trim();

  if (!name || !email || !message || !isValidEmail(email)) {
    context.res = { status: 400, body: { error: 'Invalid form submission.' } };
    return;
  }

  const apiKey = getEnv('SENDGRID_API_KEY');
  const toEmail = getEnv('CONTACT_TO') || 'support@sydneysamil.org';
  const fromEmail = getEnv('CONTACT_FROM');
  const fromName = getEnv('CONTACT_FROM_NAME') || 'Sydney Samil Church';

  if (!apiKey || !fromEmail) {
    context.res = {
      status: 500,
      body: { error: 'Email service is not configured.' },
    };
    return;
  }

  const subject = `Contact form: ${name}`;
  const text = `Name: ${name}\nEmail: ${email}\n\n${message}`;

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: toEmail }],
            subject,
          },
        ],
        from: { email: fromEmail, name: fromName },
        reply_to: { email, name },
        content: [{ type: 'text/plain', value: text }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      context.res = { status: 502, body: { error: 'Email provider rejected request.', detail: detail.slice(0, 200) } };
      return;
    }

    context.res = { status: 202, body: { ok: true } };
  } catch (error) {
    context.res = { status: 500, body: { error: 'Unable to reach email provider.' } };
  }
};
