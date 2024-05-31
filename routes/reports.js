import helper from '../utils/helpers.js';
import express from 'express';
import reports from '../controllers/reports.js';
const router = express.Router();

router.post('/employeePerformance', helper.verifyAuthToken, reports.employeePerformance);
router.post('/salesChart', helper.verifyAuthToken, reports.salesChart);
router.post('/salesData', reports.salesData);

export default router;