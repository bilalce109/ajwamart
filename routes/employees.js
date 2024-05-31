import helper from '../utils/helpers.js';
import express from 'express';
import employees from '../controllers/employees.js';
const router = express.Router();

router.post('/createEmployees', helper.verifyAuthToken, employees.createEmployees);
router.put('/updateEmployees/:id', helper.verifyAuthToken, employees.updateEmployees);
router.get('/getSingleEmployee/:id', helper.verifyAuthToken, employees.getSingleEmployee);
router.post('/getAllEmployees', helper.verifyAuthToken, employees.getAllEmployees);
router.delete('/deleteEmployee/:id', employees.deleteEmployee);
router.put('/blockUser/:id', helper.verifyAuthToken, employees.blockEmployee);
router.post('/listBlocked', helper.verifyAuthToken, employees.listBlocked);
router.put('/unBlockUser/:id', helper.verifyAuthToken, employees.unBlockUser);
router.post('/companyEmployees', helper.verifyAuthToken, employees.getEmployees);


export default router;