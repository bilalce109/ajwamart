import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, ref: "users",
    },
    title: {
        type: String,
    },
    body: {
        type: String,
    },
    type: {
        type: String
    },
    data: {
        type: mongoose.Types.ObjectId,
        default: null
    },
    date: {
        type: Date,
        default: Date.now,
    },
    readStatus: {
        type: Number,
        default: 0,
        //0 = unread, 1 = read
    }
});
export default mongoose.model("notifications", notificationSchema)
