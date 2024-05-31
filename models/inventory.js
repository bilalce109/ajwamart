import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    companyId: {
        type: mongoose.Types.ObjectId,
        ref: 'vendor'
    },
    productId: {
        type: mongoose.Types.ObjectId,
        ref: 'service'
    },
    type: {
        type: String,
        default: 'product'
    },
    name: {
        type: String
    },
    cost: {
        type: Number
    },
    uploadPicture: {
        type: String
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'inventoryCategory'
    },
    stock: {
        type: Boolean,
        default: true
    },
    available: {
        type: Number,
        default: 0
    },
    sales: {
        type: Number,
        default: 0
    },
    threshold: {
        type: Number,
        default: 0
    },
    sku: {
        type: String,
        default: '',
    },
    reorder: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
export default mongoose.model('inventory', inventorySchema);