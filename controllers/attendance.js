import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import SimpleSchema from 'simpl-schema';
import helper from '../utils/helpers.js';
import role from '../models/role.js';
import permission from '../models/permission.js';
import attendance from '../models/attendance.js';
import attendRequest from '../models/attendRequest.js';
import User from '../models/users.js';
import employees from '../models/employees.js';
import moment from 'moment/moment.js';

const clockIn = async (req, res) => {
    try {
        let body = req.body;
        const clockinSchema = new SimpleSchema({
            clockIn: String,
        }).newContext();

        if (!clockinSchema.validate(body)) return res.status(400).json({
            status: "error",
            message: "Please fill all the fields to proceed further!",
            trace: clockinSchema.validationErrors()
        });

        let checkUser = await User.findOne({
            _id: req.user._id,
            role: { $in: ['csr', 'manager', 'technician', 'owner'] }
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }

        const checkAttendance = await attendance.findOne({ userId: req.user._id, clockIn: body.clockIn });
        if (checkAttendance) {
            return res.status(409).json({
                status: "error",
                message: "Already Clocked in",
                trace: { clockIn: body.clockIn }
            });
        }

        // Assuming you have a date object fetched from Mongoose
        const date = new Date(req.body.clockIn); // Replace this with your actual date

        // Get the day of the week as a number (0 for Sunday, 1 for Monday, etc.)
        const dayOfWeekNumber = date.getDay();

        // Array to map day of the week number to its name
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Get the name of the day of the week
        const dayOfWeekName = daysOfWeek[dayOfWeekNumber];

        // Create your response object including the day of the week
        const response = {
            userId: req.user._id,
            Date: date, // Include the date
            Day: dayOfWeekName, // Include the day of the week
            clockIn: date,
            companyId: req.user.companyId
        };

        let result = await attendance.create(response);


        return res.status(200).json({
            status: "success",
            message: "You have marked your attendance Successfully",
            data: result
        })


    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while proceeding your request.",
            trace: error.message
        });
    }
}

const clockOut = async (req, res) => {
    try {
        let body = req.body;
        const clockinSchema = new SimpleSchema({
            clockOut: String,
        }).newContext();

        if (!clockinSchema.validate(body)) return res.status(400).json({
            status: "error",
            message: "Please fill all the fields to proceed further!",
            trace: clockinSchema.validationErrors()
        });

        let checkUser = await User.findOne({
            _id: req.user._id,
            role: { $in: ['csr', 'manager', 'technician', 'owner'] }
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }


        // Assuming you have a date object fetched from Mongoose
        const date = new Date(req.body.clockOut); // Replace this with your actual date

        let getDate = await attendance.findOne({ _id: req.params.id });

        // Parse the time strings into Date objects
        const clockIn = new Date(getDate.clockIn);
        const clockOut = new Date(date);

        // Calculate the difference in milliseconds
        const differenceMs = clockOut - clockIn;

        // Convert milliseconds to hours and minutes
        const hours = Math.floor(differenceMs / (1000 * 60 * 60));
        const minutes = Math.floor((differenceMs % (1000 * 60 * 60)) / (1000 * 60));

        // Format the result
        const workingHours = `${hours} hours ${minutes} minutes`;


        // Create your response object including the day of the week
        const response = {
            clockOut: date,
            totalHours: workingHours
        };

        let updateClockTime = await attendance.findByIdAndUpdate({ _id: req.params.id }, { $set: response }, { new: true });

        return res.status(200).json({
            status: "success",
            message: "Thank you for signing off",
            data: updateClockTime
        })


    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while proceeding your request.",
            trace: error.message
        });
    }
}

const getAttendance = async (req, res) => {
    const { clockIn, clockOut } = req.body;
    let query = {
        userId: req.user._id
    };

    if (clockIn && clockOut) {
        query.clockIn = { $gte: new Date(clockIn) };
        query.$or = [
            { clockOut: { $lte: new Date(clockOut) } },
            { clockOut: { $exists: false } }
        ];
    } else {
        // Get start of the month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Get end of the month
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        query.clockIn = { $gte: startOfMonth };
        query.$or = [
            { clockOut: { $lte: endOfMonth } },
            { clockOut: { $exists: false } }
        ];
    }

    try {
        const result = await attendance.find(query);
        return res.status(200).json({
            status: "success",
            message: "Get Attendance of the Employee",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while proceeding your request.",
            trace: error.message
        });
    }
}


