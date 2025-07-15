// --- sqlite3数据库初始化 ---
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const session = require('express-session');
const SQLiteStore = require('better-sqlite3-session-store')(session);
const multer = require('multer');
const bcrypt = require('bcryptjs');


const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(path.join(__dirname, 'data', 'aespa.db'));


// 创建表和升级表结构（better-sqlite3为同步API）
try {
  db.prepare(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  db.prepare(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target TEXT,
    user_id INTEGER,
    username TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    likes INTEGER DEFAULT 0
  )`).run();
  db.prepare(`CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    fav_type TEXT,
    fav_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  // 新建评论点赞表（唯一约束防止重复点赞）

  // 升级users表，添加nickname和avatar字段（幂等）
  try { db.prepare('ALTER TABLE users ADD COLUMN nickname TEXT').run(); } catch(e) {}
  try { db.prepare('ALTER TABLE users ADD COLUMN avatar TEXT').run(); } catch(e) {}
} catch(e) { console.error(e); }

// 头像上传目录
const AVATAR_DIR = path.join(__dirname, 'assets', 'img', 'avatars');
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });
const upload = multer({ dest: AVATAR_DIR });



// 配置session存储
app.use(session({
  store: new SQLiteStore({
    client: db,
    expired: {
      clear: true,
      intervalMs: 900000 //15min
    }
  }),
  name: 'aespa.sid', // 设置cookie名称
  secret: 'aespa_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    path: '/'
  }
}));

// 允许跨域请求，配置允许携带认证信息
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000',
  credentials: true
};
app.use(require('cors')(corsOptions));
app.use(express.json());

// 获取用户信息
app.get('/api/userinfo', (req, res) => {
  const user = req.session.user;
  if (!user) return res.json({ success: false, message: '未登录' });
  const row = db.prepare('SELECT id, username, nickname, avatar, created_at FROM users WHERE id=?').get(user.id);
  if (!row) return res.json({ success: false, message: '用户不存在' });
  if (row.avatar && !/^https?:/.test(row.avatar)) {
    row.avatar = '/assets/img/avatars/' + row.avatar;
  }
  res.json({ success: true, user: row });
});

// 修改昵称/头像
app.post('/api/userinfo', upload.single('avatar'), (req, res) => {
  const user = req.session.user;
  if (!user) return res.json({ success: false, message: '未登录' });
  let nickname = req.body.nickname;
  let avatarFile = req.file;
  let avatarUrl = null;
  if (avatarFile) {
    const ext = path.extname(avatarFile.originalname) || '.jpg';
    const newName = user.id + '_' + Date.now() + ext;
    const newPath = path.join(AVATAR_DIR, newName);
    fs.renameSync(avatarFile.path, newPath);
    avatarUrl = newName;
  }
  if (!avatarFile && req.is('application/json')) {
    try {
      db.prepare('UPDATE users SET nickname=? WHERE id=?').run(nickname, user.id);
      res.json({ success: true });
    } catch (err) {
      res.json({ success: false, message: '保存失败' });
    }
  } else {
    try {
      db.prepare('UPDATE users SET nickname=?, avatar=? WHERE id=?').run(nickname, avatarUrl, user.id);
      res.json({ success: true });
    } catch (err) {
      res.json({ success: false, message: '保存失败' });
    }
  }
});

// --- session中间件 ---
app.use(session({
  secret: 'aespa_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 7*24*3600*1000 }
}));

// --- 用户注册 ---
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  // 用户名和密码基础校验
  if (!username || !password) return res.json({ success: false, message: '用户名和密码必填' });
  if (typeof username !== 'string' || typeof password !== 'string') return res.json({ success: false, message: '参数错误' });
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.json({ success: false, message: '用户名需为3-20位字母数字或下划线' });
  if (password.length < 6) return res.json({ success: false, message: '密码至少6位' });
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return res.json({ success: false, message: '密码需包含字母和数字' });
  try {
    // 密码加密
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const info = stmt.run(username, hash);
    req.session.user = { id: info.lastInsertRowid, username };
    res.json({ success: true, user: { id: info.lastInsertRowid, username } });
  } catch (err) {
    res.json({ success: false, message: '用户名已存在' });
  }
});

