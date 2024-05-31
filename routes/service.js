import helper from '../utils/helpers.js';
import express from 'express';
import service from '../controllers/service.js';
const router = express.Router();

router.post('/createServiceType', helper.verifyAuthToken, service.createServiceCat);
router.post('/createService', helper.verifyAuthToken, service.createService);
router.post('/getAllService', helper.verifyAuthToken, service.getAllService);
router.get('/getSingleService/:id', helper.verifyAuthToken, service.getSingleService);
router.put('/updateService/:id', helper.verifyAuthToken, service.updateService);
router.delete('/deleteService/:id', helper.verifyAuthToken, service.deleteService);

export default router;