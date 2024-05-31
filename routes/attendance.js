import helper from '../utils/helpers.js';
import express from 'express';
import attendance from '../controllers/attendance.js';
const router = express.Router();

router.post('/clockIn', helper.verifyAuthToken, attendance.clockIn);
router.put('/clockOut/:id', helper.verifyAuthToken, attendance.clockOut);
router.post('/getAttendance', helper.verifyAuthToken, attendance.getAttendance);
router.post('/attendanceRequest', helper.verifyAuthToken, attendance.attendanceRequest);
router.post('/getAttendanceRequest', helper.verifyAuthToken, attendance.getAttendanceRequest);
router.get('/requestDetail/:id',helper.verifyAuthToken, attendance.requestDetail);
router.put('/acceptRequest/:id', helper.verifyAuthToken, attendance.acceptAttendanceRequest);

export default router;