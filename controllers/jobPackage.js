import SimpleSchema from 'simpl-schema';
import helper from '../utils/helpers.js';
import User from '../models/users.js';
import jobPackage from '../models/jobPackage.js';
import coupon from '../models/coupon.js';
import discount from '../models/discount.js';
import service from '../models/service.js';

const createJobPackage = async (req, res) => {
    try {
        let body = req.body;
        const jobPackageSchema = new SimpleSchema({
            name: { type: String, required: false },
            cost: { type: Number, required: false },
            services: {
                type: Array,
                required: false
            },
            'services.$': {
                type: String
            }
        }).newContext();

        if (!jobPackageSchema.validate(body)) return res.status(400).json({
            status: "error",
            message: "Please fill all the fields to proceed further!",
            trace: jobPackageSchema.validationErrors()
        });

        let checkUser = await User.findOne({
            _id: req.user._id,
            role: { $in: ['admin', 'owner', 'csr', 'manager'] }
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }
        let checkPackage = await jobPackage.findOne({ name: body.name });
        if (checkPackage) {
            return res.status(409).json({
                status: "error",
                message: "Package already exists",
                data: checkPackage,
            })
        }

        let creatProduct = new service({
            type: "package",
            name: req.body.name,
            price: req.body.cost,
            companyId: req.user.companyId
        })
        creatProduct = await creatProduct.save();

        req.body.productId = creatProduct._id;
        req.body.companyId = req.user.companyId;

        let result = await jobPackage.create(req.body);

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

const getJobPackage = async (req, res) => {
    try {
        const jobPackageId = req.params.id;

        // Find the jobPackage document
        const details = await jobPackage.findOne({ _id: jobPackageId }).lean();

        // Extract service IDs from the jobPackage document
        const serviceIds = details.services;

        // Find corresponding service documents
        const services = await service.find({ _id: { $in: serviceIds } }).lean();

        // Combine jobPackage and services data
        const result = {
            ...details,
            services: services
        };

        return res.status(200).json({
            status: "success",
            message: "Data get Successfully",
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

const getAllPackage = async (req, res) => {
    try {
        // Find all job packages
        const allJobPackages = await jobPackage.find().lean();

        // Create an array to store the results
        const results = [];

        // Iterate through each job package
        for (const jobPackages of allJobPackages) {
            // Extract service IDs from the jobPackage document
            const serviceIds = jobPackages.services;

            // Find corresponding service documents
            const servicesDetails = await service.find({ _id: { $in: serviceIds } }).lean();

            // Combine jobPackage and services data
            const finalData = {
                ...jobPackages,
                servicesDetails
            };

            // Add the result to the results array
            results.push(finalData);
            // console.log(jobPackages);
        }

        // Send the results as JSON response
        return res.status(200).json({
            status: "success",
            message: "Data get Successfully",
            data: results
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while proceeding your request.",
            trace: error.message
        });
    }
}

const getAllServices = async (req, res) => {
    try {

        let packageData = await jobPackage.find({ companyId: req.user.companyId }).populate('services');
        let couponData = await coupon.find({ companyId: req.user.companyId });

        // Step 1: Query the User collection
        // Find users whose companyId matches req.user.companyId and whose role is either 'csr' or 'technician'
        const users = await User.find({
            companyId: req.user.companyId,
        }).select('_id');  // Select only the _id field to get a list of user IDs

        // Extract the list of user IDs
        const userIds = users.map(user => user._id);

        // Step 2: Query the attendRequest collection
        // Find attendance requests where userId is in the list of user IDs
        let discountData = await discount.find({ userId: { $in: userIds } });

        return res.status(200).json({
            status: "success",
            message: "All Package Data",
            data: [{ Package: packageData, Coupons: couponData, Discount: discountData }]
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
}

export default {
    createJobPackage,
    getJobPackage,
    getAllPackage,
    getAllServices
};