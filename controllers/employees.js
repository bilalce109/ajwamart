import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import SimpleSchema from 'simpl-schema';
import employees from '../models/employees.js';
import privilege from '../models/privilege.js';
import helper from '../utils/helpers.js';
import job from '../models/job.js';
import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import role from '../models/role.js';
import attendance from '../models/attendance.js';
import attendRequest from '../models/attendRequest.js';

const createEmployees = async (req, res) => {
    try {
        let body = req.body;

        let parentUser = await User.findOne({ _id: req.user._id });

        let employeesSchema = new SimpleSchema({
            email: { type: String, required: false },
            fullName: { type: String, required: false },
            phone: { type: String, required: false },
            profile_picture: { type: String, required: false },
            employeeType: { type: String, required: false },
            // privilege: { type: String, required: false }
        }).newContext();

        employeesSchema.validate(req.body);

        if (!employeesSchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: employeesSchema.validationErrors()
            })
        }

        // check owner, if owner manager should be in assignee
        let assignees = [];
        let checkAssignee = await User.findOne({ _id: req.user._id });
        if (checkAssignee.role == "owner" || checkAssignee.role == "admin") {
            assignees.push(req.user._id);
            if (req.body.employeeType == ["technician", "csr"]) {
                let checkManager = await employees.find({ userId: req.user._id, employeeType: "manager" }).lean();
                if (checkManager.length > 0) {
                    checkManager.map((e) => {
                        assignees.push(e._id);
                    })
                }
            }
        } else if (checkAssignee.role == "manager") {
            assignees.push(req.user._id);
        } else {
            return res.status(200).json({
                status: "error",
                message: "Not eligible to create employee"
            });
        }

        //end check owner, if owner manager should be in assignee

        const checkEmployees = await employees.findOne({ companyId: req.user.companyId, fullName: req.body.fullName });
        if (checkEmployees) return res.status(200).json({
            status: "error",
            message: "Employee already exists"
        });

        if (req.files && req.files.profile_picture) {
            let picture = await helper.saveRequest(req.files.profile_picture);
            body.profile_picture = picture;
        }

        // const privilegeNames = req.body.privilege.split(',');

        // const checkPrivilege = await privilege.find({ name: { $in: privilegeNames } });

        // // Check if all requested privileges have corresponding entries
        // const missingPrivileges = privilegeNames.filter(name => !checkPrivilege.some(privilege => privilege.name === name));
        // let privilegeIds;

        // if (missingPrivileges.length > 0) {
        //     return res.status(409).json({
        //         status: "Not Found",
        //         message: "Some privileges not found in the collection:",
        //         data: missingPrivileges
        //     })

        // } else {
        //     // Extract _id values from the found privileges
        //     privilegeIds = checkPrivilege.map(e => e._id);
        // }

        // // Handle the case where no matching privileges are found
        // if (checkPrivilege.length === 0) {
        //     return res.status(409).json({
        //         status: "error",
        //         message: "No such privilege exists"
        //     });
        // }

        const validRoles = ["manager", "csr", "technician"];
        const employeeType = req.body.employeeType;

        if (!validRoles.includes(employeeType)) {
            return res.status(400).json({
                status: "error",
                message: 'Invalid employeeType',
                data: null,
                track: `${employeeType} not exist in role`
            });
        }

        let password = helper.generatePassword();

        let hashedPass = await bcrypt.hash(password, 10);

        const createUser = {
            fullName: body.fullName,
            email: body.email,
            role: body.employeeType,
            password: hashedPass,
            companyId: parentUser.companyId
        }

        const inserted = await new User(createUser).save();


        const employeeData = {
            userId: inserted._id,
            fullName: body.fullName,
            email: body.email,
            phone: body.phone,
            profile_picture: body.profile_picture,
            employeeType: body.employeeType,
            // privilege: privilegeIds,
            assigned: assignees,
            companyId: parentUser.companyId,
            password: password
        };

        // req.body.userId = req.user._id;

        let result = await employees.create(employeeData);


        inserted.verificationToken = jwt.sign({ id: inserted._id, fullName: inserted.fullName }, process.env.JWT_SECRET);
        await User.findByIdAndUpdate({ _id: inserted._id }, { $set: { verificationToken: inserted.verificationToken } }, { new: true })
        helper.sendPassword(password, inserted.email, inserted.fullName);
        let newResult = await employees.findOne({ _id: result._id }).lean();
        newResult.password = password;
        return res.status(200).json({
            status: "success",
            message: "Employee and user registration successful!",
            data: newResult
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

const updateEmployees = async (req, res) => {
    try {

        let body = req.body;

        let employeesSchema = new SimpleSchema({
            email: { type: String, required: false },
            fullName: { type: String, required: false },
            phone: { type: String, required: false },
            profile_picture: { type: String, required: false },
            // privilege: { type: String, required: false }
        }).newContext();

        employeesSchema.validate(req.body);

        if (!employeesSchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: employeesSchema.validationErrors()
            })
        }

        if (req.files) {
            let picture = await helper.saveRequest(req.files.profile_picture);
            body.profile_picture = picture;
        }

        // const privilegeNames = req.body.privilege.split(',');

        // const checkPrivilege = await privilege.find({ name: { $in: privilegeNames } });

        // // Check if all requested privileges have corresponding entries
        // const missingPrivileges = privilegeNames.filter(name => !checkPrivilege.some(privilege => privilege.name === name));
        // let privilegeIds;

        // if (missingPrivileges.length > 0) {
        //     return res.status(409).json({
        //         status: "Not Found",
        //         message: "Some privileges not found in the collection:",
        //         data: missingPrivileges
        //     })

        // } else {
        //     // Extract _id values from the found privileges
        //     privilegeIds = checkPrivilege.map(e => e._id);
        // }

        // if (!checkPrivilege) return res.status(200).json({
        //     status: "error",
        //     message: "No Such privilege exist"
        // });


        const employeeData = {
            fullName: body.fullName,
            email: body.email,
            phone: body.phone,
            profile_picture: body.profile_picture,
            employeeType: body.employeeType,
            // privilege: privilegeIds,
        };



        let result = await employees.findByIdAndUpdate({ _id: req.params.id, userId: req.user._id }, employeeData, { new: true });

        return res.status(200).json({
            status: "success",
            message: "Employees data updated",
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

const getAllEmployees = async (req, res) => {
    try {


        let checkUser = await User.findOne({
            _id: req.user._id,
            role: { $in: ['admin', 'owner', 'manager'] }
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `You don't have access  for this route`
            })
        }
        const employeeTypes = ["csr", "technician", "manager"];

        const employeesWithPrivileges = await employees.find({ companyId: checkUser.companyId, active: { $eq: true }, employeeType: { $in: employeeTypes } })
            .sort({ createdAt: -1 })
            .lean()
            // .populate({
            //     path: 'privilege',
            //     select: { name: 1 }
            // })
            .exec();

        // Separate data into CSR, Technician, and Manager arrays
        const CSRData = employeesWithPrivileges.filter(employee => employee.employeeType === 'csr');
        const technicianData = employeesWithPrivileges.filter(employee => employee.employeeType === 'technician');
        const managerData = employeesWithPrivileges.filter(employee => employee.employeeType === 'manager');

        return res.status(200).json({
            status: "success",
            message: "All Employees Data",
            data: {
                CSR: CSRData,
                technician: technicianData,
                manager: managerData
            }
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while getting all employees",
            data: null,
            trace: err.message
        });
    }
};

const getSingleEmployee = async (req, res) => {
    try {
        let result = await employees.findOne({ _id: req.params.id }).lean();
        let getUser = await User.findOne({ fullName: result.fullName })

        let query = {};

        if (!result) {
            return res.status(404).json({
                status: "error",
                message: "Employee not found",
                data: null
            });
        }

        // if (result.privilege.length > 0) {
        //     result.privilege = await Promise.all(result.privilege.map(async (e) => {
        //         return await privilege.findOne({
        //             _id: e
        //         }).select({ name: 1, module: 1 });
        //     }));
        // }

        if (result.employeeType == 'manager' || result.employeeType == 'owner') {
            query.companyId = getUser.companyId;
        }
        else if (result.employeeType == 'technician') {
            query.assignedTechnician = getUser._id;
        }
        else {
            query.userId = getUser._id;
        }

        let query2 = {
            userId: getUser._id
        };

        // Get start of the month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Get end of the month
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        query2.clockIn = { $gte: startOfMonth };
        query2.$or = [
            { clockOut: { $lte: endOfMonth } },
            { clockOut: { $exists: false } }
        ];


        result.job = await job.find(query)
            .populate({
                path: 'invoice',
                model: 'invoice' // Adjust the model name according to your schema
            }).populate({
                path: 'customer',
                select: 'name address number',
                populate: {
                    path: 'vehicles',
                    select: 'vinNumber license make year carType fleet',
                    model: 'vehicle'
                },
            });
        result.attendance = await attendance.find(query2);

        // Step 1: Query the User collection
        // Find users whose companyId matches req.user.companyId and whose role is either 'csr' or 'technician'
        const users = await User.find({
            fullName: result.fullName,
            companyId: req.user.companyId,
            role: { $in: ['csr', 'technician'] }
        }).select('_id');  // Select only the _id field to get a list of user IDs    

        // Extract the list of user IDs
        const userIds = users.map(user => user._id);

        // Step 2: Query the attendRequest collection
        // Find attendance requests where userId is in the list of user IDs

        result.attendRequest = await attendRequest.find({
            userId: { $in: userIds }
        });

        return res.status(200).json({
            status: "success",
            message: "Employee retrieved successfully",
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while processing your request.",
            data: null,
            trace: error.message
        });
    }
}

const deleteEmployee = async (req, res) => {
    try {
        let result = employees.findOneAndDelete({ userId: req.user._id, _id: req.params.id }).exec((err, deletedPrivilege) => {
            if (err) {
                return res.status(200).json({
                    status: "error",
                    message: err.message
                });
            }
        });

        return res.status(200).json({
            status: "success",
            message: "Employee deleted successfully",
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

const blockEmployee = async (req, res) => {
    try {
        let checkUser = await User.findOne({
            _id: req.user._id,
            role: { $in: ['csr', 'manager', 'owner', 'admin'] }
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }
        let id = req.params.id;
        let checkBlock = await employees.findOne({ _id: id, userId: req.user._id, active: false, companyId: checkUser.companyId });
        let result;
        if (!checkBlock) {
            result = await employees.findByIdAndUpdate({ userId: req.user._id, _id: id }, { active: false }, { new: true });
            return res.status(200).json({
                status: "success",
                message: "Employee block successfully",
                data: result
            });
        } else {
            return res.status(200).json({
                status: "success",
                message: "Employee already block",
                data: result
            });
        }
    } catch (err) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}

const listBlocked = async (req, res) => {
    try {
        let checkUser = await User.findOne({
            _id: req.user._id,
            role: { $in: ['csr', 'manager', 'owner', 'admin'] }
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            });
        }

        const employeeTypes = ["csr", "technician"];

        const employeesWithPrivileges = await employees.find({ companyId: req.user.companyId, employeeType: { $in: employeeTypes } })
            .sort({ createdAt: -1 })
            .lean();

        // Separate data into CSR and Technician arrays
        const CSRData = employeesWithPrivileges.filter(employee => employee.employeeType === 'csr');
        const technicianData = employeesWithPrivileges.filter(employee => employee.employeeType === 'technician');

        // Retrieve job counts for CSR employees
        const CSRJobCounts = await job.aggregate([
            { $match: { userId: { $in: CSRData.map(csr => csr.userId) } } },
            { $group: { _id: "$userId", jobCount: { $sum: 1 } } }
        ]);

        // Retrieve job counts for Technicians
        const TechnicianJobCounts = await job.aggregate([
            { $match: { assignedTechnician: { $in: technicianData.map(tech => tech.assignedTechnician) } } },
            { $group: { _id: "$assignedTechnician", jobCount: { $sum: 1 } } }
        ]);

        // Prepare the response
        const response = {
            CSR: CSRData.map(csr => ({ ...csr, jobCount: CSRJobCounts.find(jc => jc._id === csr.userId)?.jobCount || 0 })),
            technician: technicianData.map(tech => ({ ...tech, jobCount: TechnicianJobCounts.find(jc => jc._id === tech.assignedTechnician)?.jobCount || 0 }))
        };

        return res.status(200).json({
            status: "success",
            message: "All Employees Data with Job Counts",
            data: response
        });
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while getting all employees",
            data: null,
            trace: err.message
        });
    }
};


const unBlockUser = async (req, res) => {
    try {
        let checkUser = await User.findOne({
            _id: req.user._id,
            role: { $in: ['csr', 'manager', 'owner', 'admin'] }
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }
        let id = req.params.id;
        let checkBlock = await employees.findOne({ _id: id, userId: req.user._id, active: false, companyId: checkUser.companyId });
        let result;
        if (!checkBlock) {
            result = await employees.findByIdAndUpdate({ userId: req.user._id, _id: id }, { active: true }, { new: true });
            return res.status(200).json({
                status: "success",
                message: "Employee UnBlocked successfully",
                data: result
            });
        } else {
            return res.status(200).json({
                status: "success",
                message: "Employee already Un block",
                data: result
            });
        }
    } catch (err) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: err.message
        });
    }
}

const getEmployees = async (req, res) => {
    try {
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
        let result = await User.find({ companyId: checkUser.companyId })
            .select({ fullName: 1, email: 1, companyId: 1, role: 1 })
            .sort({ createdAt: -1 })
            .populate({
                path: 'companyId',
                select: { name: 1, address: 1, email: 1 }
            })
        return res.status(200).json({
            status: "success",
            message: "All Employees Data",
            data: result
        });

    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while getting all employees",
            data: null,
            trace: err.message
        });
    }
}


export default {
    createEmployees,
    updateEmployees,
    getAllEmployees,
    getSingleEmployee,
    deleteEmployee,
    blockEmployee,
    listBlocked,
    unBlockUser,
    getEmployees
}
