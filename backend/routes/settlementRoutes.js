const express = require('express');
const router = express.Router();
const {
  createSettlement,
  getGroupSettlements,
  confirmSettlement,
  rejectSettlement,
  deleteSettlement
} = require('../controllers/settlementController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createSettlement);
router.get('/group/:groupId', getGroupSettlements);
router.patch('/:id/confirm', confirmSettlement);
router.patch('/:id/reject', rejectSettlement);
router.delete('/:id', deleteSettlement);

module.exports = router;
