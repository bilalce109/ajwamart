import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    companyId:{
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    name: {
        type: String
    },
    price: {
        type: Number
    },
    category: {
        type: String
    },
    type: {
        type: String,
        default: 'product'
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
export default mongoose.model('service', serviceSchema);