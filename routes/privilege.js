import helper from '../utils/helpers.js';
import express from 'express';
import privilege from '../controllers/privilege.js';
const router = express.Router();

router.post('/createPrivilege', helper.verifyAuthToken, privilege.createPrivilege);
router.put('/updatePrivilege/:id', helper.verifyAuthToken, privilege.updatePrivilege);
router.post('/getPrivilege', helper.verifyAuthToken, privilege.getPrivilege);
router.get('/getSinglePrivilege/:id', helper.verifyAuthToken, privilege.getSinglePrivilege);
router.delete('/deletePrivilege/:id', helper.verifyAuthToken, privilege.deletePrivilege);

export default router;