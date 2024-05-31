import helper from '../utils/helpers.js';
import express from 'express';
import cashDrawer from '../controllers/cashDrawer.js';
const router = express.Router();

router.post('/openProcedure', helper.verifyAuthToken, cashDrawer.createOpenProcedure);
router.post('/view', helper.verifyAuthToken, cashDrawer.viewProcedure);
router.post('/closeProcedure/:id', helper.verifyAuthToken, cashDrawer.createCloseProcedure);
router.post('/viewClose', helper.verifyAuthToken, cashDrawer.viewCloseProcedure);

export default router;