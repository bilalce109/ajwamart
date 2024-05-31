import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import roleSchema from '../models/role.js';
import helper from '../utils/helpers.js';
import mongoose, { trusted } from 'mongoose';
import SimpleSchema from 'simpl-schema';
import permission from '../models/permission.js';
import employeesData from '../models/employees.js';
import job from '../models/job.js';
import vendor from '../models/vendor.js';
import invoice from '../models/invoice.js';
import jobService from '../service/job.js';
import customer from '../models/customer.js';
import inventory from '../models/inventory.js';
import vehicle from '../models/vehicle.js';

const login = async (req, res) => {
    try {

        let { email, password } = req.body;
        const loginSchema = new SimpleSchema({
            email: {
                type: String,
                required: true,
                custom() {
                    if (!helper.validateEmail(this.value)) return SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED;
                }
            },
            password: {
                type: String,
                required: true
            },
        }).newContext();

        if (!loginSchema.validate(req.body)) {
            return res.status(200).json({
                status: "error",
                message: "Please fill in all the fields precisely to proceed!",
                data: null,
                trace: loginSchema.validationErrors()
            });
        }

        let user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({
                status: "error",
                message: `User doesn't exist!`,
                data: null,
            });
        }

        const isPassword = await bcrypt.compare(password, user.password);

        if (!isPassword) return res.status(400).json({
            status: "error",
            message: "Incorrect Password.",
            trace: `Password: ${isPassword} is incorrect`
        });

        // user.verificationToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
        // user.save();

        let getUser = await User.findOne({
            _id: user._id
        }).lean();

        let roleData = await roleSchema.findOne({ name: getUser.role }).lean();
        if (roleData.permissions) {
            roleData = await Promise.all(roleData.permissions.map(async (e) => {
                return await permission.findOne({
                    _id: e
                }).sort({ updatedAt: -1 });
            }))

            getUser.permissions = roleData;
        } else {
            getUser.permissions = [];
        }

        getUser.verificationToken = user.verificationToken;

        getUser.profile_picture = getUser.profile_picture ? getUser.profile_picture : "/request/1707995805815-defaultpic.svg";
        if (user.role == 'admin') {
            getUser.dashboard = '/adminDashboard';
        } else if (user.role == 'manager') {
            getUser.dashboard = '/managerDashboard';
        } else if (user.role == 'technician') {
            getUser.dashboard = '/technicianDashboard';
        } else if (user.role == 'csr') {
            getUser.dashboard = '/csrDashboard';
        } else {
            getUser.dashboard = '/ownerDashboard';
        }

        return res.json({
            status: "success",
            message: "Login Successfully! You may proceed further.",
            data: getUser
        });
    } catch (error) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occurred while proceeding your request.",
            data: null,
            trace: error.message
        })
    }
}

// const register = async (req, res) => {
//     try {
//         let { email, fullName, role, password, confirmPassword } = req.body;


//         let registerSchema = new SimpleSchema({
//             email: {
//                 type: String,
//                 required: true,
//                 custom() {
//                     if (!helper.validateEmail(this.value)) return { message: 'Enter valid email address!' };
//                 }
//             },
//             fullName: {
//                 type: String,
//                 required: true,
//             },
//             password: {
//                 type: String,
//                 required: true,
//                 custom() {
//                     if (this.isSet && this.value !== this.field('confirmPassword').value) {
//                         return 'passwordMismatch';
//                     }
//                 },
//             },
//             confirmPassword: {
//                 type: String,
//                 required: true,
//                 custom() {
//                     if (this.isSet && this.value !== this.field('password').value) {
//                         return 'passwordMismatch';
//                     }
//                 },
//             },
//             role: {
//                 type: String
//             }
//         }).newContext();

//         if (!registerSchema.validate(req.body))
//             return res.status(200).json({
//                 status: "error",
//                 message: "Please fill all the fields to proceed further!",
//                 data: null,
//                 trace: registerSchema.validationErrors()
//             })

//         const userExist = await User.findOne({ email });

//         if (userExist)
//             return res.status(200).json({
//                 status: "error",
//                 message: "Email already exist.",
//                 data: null,
//                 trace: { email }
//             });

//         if (!helper.validateUsername(fullName))
//             return res.status(200).json({
//                 status: "error",
//                 message: "Full Name can only have lowercase letters, dots, underscores and numbers.",
//                 data: null,
//                 trace: { fullName }
//             });

//         if (!helper.validateEmail(email))
//             return res.status(200).json({
//                 status: "error",
//                 message: "Please enter a valid email address.",
//                 data: null,
//                 trace: `Email Address: ${email} is not valid.`
//             });

