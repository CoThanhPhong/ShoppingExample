const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// ==========================================
// 1. FRONT-END ROUTES (TRUYỀN DỮ LIỆU BẰNG RES.RENDER, GIỎ HÀNG BẰNG SESSION)
// ==========================================

// Trang 1: Trang danh sách sản phẩm
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        const cart = req.session.cart || [];
        const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

        res.render('index', { products, cartCount });
    } catch (err) {
        res.status(500).send("Lỗi server: " + err.message);
    }
});

// Trang 2: Trang thông tin chi tiết một sản phẩm
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Không tìm thấy sản phẩm!');
        
        res.render('detail', { product });
    } catch (err) {
        res.status(500).send("Lỗi server: " + err.message);
    }
});

// Trang 3: Trang giỏ hàng
router.get('/cart', (req, res) => {
    const cart = req.session.cart || [];
    res.render('cart', { cart });
});

// Thêm sản phẩm vào giỏ hàng (Session)
router.post('/cart/add/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Sản phẩm không tồn tại!');

        if (!req.session.cart) {
            req.session.cart = [];
        }

        const existingIndex = req.session.cart.findIndex(item => item.id === product._id.toString());
        if (existingIndex > -1) {
            req.session.cart[existingIndex].quantity += 1;
        } else {
            req.session.cart.push({
                id: product._id.toString(),
                name: product.name,
                price: product.price,
                quantity: 1
            });
        }

        res.redirect('/cart');
    } catch (err) {
        res.status(500).send("Lỗi: " + err.message);
    }
});

// Xóa sản phẩm khỏi giỏ hàng
router.post('/cart/remove/:id', (req, res) => {
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.id !== req.params.id);
    }
    res.redirect('/cart');
});

// ==========================================
// 2. BACK-END RESTful API (TƯƠNG TÁC BẰNG POSTMAN: CRUD)
// ==========================================

// API Lấy danh sách sản phẩm (GET)
router.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API Tạo sản phẩm mới (POST)
router.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// API Cập nhật/Sửa sản phẩm (PUT)
router.put('/api/products/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.status(200).json(updatedProduct);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// API Xóa sản phẩm (DELETE)
router.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Xóa sản phẩm thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;