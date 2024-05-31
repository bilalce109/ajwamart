import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    invoiceNumber  : {
        type : Number,
        default : ""
    },
    companyId : {
        type : mongoose.Types.ObjectId,
        ref : "company",
        default : null
    },
    jobId: {
        type: mongoose.Types.ObjectId,
        ref: 'jobs'
    },
    paymentStatus : {
        type : String,
        default : 'unpaid'
    },
    customerId: {
        type: mongoose.Types.ObjectId,
        ref: 'customer'
    },
    vehicleId: {
        type: mongoose.Types.ObjectId,
        ref: 'vehicle'
    },
    service: [{
        id: { type: mongoose.Types.ObjectId },
        price: {
            type : Number,
            default : 0
        },
        qty : {
            type : Number,
            default : 0
        },
        recommended: { type: Boolean, default: false },
        checked: { type: Boolean, default: true }
    }],

    discount: [{
        product: { type: mongoose.Types.ObjectId , ref : "service" },
        price: {
            type : Number,
            default : 0
        },
        qty : {
            type : Number,
            default : 1
        },
    }],
    recommendedService: [{
        id: { type: mongoose.Types.ObjectId },
        recommended: { type: Boolean, default: true },
        checked: { type: Boolean, default: false }
    }],
    inventory: [{
        id: { type: mongoose.Types.ObjectId },
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
    totalQty : {
        type : Number,
        default : 0
    },
    totalPrice : {
        type : Number,
        default : 0
    }
   
}, { timestamps: true },);
export default mongoose.model('invoice', invoiceSchema);