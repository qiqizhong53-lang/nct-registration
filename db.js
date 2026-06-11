const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const ADMIN_PASSWORD = 'admin123'; // 管理员密码，可自行修改

// 工厂函数：为每个校区创建独立的数据库实例
function createCampusDB(campusName) {
  const dbDir = path.join(__dirname, 'data');
  const dbPath = path.join(dbDir, campusName + '.db');
  let db = null;

  async function init() {
    const SQL = await initSqlJs();

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS registrations (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        name      TEXT NOT NULL,
        period    TEXT NOT NULL,
        teacher   TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    save();
    console.log('[db] ' + campusName + ' 数据库初始化完成');
  }

  function save() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }

  function insertRegistration(name, period, teacher) {
    db.run(
      'INSERT INTO registrations (name, period, teacher) VALUES (?, ?, ?)',
      [name, period, teacher]
    );
    save();
  }

  function getAllRegistrations() {
    const result = db.exec('SELECT * FROM registrations ORDER BY id DESC');
    if (result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  }

  function deleteRegistration(id) {
    db.run('DELETE FROM registrations WHERE id = ?', [id]);
    save();
  }

  function getStats() {
    const total = db.exec('SELECT COUNT(*) as count FROM registrations');
    const totalCount = total.length > 0 ? total[0].values[0][0] : 0;

    const byPeriod = db.exec(
      'SELECT period, COUNT(*) as count FROM registrations GROUP BY period'
    );
    const periodStats = {};
    if (byPeriod.length > 0) {
      byPeriod[0].values.forEach(row => {
        periodStats[row[0]] = row[1];
      });
    }

    const byTeacher = db.exec(
      'SELECT teacher, COUNT(*) as count FROM registrations GROUP BY teacher'
    );
    const teacherStats = {};
    if (byTeacher.length > 0) {
      byTeacher[0].values.forEach(row => {
        teacherStats[row[0]] = row[1];
      });
    }

    return { total: totalCount, byPeriod: periodStats, byTeacher: teacherStats };
  }

  function verifyPassword(password) {
    return password === ADMIN_PASSWORD;
  }

  return {
    init,
    insertRegistration,
    getAllRegistrations,
    deleteRegistration,
    getStats,
    verifyPassword
  };
}

module.exports = { createCampusDB };
