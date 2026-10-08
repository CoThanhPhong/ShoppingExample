const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const productRoutes = require('./routes/productRoutes');

const app = express();

// 1. Kết nối MongoDB local (hoặc thay bằng chuỗi kết nối MongoDB Atlas nếu dùng cloud)
mongoose.connect('mongodb://127.0.0.1:27017/shopping_db')
    .then(() => console.log('>>> Kết nối MongoDB thành công!'))
    .catch(err => console.error('>>> Lỗi kết nối MongoDB:', err));

// 2. Cấu hình View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 3. Middlewares
app.use(express.json()); // Đọc dữ liệu JSON từ Postman
app.use(express.urlencoded({ extended: true })); // Đọc dữ liệu từ HTML Form

// Cấu hình Session quản lý giỏ hàng
app.use(session({
    secret: 'mysecretkey123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // Hạn dùng 1 ngày
}));

// 4. Định tuyến Routes
app.use('/', productRoutes);

// 5. Khởi chạy Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`>>> Server đang chạy tại http://localhost:${PORT}`);
});