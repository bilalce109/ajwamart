import mongoose from 'mongoose';

const jobPackageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    companyId: {
        type: mongoose.Types.ObjectId,
        ref: "company",
        default: null
    },
    productId : {
        type : mongoose.Types.ObjectId,
        default : 'service'
    },
    type: {
        type: String,
        default: 'package'
    },
    name: {
        type: String
    },
    cost: {
        type: Number
    },
    services: [{
        type: mongoose.Types.ObjectId,
        ref: 'service'
    }],
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
export default mongoose.model('jobPackage', jobPackageSchema);