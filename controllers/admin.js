import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import SimpleSchema from 'simpl-schema';
import Admin from '../models/admin.js';
import helper from '../utils/helpers.js';
import role from '../models/role.js';
import permission from '../models/permission.js';

const createAdmin = async (req, res) => {
    try {
        let body = req.body;
        const adminSchema = new SimpleSchema({
            name: String,
            email: String,
            password: {
                type: String,
                custom() {
                    if (this.value.length < 8) return SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED;
                }
            },
        }).newContext();

        if (!adminSchema.validate(body)) return res.status(400).json({
            status: "error",
            message: "Please fill all the fields to proceed further!",
            trace: adminSchema.validationErrors()
        });

        const adminExist = await Admin.findOne({ email: body.email });
        if (adminExist) {
            return res.status(409).json({
                status: "error",
                message: "A admin with this adminname or email already exists.",
                trace: { email: body.email }
            });
        }

        if (!helper.validateEmail(body.email)) {
            return res.status(400).json({
                status: "error",
                message: "Please enter a valid email address.",
                trace: `Email Address: ${body.email} is not valid`
            });
        }

        body.password = await bcrypt.hash(body.password, 10);

        const inserted = await new Admin(body).save();
        inserted.verificationToken = jwt.sign({ id: inserted._id, email: inserted.email }, process.env.JWT_SECRET);
        inserted.save();
        return res.json({
            status: "success",
            message: "admin Added Successfully",
            data: inserted
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while proceeding your request.",
            trace: error.message
        });
    }
}
const createUser = async (req, res) => {
    try {
        let body = req.body;
        const adminSchema = new SimpleSchema({
            fullName: String,
            email: String,
            role: String,
            password: {
                type: String,
                custom() {
                    if (this.value.length < 8) return SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED;
                }
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

        if (!adminSchema.validate(body)) return res.status(400).json({
            status: "error",
            message: "Please fill all the fields to proceed further!",
            trace: adminSchema.validationErrors()
        });

        const adminExist = await Admin.findOne({ email: body.email });
        if (adminExist) {
            return res.status(409).json({
                status: "error",
                message: "A admin with this adminname or email already exists.",
                trace: { email: body.email }
            });
        }

        if (!helper.validateEmail(body.email)) {
            return res.status(400).json({
                status: "error",
                message: "Please enter a valid email address.",
                trace: `Email Address: ${body.email} is not valid`
            });
        }

        let roleCheck = await role.findOne({
            name: req.body.role
        });
        if (!roleCheck) return res.status(400).json({
            status: "error",
            message: "Please enter a valid Role!.",
            trace: `Role ${body.role} is not valid`
        })
        body.role = roleCheck._id
        body.password = await bcrypt.hash(body.password, 10);

        const inserted = await new Admin(body).save();
        inserted.verificationToken = jwt.sign({ id: inserted._id, email: inserted.email }, process.env.JWT_SECRET);
        inserted.save();
        return res.json({
            status: "success",
            message: "admin Added Successfully",
            data: inserted
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error occurred while proceeding your request.",
            trace: error.message
        });
    }
}

const deleteAdmin = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).lean();
        if (!admin) return res.status(404).json({
            status: 'error',
            message: "No Admin User exists against this id."
        })
        Admin.findByIdAndDelete(admin._id, (err, docs) => {
            if (err) res.status(500).json({ status: "error", message: "An unexpected error ocurred while proceeding your request.", trace: err });
            res.json({
                status: "success",
                message: "Your Admin account has been removed successfully.",
                data: docs
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error ocurred while proceeding your request.",
            trace: err.message
        })
    }
};

const login = async (req, res) => {
    try {
        const body = req.body;
        const adminSchema = new SimpleSchema({
            email: {
                type: String,
                custom() {
                    if (!helper.validateEmail(this.value)) return SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED;
                }
            },
            password: {
                type: String,
                custom() {
                    if (this.value < 8) return SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED;
                }
            },
        }).newContext();

        if (!adminSchema.validate(body)) return res.status(409).json({
            status: "error",
            message: "Please fill all the fields to proceed further!",
            trace: adminSchema.validationErrors()
        });

        const admin = await Admin.findOne({ email: body.email });
        if (!admin) return res.status(409).json({
            status: "error",
            message: "No user found against this email!"
        });

        const isPassword = await bcrypt.compare(body.password, admin.password);
        if (!isPassword) return res.status(400).json({
            status: "error",
            message: "Incorrect Password.",
            trace: `Password: ${isPassword} is incorrect`
        });

        admin.verificationToken = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET);
        admin.save();

        let getUser = await Admin.findOne({
            _id: admin._id
        }).lean()

        let roleData = await role.findById(getUser.role).lean();

        roleData.permissions = await Promise.all(roleData.permissions.map(async (e) => {
            return await permission.findOne({
                _id: e
            });
        }))

        getUser.permissions = roleData
        getUser.verificationToken = admin.verificationToken



        return res.json({
            status: "success",
            message: "Login Successfully! You may proceed further.",
            data: getUser
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error",
            trace: error.message
        });
    }
}

const forgetPassword = async (req, res) => {
    try {
        const body = req.body;
        const schema = new SimpleSchema({
            email: String
        }).newContext();
        if (!schema.validate(body)) return res.status(409).json({
            status: "error",
            message: "Please fill in all the fields precisely to proceed.",
            trace: schema.validationErrors()
        });

        const admin = await Admin.findOne({ email: body.email }).lean();
        if (!admin) {
            return res.status(404).json({
                status: "error",
                message: "Couldn't find any account associated with this email."
            });
        }
        const randomNumber = Math.floor(100000 + Math.random() * 900000);
        await helper.sendResetPasswordEmail(randomNumber, admin.email, admin.name);
        await Admin.updateOne({ email: body.email }, { $set: { otpCode: randomNumber } });
        return res.json({
            status: "success",
            message: "Please check your email for OTP Code!",
            data: randomNumber
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error ocurred while proceeding your request.",
            trace: error.message
        });
    }
}

const verifyOtp = async (req, res) => {
    try {
        const body = req.body;
        const schema = new SimpleSchema({
            email: String,
            otpCode: Number
        }).newContext();

        if (!schema.validate(body)) return res.status(409).json({
            status: "error",
            message: "Please fill in all the fields precisely to proceed.",
            trace: schema.validationErrors()
        });

        const admin = await Admin.findOne({ email: body.email }).lean();
        if (!admin) return res.status(404).json({
            status: "error",
            message: "Couldn't find any account associated with this email."
        });

        if (admin.otpCode !== body.otpCode) return res.status(409).json({
            status: "error",
            message: "Invalid OTP Code! Please check your email or hit resend!"
        });

        return res.json({
            status: "success",
            message: "Your OTP has been verified! You may now change your password! ✔",
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error ocurred while proceeding your request.",
            trace: error.message
        });
    }
}

const changePassword = async (req, res) => {
    try {
        const body = req.body;
        const schema = new SimpleSchema({
            email: String,
            password: {
                type: String,
                custom() {
                    if (this.value.length < 8) return SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED;
                }
            },
            otpCode: Number
        }).newContext();

        if (!schema.validate(body)) return res.status(409).json({
            status: "error",
            message: "Please fill in all the fields precisely to proceed.",
            trace: schema.validationErrors()
        });

        const admin = await Admin.findOne({ email: body.email }).lean();
        if (!admin) return res.status(404).json({
            status: "error",
            message: "Couldn't find any account associated with this email."
        });

        if (admin.otpCode !== body.otpCode) return res.status(409).json({
            status: "error",
            message: "Invalid OTP Code! Please check your email or hit resend!"
        });

        const hashPassword = await bcrypt.hash(body.password, 10);
        await Admin.updateOne({ email: body.email }, { $set: { password: hashPassword, otpCode: 0 } });
        return res.json({
            status: "success",
            message: "Your Password has been changed! You can now login!",
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error ocurred while proceeding your request.",
            trace: error.message
        });
    }
}

const updateAdmin = async (req, res) => {
    try {
        const body = req.body;
        const schema = new SimpleSchema({
            name: {
                type: String,
                optional: true
            },
            password: {
                type: String,
                optional: true
            },
        }).newContext();

        if (!schema.validate(body)) return res.status(409).json({
            status: "error",
            message: "Please fill in all the fields to continue.",
            trace: schema.validationErrors()
        });

        if (body.password !== undefined) body.password = await bcrypt.hash(body.password, 10);

        const updatedUser = await Admin.findOneAndUpdate({ _id: req.user._id }, { $set: body }, { new: true, projection: { verificationToken: 0, otpcode: 0, password: 0 } });
        return res.json({
            status: "success",
            message: "Your account has been updated!",
            data: updatedUser
        })

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error ocurred while proceeding your request.",
            data: null,
            trace: error.message
        });
    }
};

const adminList = async (req, res) => {
    try {
        const body = req.body
        const adminList = await Admin.find({}, { verificationToken: 0, otpCode: 0, password: 0 }).lean();
        const adminListPaginated = helper.pagination(adminList, req.query.page, req.query.limit,);

        return res.json({
            status: "success",
            message: "Your user is here!",
            data: adminListPaginated
        })

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An unexpected error",
            trace: error.message
        })
    }
}

export default {
    createAdmin,
    deleteAdmin,
    login,
    forgetPassword,
    verifyOtp,
    changePassword,
    updateAdmin,
    adminList,
    createUser
};