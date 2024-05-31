import helper from '../utils/helpers.js';
import express from 'express';
import invoice from '../controllers/invoice.js';
const router = express.Router();



router.get('/searchbyVin', helper.verifyAuthToken, invoice.getInvoiceByVin);

router.post('/:id/store', helper.verifyAuthToken, invoice.store);

router.put('/:id/update', helper.verifyAuthToken, invoice.update);


router.get('/:id/updatePayment', helper.verifyAuthToken, invoice.updatePayment);

router.get('/:id', helper.verifyAuthToken, invoice.view);

router.get('/', helper.verifyAuthToken, invoice.all);


export default router;