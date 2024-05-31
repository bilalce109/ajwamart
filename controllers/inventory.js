import mongoose from 'mongoose';
import SimpleSchema from 'simpl-schema';
import helper from '../utils/helpers.js';
import User from '../models/users.js';
import inventory from '../models/inventory.js';
import inventoryCategory from '../models/inventoryCategory.js';
import service from '../models/service.js';
import job from '../models/job.js';
import jobService from '../service/job.js';


const createInventory = async (req, res) => {
    try {
        let body = req.body;
        let inventorySchema = new SimpleSchema({
            name: { type: String, required: true },
            cost: { type: String, required: false },
            uploadPicture: { type: String, required: false },
            category: { type: String, required: false },
            sku: { type: String, required: false },
            available: { type: String, required: false },
            threshold: { type: String, required: false }
        }).newContext();

        inventorySchema.validate(req.body);

        if (!inventorySchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: inventorySchema.validationErrors()
            })
        }
        const checkInventory = await inventory.findOne({ name: req.body.name });
        if (checkInventory) return res.status(200).json({
            status: "error",
            message: "Inventory already created"
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


        let creatProduct = new service({
            type: "product",
            name: req.body.name,
            price: req.body.cost,
            companyId: req.user.companyId
        })
        creatProduct = await creatProduct.save()

        req.body.userId = req.user._id;
        req.body.companyId = checkUser.companyId;
        req.body.productId = creatProduct._id;

        let result = await inventory.create(req.body);



        return res.status(200).json({
            status: "success",
            message: "Inventory Created",
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

const view = async (req, res) => {
    try {
        let checkUser = await User.findOne({
            companyId: req.user.companyId,
            // role: { $in: ['admin', 'manager', 'owner'] }
        });
        if (!checkUser) {
            return res.status(409).json({
                status: "error",
                message: "User not found or your role is not allowed",
                data: null,
                track: `permission  not allowed`
            })
        }
        let result = await inventory.find({ companyId: checkUser.companyId });
        return res.status(200).json({
            status: "success",
            message: "Inventory Get",
            data: result
        })
    } catch (error) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: error.message
        });
    }
}

const update = async (req, res) => {
    try {

        let body = req.body;

        let inventorySchema = new SimpleSchema({
            name: { type: String, required: false },
            cost: { type: String, required: false },
            category: { type: String, required: false },
            uploadPicture: { type: String, required: false }
        }).newContext();

        inventorySchema.validate(req.body);

        if (!inventorySchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: inventorySchema.validationErrors()
            })
        }

        if (req.files) {
            let picture = await helper.saveRequest(req.files.uploadPicture);
            body.uploadPicture = picture;
        }

        const inventoryData = {
            name: body.name,
            cost: body.cost,
            uploadPicture: body.uploadPicture,
            category: body.category,
        };

        let result = await inventory.findByIdAndUpdate({ _id: req.params.id }, inventoryData, { new: true });

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

const deleteInventory = async (req, res) => {
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

        let result = await inventory.findByIdAndDelete({ _id: req.params.id });

        return res.status(200).json({
            status: "success",
            message: "Inventory delete Successfully",
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

const reorderInventory = async (req, res) => {
    try {
        let id = req.params.id;
        let result = await inventory.findByIdAndUpdate({ _id: id }, { reorder: true }, { new: true });

        return res.status(200).json({
            status: "success",
            message: "Inventory reorder Successfully",
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

const reorderList = async (req, res) => {
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
        let result = await inventory.find({ reorder: true, companyId: checkUser.companyId });
        return res.status(200).json({
            status: "success",
            message: "Inventory Reoder Get",
            data: result
        })
    } catch (error) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: error.message
        });
    }
}

const cancelReorder = async (req, res) => {
    try {
        let id = req.params.id;
        let result = await inventory.findByIdAndUpdate({ _id: id }, { reorder: false }, { new: true });

        return res.status(200).json({
            status: "success",
            message: "Inventory reorder Successfully",
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

const checkedReorder = async (req, res) => {
    try {
        let id = req.params.id;
        let checkInventory = await inventory.findOne({ _id: id, reorder: false });
        if (checkInventory) {
            return res.status(200).json({
                status: "success",
                message: "Inventory not in reorder list",
                data: checkInventory
            })
        }
        let result = await inventory.findByIdAndUpdate({ _id: id }, { $set: { reorder: false, stock: true } }, { new: true });
        return res.status(200).json({
            status: "success",
            message: "Inventory reorder checked",
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

const createCategory = async (req, res) => {
    try {
        let body = req.body;
        let inventoryCategorySchema = new SimpleSchema({
            name: { type: String, required: true },
            uploadPicture: { type: String, required: false }
        }).newContext();

        inventoryCategorySchema.validate(req.body);

        if (!inventoryCategorySchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: inventoryCategorySchema.validationErrors()
            })
        }
        const checkInventoryCategory = await inventoryCategory.findOne({ companyId: req.user.companyId, name: req.body.name });
        if (checkInventoryCategory) return res.status(200).json({
            status: "error",
            message: "Inventory Category already created"
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

        req.body.userId = req.user._id;
        req.body.companyId = checkUser.companyId;

        let result = await inventoryCategory.create(req.body);

        return res.status(200).json({
            status: "success",
            message: "Inventory Category Created",
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

const viewCategory = async (req, res) => {
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
        let result = await inventoryCategory.find({ companyId: checkUser.companyId });
        return res.status(200).json({
            status: "success",
            message: "Inventory Category Get",
            data: result
        })
    } catch (error) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: error.message
        });
    }
}

const viewByCategory = async (req, res) => {
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
        // Fetch all categories
        const categories = await inventoryCategory.find({ companyId: checkUser.companyId });

        // Array to store products for each category
        const productsByCategory = [];

        // Retrieve products for each category
        for (const category of categories) {
            const products = await inventory.find({ category: category._id });
            productsByCategory.push({ category: category.name, products: products });
        }
        return res.status(200).json({
            status: "success",
            message: "Inventory Category Get",
            data: productsByCategory
        })
    } catch (error) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: error.message
        });
    }
}

const sales = async (req, res) => {
    let { id } = req.params;
    try {
        let checkInventory = await inventory.findOne({
            productId: id
        }).lean()

        let sales = await job.find({
            "service.id": id
        }).lean()
        checkInventory.sales = await Promise.all(sales.map(async (e) => {
            return await jobService.getJobById(e._id);
        }))


        return res.status(200).json({
            status: "success",
            message: "Inventory Category Get",
            data: checkInventory
        })
    }
    catch (error) {
        return res.status(200).json({
            status: "error",
            message: "An unexpected error occured while proceeding your request.",
            data: null,
            trace: error.message
        });
    }
}

export default {
    createInventory,
    view,
    update,
    deleteInventory,
    reorderInventory,
    reorderList,
    cancelReorder,
    checkedReorder,
    createCategory,
    viewCategory,
    viewByCategory,
    sales
}
