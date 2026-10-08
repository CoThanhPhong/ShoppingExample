const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, default: 'https://via.placeholder.com/200' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);