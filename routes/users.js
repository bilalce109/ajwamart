import helper from '../utils/helpers.js';
import express from 'express';
import userController from '../controllers/users.js';
import authentication from '../controllers/authentication.js';
const router = express.Router();

router.post('/login', authentication.login);
router.post('/register', authentication.register);
router.post('/forgetPassword', authentication.forgetPassword);
router.get('/home', userController.home);

router.post("/changePassword", authentication.changePassword);

// setup new password
router.put("/newPassword", helper.verifyAuthToken, authentication.newPassword);

router.put("/updateUser", helper.verifyAuthToken, userController.updateUser);
router.post("/homePage", helper.verifyAuthToken, userController.homePage);
router.get("/getUser/:id", userController.getProfile);


router.get("/getUserProfile", helper.verifyAuthToken, userController.getUserProfile);
router.post("/getList", userController.getUserList);
router.post("/verifyOtp", authentication.verifyOtp);
router.get('/search', userController.search);
router.delete('/delete', helper.verifyAuthToken, authentication.deleteUser);
router.put('/profilePicture', helper.verifyAuthToken, authentication.profilePicture);
router.post('/card', helper.verifyAuthToken, userController.addNewCard);
router.put('/removecard/:cardId', helper.verifyAuthToken, userController.removeCard);
router.put('/setting', helper.verifyAuthToken, userController.updateSettings);

router.post('/dashboard', helper.verifyAuthToken,  authentication.home);

router.post('/managerDashboard', helper.verifyAuthToken, authentication.managerDashboard);
router.post('/ownerDashboard', helper.verifyAuthToken, authentication.ownerDashboard);
// router.post('/admindashboard', helper.verifyAuthToken, authentication.superAdminDashboard);


export default router;