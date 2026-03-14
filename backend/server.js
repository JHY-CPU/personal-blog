const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

dotenv.config();
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 数据库连接
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('数据库连接失败:', err);
        return;
    }
    console.log('✅ 数据库连接成功');
});

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// 创建上传目录
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// ========== 用户相关接口 ==========

// 用户注册
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    
    try {
        // 密码加密
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
        db.query(sql, [username, hashedPassword, email], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: '用户名或邮箱已存在' });
                }
                return res.status(500).json({ message: '服务器错误' });
            }
            
            // 生成token
            const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET);
            res.status(201).json({ 
                message: '注册成功',
                token,
                user: { id: result.insertId, username, email }
            });
        });
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

// 用户登录
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    const sql = 'SELECT * FROM users WHERE username = ? OR email = ?';
    db.query(sql, [username, username], async (err, results) => {
        if (err) return res.status(500).json({ message: '服务器错误' });
        if (results.length === 0) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        
        const user = results[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
        res.json({
            message: '登录成功',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    });
});

// ========== 文章相关接口 ==========

// 创建文章（需要token）
app.post('/api/posts', verifyToken, upload.single('cover'), (req, res) => {
    const { title, content, summary, categories } = req.body;
    const coverImage = req.file ? `/uploads/${req.file.filename}` : null;
    const userId = req.user.id;
    
    const sql = 'INSERT INTO posts (title, content, summary, cover_image, user_id) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [title, content, summary, coverImage, userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: '发布失败' });
        }
        
        // 如果有分类，处理分类关联
        if (categories) {
            const categoryList = JSON.parse(categories);
            categoryList.forEach(catId => {
                db.query('INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)', 
                    [result.insertId, catId]);
            });
        }
        
        res.status(201).json({ 
            message: '发布成功',
            postId: result.insertId 
        });
    });
});

// 获取所有文章
app.get('/api/posts', (req, res) => {
    const sql = `
        SELECT p.*, u.username, 
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: '获取失败' });
        }
        res.json(results);
    });
});

// 获取单篇文章
app.get('/api/posts/:id', (req, res) => {
    // 增加浏览量
    db.query('UPDATE posts SET views = views + 1 WHERE id = ?', [req.params.id]);
    
    const sql = `
        SELECT p.*, u.username, u.avatar, u.bio,
        c.id as comment_id, c.content as comment_content, 
        c.created_at as comment_time, cu.username as comment_username
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN users cu ON c.user_id = cu.id
        WHERE p.id = ?
    `;
    
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: '获取失败' });
        if (results.length === 0) {
            return res.status(404).json({ message: '文章不存在' });
        }
        
        // 格式化返回数据
        const post = {
            id: results[0].id,
            title: results[0].title,
            content: results[0].content,
            summary: results[0].summary,
            cover_image: results[0].cover_image,
            views: results[0].views,
            created_at: results[0].created_at,
            username: results[0].username,
            comments: results[0].comment_id ? results.map(r => ({
                id: r.comment_id,
                content: r.comment_content,
                username: r.comment_username,
                created_at: r.comment_time
            })) : []
        };
        
        res.json(post);
    });
});

// 评论文章
app.post('/api/posts/:id/comments', verifyToken, (req, res) => {
    const { content } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;
    
    const sql = 'INSERT INTO comments (content, user_id, post_id) VALUES (?, ?, ?)';
    db.query(sql, [content, userId, postId], (err, result) => {
        if (err) return res.status(500).json({ message: '评论失败' });
        res.status(201).json({ message: '评论成功', commentId: result.insertId });
    });
});

// Token验证中间件
function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: '请先登录' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'token无效' });
        }
        req.user = decoded;
        next();
    });
}

// 启动服务器
app.listen(process.env.PORT, () => {
    console.log(`✅ 后端服务器运行在 http://localhost:${process.env.PORT}`);
});