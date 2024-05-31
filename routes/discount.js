import helper from '../utils/helpers.js';
import express from 'express';
import discount from '../controllers/discount.js';
const router = express.Router();

router.post('/createDiscount', helper.verifyAuthToken, discount.createDiscount);
router.put('/updateDiscount/:id', helper.verifyAuthToken, discount.updateDiscount);
router.post('/getDiscount', helper.verifyAuthToken, discount.getDiscount);
router.get('/getSingleDiscount/:id', helper.verifyAuthToken, discount.getSingleDiscount);
router.delete('/deleteDiscount/:id', helper.verifyAuthToken, discount.deleteDiscount);

export default router;