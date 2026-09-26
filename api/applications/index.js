const { sql, getPool, ensureSchema, withSchema } = require('../shared/db');
const { requireRole, actorOf, getClientPrincipal, ROLES } = require('../shared/principal');
const { visibleLevelsFor } = require('../shared/library');
const { validateApplicationInput } = require('../shared/applications');

const toIsoDate = (value) => {
  if (!value) return '';
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
};

const toApplicationResponse = (row) => ({
  id: row.Id,
  title: row.Title,
  description: row.Description || '',
  formUrl: row.FormUrl,
  category: row.Category || 'other',
  visibility: row.Visibility || 'member',
  opensOn: toIsoDate(row.OpensOn),
  closesOn: toIsoDate(row.ClosesOn),
  published: Boolean(row.IsPublished),
  highlightOnHome: Boolean(row.HighlightOnHome),
});

const APPLICATION_COLUMNS =
  'Id, Title, Description, FormUrl, Category, Visibility, OpensOn, ClosesOn, IsPublished, HighlightOnHome';
const INSERTED_COLUMNS = APPLICATION_COLUMNS.split(', ')
  .map((column) => `inserted.${column}`)
  .join(', ');

const listApplications = async (userRoles, includeDrafts, id) =>
  withSchema(async () => {
    const pool = await getPool();
    const levels = visibleLevelsFor(userRoles);
    const request = pool.request().input('includeDrafts', sql.Bit, includeDrafts);
    const params = levels.map((level, index) => {
      request.input(`level${index}`, sql.NVarChar(20), level);
      return `@level${index}`;
    });
    if (id) request.input('id', sql.UniqueIdentifier, id);

    const result = await request.query(`
SELECT ${APPLICATION_COLUMNS}
FROM dbo.Applications
WHERE Visibility IN (${params.join(', ')})
  AND (@includeDrafts = 1 OR IsPublished = 1)
  ${id ? 'AND Id = @id' : ''}
ORDER BY HighlightOnHome DESC, CreatedAt DESC
`);
    return (result.recordset || []).map(toApplicationResponse);
  });

const bindApplication = (request, value, actor) =>
  request
    .input('title', sql.NVarChar(200), value.title)
    .input('description', sql.NVarChar(500), value.description)
    .input('formUrl', sql.NVarChar(500), value.formUrl)
    .input('category', sql.NVarChar(40), value.category)
    .input('visibility', sql.NVarChar(20), value.visibility)
    .input('opensOn', sql.Date, value.opensOn)
    .input('closesOn', sql.Date, value.closesOn)
    .input('published', sql.Bit, value.published)
    .input('highlightOnHome', sql.Bit, value.highlightOnHome)
    .input('actor', sql.NVarChar(256), actor);

module.exports = async function (context, req) {
  try {
    if (req.method === 'GET') {
      const principal = getClientPrincipal(req);
      const roles = principal ? principal.userRoles : [];
      const includeDrafts = roles.includes(ROLES.EDITOR);
      const id = String((req.query && req.query.id) || '').trim();
      context.res = {
        status: 200,
        body: { applications: await listApplications(roles, includeDrafts, id) },
      };
      return;
    }

    const auth = requireRole(req, ROLES.EDITOR);
    if (auth.error) {
      context.res = { status: auth.error.status, body: auth.error.body };
      return;
    }
    const actor = actorOf(auth.principal);
    await ensureSchema();
    const pool = await getPool();

    if (req.method === 'POST') {
      const parsed = validateApplicationInput(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error } };
        return;
      }
      const inserted = await bindApplication(pool.request(), parsed.value, actor).query(`
INSERT INTO dbo.Applications
  (Title, Description, FormUrl, Category, Visibility, OpensOn, ClosesOn, IsPublished, HighlightOnHome, CreatedBy, UpdatedBy)
OUTPUT ${INSERTED_COLUMNS}
VALUES (@title, @description, @formUrl, @category, @visibility, @opensOn, @closesOn, @published, @highlightOnHome, @actor, @actor);
`);
      context.res = { status: 201, body: { application: toApplicationResponse(inserted.recordset[0]) } };
      return;
    }

    if (req.method === 'PUT') {
      const id = String((req.body && req.body.id) || '').trim();
      if (!id) {
        context.res = { status: 400, body: { error: 'Application id is required.' } };
        return;
      }
      const parsed = validateApplicationInput(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error } };
        return;
      }
      const updated = await bindApplication(pool.request(), parsed.value, actor)
        .input('id', sql.UniqueIdentifier, id)
        .query(`
UPDATE dbo.Applications
SET Title = @title, Description = @description, FormUrl = @formUrl, Category = @category,
    Visibility = @visibility, OpensOn = @opensOn, ClosesOn = @closesOn, IsPublished = @published,
    HighlightOnHome = @highlightOnHome, UpdatedBy = @actor, UpdatedAt = SYSUTCDATETIME()
OUTPUT ${INSERTED_COLUMNS}
WHERE Id = @id;
`);
      if (!updated.recordset.length) {
        context.res = { status: 404, body: { error: 'Application not found.' } };
        return;
      }
      context.res = { status: 200, body: { application: toApplicationResponse(updated.recordset[0]) } };
      return;
    }

    if (req.method === 'DELETE') {
      const id = String((req.query && req.query.id) || '').trim();
      if (!id) {
        context.res = { status: 400, body: { error: 'Application id is required.' } };
        return;
      }
      await pool.request().input('id', sql.UniqueIdentifier, id).query('DELETE FROM dbo.Applications WHERE Id = @id');
      context.res = { status: 204 };
      return;
    }

    context.res = { status: 405, body: { error: 'Method not allowed.' } };
  } catch (error) {
    context.log.error('applications error:', (error && error.message) || error);
    context.res = {
      status: 500,
      body: {
        error: 'Unable to process applications.',
        detail: String((error && error.message) || error).slice(0, 220),
      },
    };
  }
};
