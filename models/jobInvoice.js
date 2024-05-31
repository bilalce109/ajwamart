import mongoose from 'mongoose';

const jobServiceSchema = new mongoose.Schema({
    invoiceId:{
        type: String
    },
    jobId: {
        type: mongoose.Types.ObjectId,
        ref: 'jobs'
    },
    date: {
        type: Date,
        default: Date.now
    },
    issuedTo: {
        type: String
    },
    totalAmount: {
        type: Number
    },
    details: {
        type: String
    },
    status: {
        type: String,
        default: "unpaid"
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
export default mongoose.model('jobService', jobServiceSchema);