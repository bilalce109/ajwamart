import helper from '../utils/helpers.js';
import express from 'express';
import coupon from '../controllers/coupon.js';
const router = express.Router();

router.post('/createCoupon', helper.verifyAuthToken, coupon.createCoupon);
router.put('/updateCoupon/:id', helper.verifyAuthToken, coupon.updateCoupon);
router.post('/getCoupon', helper.verifyAuthToken, coupon.getCoupon);
router.get('/getSingleCoupon/:id', helper.verifyAuthToken, coupon.getSingleCoupon);
router.delete('/deleteCoupon/:id', helper.verifyAuthToken, coupon.deleteCoupon);

export default router;