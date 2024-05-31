import helper from '../utils/helpers.js';
import express from 'express';
import vendor from '../controllers/vendor.js';
const router = express.Router();

router.post('/createVendor', helper.verifyAdmin, vendor.createVendor);
router.put('/updateVendor/:id', helper.verifyAdmin, vendor.updateVendor);
router.post('/getVendor', helper.verifyAdmin, vendor.getVendor);
router.get('/getSingleVendor/:id', helper.verifyAdmin, vendor.getSingleVendor);
router.delete('/deleteVendor/:id', helper.verifyAdmin, vendor.deleteVendor);

export default router;