//         let hashedPass = await bcrypt.hash(password, 10);

//         let create_vendor;
//         if (role == 'owner') {
//             let checkVendor = await vendor.findOne({ name: req.body.fullName });
//             if (!checkVendor) {
//                 let vendorData = {
//                     email: req.body.email,
//                     name: req.body.fullName
//                 };

//                 create_vendor = await vendor.create(vendorData);
//                 return create_vendor;
//             } else {
//                 create_vendor = checkVendor;
//             }
//         }

//         let checkRole = await roleSchema.findOne({ name: req.body.role });
//         if (!checkRole) {
//             return res.status(200).json({
//                 status: "error",
//                 message: "Role Not Found",
//                 data: null,
//                 trace: `Role is not valid.`
//             });
//         }


//         let data = req.body;
//         delete data.confirmPassword;
//         data.password = hashedPass;
//         data.profile_picture = data.profile_picture ? data.profile_picture : "/request/1707995805815-defaultpic.svg";
//         data.companyId = create_vendor._id;

//         // create User First

//         let userData = new User(data);
//         await userData.save()




//         // new User(data).save().then(async inserted => {
//         //     inserted.verificationToken = jwt.sign({ id: inserted._id, fullName: inserted.fullName }, process.env.JWT_SECRET);
//         //     await User.findByIdAndUpdate({ _id: inserted._id }, { $set: { verificationToken: inserted.verificationToken } }, { new: true })
//         //     await vendor.findByIdAndUpdate({ _id: create_vendor._id }, { userId: inserted._id })

//         //     return res.json(req.body);


//         //     return res.status(200).json({
//         //         status: "success",
//         //         message: "User registration successful!",
//         //         data: inserted
//         //     });
//         // }).catch(error => {
//         //     console.log(error)
//         //     return res.status(200).json({
//         //         status: "error",
//         //         message: "An unexpected error occurred while proceeding your request.",
//         //         data: null,
//         //         trace: error.message
//         //     });
//         // });

//     } catch (error) {
//         return res.status(200).json({
//             status: "error",
//             message: "An unexpected error occurred while proceeding your request.",
//             data: null,
//             trace: error.message
//         });
//     }
// }

const register = async (req, res) => {
    try {
        let { email, fullName, role, password, confirmPassword } = req.body;

        let registerSchema = new SimpleSchema({
            email: {
                type: String,
                required: true,
                custom() {
                    if (!helper.validateEmail(this.value)) return { message: 'Enter valid email address!' };
                }
            },
            fullName: {
                type: String,
                required: true,
            },
            password: {
                type: String,
                required: true,
                custom() {
                    if (this.isSet && this.value !== this.field('confirmPassword').value) {
                        return 'passwordMismatch';
                    }
                },
            },
            confirmPassword: {
                type: String,
                required: true,
                custom() {
                    if (this.isSet && this.value !== this.field('password').value) {
                        return 'passwordMismatch';
                    }
                },
            },
            role: {
                type: String
            }
        }).newContext();

        if (!registerSchema.validate(req.body))
            return res.status(200).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                data: null,
                trace: registerSchema.validationErrors()
            });

        const userExist = await User.findOne({ email });

        if (userExist)
            return res.status(200).json({
                status: "error",
                message: "Email already exists.",
                data: null,
                trace: { email }
            });

        if (!helper.validateUsername(fullName))
            return res.status(200).json({
                status: "error",
                message: "Full Name can only have lowercase letters, dots, underscores, and numbers.",
                data: null,
                trace: { fullName }
            });

        if (!helper.validateEmail(email))
            return res.status(200).json({
                status: "error",
                message: "Please enter a valid email address.",
                data: null,
                trace: `Email Address: ${email} is not valid.`
            });

        let hashedPass = await bcrypt.hash(password, 10);

        let create_vendor;
        if (role == 'owner') {
            let checkVendor = await vendor.findOne({ name: fullName });
            if (!checkVendor) {
                let vendorData = {
                    email,
                    name: fullName
                };

                create_vendor = await vendor.create(vendorData);
            } else {
                create_vendor = checkVendor;
            }
        }

        let checkRole = await roleSchema.findOne({ name: role });
        if (!checkRole) {
            return res.status(200).json({
                status: "error",
                message: "Role Not Found",
                data: null,
                trace: `Role is not valid.`
            });
        }

        let data = req.body;
        delete data.confirmPassword;
        data.password = hashedPass;
        data.profile_picture = data.profile_picture || "/request/1707995805815-defaultpic.svg";
        if (create_vendor) {
            data.companyId = create_vendor._id;
        }

        // Create userData object
        let userData = new User(data);

        // Set a timeout of 10 seconds for the save operation
        const saveTimeout = 10000; // 10 seconds
        const savePromise = userData.save();

        const timeoutPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new Error('Save operation timed out.'));
            }, saveTimeout);
        });

        // Wait for either the save operation to complete or the timeout to occur
        // let userdata = await Promise.race([savePromise, timeoutPromise]);

        const inserted = await Promise.race([savePromise, timeoutPromise]);

        // If save operation completed successfully, continue with the response
        // If timeout occurred, an error response will be sent in the catch block

        // Update verification token
        inserted.verificationToken = jwt.sign({ id: inserted._id, fullName: inserted.fullName }, process.env.JWT_SECRET);
        await User.findByIdAndUpdate({ _id: inserted._id }, { $set: { verificationToken: inserted.verificationToken } }, { new: true });

        // Update userId for vendor
        if (create_vendor) {
            await vendor.findByIdAndUpdate({ _id: create_vendor._id }, { userId: inserted._id });
        }

        return res.status(200).json({
            status: "success",
            message: "User registration successful!",
            data: inserted
        });

        // If save operation completed successfully, continue with the response
        // If timeout occurred, an error response will be sent in the catch block

        // Remaining code for updating verification token, etc. (uncomment as needed)

        // return res.json(req.body);
        return res.status(200).json({
            status: "success",
            message: "User registration successful!",
            data: userdata
        });

    } catch (error) {
        console.log(error);
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occurred while proceeding with your request.",
            data: null,
            trace: error.message
        });
    }
};


