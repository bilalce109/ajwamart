import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import SimpleSchema from 'simpl-schema';
import helper from '../utils/helpers.js';
import openProcedure from '../models/openProcedure.js';
import closeProcedure from '../models/closingProcedure.js';
import User from '../models/users.js';

const createOpenProcedure = async (req, res) => {
    try {
        let body = req.body;
        const procedureSchema = new SimpleSchema({
            inputDate: { type: String, required: false },
            amount: { type: String, required: false },
            uploadPicture: { type: String, required: false },
            negativeAmount: { type: String, required: false },
            totalAmount: { type: String, required: false }
        }).newContext();



        if (!procedureSchema.validate(body)) return res.status(400).json({
            status: "error",
            message: "Please fill all the fields to proceed further!",
            trace: procedureSchema.validationErrors()
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

        if (req.files) {
            let picture = await helper.saveRequest(req.files.uploadPicture);
            body.uploadPicture = picture;
        }

        let total = 0;

        body.totalAmount = total + req.body.amount;


        // Create your response object including the day of the week
        const response = {
            userId: req.user._id,
            inputDate: new Date(req.body.inputDate), // Include the date
            amount: req.body.amount, // Include the day of the week
            uploadPicture: body.uploadPicture,
            companyId: req.user.companyId
        };

        let result = await openProcedure.create(response);

        return res.status(200).json({
            status: "success",
            message: "Data Submitted Successfully",
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

const viewProcedure = async (req, res) => {
    try {
        let result = await openProcedure.find({ companyId: req.user.companyId }).lean();

        // Check if each document in the result exists in closeProcedure model
        let populatedResult = await Promise.all(result.map(async (doc) => {
            // Find the closeProcedure document that matches the procedureId
            let closeProcedureDoc = await closeProcedure.findOne({ procedureId: doc._id });

            // Add isClosed field to the document based on whether a closeProcedureDoc was found
            doc.isClosed = closeProcedureDoc ? true : false;

            // If closeProcedureDoc exists, add its data to the document
            if (closeProcedureDoc) {
                doc.closeProcedureData = closeProcedureDoc;
            }

            return doc;
        }));


        return res.status(200).json({
            status: "success",
            message: "Open Procedure Details",
            data: populatedResult
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while proceeding your request.",
            trace: error.message
        });
    }
}

const createCloseProcedure = async (req, res) => {
    try {
        let body = req.body;
        const procedureSchema = new SimpleSchema({
            inputDate: { type: String, required: false },
            amount: { type: Number, required: false },
            cardReceipt: { type: String, required: false },
            coupon: { type: String, required: false },
            cheque: { type: String, required: false }
        }).newContext();

        if (!procedureSchema.validate(body)) return res.status(400).json({
            status: "error",
            message: "Please fill all the fields to proceed further!",
            trace: procedureSchema.validationErrors()
        });

        let checkUser = await User.findOne({
            _id: req.user._id,
            role: { $in: ['admin', 'owner', 'csr', 'manager', 'technician'] }
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }

        let checkProcedure = await openProcedure.findOne({ _id: req.params.id });
        if (!checkProcedure) {
            return res.status(409).json({
                status: "error",
                message: "Open Procedure not found",
                data: null,
                track: `${checkProcedure} is not found`
            })
        }

        // Create your response object including the day of the week
        const response = {
            userId: req.user._id,
            inputDate: new Date(req.body.inputDate), // Include the date
            amount: req.body.amount, // Include the day of the week
            cardReceipt: req.body.cardReceipt,
            coupon: req.body.coupon,
            cheque: req.body.cheque,
            procedureId: req.params.id
        };

        let result = await closeProcedure.create(response);

        return res.status(200).json({
            status: "success",
            message: "Data Submitted Successfully",
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

const viewCloseProcedure = async (req, res) => {
    try {
        let result = await closeProcedure.find({ companyId: req.user.companyId }).populate('procedureId');
        return res.status(200).json({
            status: "success",
            message: "Close Procedure Details",
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

export default {
    createOpenProcedure,
    viewProcedure,
    createCloseProcedure,
    viewCloseProcedure
};