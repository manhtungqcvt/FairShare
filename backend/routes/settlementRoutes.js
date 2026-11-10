const express = require('express');
const router = express.Router();
const {
  createSettlement,
  getGroupSettlements,
  deleteSettlement
} = require('../controllers/settlementController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createSettlement);
router.get('/group/:groupId', getGroupSettlements);
router.delete('/:id', deleteSettlement);

module.exports = router;