// --- 用户登录 ---
app.post('/api/login', (req, res) => {
  try {
    const { username, password, remember } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码必填' });
    }
    
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: '参数错误' });
    }
    
    const row = db.prepare('SELECT * FROM users WHERE username=?').get(username);
    
    if (row && bcrypt.compareSync(password, row.password)) {
      // 设置用户session
      req.session.user = { 
        id: row.id, 
        username: row.username,
        loginTime: Date.now()
      };
      
      // 处理"记住我"功能
      if (remember) {
        // 如果用户选择了"记住我"，设置 30 天的过期时间
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      } else {
        // 否则设置为浏览器会话结束时过期
        req.session.cookie.expires = false;
      }

      res.json({ 
        success: true, 
        user: { 
          id: row.id, 
          username: row.username,
          remember: remember
        } 
      });
    } else {
      res.json({ success: false, message: '用户名或密码错误' });
    }
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
});

// --- 用户注销 ---
app.get('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// --- 发表评论 ---
app.post('/api/comment', (req, res) => {
  const { target, content, anonymous } = req.body;
  let user = req.session.user;
  let username = anonymous ? '匿名' : (user ? user.username : '匿名');
  let user_id = anonymous ? null : (user ? user.id : null);
  if (!target || !content) return res.json({ success: false, message: '内容不能为空' });
  try {
    const stmt = db.prepare('INSERT INTO comments (target, user_id, username, content) VALUES (?, ?, ?, ?)');
    const info = stmt.run(target, user_id, username, content);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.json({ success: false, message: '评论失败' });
  }
});

// --- 获取评论 ---
app.get('/api/comment', (req, res) => {
  const { target } = req.query;
  let rows;
  let user = req.session.user;
  if (target && target !== 'all') {
    rows = db.prepare('SELECT * FROM comments WHERE target=? ORDER BY created_at DESC LIMIT 30').all(target);
  } else {
    // 查询所有评论（如用户中心）
    if (!user) return res.json({ success: false, message: '未登录' });
    rows = db.prepare('SELECT * FROM comments WHERE user_id=? ORDER BY created_at DESC LIMIT 30').all(user.id);
  }
  // 不再返回点赞数和liked字段
  res.json({ success: true, data: rows });
});



// --- 删除评论（仅本人）---
app.delete('/api/comment/:id', (req, res) => {
  const id = req.params.id;
  let user = req.session.user;

  // 1. 检查用户是否登录
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: '请先登录' 
    });
  }

  // 2. 获取评论信息
  const row = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
  
  // 3. 检查评论是否存在
  if (!row) {
    return res.status(404).json({ 
      success: false, 
      message: '评论不存在' 
    });
  }

  // 4. 检查是否是评论作者
  if (row.user_id !== user.id) {
    return res.status(403).json({ 
      success: false, 
      message: '只能删除自己发布的评论' 
    });
  }

  // 5. 执行删除操作
  try {
    db.prepare('DELETE FROM comments WHERE id = ?').run(id);
    res.json({ 
      success: true,
      message: '评论已删除'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: '删除评论失败，请稍后重试'
    });
  }
});

// --- 收藏API ---
app.post('/api/favorite', (req, res) => {
  let user = req.session.user;
  if (!user) return res.json({ success: false, message: '未登录' });
  const { fav_type, fav_id } = req.body;
  try {
    db.prepare('INSERT INTO favorites (user_id, fav_type, fav_id) VALUES (?, ?, ?)').run(user.id, fav_type, fav_id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: '已收藏' });
  }
});
app.get('/api/favorite', (req, res) => {
  let user = req.session.user;
  if (!user) return res.json({ success: false, message: '未登录' });
  const rows = db.prepare('SELECT * FROM favorites WHERE user_id=?').all(user.id);
  res.json({ success: true, data: rows });
});

