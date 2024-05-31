import mongoose from 'mongoose';

const permission = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    name: {
        type: String
    },
    module: {
        type: String
    },
    url: {
        type: String
    },
    icon: {
        type: String
    },
    actions: [String],
    child: [{
        name: {
            type: String
        },
        module: {
            type: String
        },
        url: {
            type: String
        },
        icon: {
            type: String
        },
        actions: [String],
    }]
}, { timestamps: true });
export default mongoose.model('permissions', permission);
