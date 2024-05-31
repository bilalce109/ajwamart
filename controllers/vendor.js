import mongoose from 'mongoose';
import SimpleSchema from 'simpl-schema';
import vendor from '../models/vendor.js';
import helper from '../utils/helpers.js';

const createVendor = async (req, res) => {
    try {
        let body = req.body;
        let vendorSchema = new SimpleSchema({
            name: { type: String, required: true },
            phone: { type: String, required: false },
            email: { type: String, required: false },
            address: { type: String, required: false },
            uploadPicture: { type: String, required: false }
        }).newContext();

        vendorSchema.validate(req.body);

        if (!vendorSchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: vendorSchema.validationErrors()
            })
        }
        const checkVendor = await vendor.findOne({ name: req.body.name });
        if (checkVendor) return res.status(200).json({
            status: "error",
            message: "Vendor already exist"
        });

        if (req.files) {
            let picture = await helper.saveRequest(req.files.uploadPicture);
            body.uploadPicture = picture;
        }

        let result = await vendor.create(req.body);

        return res.status(200).json({
            status: "success",
            message: "Vendor Created",
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

const updateVendor = async (req, res) => {
    try {
        let body = req.body;
        let vendorSchema = new SimpleSchema({
            name: { type: String, required: true },
            phone: { type: String, required: false },
            email: { type: String, required: false },
            uploadPicture: { type: String, required: false }
        }).newContext();

        vendorSchema.validate(req.body);

        if (!vendorSchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: vendorSchema.validationErrors()
            })
        }

        if (req.files) {
            let picture = req.files.uploadPicture;
            let fileName = `public/coupon/${Date.now()}-${picture.name.replace(/ /g, '-').toLowerCase()}`;
            await picture.mv(fileName);
            picture = fileName.replace("public", "");
            body.uploadPicture = picture;
        }

        const vendorData = {
            name: body.name,
            phone: body.phone,
            email: body.email,
            uploadPicture: body.uploadPicture
        };
        let result = await vendor.findByIdAndUpdate({ _id: req.params.id }, vendorData, { new: true });

        return res.status(200).json({
            status: "success",
            message: "Vendor updated",
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

const getVendor = async (req, res) => {
    try {
        let result = await vendor.find({}).sort({ createdAt: -1 });
        return res.status(200).json({
            status: "success",
            message: "All Vendor",
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

const getSingleVendor = async (req, res) => {
    try {
        let result = await vendor.findOne({ _id: req.params.id });
        return res.status(200).json({
            status: "success",
            message: "get vendor",
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

const deleteVendor = async (req, res) => {
    try {
        let result = vendor.findOneAndDelete({ _id: req.params.id }).exec((err, deletedPrivilege) => {
            if (err) {
                return res.status(200).json({
                    status: "error",
                    message: err.message
                });
            }
        });

        return res.status(200).json({
            status: "success",
            message: "Vendor deleted successfully",
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
    createVendor,
    getVendor,
    getSingleVendor,
    updateVendor,
    deleteVendor,
}
