import Notification from '../models/notification.js';
import SimpleSchema from 'simpl-schema'
import NotificationHandler from '../utils/NotificationHandler.js';
import helpers from '../utils/helpers.js';
import users from '../models/users.js';

const createNotification = async (req, res) => {
    try {
        let body = req.body;
        const notificationSchema = new SimpleSchema({
            title: String,
            message: String,
            type: String
        }).newContext();

        if (!notificationSchema.validate(body)) return res.status(200).json({
            status: "error",
            message: "Please fill all the fields to proceed further!",
            trace: notificationSchema.validationErrors()
        });

        await Notification.create(body);
        let sendNotification = await users.find({}).select({deviceToken : 1});
        await Promise.all(sendNotification.map( async(e) =>{
            if(e.deviceToken)
                console.log(calculateDays); // log the number of days in the gap
            {
                await NotificationHandler.sendNotification(body.title, body.message, e.deviceToken);
            }
            

        }))

        return res.json({
            status: "success",
            message: "Notification sent successfully!",
        });
    } catch (error) {
        return res.status(200).json({
            status: "error",
            message: "unexpected error",
            trace: error.message
        });
    }
}

const NotificationList = async (req, res) => {
    try {
        const list = await Notification.find({user:req.user._id}).lean();
        return res.json({
            status: "success",
            message: "Retrieved list of all of Notification",
            data: list
        })
    } catch (err) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            trace: err.message
        })
    }
}

export default {
    createNotification,
    NotificationList,
};