app.delete('/api/favorite/:id', (req, res) => {
  let user = req.session.user;
  if (!user) return res.json({ success: false, message: '未登录' });
  try {
    db.prepare('DELETE FROM favorites WHERE id=? AND user_id=?').run(req.params.id, user.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

// 新增：获取某对象被多少人收藏，无需登录
app.get('/api/favorite/count', (req, res) => {
  const { fav_type, fav_id } = req.query;
  if (!fav_type || !fav_id) return res.json({ success: false, message: '参数缺失' });
  try {
    const row = db.prepare('SELECT COUNT(*) as cnt FROM favorites WHERE fav_type=? AND fav_id=?').get(fav_type, fav_id);
    res.json({ success: true, count: row.cnt });
  } catch (err) {
    res.json({ success: false, message: '查询失败' });
  }
});


const axios = require('axios');
const cheerio = require('cheerio');

// 爬取aespa官方微博最新内容
app.get('/news', async (req, res) => {
  try {
    const url = 'https://weibo.com/u/7479199632?tabtype=feed';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    });
    const $ = cheerio.load(response.data);
    // 微博页面为动态渲染，直接爬取html难以获取内容，尝试抓取初步内容
    // 这里仅做演示，实际生产建议用微博开放API或第三方API
    let newsList = [];
    $("script").each((i, el) => {
      const html = $(el).html();
      if (html && html.includes('var $render_data')) {
        // 尝试提取json数据
        const match = html.match(/\$render_data = \[(.*)\]\[0\]/);
        if (match && match[1]) {
          try {
            const json = JSON.parse(match[1]);
            if (json.statuses && Array.isArray(json.statuses)) {
              newsList = json.statuses.slice(0, 5).map(item => ({
                id: item.id,
                text: item.text_raw || item.text,
                created_at: item.created_at,
                pics: item.pics ? item.pics.map(p => p.url) : [],
                user: item.user ? item.user.screen_name : '',
                url: `https://weibo.com/${item.user ? item.user.id : ''}/${item.bid}`
              }));
            }
          } catch (e) {}
        }
      }
    });
    if (newsList.length === 0) {
      return res.json({ success: false, message: '未能获取到微博内容，建议使用微博API或第三方API。' });
    }
    res.json({ success: true, data: newsList });
  } catch (err) {
    res.status(500).json({ success: false, message: '爬取失败', error: err.message });
  }
});



const DATA_DIR = path.join(__dirname, 'data');
const GALLERY_PATH = path.join(DATA_DIR, 'gallery.json');

// Ensure data directory & file exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(GALLERY_PATH)) fs.writeFileSync(GALLERY_PATH, '[]', 'utf8');

// Helper to read / write gallery list
function readGallery() {
  return JSON.parse(fs.readFileSync(GALLERY_PATH, 'utf8'));
}
function writeGallery(list) {
  fs.writeFileSync(GALLERY_PATH, JSON.stringify(list, null, 2), 'utf8');
}

// GET   /api/gallery  -> list
app.get('/api/gallery', (req, res) => {
  try {
    res.json(readGallery());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to read gallery data' });
  }
});

// POST  /api/gallery  { bvid|url, title }
app.post('/api/gallery', (req, res) => {
  let { bvid, url, title } = req.body || {};
  if (!title) {
    title = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }
  if (!bvid && !url) {
    return res.status(400).json({ error: 'Missing bvid or url' });
  }
  const newItem = bvid ? { type: 'bilibili', bvid, title } : { type: 'iframe', url, title };
  try {
    const list = readGallery();
    list.push(newItem);
    writeGallery(list);
    res.json(newItem);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save' });
  }
});

// Serve static website for convenience
app.use(express.static(__dirname));

app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