const forgetPassword = async (req, res) => {
    try {
        const body = req.body;
        const userSchema = new SimpleSchema({
            email: { type: String, required: true }
        }).newContext();

        if (!userSchema.validate(body)) return res.status(409).json({
            status: "error",
            message: "Please fill in all the fields precisely to proceed.",
            trace: schema.validationErrors()
        });

        const user = await User.findOne({ email: body.email }).lean();
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: `Not account found on ${body.email}`
            });
        };

        const randomCode = Math.floor(1000 + Math.random() * 9000);
        await helper.sendResetPasswordEmail(randomCode, user.email, user.fullName);
        await User.updateOne({ email: body.email }, { $set: { otpCode: randomCode } });
        return res.status(200).json({
            status: "success",
            message: "Please check your email for OTP Code!",
            data: randomCode
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error ocurred while proceeding your requSest.",
            trace: error.message
        });
    }
}

const verifyOtp = async (req, res) => {
    try {
        const body = req.body;
        const schema = new SimpleSchema({
            email: { type: String, required: true },
            otpCode: { type: Number, required: true }
        }).newContext();

        if (!schema.validate(body)) return res.status(409).json({
            status: "error",
            message: "Please fill in all the fields precisely to proceed.",
            trace: schema.validationErrors()
        });

        const user = await User.findOne({ email: body.email }).lean();
        if (!user) return res.status(404).json({
            status: "error",
            message: `Not account found on this ${body.email}`
        });

        if (user.otpCode !== body.otpCode) return res.status(200).json({
            status: "error",
            message: "Invalid OTP Code! Please try again"
        });
        await User.updateOne({ email: body.email }, { $set: { optcode: null } });
        return res.status(200).json({
            status: "success",
            message: "Your OTP has been verified! You may now change your password!",
        });
    } catch (error) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error ocurred while proceeding your request.",
            trace: error.message
        });
    }
}

const changePassword = async (req, res) => {
    try {
        let body = req.body;
        const userSchema = new SimpleSchema({
            email: { type: String, required: true },
            password: {
                type: String,
                required: true,
                custom() {
                    if (this.isSet && this.value !== this.field('confirmPassword').value) {
                        return 'passwordMismatch';
                    }
                },
            },
            confirmPassword: {
                type: String,
                required: true,
                custom() {
                    if (this.isSet && this.value !== this.field('password').value) {
                        return 'passwordMismatch';
                    }
                },
            },
        }).newContext();

        if (!userSchema.validate(body)) return res.status(200).json({
            status: "error",
            message: "Please fill all the fields to proceed further!",
            trace: userSchema.validationErrors()
        });
        const user = await User.findOne({ email: body.email }).lean();
        if (!user) return res.status(200).json({
            status: "error",
            message: "Couldn't find any account associated with this email."
        });

        if (body.password !== undefined) body.password = await bcrypt.hash(body.password, 10);

        const changePassword = await User.findOneAndUpdate({ email: body.email }, { $set: { password: body.password } }, { new: true });
        return res.status(200).json({
            status: "success",
            message: "Your account has been updated!",
            data: changePassword
        });

    } catch (error) {
        res.status(200).json({
            status: "error",
            message: "An unexpected error",
            trace: error.message
        })
    }
}

