import mongoose from 'mongoose';

const customer = new mongoose.Schema({
    companyId: {
        type: mongoose.Types.ObjectId,
        ref: "company",
        default: null
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users',
        default: null
    },
    name: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    number: {
        type: String,
        default: ""
    },
    vehicles: [{
        type: mongoose.Types.ObjectId,
        default: null,
        ref: "vehicle"
    }]

}, { timestamps: true });
export default mongoose.model('customer', customer);