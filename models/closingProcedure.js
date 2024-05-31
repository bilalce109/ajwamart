import mongoose from 'mongoose';

const closingProcedureSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    procedureId:{
        type: mongoose.Types.ObjectId,
        ref: 'openProcedure'
    },
    inputDate: {
        type: Date,
        default: Date.now
    },
    amount: {
        type: Number,
        default: ""
    },
    cardReceipt:{
        type: String
    },
    coupon:{
        type: String
    },
    cheque:{
        type: String,
        default: ''
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
export default mongoose.model('closingProcedure', closingProcedureSchema);