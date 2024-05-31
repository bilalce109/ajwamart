import mongoose from 'mongoose';

const category = new mongoose.Schema({
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
    name: {
        type: String,
    },
    picture: {
        type: String
    },
    parent: {
        type: mongoose.Types.ObjectId,
        ref: 'category'
    }
}, { timestamps: true });
export default mongoose.model('category', category);