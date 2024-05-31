import mongoose from 'mongoose';


const adminSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Email is required"],
    },
    role : {
        type : mongoose.Types.ObjectId,
        ref : "roleSchema"
    },
    password: {
        type: String,
        min: [8, "Password must be 8 characters"],
        required: true
    },
    verificationToken: {
        type: String
    },
    otpCode: {
        type: Number
    },
});

export default mongoose.model('admin', adminSchema);