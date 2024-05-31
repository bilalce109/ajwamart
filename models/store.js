import mongoose from 'mongoose';

const store = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users',
        default: null
    },
    name: {
        type: String,
    },
    phone: {
        type: Number
    },
    state: {
        type: String
    },
    area: {
        type: String
    },
    zipCode: {
        type: String
    },
    logo: {
        type: String
    }

}, { timestamps: true });
export default mongoose.model('store', store);