import mongoose from 'mongoose';
import SimpleSchema from 'simpl-schema';
import job from '../models/job.js';
import serviceType from '../models/serviceCategory.js';
import User from '../models/users.js';
import service from '../models/service.js';
import inventory from '../models/inventory.js';
import users from '../models/users.js';
import customer from '../models/customer.js';
import vehicle from '../models/vehicle.js';
import jobService from '../service/job.js';
import helpers from '../utils/helpers.js';
import invoice from '../models/invoice.js';
import userService from '../service/userService.js';
import jobPackage from '../models/jobPackage.js';
import { io } from '../index.js'; // Adjust the path as needed


const createJob = async (req, res) => {
    try {
        let body = req.body;
        let vehicle_id;

        let jobSchema = new SimpleSchema({
            vinNumber: { type: String, required: true },
            license: { type: String, required: false },
            make: { type: String, required: false },
            model: { type: String, required: false },
            engineSize: { type: String, required: false },
            fleet: { type: String, required: false },
            custName: { type: String, required: true },
            custAddress: { type: String, required: false },
            custNumber: { type: Number, required: false },
            date: { type: String, required: false },
            service: {
                type: Array,
                required: false
            },
            'service.$': {
                type: Object
            },
            'service.$.id': {
                type: String
            },
            'service.$.price': {
                type: Number
            }

        }).newContext();
        jobSchema.validate(req.body);

        if (!jobSchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: jobSchema.validationErrors()
            })
        }

        // Check user role
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

        // Check if the customer already exists
        let checkCustomer = await customer.findOne({ name: req.body.custName, number: req.body.custNumber });
        let createCustomer;
        let result;
        let checkExistVehicle;
        let newVehicleData

        checkExistVehicle = await vehicle.findOne({ vinNumber: req.body.vinNumber });
        // return res.json(checkCustomer);

        if (!checkCustomer) {
            // If customer doesn't exist, create a new customer and vehicle
            req.body.userId = req.user._id;
            req.body.company = req.body.company ? checkUser.companyId : null;

            checkExistVehicle = await vehicle.findOne({ vinNumber: req.body.vinNumber });
            if (!checkExistVehicle) {
                newVehicleData = {
                    vinNumber: req.body.vinNumber,
                    license: req.body.license,
                    make: req.body.make,
                    model: req.body.model,
                    engineSize: req.body.engineSize,
                    fleet: req.body.fleet,
                    companyId: req.user.companyId,
                    userId: req.user._id,
                }
                checkExistVehicle = await vehicle.create(newVehicleData);

            }

            req.body.company = checkUser.companyId;

            let vehicleData = {
                company: req.body.company,
                userId: req.user._id,
                name: req.body.custName,
                address: req.body.custAddress,
                number: req.body.custNumber,
            }

            createCustomer = await customer.create({ ...vehicleData, vehicles: [checkExistVehicle._id], companyId: req.user.companyId });
            req.body.customer = createCustomer._id;
            req.body.vehicle = checkExistVehicle._id;

        } else {
            // If customer exists, check if the vehicle already exists

            if (!checkExistVehicle) {

                newVehicleData = {
                    vinNumber: req.body.vinNumber,
                    license: req.body.license,
                    make: req.body.make,
                    model: req.body.model,
                    engineSize: req.body.engineSize,
                    fleet: req.body.fleet,
                    companyId: req.user.companyId,
                    userId: req.user._id,
                }
                let newVehicleDetails = await vehicle.create(newVehicleData);
                await customer.findByIdAndUpdate({ _id: checkCustomer._id }, { $push: { vehicles: newVehicleDetails._id } }, { new: true });
                req.body.customer = checkCustomer._id;
                req.body.vehicle = newVehicleDetails._id;
            } else {
                await customer.findByIdAndUpdate({ _id: checkCustomer._id }, { $push: { vehicles: checkExistVehicle._id } }, { new: true });
                req.body.customer = checkCustomer._id;
                req.body.vehicle = checkExistVehicle._id;
            }

        }

        req.body.jobNumber = await helpers.generateSixDigitRandomNumber()
        req.body.vehicle = checkExistVehicle._id;
        req.body.companyId = checkUser.companyId;




        // Calculate TotalQuantity & discounts

        let totalPrice = 0;
        let totalQty = 0;
        req.body.service?.map((e) => {
            totalPrice += e.price;
            totalQty += 1;
        })


        req.body.totalPrice = totalPrice
        req.body.totalQty = totalQty;



        // Create the job
        result = await job.create(req.body);
        result = await jobService.getJobById(result._id);
        // Find the invoice document based on some condition (e.g., vehicleId)
        const invoiceDoc = await invoice.findOne({ vehicleId: checkExistVehicle._id });

        // Assign the invoice document to the invoiceHistory field
        result.invoiceHistory = invoiceDoc;
        io.emit('jobCreated', result);
        return res.status(200).json({
            status: "success",
            message: "Job Created",
            data: result
        });
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}


