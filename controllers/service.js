import mongoose from 'mongoose';
import SimpleSchema from 'simpl-schema';
import service from '../models/service.js';
import serviceCat from '../models/serviceCategory.js';
import { io } from '../index.js'; // Adjust the path as needed

const createServiceCat = async (req, res) => {
    try {

        let serviceCatSchema = new SimpleSchema({
            name: { type: String, required: false },
            description: { type: String, required: false }
        }).newContext();

        serviceCatSchema.validate(req.body);

        if (!serviceCatSchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: serviceCatSchema.validationErrors()
            })
        }
        const checkService = await serviceCat.findOne({ name: req.body.name, companyId: req.user.companyId });
        if (checkService) return res.status(200).json({
            status: "error",
            message: "Service Cat already exist"
        });

        req.body.userId = req.user._id;
        let result = await serviceCat.create(req.body);

        io.emit('serviceAdded', result);

        return res.status(200).json({
            status: "success",
            message: "Service Type Created",
            data: result
        })
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}

const createService = async (req, res) => {
    try {

        let serviceSchema = new SimpleSchema({
            name: { type: String, required: false },
            price: { type: String, required: false },
            category: { type: String, required: false },
        }).newContext();

        serviceSchema.validate(req.body);

        if (!serviceSchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: serviceSchema.validationErrors()
            })
        }
        const checkService = await service.findOne({ name: req.body.name });
        if (checkService) return res.status(200).json({
            status: "error",
            message: "Service already exist"
        });
        req.body.userId = req.user._id;
        req.body.companyId = req.user.companyId

        const checkServiceType = await serviceCat.findOne({ name: req.body.category });
        if (!checkServiceType) {
            return res.status(409).json({
                status: "error",
                message: "Service Category not found",
            })
        }

        let result = await service.create(req.body);

        return res.status(200).json({
            status: "success",
            message: "Service Created",
            data: result
        })
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}

const updateService = async (req, res) => {
    try {

        let serviceSchema = new SimpleSchema({
            name: { type: String, required: false },
            price: { type: String, required: false },
        }).newContext();

        serviceSchema.validate(req.body);

        if (!serviceSchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: serviceSchema.validationErrors()
            })
        }

        let serviceData = {
            name: req.body.name,
            price: req.body.price
        }

        let result = await service.findByIdAndUpdate({ _id: req.params.id, userId: req.user._id }, serviceData, { new: true });

        return res.status(200).json({
            status: "success",
            message: "Service updated",
            data: result
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}

const getAllService = async (req, res) => {
    try {
        const serviceCategories = ["maintenance", "engine", "interior", "underbody", "exterior"];

        const serviceData = {};

        // Fetch services for each category
        for (const category of serviceCategories) {
            const services = await service.find({ category: category, companyId: req.user.companyId }).sort({ createdAt: -1 }).lean();
            console.log(services);
            console.log(req.user.companyId)
            serviceData[category] = services;
        }

        return res.status(200).json({
            status: "success",
            message: "All Services Data",
            data: serviceData
        });
    } catch (err) {
        console.error('Error getting all services:', err);
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while getting all services",
            data: null,
            trace: err.message
        });
    }
};


const getSingleService = async (req, res) => {
    try {
        let result = await service.find({ _id: req.params.id, userId: req.user._id });
        return res.status(200).json({
            status: "success",
            message: "service data",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}

const deleteService = async (req, res) => {
    try {
        let result = service.findOneAndDelete({ _id: req.params.id, userId: req.user._id }).exec((err, deletedPrivilege) => {
            if (err) {
                return res.status(500).json({
                    status: "error",
                    message: err.message
                });
            }
        });

        return res.status(200).json({
            status: "success",
            message: "Service deleted successfully",
            data: result
        })
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}


export default {
    createServiceCat,
    createService,
    updateService,
    getAllService,
    getSingleService,
    deleteService,
}