const deleteUser = async (req, res) => {
    try {
        // const body = req.body;
        // const schema = new SimpleSchema({
        //     password: String,
        // }).newContext();

        // if (!schema.validate(body)) {
        //     return res.status(200).json({
        //         status: "error",
        //         message: "Please fill all the fields to proceed further!",
        //         trace: schema.validationErrors()
        //     });
        // }

        // const user = await User.findById(req.user._id).lean();
        // const checkPassword = await bcrypt.compare(body.password, user.password);
        // if (!checkPassword) {
        //     return res.status(200).json({
        //         status: "error",
        //         message: "Invalid password! Please try again"
        //     });
        // }

        // Delete user's associated posts
        await Post.deleteMany({ user: req.user._id });

        // Delete user
        const deletedUser = await User.findOneAndDelete({ _id: req.user._id });
        if (!deletedUser) {
            return res.status(200).json({
                status: "error",
                message: "Please insert your _id"
            });
        } else {
            return res.json({
                status: "success",
                message: "Account is deleted successfully",
            });
        }
    } catch (error) {
        return res.json({
            status: "error",
            message: "Something went wrong",
            data: error.message
        });
    }
};

const profilePicture = async (req, res) => {
    try {
        let body = req.body;

        let requestSchema = new SimpleSchema({
            profile_picture: { type: String, required: false }
        }).newContext();

        if (req.files.profile_picture) {
            let picture = await helper.saveRequest(req.files.profile_picture);
            body.profile_picture = picture;
        }

        if (!requestSchema.validate(body)) {
            return res.status(200).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: requestSchema.validationErrors()
            })
        }

        body.userId = req.user._id;

        let requestData = {
            profile_picture: body.profile_picture,

        }

        let result = await User.findByIdAndUpdate(body.userId, requestData, { new: true });

        return res.status(200).json({
            status: "success",
            message: "Profile Picture Updated!",
            data: result
        });

    } catch (error) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occurred while proceeding your request.",
            data: null,
            trace: error.message
        });
    }
}

