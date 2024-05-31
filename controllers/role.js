import SimpleSchema from 'simpl-schema'
import permission from '../models/permission.js';
import role from '../models/role.js';

const register = async (req, res) => {
    try {
        let data = await role.create(
            req.body
        )
        return res.status(200).json({
            status: "success",
            message: "role created successfully",
            data: req.body
        })
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: "success",
            data: {}
        })
    }
}
const all = async (req, res) => {
    try {
        let data = await role.find({});
        return res.json({
            status: 200,
            message: "success",
            data: data
        })
    }
    catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
            data: []
        })
    }
}

const permissions = async (req, res) => {
    try {
        // Check if the permission already exists
        const checkData = await permission.findOne({
            module: req.body.module,
            url: req.body.url,
            actions: req.body.actions
        });

        if (!checkData) {
            const data = await permission.create(req.body);
            return res.status(200).json({
                status: 200,
                message: "Permission created successfully",
                data
            });
        } else {
            // If the permission already exists, handle it accordingly
            return res.status(409).json({
                status: 409,
                message: "Permission already exists",
                data: checkData
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "An unexpected error occurred",
            data: null,
            trace: error.message
        });
    }
};

const updateChild = async (req, res) => {
    try {
        let permissionId = req.params.id;
        let body = req.body;
        let permissionSchema = new SimpleSchema({
            child: {
                type: Array,
                required: false
            },
            'child.$': {
                type: Object
            },
            'child.$.serialNumber': {
                type: Number
            },
            'child.$.module': {
                type: String
            },
            'child.$.url': {
                type: String
            },
            'child.$.actions': {
                type: Array
            },
            'child.$.actions.$': {
                type: String
            }

        }).newContext();

        permissionSchema.validate(req.body);

        if (!permissionSchema.isValid()) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields to proceed further!",
                trace: permissionSchema.validationErrors()
            })
        }

        // Separate update operations for service and inventory
        let result = await permission.findByIdAndUpdate(
            { _id: permissionId },
            { $push: { child: { $each: body.child } } },
            { new: true }
        );
        return res.status(200).json({
            status: "success",
            message: "permission updated",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "An unexpected error occurred",
            data: null,
            trace: error.message
        });
    }
};


const showPermissions = async (req, res) => {
    try {
        let data = await permission.find()
        return res.status(200).json({
            status: 200,
            message: "success",
            data
        })
    }
    catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
            data: {}
        })
    }
}


const assignPermission = async (req, res) => {

    try {
        const roleData = await role.findById(req.params.roleId);
        if (!roleData) {
            return res.status(404).json({ error: 'Role not found' });
        }

        const permissions = await permission.find({ _id: { $in: req.body.permissionIds } });
        role.permissions = permissions.map(permission => permission._id);
        await role.save();

        res.json(role);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const getPermissions = async (req, res) => {
    try {



        let roleData = await role.findById(req.params.roleId).lean();

        roleData.permissions = await Promise.all(roleData.permissions.map(async (e) => {
            return await permission.findOne({
                _id: e
            });
        }))


        if (!roleData) {
            return res.status(404).json({ error: 'Role not found' });
        }
        return res.json(roleData);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }

}

const allPermissions = async (req, res) => {
    try {



        let roleData = await role.findById(req.params.roleId).lean();

        roleData.permissions = await Promise.all(roleData.permissions.map(async (e) => {
            return await permission.findOne({
                _id: e
            });
        }))


        if (!roleData) {
            return res.status(404).json({ error: 'Role not found' });
        }
        return res.json(roleData);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }

}


const updatePermission = async (req, res) => {
    // Update a specific permission for a role
    try {
        let Role = await role.findById(req.params.roleId);
        if (!Role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        const permissionIdToUpdate = req.params.permissionId;
        const updatedPermission = await permission.findByIdAndUpdate(
            permissionIdToUpdate,
            req.body,
            { new: true }
        );

        if (!updatedPermission) {
            return res.status(404).json({ error: 'Permission not found' });
        }

        // Find the index of the permission in the role's permissions array

        if (Role.permissions.length) {
            const permissionIndex = Role.permissions.indexOf(permissionIdToUpdate);


            // If permission is found in the role's permissions, update it
            if (permissionIndex !== -1) {
                Role.permissions.set(permissionIndex, updatedPermission._id);
                await Role.save();
            }
        }



        res.json({ role, updatedPermission });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }

}

const bulkPermission = async (req, res) => {
    try {
        const Role = await role.findById(req.params.roleId);
        if (!Role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        const permissionIds = req.body.permissionIds;

        // Find the permissions based on the provided IDs
        const permissions = await permission.find({ _id: { $in: permissionIds } });

        // Map the permission IDs to ObjectId values
        const permissionObjectIds = permissions.map(permission => permission._id);

        // Assign the permission ObjectIds to the role's permissions array
        Role.permissions = permissionObjectIds;
        await Role.save();
        res.json({
            status: 'success',
            data: Role
        });


    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
}


export default {
    register,
    permissions,
    updateChild,
    showPermissions,
    assignPermission,
    updatePermission,
    getPermissions,
    all,
    bulkPermission

};