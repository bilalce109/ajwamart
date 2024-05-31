import mongoose from 'mongoose';
import SimpleSchema from 'simpl-schema';
import privilege from '../models/privilege.js';

const createPrivilege = async (req, res) => {
    try {

        let privilegeSchema = new SimpleSchema({
            name: { type: String, required: true },
            module: { type: String, required: true },
        }).newContext();

        privilegeSchema.validate(req.body);

        if (!privilegeSchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: privilegeSchema.validationErrors()
            })
        }
        const checkPrivilege = await privilege.findOne({ name: req.body.name });
        if (checkPrivilege) return res.status(200).json({
            status: "error",
            message: "privilege already exist"
        });

        let result = await privilege.create(req.body);

        return res.status(200).json({
            status: "success",
            message: "Post Created",
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

const updatePrivilege = async (req, res) => {
    try {

        let privilegeSchema = new SimpleSchema({
            name: { type: String, required: false },
        }).newContext();

        privilegeSchema.validate(req.body);

        if (!privilegeSchema.isValid()) {
            return res.status(500).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: privilegeSchema.validationErrors()
            })
        }

        let result = await privilege.findByIdAndUpdate({ _id: req.params.id }, {$set:{name: req.body.name}}, { new: true });

        return res.status(200).json({
            status: "success",
            message: "Privilege name updated",
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

const getPrivilege = async (req, res) => {
    try {
        let result = await privilege.find({module: 'employee'});
        return res.status(200).json({
            status: "success",
            message: "All privilege",
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

const getSinglePrivilege = async (req, res) => {
    try {
        let result = await privilege.find({_id: req.params.id});
        return res.status(200).json({
            status: "success",
            message: "get privilege",
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

const deletePrivilege = async (req, res) => {
    try {
        let result = privilege.findOneAndDelete({ _id: req.params.id }).exec((err, deletedPrivilege) => {
            if (err) {
                return res.status(200).json({
                    status: "error",
                    message: err.message
                });
            }
        });

        return res.status(200).json({
            status: "success",
            message: "Privilege deleted successfully",
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
    createPrivilege,
    getPrivilege,
    getSinglePrivilege,
    updatePrivilege,
    deletePrivilege,
}
