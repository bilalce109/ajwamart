import mongoose from 'mongoose';

const vendor = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    name: {
        type: String
    },
    address: {
        type: String,
        default: ''
    },
    phone: {
        type: String
    },
    email: {
        type: String
    },
    uploadPicture: {
        type: String
    }
}, { timestamps: true });
export default mongoose.model('vendorSchema', vendor);