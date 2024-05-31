import mongoose from 'mongoose';

const attendanceRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    clockDate: {
        type: Date,
        default: Date.now
    },
    clockTime: {
        type: Date,
        default: Date.now
    },
    description:{
        type: String
    },
    issue:{
        type: String
    },
    request: [{
        type: mongoose.Types.ObjectId,
        ref: 'users'
    }],
    status: {
        type: String,
        default: 'pending'
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
export default mongoose.model('attendanceRequest', attendanceRequestSchema);