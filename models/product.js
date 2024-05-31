import mongoose from 'mongoose';

const product = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users',
        default: null
    },
    storeId: {
        type: mongoose.Types.ObjectId,
        ref: 'store',
        default: null
    },
    name: { type: String },
    price: { type: Number },
    description: { type: String },
    features: { type: [String] },
    sku: { type: String, unique: true },
    threshold: { type: Number, default: 0 },
    images: [{
        path: { type: String },
        isPrimary: { type: Boolean, default: false }
    }],
    categories: [{
        name: { type: String },
        subcategories: [{
            name: { type: String },
            subcategories: [this] // Self-referencing for nested subcategories
        }]
    }],
    tags: [{
        name: { type: String }
    }],
    discount: {
        type: mongoose.Types.ObjectId,
        ref: 'discount'
    }
}, { timestamps: true });
export default mongoose.model('product', product);