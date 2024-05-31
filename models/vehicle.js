import mongoose from 'mongoose';

const vehicle = new mongoose.Schema({
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
    vinNumber: {
        type: String,
        default: ""
    },
    license: {
        type: String,
        default: ""
    },
    make: {
        type: String,
        default: ""
    },
    model: {
        type: String,
        default: ""
    },
    engineSize: {
        type: String,
        default: ""
    },
    year: {
        type: String,
        default: ""
    },
    carType: {
        type: String,
        default: ""
    },
    fleet: {
        type: String,
        default: ""
    }

}, { timestamps: true });
export default mongoose.model('vehicle', vehicle);