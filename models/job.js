import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    companyId: {
        type: mongoose.Types.ObjectId,
        ref: "company",
        default: null
    },
    vehicle: {
        type: mongoose.Types.ObjectId,
        ref: "vehicle",
        default: null
    },
    jobNumber: {
        type: Number,
        default: 0
    },
    customer: {
        type: mongoose.Types.ObjectId,
        ref: 'customer'
    },
    service: [{
        id: { type: mongoose.Types.ObjectId, ref: 'service' },
        price: {
            type: Number,
            default: 0
        },
        qty: {
            type: Number,
            default: 1
        },
        model: { type: String, default: 'service' },
        recommended: { type: Boolean, default: false },
        checked: { type: Boolean, default: true }
    }],
    recommendedService: [{
        id: { type: mongoose.Types.ObjectId, ref: 'service' },
        model: { type: String, default: 'service' },
        recommended: { type: Boolean, default: true },
        checked: { type: Boolean, default: false },
    }],
    inventory: [{
        id: { type: mongoose.Types.ObjectId, ref: 'inventory' },
        model: { type: String, default: 'inventory' },
        recommended: { type: Boolean, default: true },
        checked: { type: Boolean, default: true },
    }],
    package: {
        type: mongoose.Types.ObjectId,
        ref: 'jobPackage',
        default: null
    },
    invoice: [{
        type: mongoose.Types.ObjectId,
        ref: "invoice",
        default: null
    }],
    date: {
        type: Date,
        default: Date.now
    },
    time: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: "pending"
    },
    assignedTechnician: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    active: {
        type: Boolean,
        default: true
    },
    totalQty: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        default: 0
    }
}, { timestamps: true });
export default mongoose.model('job', jobSchema);