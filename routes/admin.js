import helper from '../utils/helpers.js';
import express from 'express';
import adminController from '../controllers/admin.js';

const router = express.Router();

//#region ADMIN USERS APIs

router.post('/register', adminController.createUser);

router.post('/login', adminController.login);


router.post("/password/forget", adminController.forgetPassword);

router.post("/otp/verify", helper.verifyAdmin, adminController.verifyOtp);

router.post("/password/change", adminController.changePassword);


router.post('/user', helper.verifyAdmin, adminController.createUser);

router.put('/update', helper.verifyAdmin, adminController.updateAdmin);

router.delete('/:id', helper.verifyAdmin, adminController.deleteAdmin);

router.get('/', helper.verifyAdmin, adminController.adminList);

//#endregion



export default router;