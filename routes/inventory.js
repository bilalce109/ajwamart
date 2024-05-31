import helper from '../utils/helpers.js';
import express from 'express';
import inventory from '../controllers/inventory.js';
const router = express.Router();

router.post('/createInventory', helper.verifyAuthToken, inventory.createInventory);
router.post('/view', helper.verifyAuthToken, inventory.view);
router.put('/update/:id', helper.verifyAuthToken, inventory.update);
router.delete('/delete/:id', helper.verifyAuthToken, inventory.deleteInventory);
router.put('/reorder/:id', helper.verifyAuthToken, inventory.reorderInventory);
router.post('/reorderView', helper.verifyAuthToken, inventory.reorderList);
router.put('/cancelReorder/:id', helper.verifyAuthToken, inventory.cancelReorder);
router.put('/checkedReorder/:id', helper.verifyAuthToken, inventory.checkedReorder);
router.get('/:id/sales', helper.verifyAuthToken, inventory.sales);

// create category

router.post('/createCategory', helper.verifyAuthToken, inventory.createCategory);
router.post('/viewCategory', helper.verifyAuthToken, inventory.viewCategory);
router.post('/viewByCategory', helper.verifyAuthToken, inventory.viewByCategory);




export default router;