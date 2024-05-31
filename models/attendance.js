import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    companyId : {
        type : mongoose.Types.ObjectId,
        default : "company"
    },
    Date: {
        type: Date
    },
    Day: {
        type: String
    },
    totalHours: {
        type: String
    },
    clockIn: {
        type: Date
    },
    clockOut: {
        type: Date,
    },
    status: {
        type: String,
        default: 'On Time'
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
export default mongoose.model('attendance', attendanceSchema);