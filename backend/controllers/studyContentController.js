const prisma = require('../src/config/database');

function domainData(body) {
  return {
    name: body.name?.trim(),
    description: body.description?.trim() || null,
    display_order: Number(body.displayOrder) || 0,
    is_published: body.isPublished !== false,
  };
}

function moduleData(body) {
  return {
    topic_id: Number(body.topicId),
    title: body.title?.trim(),
    summary: body.summary?.trim() || null,
    content: body.content?.trim() || null,
    estimated_minutes: body.estimatedMinutes ? Number(body.estimatedMinutes) : null,
    display_order: Number(body.displayOrder) || 0,
    is_published: body.isPublished !== false,
  };
}

async function publicStudyGuide(req, res) {
  try {
    const domains = await prisma.studyDomain.findMany({
      where: { is_published: true },
      orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      include: {
        topics: {
          where: { type: 'STUDY', is_published: true },
          orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
          include: { modules: { where: { is_published: true }, orderBy: [{ display_order: 'asc' }, { title: 'asc' }] } },
        },
      },
    });
    return res.json({ domains });
  } catch (error) {
    console.error('Load study guide error:', error);
    return res.status(500).json({ error: 'Unable to load study guide' });
  }
}

async function listDomains(req, res) {
  const domains = await prisma.studyDomain.findMany({ orderBy: [{ display_order: 'asc' }, { name: 'asc' }] });
  return res.json({ domains });
}

async function createDomain(req, res) {
  if (!req.body.name?.trim()) return res.status(400).json({ error: 'Domain name is required' });
  try { return res.status(201).json({ domain: await prisma.studyDomain.create({ data: domainData(req.body) }) }); }
  catch (error) { return res.status(400).json({ error: error.code === 'P2002' ? 'Domain name already exists' : 'Unable to create domain' }); }
}

async function updateDomain(req, res) {
  try { return res.json({ domain: await prisma.studyDomain.update({ where: { id: Number(req.params.id) }, data: domainData(req.body) }) }); }
  catch (error) { return res.status(error.code === 'P2025' ? 404 : 400).json({ error: 'Unable to update domain' }); }
}

async function deleteDomain(req, res) {
  const topicCount = await prisma.category.count({ where: { domain_id: Number(req.params.id) } });
  if (topicCount) return res.status(400).json({ error: 'Move or delete this domain’s topics first' });
  try { await prisma.studyDomain.delete({ where: { id: Number(req.params.id) } }); return res.json({ success: true }); }
  catch { return res.status(404).json({ error: 'Domain not found' }); }
}

async function createModule(req, res) {
  if (!req.body.title?.trim() || !req.body.topicId) return res.status(400).json({ error: 'Topic and module title are required' });
  try { return res.status(201).json({ module: await prisma.studyModule.create({ data: moduleData(req.body) }) }); }
  catch { return res.status(400).json({ error: 'Unable to create module' }); }
}

async function updateModule(req, res) {
  try { return res.json({ module: await prisma.studyModule.update({ where: { id: Number(req.params.id) }, data: moduleData(req.body) }) }); }
  catch (error) { return res.status(error.code === 'P2025' ? 404 : 400).json({ error: 'Unable to update module' }); }
}

async function deleteModule(req, res) {
  try { await prisma.studyModule.delete({ where: { id: Number(req.params.id) } }); return res.json({ success: true }); }
  catch { return res.status(404).json({ error: 'Module not found' }); }
}

module.exports = { publicStudyGuide, listDomains, createDomain, updateDomain, deleteDomain, createModule, updateModule, deleteModule };
