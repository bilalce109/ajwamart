import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    storeId: {
        type: mongoose.Types.ObjectId,
        ref: 'store'
    },
    name: {
        type: String
    },
    price: {
        type: Number
    },
    unit: {
        type: String,
        default: '%'
    },
    timeFrame: {
        type: Date,
        default: Date.now,
    },
    numberOfUser: {
        type: Number
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'category'
    },
    product: [{
        type: mongoose.Types.ObjectId,
        ref: 'product'
    }],
    picture: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
export default mongoose.model('coupon', couponSchema);