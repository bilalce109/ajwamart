import mongoose from 'mongoose';

const openProcedureSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    companyId : {
        type : mongoose.Types.ObjectId,
        ref : "company",
        default : null
    },
    inputDate: {
        type: Date,
        default: Date.now
    },
    amount: {
        type: Number,
        default: ""
    },
    uploadPicture: {
        type: String
    },
    negativeAmount: {
        type: Number,
        default: ""
    },
    totalAmount: {
        type: Number,
        default: ""
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
export default mongoose.model('openProcedure', openProcedureSchema);