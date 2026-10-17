const { EmailClient } = require('@azure/communication-email');
const { guardPublicSection } = require('../shared/sectionAvailability');

const getEnv = (name) => process.env[name] || '';
const createEmailClient = (connectionString) => new EmailClient(connectionString);

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

const TOPICS = {
  general: null,
  community: { tag: '[목장 연결]', label: 'Find a community (목장 연결)' },
  prayer: { tag: '[기도 요청]', label: 'Prayer request (기도 요청)' },
};

const SHARES = {
  staff: 'Pastoral staff only (교역자만 보기)',
  team: 'OK to share with the prayer team (중보기도팀 공유 가능)',
};

const known = (table, value, fallback) =>
  Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;

const buildContactEmail = ({ name, email, phone, message, topic, share }) => {
  const topicId = known(TOPICS, typeof topic === 'string' ? topic : '', 'general');
  const details = TOPICS[topicId];
  const subject = details ? `${details.tag} ${name}` : `Contact form: ${name}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    details ? `Topic: ${details.label}` : null,
    topicId === 'prayer' ? `Sharing: ${SHARES[known(SHARES, typeof share === 'string' ? share : '', 'staff')]}` : null,
    '',
    message,
  ]
    .filter((line) => line !== null)
    .join('\n');
  return { subject, text };
};

const defaultDeps = { guardPublicSection, createEmailClient };

module.exports = async function (context, req, overrides = {}) {
  const deps = { ...defaultDeps, ...overrides };
  if (req.method && req.method.toUpperCase() !== 'POST') {
    context.res = { status: 405, body: { error: 'Method not allowed.' } };
    return;
  }

  try {
    const unavailable = await deps.guardPublicSection(req, 'contact', {
      allowManagement: false,
      logger: context.log,
    });
    if (unavailable) {
      context.res = unavailable;
      return;
    }
  } catch (error) {
    context.log.error('contact availability error:', (error && error.message) || error);
    context.res = { status: 500, body: { error: 'Unable to process contact request.' } };
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

  const { subject, text } = buildContactEmail({
    name,
    email,
    phone,
    message,
    topic: body.topic,
    share: body.share,
  });

  try {
    const client = deps.createEmailClient(connectionString);
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

module.exports.buildContactEmail = buildContactEmail;
