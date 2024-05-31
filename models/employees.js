import mongoose from 'mongoose';

const employeesSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    companyId: {
        type: mongoose.Types.ObjectId,
        ref: 'vendorSchema'
    },
    email: {
        type: String
    },
    fullName: {
        type: String
    },
    phone: {
        type: Number
    },
    profile_picture: {
        type: String
    },
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number]
        }
    },
    role: {
        type: String
    },
    employeeType: {
        type: String
    },
    // privilege: [{
    //     type: String,
    //     ref: 'privilegeSchema'
    // }],
    assigned: [{
        type: mongoose.Types.ObjectId,
        ref: 'users'
    }],
    password:{
        type: String
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
employeesSchema.index({ location: "2dsphere" });
export default mongoose.model('employees', employeesSchema);