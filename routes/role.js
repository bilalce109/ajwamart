import express from 'express';
import role from '../controllers/role.js';




const router = express.Router();

router.post("/",role.register);
router.get("/",role.all);
router.post("/permissions",role.permissions);
router.get("/permissions",role.showPermissions);

 // Assign permissions to a role

router.post("/:roleId/permissions",role.assignPermission);
router.put("/:roleId/update-permission/:permissionId",role.updatePermission);
router.post('/:roleId/assign-bulk-permissions',role.bulkPermission);


router.get("/:roleId/permissions",role.getPermissions);


// update child in permissions
router.put('/updateChild/:id',role.updateChild);




export default router;