const updateJobByCSR = async (req, res) => {
    try {
        let body = req.body;


        let checkUser = await User.findOne({
            _id: req.user._id,
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }

        let getJob = await job.findById({ _id: req.params.id });

        let service = req.body.service;
        let totalQty = 0;
        let totalPrice = 0;
        let allServices = getJob.service?.map((e) => {
            totalQty += 1;
            totalPrice += e.price
            return {
                id: e.id,
                price: e.price,
                qty: e.qty
            }
        })

        service = [...allServices, ...service]; // Concatenate arrays using spread operator

        req.body.totalQty = totalQty + 1;
        req.body.totalPrice = totalPrice + req.body.service[0].price
        req.body.service = service;



        let result = await job.findByIdAndUpdate({ _id: req.params.id }, { $set: req.body }, { new: true });


        return res.status(200).json({
            status: "success",
            message: "Job updated",
            data: result
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}

const assignJobToTechnician = async (req, res) => {
    try {
        let jobId = req.params.id;
        let checkJob = await job.findOne({
            _id: jobId
        });
        if (!checkJob) {
            return res.status(409).json({
                status: "error",
                message: "Job Not Found",
                data: null,
                track: `${jobId} Job is not Found`
            })
        }

        let checkUser = await User.findOne({
            _id: req.user._id,
            role: 'technician'
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }

        // Separate update operations for service and inventory
        let result = await job.findByIdAndUpdate(
            { _id: req.params.id },
            { assignedTechnician: req.user._id },
            { new: true }
        );

        return res.status(200).json({
            status: "success",
            message: "Technician Assign to Job",
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

const updateTechnicianByCsr = async (req, res) => {
    try {
        let jobId = req.params.id;
        let csr = req.body.csr;
        let checkJob = await job.findOne({
            _id: jobId
        });
        if (!checkJob) {
            return res.status(409).json({
                status: "error",
                message: "Job Not Found",
                data: null,
                track: `${jobId} Job is not Found`
            })
        }

        let checkUser = await User.findOne({
            _id: req.body.csr,
            role: 'csr'
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }

        // Separate update operations for service and inventory
        let result = await job.findByIdAndUpdate(
            { _id: req.params.id },
            { assignedTechnician: req.body.csr },
            { new: true }
        );

        console.log(result)

        return res.status(200).json({
            status: "success",
            message: "Technician Assign to Job",
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


const listOfTechnician = async (req, res) => {
    try {

        let checkUser = await User.find({
            role: 'csr',
            companyId: req.user.companyId
        });

        return res.status(200).json({
            status: "success",
            message: "Technician Assign to Job",
            data: checkUser
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

const updateJobByTechnician = async (req, res) => {
    try {
        let body = req.body;
        // let jobSchema = new SimpleSchema({
        //     recommendedService: {
        //         type: Array,
        //         required: false
        //     },
        //     'recommendedService.$': {
        //         type: Object
        //     },
        //     'recommendedService.$.id': {
        //         type: String
        //     },
        //     inventory: {
        //         type: Array,
        //         required: false
        //     },
        //     'inventory.$': {
        //         type: Object
        //     },
        //     'inventory.$.id': {
        //         type: String
        //     },

        // }).newContext();

        // jobSchema.validate(req.body);

        // if (!jobSchema.isValid()) {
        //     return res.status(400).json({
        //         status: "error",
        //         message: "Please fill all the fields to proceed further!",
        //         trace: jobSchema.validationErrors()
        //     })
        // }

        let checkUser = await User.findOne({
            assignedTechnician: req.user._id,
            role: 'technician'
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }

        // Separate update operations for service and inventory
        let result = await job.findByIdAndUpdate(
            { _id: req.params.id },
            { $push: { service: req.body.service } },
            { new: true }
        );

        let Job = await jobService.getJobById(req.params.id)

        return res.status(200).json({
            status: "success",
            message: "Job updated",
            data: Job
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

const updateRecommended = async (req, res) => {
    try {
        const jobId = req.params.id;
        const recommendedServiceId = req.params.serviceId; // ID of the recommendedService to update

        let checkUser = await User.findOne({
            _id: req.user._id,
            role: 'csr'
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }

        // Find the job by ID
        const jobData = await job.findById(jobId);
        if (!jobData) {
            return res.status(404).json({
                status: "error",
                message: "Job not found",
                data: null
            });
        }

        // Find the index of the recommendedService with the given ID
        const index = jobData.recommendedService.findIndex(service => service._id.toString() === recommendedServiceId);
        if (index === -1) {
            return res.status(400).json({
                status: "error",
                message: "Recommended service not found",
                data: null
            });
        }

        // Update the checked status of the recommendedService at the found index to true
        jobData.recommendedService[index].checked = true;

        // Save the updated job
        await jobData.save();

        return res.status(200).json({
            status: "success",
            message: `Checked status updated to true for recommended service with ID ${recommendedServiceId}`,
            data: jobData.recommendedService[index]
        });
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while processing your request.",
            data: null,
            trace: err.message
        });
    }
}

const addRecommended = async (req, res) => {
    try {
        let jobId = req.params.id;

        // Check if user is a technician
        let checkUser = await User.findOne({
            _id: req.user._id,
            role: 'csr'
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            });
        }

        // Find the job by ID
        const jobData = await job.findById(jobId);
        if (!jobData) {
            return res.status(404).json({
                status: "error",
                message: "Job not found",
                data: null
            });
        }

        // Filter the checked recommendedService items
        const checkedRecommendedService = jobData.recommendedService.filter(service => service.checked);

        // Filter the checked inventory items
        const checkedInventory = jobData.inventory.filter(item => item.checked);

        // Initialize an array to store new recommended services to add
        const newRecommendedServices = [];
        const newInventoryItems = [];

        // Iterate over each checked recommendedService
        for (const service of checkedRecommendedService) {
            // Check if the service is already in the service array based on _id
            const alreadyAdded = jobData.service.some(existingService => existingService._id.toString() === service._id.toString());
            if (!alreadyAdded) {
                // Push the checked recommendedService to the newRecommendedServices array
                newRecommendedServices.push(service);
            }
        }

        // Push only the new recommendedService items to the service array
        if (newRecommendedServices.length > 0) {
            let result = await job.findByIdAndUpdate(
                { _id: jobId },
                { $push: { service: { $each: newRecommendedServices } }, $set: { status: 'complete' } },
                { new: true }
            );

            return res.status(200).json({
                status: "success",
                message: "New checked recommended services added to job",
                data: result
            });
        } else {
            return res.status(400).json({
                status: "error",
                message: "No new checked recommended services found",
                data: null
            });
        }
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while processing your request.",
            data: null,
            trace: err.message
        });
    }
}

const getJob = async (req, res) => {
    let joQuery = {}
    let pending = [];
    let completed = [];
    let paid = [];
    try {

        // Get Job Based on Token
        let checkUser = await userService.getUserDetails(req.user._id);

        if (!checkUser._id) {
            return res.status(500).json({
                status: "error",
                message: "user not found",
                data: null,
            });
        }
        if (checkUser?.role == 'csr') {
            joQuery.userId = req.user._id
        }
        else if (checkUser?.role == 'manager' || checkUser?.role == 'owner') {
            joQuery.companyId = req.user.companyId

        }
        else {
            joQuery.companyId = req.user.companyId
        }


        let result = await job.find(joQuery).sort({ createdAt: -1 }).lean();
        result = await Promise.all(result.map(async (e) => {
            if (e.status == 'pending') {
                pending.push(await jobService.getJobById(e._id));
            }
            else if (e.status == 'completed') {
                completed.push(await jobService.getJobById(e._id))
            }
            else {
                paid.push(await jobService.getJobById(e._id))

            }
            return await jobService.getJobById(e._id);

        }))
        return res.status(200).json({
            status: "success",
            message: "All Jobs",
            data: result,
            all: { paid, completed, pending }


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

const getSingleJob = async (req, res) => {
    try {
        let checkUser = await User.findOne({
            _id: req.user._id,
            role: { $in: ['admin', 'manager', 'technician', 'csr', 'owner'] }
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }
        let result = await job.findOne({ _id: req.params.id }).lean();
        result = await jobService.getJobById(req.params.id)
        // if (result.service.length > 0) {
        //     result.service = await Promise.all(result.service.map(async (e) => {
        //         return await service.findOne({
        //             _id: e.id
        //         }).select({ type: 1, name: 1, price: 1, category: 1 });
        //     }))
        // }
        // if (result.recommendedService.length > 0) {
        //     result.recommendedService = await Promise.all(result.recommendedService.map(async (e) => {
        //         return await service.findOne({
        //             _id: e.id
        //         }).select({ type: 1, name: 1, price: 1, category: 1 });
        //     }))
        // }
        // if (result.inventory.length > 0) {
        //     result.inventory = await Promise.all(result.inventory.map(async (e) => {
        //         return await inventory.findOne({
        //             _id: e.id
        //         }).select({ type: 1, name: 1, price: 1, category: 1 });
        //     }))
        // }
        // if (result.assignedTechnician) {
        //     result.assignedTechnician = await users.findOne({
        //         _id: result.assignedTechnician
        //     }).select({ fullName: 1, email: 1 });
        // }
        return res.status(200).json({
            status: "success",
            message: "get job",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: error.message
        });
    }
}

const deleteJob = async (req, res) => {
    try {
        let result = job.findOneAndDelete({ _id: req.params.id }).exec((err, deletedPrivilege) => {
            if (err) {
                return res.status(500).json({
                    status: "error",
                    message: err.message
                });
            }
        });

        return res.status(200).json({
            status: "success",
            message: "Job deleted successfully",
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

const getJobsTechnician = async (req, res) => {
    try {
        // Query to retrieve jobs with pending status
        const pendingJobs = await job.find({ status: 'pending' });

        // Query to retrieve jobs with checkout status
        const checkoutJobs = await job.find({ status: 'complete' });

        // Return the results
        return res.status(200).json({
            status: "success",
            message: "Jobs retrieved successfully",
            data: {
                pendingJobs: pendingJobs,
                checkoutJobs: checkoutJobs,
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while processing your request.",
            data: null,
            trace: err.message
        });
    }
};


const updateJobStatus = async (req, res) => {
    const { id } = req.params;
    const { status, servicesData } = req.body;

    try {
        // Update the job status
        const updatedJob = await job.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        // If the status is "paid" and there is services data provided
        if (status === "paid" && Array.isArray(servicesData) && servicesData.length > 0) {
            // Process each item ID in servicesData
            for (const itemId of servicesData) {
                try {
                    // Convert item ID to ObjectId and find the item in the inventory
                    const item = await inventory.findOne({ productId: mongoose.Types.ObjectId(itemId) });

                    if (item) {
                        // Update sales and available counts
                        item.sales += 1;
                        item.available -= 1;
                        // Save the updated item
                        await item.save();
                    } else {
                        console.log(`Item with productId ${itemId} not found in inventory.`);
                    }

                    if (item.available < threshold) {
                        item.status = false;
                        // Save the updated item
                        await item.save();
                    }
                } catch (error) {
                    console.error(`Error processing item with productId ${itemId}: ${error.message}`);
                }
            }
        }

        // Respond with the updated job data
        return res.status(200).json({
            status: "success",
            message: "Job updated successfully",
            data: updatedJob
        });
    } catch (error) {
        console.error(`Error updating job status: ${error.message}`);
        // Return error response
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while processing your request.",
            data: null,
            trace: error.message
        });
    }
};




const updateJobPackage = async (req, res) => {
    try {
        const jobId = req.params.id;
        const { packageId, servicesData } = req.body;

        // Find the job by ID
        let jobData = await job.findById(jobId);

        // Retrieve the package details including its services
        let jobPackageData = await jobPackage.findById(packageId).populate('services');

        // Calculate the total price of the job
        let totalServiceCost = 0;

        // Fetch each service document and sum up the prices
        for (const serviceObj of servicesData) {
            // Extract the service ID from the object
            const serviceId = serviceObj.id;
            // Find the service by its ID
            let serviceData = await service.findById(serviceId);

            // If service is found, add its cost to the total service cost
            if (serviceData) {
                totalServiceCost += serviceData.price;
            }
        }

        // Calculate the total price of the job by adding the package price and the total service cost
        let totalJobPrice = jobPackageData.cost + totalServiceCost;

        // Update job with the new package, total service cost, total price, and services IDs
        jobData.package = jobPackageData;
        jobData.totalPrice = totalJobPrice;
        // Update job services with service IDs from req.body
        jobData.service = servicesData;

        // Save the updated job
        await jobData.save();

        res.status(200).json({ status: 'success', message: 'Job package updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: 'error', message: 'An unexpected error occurred while updating the job package.' });
    }
}





export default {
    createJob,
    updateJobByCSR,
    updateJobByTechnician,
    updateRecommended,
    assignJobToTechnician,
    getJobsTechnician,
    addRecommended,
    getJob,
    getSingleJob,
    deleteJob,
    updateTechnicianByCsr,
    listOfTechnician,
    updateJobStatus,
    updateJobPackage
}
