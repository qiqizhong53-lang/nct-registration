// Vercel KV 存储，带内存回退（首次部署未配置 KV 时也能运行）
let kv = null;
try {
  const mod = require('@vercel/kv');
  kv = mod.kv;
} catch (e) {
  // KV 未安装，使用内存回退
}

const ADMIN_PASSWORD = 'admin123';

// 内存存储（KV 不可用时的回退方案）
const memoryStore = {};

async function getRegistrations(campus) {
  if (kv) {
    return await kv.get(campus + ':registrations') || [];
  }
  return memoryStore[campus] || [];
}

async function saveRegistrations(campus, data) {
  if (kv) {
    await kv.set(campus + ':registrations', data);
  } else {
    memoryStore[campus] = data;
  }
}

async function getNextId(campus) {
  if (kv) {
    const id = await kv.get(campus + ':nextId') || 1;
    await kv.set(campus + ':nextId', id + 1);
    return id;
  }
  if (!memoryStore[campus + ':nextId']) memoryStore[campus + ':nextId'] = 1;
  return memoryStore[campus + ':nextId']++;
}

function verifyPassword(password) {
  return password === ADMIN_PASSWORD;
}

module.exports = { getRegistrations, saveRegistrations, getNextId, verifyPassword };
