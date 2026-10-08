const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// ==========================================
// 1. FRONT-END ROUTES (EJS VIEWS & SESSION)
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
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.render('cart', { cart, totalAmount });
});

// ==========================================
// 2. XỬ LÝ GIỎ HÀNG (SỬ DỤNG SESSION)
// ==========================================

// Thêm 1 hoặc nhiều sản phẩm vào giỏ hàng
router.post('/cart/add/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Sản phẩm không tồn tại!');

        const qty = parseInt(req.body.quantity) || 1;

        if (!req.session.cart) {
            req.session.cart = [];
        }

        const existingIndex = req.session.cart.findIndex(item => item.id === product._id.toString());
        if (existingIndex > -1) {
            req.session.cart[existingIndex].quantity += qty;
        } else {
            req.session.cart.push({
                id: product._id.toString(),
                name: product.name,
                price: product.price,
                quantity: qty
            });
        }

        const backUrl = req.get('Referrer') || '/';
        const separator = backUrl.includes('?') ? '&' : '?';

        res.redirect(`${backUrl}${separator}message=` + encodeURIComponent(`Đã thêm ${qty} "${product.name}" vào giỏ hàng!`));
    } catch (err) {
        res.status(500).send("Lỗi: " + err.message);
    }
});

// Xóa 1 sản phẩm khỏi giỏ hàng
router.post('/cart/remove/:id', (req, res) => {
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.id !== req.params.id);
    }

    const backUrl = req.get('Referrer') || '/cart';
    const separator = backUrl.includes('?') ? '&' : '?';

    res.redirect(`${backUrl}${separator}message=` + encodeURIComponent('Đã xóa sản phẩm khỏi giỏ hàng thành công!'));
});

// Xóa tất cả sản phẩm trong giỏ hàng
router.post('/cart/clear', (req, res) => {
    req.session.cart = [];

    const backUrl = req.get('Referrer') || '/cart';
    const separator = backUrl.includes('?') ? '&' : '?';

    res.redirect(`${backUrl}${separator}message=` + encodeURIComponent('Đã xóa toàn bộ giỏ hàng thành công!'));
});

// ==========================================
// 3. BACK-END RESTful API (TƯƠNG TÁC VỚI POSTMAN)
// ==========================================

// [GET] 1. Lấy danh sách tất cả sản phẩm
router.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// [GET] 2. Lấy thông tin chi tiết 1 sản phẩm theo ID
router.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm!' });
        }
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// [POST] 3. Tạo mới sản phẩm (Hỗ trợ tạo 1 sản phẩm hoặc tạo hàng loạt nhiều sản phẩm)
router.post('/api/products', async (req, res) => {
    try {
        if (Array.isArray(req.body)) {
            // Trường hợp dán mảng JSON tạo nhiều sản phẩm cùng lúc
            const savedProducts = await Product.insertMany(req.body);
            return res.status(201).json({
                success: true,
                message: `Đã thêm thành công ${savedProducts.length} sản phẩm!`,
                data: savedProducts
            });
        } else {
            // Trường hợp tạo 1 sản phẩm lẻ
            const newProduct = new Product(req.body);
            const savedProduct = await newProduct.save();
            return res.status(201).json({
                success: true,
                message: 'Tạo sản phẩm mới thành công!',
                data: savedProduct
            });
        }
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// [PUT] 4. Cập nhật / Sửa thông tin sản phẩm theo ID
router.put('/api/products/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true } // { new: true } để trả về dữ liệu mới sau khi sửa
        );
        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm cần sửa!' });
        }
        res.status(200).json({
            success: true,
            message: 'Cập nhật sản phẩm thành công!',
            data: updatedProduct
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// [DELETE] 5. Xóa 1 sản phẩm theo ID
router.delete('/api/products/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm cần xóa!' });
        }
        res.status(200).json({
            success: true,
            message: 'Đã xóa sản phẩm thành công!'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;