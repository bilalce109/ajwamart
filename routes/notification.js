import helper from '../utils/helpers.js';
import express from 'express';
import notificationController from '../controllers/notification.js';

const router = express.Router();

router.post('/create', notificationController.createNotification);

router.get('/', helper.verifyAuthToken, notificationController.NotificationList);

export default router;