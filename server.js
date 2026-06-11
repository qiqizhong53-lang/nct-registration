const express = require('express');
const path = require('path');
const { createCampusDB } = require('./db');

const app = express();
const PORT = 3000;

// 中间件
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ============ 为每个校区创建独立路由 ============

function setupCampus(routePrefix, campusName, dirName) {
  const router = express.Router();
  const campusDB = createCampusDB(dirName);

  // 静态文件
  router.use(express.static(path.join(__dirname, 'public', dirName)));

  // 报名接口
  router.post('/api/register', (req, res) => {
    const { name, period, teacher } = req.body;

    if (!name || !period || !teacher) {
      return res.json({ ok: false, msg: '请填写完整信息' });
    }

    try {
      campusDB.insertRegistration(name.trim(), period, teacher);
      console.log(`[报名·${campusName}] ${name} - ${period} - ${teacher}`);
      res.json({ ok: true, msg: '报名成功' });
    } catch (err) {
      console.error(`[报名错误·${campusName}]`, err);
      res.json({ ok: false, msg: '服务器错误，请稍后再试' });
    }
  });

  // 获取报名列表（需密码）
  router.get('/api/registrations', (req, res) => {
    const password = req.query.password || req.headers['x-admin-password'];
    if (!campusDB.verifyPassword(password)) {
      return res.status(401).json({ ok: false, msg: '密码错误' });
    }

    try {
      const registrations = campusDB.getAllRegistrations();
      res.json({ ok: true, data: registrations });
    } catch (err) {
      console.error(`[查询错误·${campusName}]`, err);
      res.status(500).json({ ok: false, msg: '服务器错误' });
    }
  });

  // 获取统计（需密码）
  router.get('/api/stats', (req, res) => {
    const password = req.query.password || req.headers['x-admin-password'];
    if (!campusDB.verifyPassword(password)) {
      return res.status(401).json({ ok: false, msg: '密码错误' });
    }

    try {
      const stats = campusDB.getStats();
      res.json({ ok: true, data: stats });
    } catch (err) {
      console.error(`[统计错误·${campusName}]`, err);
      res.status(500).json({ ok: false, msg: '服务器错误' });
    }
  });

  // 删除报名记录（需密码）
  router.delete('/api/registrations/:id', (req, res) => {
    const password = req.query.password || req.headers['x-admin-password'];
    if (!campusDB.verifyPassword(password)) {
      return res.status(401).json({ ok: false, msg: '密码错误' });
    }

    try {
      campusDB.deleteRegistration(parseInt(req.params.id));
      res.json({ ok: true, msg: '删除成功' });
    } catch (err) {
      console.error(`[删除错误·${campusName}]`, err);
      res.status(500).json({ ok: false, msg: '服务器错误' });
    }
  });

  app.use(routePrefix, router);
  return campusDB;
}

// ============ 注册校区 ============

const chencunDB = setupCampus('/chencunnct', '陈村校区', 'chencunnct');
const beijiaoDB = setupCampus('/beijiaonct', '北滘校区', 'beijiaonct');

// 根路径跳转提示
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>校区选择</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
             background:#F5F7FA; display:flex; justify-content:center; align-items:center;
             min-height:100vh; }
      .card { background:#fff; border-radius:20px; padding:48px 40px; box-shadow:0 4px 24px rgba(0,0,0,0.08);
              text-align:center; max-width:420px; width:90%; }
      h1 { font-size:22px; color:#1A1A2E; margin-bottom:8px; }
      p { color:#666; font-size:14px; margin-bottom:28px; }
      .links { display:flex; flex-direction:column; gap:14px; }
      a { display:block; padding:16px 24px; border-radius:14px; text-decoration:none;
          font-size:16px; font-weight:700; color:#fff; transition:transform 0.2s; }
      a:hover { transform:translateY(-2px); }
      .chencun { background:linear-gradient(135deg,#FF6B35,#FFB347); }
      .beijiao { background:linear-gradient(135deg,#4A6CF7,#6B8CFF); }
    </style></head>
    <body><div class="card">
      <h1>🏫 选择校区</h1>
      <p>请选择您所在的校区</p>
      <div class="links">
        <a class="chencun" href="/chencunnct/">陈村校区</a>
        <a class="beijiao" href="/beijiaonct/">北滘校区</a>
      </div>
    </div></body></html>
  `);
});

// ============ 启动服务器 ============

async function start() {
  await chencunDB.init();
  await beijiaoDB.init();
  app.listen(PORT, () => {
    console.log('\n🚀 服务器已启动: http://localhost:' + PORT);
    console.log('🏫 陈村校区: http://localhost:' + PORT + '/chencunnct/');
    console.log('🏫 北滘校区: http://localhost:' + PORT + '/beijiaonct/');
    console.log('🔑 管理员密码: admin123\n');
  });
}

start();