const attendanceRequest = async (req, res) => {
    try {
        let body = req.body;
        const attendRequestSchema = new SimpleSchema({
            clockDate: String,
            clockTime: String,
            description: String,
            issue: String
        }).newContext();

        if (!attendRequestSchema.validate(body)) return res.status(400).json({
            status: "error",
            message: "Please fill all the fields to proceed further!",
            trace: attendRequestSchema.validationErrors()
        });

        let checkUser = await User.findOne({
            _id: req.user._id,
            role: { $in: ['csr', 'manager', 'technician'] }
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }

        // let checkAsignee = await employees.findOne({
        //     email: req.user.email,
        // });
        const combinedDateTime = moment(`${req.body.clockDate} ${req.body.clockTime}`, "YYYY-MM-DD HH:mm").toDate();
        let requestData = {
            userId: req.user._id,
            clockDate: combinedDateTime,
            clockTime: combinedDateTime,
            description: req.body.description,
            issue: req.body.issue
        }

        let result = await attendRequest.create(requestData);

        return res.status(200).json({
            status: "success",
            message: "Attendance Request submitted successfully",
            data: result
        })


    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while proceeding your request.",
            trace: error.message
        });
    }
}

const getAttendanceRequest = async (req, res) => {
    try {

        // Step 1: Query the User collection
        // Find users whose companyId matches req.user.companyId and whose role is either 'csr' or 'technician'
        const users = await User.find({
            _id: req.user._id,
            companyId: req.user.companyId,
            role: { $in: ['csr', 'technician', 'manager'] }
        }).select('_id');  // Select only the _id field to get a list of user IDs

        // Extract the list of user IDs
        const userIds = users.map(user => user._id);

        // Step 2: Query the attendRequest collection
        // Find attendance requests where userId is in the list of user IDs
        const result = await attendRequest.find({
            userId: { $in: userIds }
        });
        return res.status(200).json({
            status: "success",
            message: "Attendance Requests",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while proceeding your request.",
            trace: error.message
        });
    }
}

const requestDetail = async (req, res) => {
    try {
        let reqId = req.params.id;
        let result = await attendRequest.findOne({ _id: reqId, userId: req.user._id });
        return res.status(200).json({
            status: "success",
            message: "Attendance Requests Details",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while proceeding your request.",
            trace: error.message
        });
    }
}

const acceptAttendanceRequest = async (req, res) => {
    try {
        const reqId = req.params.id;

        // Check if the attendance request exists
        const checkRequest = await attendRequest.findById(reqId);

        if (!checkRequest) {
            return res.status(404).json({
                status: "error",
                message: "Attendance request not found",
            });
        }

        // Check the current status of the attendance request
        const currentStatus = checkRequest.status;
        const requestedStatus = req.body.status;  // This should be "approved" or another valid status

        if (currentStatus === requestedStatus) {
            return res.status(400).json({
                status: "error",
                message: `Attendance request is already ${currentStatus}`,
            });
        }

        // Check user permissions
        const checkUser = await User.findById(checkRequest.userId);
        if (checkUser.companyId !== req.user.companyId && !['manager', 'owner'].includes(req.user.role)) {
            return res.status(403).json({
                status: "error",
                message: "User is not authorized to approve this request",
            });
        }

        // Update the status of the attendance request to the requested status
        const updatedRequest = await attendRequest.findByIdAndUpdate(
            reqId,
            { $set: { status: requestedStatus } },
            { new: true }
        );

        return res.status(200).json({
            status: "success",
            message: `Attendance request ${requestedStatus}`,
            data: updatedRequest,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while processing your request.",
            trace: error.message,
        });
    }
};




export default {
    clockIn,
    clockOut,
    getAttendance,
    attendanceRequest,
    getAttendanceRequest,
    requestDetail,
    acceptAttendanceRequest,
};