const home = async (req, res) => {

    // final Quey
    let query = {}
    let invoiceQuery = {}

    try {

        if (req.user.role == 'csr') {
            query.companyId = req.user.companyId
            query.userId = req.user._id
            invoiceQuery.userId = req.user._id

        }
        else {
            query.companyId = req.user.companyId
            query.assignTechnician = req.user._id
            invoiceQuery.assignTechnician = req.user._id;
        }

        // Fetch all jobs
        let jobs = await job.find(query);
        jobs = await Promise.all(jobs.map(async (e) => {
            return jobService.getJobById(e._id);
        }))



        const jobCount = jobs.length;

        // Fetch all employees
        // const owner = await User.find({ role: "owner" });
        // const ownerCount = owner.length;

        const customerCount = await customer.find({ companyId: req.user.companyId })?.count();

        // const vendorData = [] //await vendor.find({});

        let invoices = await invoice.find(invoiceQuery).limit(5).lean();
        invoices = await Promise.all(invoices.map(async (e) => {
            return await jobService.getInvoice(e._id)
        }))

        let inventoryData = await inventory.find({ companyId: req.user.companyId });
        const inventoryCount = inventoryData.length;


        res.json({
            jobCount,
            inventoryCount,
            inventoryData,
            customerCount,
            invoices,
            jobs
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const newPassword = async (req, res) => {
    try {
        let body = req.body;
        const userSchema = new SimpleSchema({
            password: {
                type: String,
                required: true,
                custom() {
                    if (this.isSet && this.value !== this.field('confirmPassword').value) {
                        return 'passwordMismatch';
                    }
                },
            },
            confirmPassword: {
                type: String,
                required: true,
                custom() {
                    if (this.isSet && this.value !== this.field('password').value) {
                        return 'passwordMismatch';
                    }
                },
            },
        }).newContext();

        if (!userSchema.validate(body)) return res.status(200).json({
            status: "error",
            message: "Please fill all the fields to proceed further!",
            trace: userSchema.validationErrors()
        });
        const user = await User.findOne({ _id: req.user._id }).lean();
        if (!user) return res.status(200).json({
            status: "error",
            message: "Couldn't find any account associated with this email."
        });

        if (body.password !== undefined) body.password = await bcrypt.hash(body.password, 10);

        const changePassword = await User.findOneAndUpdate({ _id: req.user._id }, { $set: { password: body.password } }, { new: true });
        return res.json({
            status: "success",
            message: "Your Password has been updated!",
            data: changePassword
        });

    } catch (error) {
        res.status(200).json({
            status: "error",
            message: "An unexpected error",
            trace: error.message
        })
    }
}

const managerDashboard = async (req, res) => {
    try {
        let checkUser = await User.findOne({
            _id: req.user._id,
            role: 'manager'
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }

        // Fetch all jobs
        let jobs = await job.find({ companyId: checkUser.companyId });
        const jobCount = jobs.length;

        jobs = await Promise.all(jobs.map(async (e) => {
            return jobService.getJobById(e._id);
        }))


        let inventoryData = await inventory.find({ companyId: checkUser.companyId });
        const inventoryCount = inventoryData.length;

        let customerData = await customer.find({ companyId: checkUser.companyId });
        const customerCount = customerData.length;

        let invoices = await invoice.find({ companyId: checkUser.companyId }).limit(5).lean();
        invoices = await Promise.all(invoices.map(async (e) => {
            return await jobService.getInvoice(e._id)
        }))

        let employees = await employeesData.find({ companyId: checkUser.companyId }).limit(5).lean();

        const employeesCount = employees.length;

        let fleetData = await vehicle.find({ companyId: checkUser.companyId, fleet: "true" });
        let vehicleData = await vehicle.find({ companyId: checkUser.companyId });
        let salesData = await invoice.find({ companyId: checkUser.companyId });

        let chartData = [fleetData.length, vehicleData.length, salesData];


        res.json({
            jobs,
            inventoryData,
            employeesCount,
            inventoryCount,
            customerCount,
            jobCount,
            chartData
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
const superAdminDashboard = async (req, res) => {
    try {
        let checkUser = await User.findOne({
            _id: req.user._id,
            role: 'admin'
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }

        // Fetch all jobs
        let jobs = await job.find({});
        const jobCount = jobs.length;

        jobs = await Promise.all(jobs.map(async (e) => {
            return jobService.getJobById(e._id);
        }))


        let inventoryData = await inventory.find({});
        const inventoryCount = inventoryData.length;

        let customerData = await customer.find({});
        const customerCount = customerData.length;

        let invoices = await invoice.find({}).limit(5).lean();
        invoices = await Promise.all(invoices.map(async (e) => {
            return await jobService.getInvoice(e._id)
        }))

        let employees = await employeesData.find({}).limit(5).lean();

        const employeesCount = employees.length;

        let chartData = [67, 21, 27];


        res.json({
            jobs,
            inventoryData,
            employeesCount,
            inventoryCount,
            customerCount,
            jobCount,
            chartData
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const ownerDashboard = async (req, res) => {
    try {
        let checkUser = await User.findOne({
            _id: req.user._id
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `${checkUser.role} is not allowed`
            })
        }


        // declare variables for owner & company

        let jobownerQuery = {};
        let jobInventory = {}
        let customerQuery = {}
        let invoiceQuery = {}
        let employeesQuery = {}

        if (req.user.role == 'owner') {
            jobownerQuery.companyId = checkUser.companyId
            jobInventory.companyId = checkUser.companyId
            customerQuery.companyId = checkUser.companyId
            invoiceQuery.companyId = checkUser.companyId
            employeesQuery.companyId = checkUser.companyId
        }

        // Fetch all jobs
        let jobs = await job.find(jobownerQuery);
        const jobCount = jobs.length;

        jobs = await Promise.all(jobs.map(async (e) => {
            return jobService.getJobById(e._id);
        }))


        let inventoryData = await inventory.find(jobInventory);
        const inventoryCount = inventoryData.length;

        let customerData = await customer.find(customerQuery);
        const customerCount = customerData.length;

        let invoices = await invoice.find(invoiceQuery).limit(5).lean();
        invoices = await Promise.all(invoices.map(async (e) => {
            return await jobService.getInvoice(e._id)
        }))

        let employees = await employeesData.find({ companyId: req.user.companyId, employeeType: { $nin: ['manager', 'owner'] }, active: true }).lean();

        const employeesCount = employees.length;

        let chartData = [67, 21, 27];


        res.json({
            jobs,
            inventoryData,
            employeesCount,
            inventoryCount,
            customerCount,
            jobCount,
            chartData
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export default {
    register,
    login,
    forgetPassword,
    changePassword,
    verifyOtp,
    deleteUser,
    profilePicture,
    home,
    newPassword,
    managerDashboard,
    ownerDashboard,
    superAdminDashboard
}