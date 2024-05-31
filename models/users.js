import mongoose from 'mongoose';

const usersSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Types.ObjectId,
        ref: 'store',
        default: null
    },
    fullName: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: Number
    },
    password: {
        type: String
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
    state: {
        type: String
    },
    area: {
        type: String
    },
    role: {
        type: String
    },
    permissions: [{
        type: mongoose.Types.ObjectId,
        ref: 'permission'
    }],
    verificationToken: {
        type: String,
    },
    otpCode: {
        type: Number,
    },
    fcm: {
        type: String
    },
    deviceToken: {
        type: String
    },
    cards: [
        {
            cardnumber: {
                type: String,
                default: null
            },
            cvc: {
                type: Number,
                default: 0
            },
            cardholdername: {
                type: String,
                default: ""
            },
            cardtype: {
                type: String,
                default: ""
            },
            expiry: {
                type: String,
                default: ""
            },
            stripe_customer_id: {
                type: String,
                default: ""
            }
        }
    ],
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
usersSchema.index({ location: "2dsphere" });
export default mongoose.model('users', usersSchema);