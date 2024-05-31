import mongoose from 'mongoose';

const inventoryCategorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    companyId: {
        type: mongoose.Types.ObjectId,
        ref: 'vendor'
    },
    name: {
        type: String
    },
    uploadPicture: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
export default mongoose.model('inventoryCategory', inventoryCategorySchema);