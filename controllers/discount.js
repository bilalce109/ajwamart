import mongoose from 'mongoose';
import SimpleSchema from 'simpl-schema';
import discount from '../models/discount.js';
import helpers from '../utils/helpers.js';
import User from '../models/users.js';
import service from '../models/service.js';

const createDiscount = async (req, res) => {
    try {
        let body = req.body;
        let discountSchema = new SimpleSchema({
            name: { type: String, required: true },
            startTime: { type: String, required: false },
            endTime: { type: String, required: false },
            percentage: { type: String, required: false },
            uploadPicture: { type: String, required: false }
        }).newContext();

        discountSchema.validate(req.body);

        if (!discountSchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: discountSchema.validationErrors()
            })
        }
        const checkdiscount = await discount.findOne({ name: req.body.name });
        if (checkdiscount) return res.status(200).json({
            status: "error",
            message: "Discount already created"
        });

        if (req.files) {
            let picture = req.files.uploadPicture;
            let fileName = `public/coupon/${Date.now()}-${picture.name.replace(/ /g, '-').toLowerCase()}`;
            await picture.mv(fileName);
            picture = fileName.replace("public", "");
            body.uploadPicture = picture;
        }

        let checkUser = await User.findOne({
            _id: req.user._id,
            role: { $in: ['admin', 'manager', 'owner'] }
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }


        
        let newProduct = new service({
            type : 'service',
            name : req.body.name,
            companyId : req.user.companyId,
        })
        newProduct = await newProduct.save()

        req.body.productId = newProduct._id


        req.body.userId = req.user._id;

        let result = await discount.create(req.body);

        return res.status(200).json({
            status: "success",
            message: "Discount Added",
            data: result
        })
    } catch (err) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}

const updateDiscount = async (req, res) => {
    try {
        let body = req.body;
        let discountSchema = new SimpleSchema({
            name: { type: String, required: true },
            startTime: { type: String, required: false },
            endTime: { type: String, required: false },
            percentage: { type: String, required: false },
            uploadPicture: { type: String, required: false }
        }).newContext();

        discountSchema.validate(req.body);

        if (!discountSchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: discountSchema.validationErrors()
            })
        }

        const discountData = {
            name: body.name,
            startTime: body.startTime,
            endTime: body.endTime,
            uploadPicture: body.uploadPicture,
            percentage: body.percentage,
            active: body.active
        };

        let result = await discount.findByIdAndUpdate({ _id: req.params.id }, discountData, { new: true });

        return res.status(200).json({
            status: "success",
            message: "Discount updated",
            data: result
        })
    } catch (err) {
        console.log(err)
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}

const getDiscount = async (req, res) => {
    try {
        let result = await discount.find({}).sort({ createdAt: -1 });
        return res.status(200).json({
            status: "success",
            message: "All Discount",
            data: result
        })
    } catch (error) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}

const getSingleDiscount = async (req, res) => {
    try {
        let result = await discount.find({ _id: req.params.id });
        return res.status(200).json({
            status: "success",
            message: "get discount",
            data: result
        })
    } catch (error) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}

const deleteDiscount = async (req, res) => {
    try {
        let result = discount.findOneAndDelete({ _id: req.params.id }).exec((err, deletedPrivilege) => {
            if (err) {
                return res.status(200).json({
                    status: "error",
                    message: err.message
                });
            }
        });

        return res.status(200).json({
            status: "success",
            message: "discount deleted successfully",
            data: result
        })
    } catch (err) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}


export default {
    createDiscount,
    updateDiscount,
    getDiscount,
    getSingleDiscount,
    deleteDiscount,
}
