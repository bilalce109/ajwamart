import mongoose from 'mongoose';

const serviceCategorySchema = new mongoose.Schema({
    name: {
        type: String
    },
    description:{
        type: String
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
export default mongoose.model('serviceCategory', serviceCategorySchema);