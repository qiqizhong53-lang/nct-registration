const db = require('../_db');

const ALLOWED_CAMPUSES = ['chencunnct', 'beijiaonct'];
const CAMPUS_NAMES = { chencunnct: '陈村校区', beijiaonct: '北滘校区' };

module.exports = async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const campus = req.query.campus;
  if (!ALLOWED_CAMPUSES.includes(campus)) {
    return res.status(404).json({ ok: false, msg: '校区不存在' });
  }

  const pathParts = (req.query.path || []);
  const route = pathParts[0] || '';

  // 路由分发
  if (route === 'register' && req.method === 'POST') {
    return handleRegister(req, res, campus);
  }
  if (route === 'registrations' && req.method === 'GET') {
    return handleGetRegistrations(req, res, campus);
  }
  if (route === 'stats' && req.method === 'GET') {
    return handleGetStats(req, res, campus);
  }
  if (route === 'registrations' && req.method === 'DELETE') {
    return handleDeleteRegistration(req, res, campus);
  }

  return res.status(404).json({ ok: false, msg: '接口不存在' });
};

// 报名
async function handleRegister(req, res, campus) {
  const { name, period, teacher } = req.body || {};

  if (!name || !period || !teacher) {
    return res.json({ ok: false, msg: '请填写完整信息' });
  }

  try {
    const registrations = await db.getRegistrations(campus);
    const id = await db.getNextId(campus);
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
      .replace(/\//g, '-');

    registrations.unshift({
      id,
      name: name.trim(),
      period,
      teacher,
      createdAt: now
    });

    await db.saveRegistrations(campus, registrations);
    console.log('[报名·' + CAMPUS_NAMES[campus] + '] ' + name + ' - ' + period + ' - ' + teacher);
    return res.json({ ok: true, msg: '报名成功' });
  } catch (err) {
    console.error('[报名错误]', err);
    return res.json({ ok: false, msg: '服务器错误，请稍后再试' });
  }
}

// 获取报名列表
async function handleGetRegistrations(req, res, campus) {
  const password = req.query.password || req.headers['x-admin-password'];
  if (!db.verifyPassword(password)) {
    return res.status(401).json({ ok: false, msg: '密码错误' });
  }

  try {
    const registrations = await db.getRegistrations(campus);
    return res.json({ ok: true, data: registrations });
  } catch (err) {
    console.error('[查询错误]', err);
    return res.status(500).json({ ok: false, msg: '服务器错误' });
  }
}

// 获取统计
async function handleGetStats(req, res, campus) {
  const password = req.query.password || req.headers['x-admin-password'];
  if (!db.verifyPassword(password)) {
    return res.status(401).json({ ok: false, msg: '密码错误' });
  }

  try {
    const registrations = await db.getRegistrations(campus);
    const periodStats = {};
    const teacherStats = {};

    registrations.forEach(function(r) {
      periodStats[r.period] = (periodStats[r.period] || 0) + 1;
      teacherStats[r.teacher] = (teacherStats[r.teacher] || 0) + 1;
    });

    return res.json({
      ok: true,
      data: {
        total: registrations.length,
        byPeriod: periodStats,
        byTeacher: teacherStats
      }
    });
  } catch (err) {
    console.error('[统计错误]', err);
    return res.status(500).json({ ok: false, msg: '服务器错误' });
  }
}

// 删除报名
async function handleDeleteRegistration(req, res, campus) {
  const password = req.query.password || req.headers['x-admin-password'];
  if (!db.verifyPassword(password)) {
    return res.status(401).json({ ok: false, msg: '密码错误' });
  }

  const idStr = req.query.path ? req.query.path[1] : null;
  if (!idStr) {
    return res.status(400).json({ ok: false, msg: '缺少 ID' });
  }

  try {
    const registrations = await db.getRegistrations(campus);
    const id = parseInt(idStr);
    const filtered = registrations.filter(function(r) { return r.id !== id; });
    await db.saveRegistrations(campus, filtered);
    return res.json({ ok: true, msg: '删除成功' });
  } catch (err) {
    console.error('[删除错误]', err);
    return res.status(500).json({ ok: false, msg: '服务器错误' });
  }
}
