import helper from '../utils/helpers.js';
import express from 'express';
import job from '../controllers/job.js';
import jobPackage from '../controllers/jobPackage.js';
const router = express.Router();

// CSR Flow
router.post('/createJob', helper.verifyAuthToken, job.createJob);
router.put('/updateJobByCSR/:id', helper.verifyAuthToken, job.updateJobByCSR);
router.put('/jobStatus/:id',helper.verifyAdminAuthToken,job.updateJobStatus);
router.post('/getJob', helper.verifyAuthToken, job.getJob);
router.get('/getSingleJob/:id', helper.verifyAuthToken, job.getSingleJob);
router.delete('/deleteJob/:id', helper.verifyAuthToken, job.deleteJob);

// Update Recommended Service Check as True || false || CSR
router.put('/updateRecommended/:id/:serviceId', helper.verifyAuthToken, job.updateRecommended);
router.put('/addRecommended/:id', helper.verifyAuthToken, job.addRecommended);

// Technician Job Update
router.post('/assignTechnician/:id', helper.verifyAuthToken, job.assignJobToTechnician);

router.put('/assignTechnicianByCsr/:id', helper.verifyAuthToken, job.updateTechnicianByCsr);
router.get('/technician', helper.verifyAuthToken, job.listOfTechnician);
router.put('/updateJobByTechnician/:id', helper.verifyAuthToken, job.updateJobByTechnician);
router.post('/getJobsTechnician', helper.verifyAuthToken, job.getJobsTechnician);

// Create Job Package
router.post('/createJobPackage', helper.verifyAuthToken, jobPackage.createJobPackage);
router.get('/getJobPackage/:id', helper.verifyAuthToken, jobPackage.getJobPackage);
router.post('/getAllPackage', helper.verifyAuthToken, jobPackage.getAllPackage);
router.post('/getAllServices', helper.verifyAuthToken, jobPackage.getAllServices);

// update job packages
router.post('/updateJobPackages/:id' , helper.verifyAuthToken, job.updateJobPackage);

export default router;