import mongoose from 'mongoose';
import SimpleSchema from 'simpl-schema';
import coupon from '../models/coupon.js';
import helpers from '../utils/helpers.js';
import User from '../models/users.js';
import service from '../models/service.js';

const createCoupon = async (req, res) => {
    try {
        let body = req.body;
        let couponSchema = new SimpleSchema({
            name: { type: String, required: true },
            couponCode: { type: String, required: false },
            startTime: { type: String, required: false },
            endTime: { type: String, required: false },
            percentage: { type: String, required: false },
            uploadPicture: { type: String, required: false }
        }).newContext();

        couponSchema.validate(req.body);

        if (!couponSchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: couponSchema.validationErrors()
            })
        }
        const checkCoupon = await coupon.findOne({ name: req.body.name });
        if (checkCoupon) return res.status(200).json({
            status: "error",
            message: "Coupon already created"
        });

        let couponCode = req.body.couponCode ? req.body.couponCode : helpers.couponCode();

        req.body.couponCode = couponCode;

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

        req.body.userId = req.user._id;
        req.body.companyId = req.user.companyId


        let newProduct = new service({
            type : 'service',
            name : req.body.name,
            companyId : req.user.companyId,
        })
        newProduct = await newProduct.save()

        req.body.productId = newProduct._id



        let result = await coupon.create(req.body);

        // Create product for the Coupon 

     
    

        return res.status(200).json({
            status: "success",
            message: "Coupon Created",
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

const updateCoupon = async (req, res) => {
    try {
        let body = req.body;
        let couponSchema = new SimpleSchema({
            name: { type: String, required: false },
            startTime: { type: String, required: false },
            endTime: { type: String, required: false },
            percentage: { type: String, required: false },
            uploadPicture: { type: String, required: false },
            active: { type: String, required: false }
        }).newContext();

        couponSchema.validate(req.body);

        // if (!couponSchema.isValid()) {
        //     return res.status(400).json({
        //         status: "error",
        //         message: "Please fill all the fields to proceed further!",
        //         trace: couponSchema.validationErrors()
        //     })
        // }

        const couponData = {
            name: body.name,
            startTime: body.startTime,
            endTime: body.endTime,
            uploadPicture: body.uploadPicture,
            percentage: body.percentage,
            active: body.active
        };

        let result = await coupon.findByIdAndUpdate({ _id: req.params.id }, couponData, { new: true });

        return res.status(200).json({
            status: "success",
            message: "Coupon updated",
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

const getCoupon = async (req, res) => {
    try {
        let result = await coupon.find({companyId : req.user.companyId}).sort({ createdAt: -1 });
        return res.status(200).json({
            status: "success",
            message: "All Coupon",
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

const getSingleCoupon = async (req, res) => {
    try {
        let result = await coupon.find({ _id: req.params.id });
        return res.status(200).json({
            status: "success",
            message: "get coupon",
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

const deleteCoupon = async (req, res) => {
    try {
        let result = coupon.findOneAndDelete({ _id: req.params.id }).exec((err, deletedPrivilege) => {
            if (err) {
                return res.status(200).json({
                    status: "error",
                    message: err.message
                });
            }
        });

        return res.status(200).json({
            status: "success",
            message: "Coupon deleted successfully",
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
    createCoupon,
    updateCoupon,
    getCoupon,
    getSingleCoupon,
    deleteCoupon,
}
