const test = require('node:test');
const assert = require('node:assert');
const handler = require('./index');
const { sectionUnavailableResponse } = require('../shared/sectionAvailability');
const { buildContactEmail } = handler;

const base = { name: 'Kim', email: 'kim@example.com', phone: '', message: 'Hello' };

const encode = (roles) =>
  Buffer.from(
    JSON.stringify({
      userId: 'u1',
      userDetails: 'person@church.org',
      userRoles: roles,
    }),
    'utf8'
  ).toString('base64');

const contextOf = () => ({
  res: null,
  log: {
    warn: () => {},
    error: () => {},
  },
});

const trackedPost = (roles, onBodyRead) => {
  const req = {
    method: 'POST',
    headers: roles ? { 'x-ms-client-principal': encode(roles) } : {},
  };
  Object.defineProperty(req, 'body', {
    get() {
      onBodyRead();
      return base;
    },
  });
  return req;
};

test('a general message keeps the original subject and no topic line', () => {
  const { subject, text } = buildContactEmail({ ...base, topic: 'general' });
  assert.strictEqual(subject, 'Contact form: Kim');
  assert.strictEqual(text, 'Name: Kim\nEmail: kim@example.com\n\nHello');
});

test('a community request is tagged for small-group follow-up', () => {
  const { subject, text } = buildContactEmail({ ...base, topic: 'community', share: 'team' });
  assert.strictEqual(subject, '[목장 연결] Kim');
  assert.ok(text.includes('Topic: Find a community (목장 연결)'));
  assert.ok(!text.includes('Sharing:'));
});

test('a prayer request is tagged and defaults to pastoral staff only', () => {
  const { subject, text } = buildContactEmail({ ...base, phone: '0400 000 000', topic: 'prayer' });
  assert.strictEqual(subject, '[기도 요청] Kim');
  assert.strictEqual(
    text,
    [
      'Name: Kim',
      'Email: kim@example.com',
      'Phone: 0400 000 000',
      'Topic: Prayer request (기도 요청)',
      'Sharing: Pastoral staff only (교역자만 보기)',
      '',
      'Hello',
    ].join('\n')
  );
});

test('a prayer request can allow the prayer team', () => {
  const { text } = buildContactEmail({ ...base, topic: 'prayer', share: 'team' });
  assert.ok(text.includes('Sharing: OK to share with the prayer team (중보기도팀 공유 가능)'));
});

test('unknown topic and share values fall back to the defaults', () => {
  assert.strictEqual(buildContactEmail({ ...base, topic: 'spam' }).subject, 'Contact form: Kim');
  assert.strictEqual(buildContactEmail({ ...base, topic: '__proto__' }).subject, 'Contact form: Kim');
  assert.strictEqual(buildContactEmail({ ...base, topic: ['prayer'] }).subject, 'Contact form: Kim');
  assert.strictEqual(buildContactEmail({ ...base }).subject, 'Contact form: Kim');
  assert.ok(
    buildContactEmail({ ...base, topic: 'prayer', share: 'everyone' }).text.includes(
      'Sharing: Pastoral staff only (교역자만 보기)'
    )
  );
});

test('the handler is still the default export', () => {
  assert.strictEqual(typeof handler, 'function');
});

test('a disabled contact section blocks anonymous and admin posts before parsing or sending', async () => {
  const unavailable = sectionUnavailableResponse();

  for (const roles of [null, ['admin']]) {
    let bodyReads = 0;
    let clientCreations = 0;
    const guardCalls = [];
    const context = contextOf();
    await handler(context, trackedPost(roles, () => {
      bodyReads += 1;
    }), {
      guardPublicSection: async (req, section, options) => {
        guardCalls.push({ req, section, options });
        return unavailable;
      },
      createEmailClient: () => {
        clientCreations += 1;
        throw new Error('email client must not be created');
      },
    });

    assert.deepStrictEqual(context.res, unavailable);
    assert.strictEqual(guardCalls.length, 1);
    assert.strictEqual(guardCalls[0].section, 'contact');
    assert.strictEqual(guardCalls[0].options.allowManagement, false);
    assert.strictEqual(guardCalls[0].options.logger, context.log);
    assert.strictEqual(bodyReads, 0);
    assert.strictEqual(clientCreations, 0);
  }
});

test('a contact availability lookup failure returns 500 before parsing or sending', async () => {
  let bodyReads = 0;
  let guardCalls = 0;
  let clientCreations = 0;
  const context = contextOf();
  await handler(context, trackedPost(null, () => {
    bodyReads += 1;
  }), {
    guardPublicSection: async () => {
      guardCalls += 1;
      throw new Error('settings unavailable');
    },
    createEmailClient: () => {
      clientCreations += 1;
      throw new Error('email client must not be created');
    },
  });

  assert.strictEqual(context.res.status, 500);
  assert.strictEqual(guardCalls, 1);
  assert.strictEqual(bodyReads, 0);
  assert.strictEqual(clientCreations, 0);
});

test('a non-POST response remains 405 without checking availability', async () => {
  let guardCalls = 0;
  const context = contextOf();
  await handler(context, { method: 'GET', headers: {} }, {
    guardPublicSection: async () => {
      guardCalls += 1;
      return null;
    },
  });
  assert.deepStrictEqual(context.res, {
    status: 405,
    body: { error: 'Method not allowed.' },
  });
  assert.strictEqual(guardCalls, 0);
});

test('an enabled valid contact post uses the injected email client', async () => {
  const previous = {
    connectionString: process.env.ACS_CONNECTION_STRING,
    from: process.env.CONTACT_FROM,
    to: process.env.CONTACT_TO,
  };
  process.env.ACS_CONNECTION_STRING = 'not-a-real-connection-string';
  process.env.CONTACT_FROM = 'church@example.com';
  process.env.CONTACT_TO = 'office@example.com';

  const sent = [];
  const guardOptions = [];
  const context = contextOf();
  try {
    await handler(context, { method: 'POST', headers: {}, body: base }, {
      guardPublicSection: async (req, section, options) => {
        assert.strictEqual(section, 'contact');
        guardOptions.push(options);
        return null;
      },
      createEmailClient: (connectionString) => {
        assert.strictEqual(connectionString, 'not-a-real-connection-string');
        return {
          beginSend: async (message) => {
            sent.push(message);
            return {
              pollUntilDone: async () => ({ status: 'Succeeded' }),
            };
          },
        };
      },
    });
  } finally {
    for (const [key, value] of [
      ['ACS_CONNECTION_STRING', previous.connectionString],
      ['CONTACT_FROM', previous.from],
      ['CONTACT_TO', previous.to],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  assert.strictEqual(context.res.status, 202);
  assert.strictEqual(guardOptions.length, 1);
  assert.strictEqual(guardOptions[0].allowManagement, false);
  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].content.subject, 'Contact form: Kim');
});
