const express = require('express');
const router = express.Router();
const {
  createGroup,
  getMyGroups,
  getGroupById,
  joinGroupByCode,
  getGroupBalances,
  getGroupHistory
} = require('../controllers/groupController');
const { protect, requireGroupMember } = require('../middleware/auth');

router.use(protect); // Tất cả group routes đều yêu cầu đăng nhập

router.post('/', createGroup);
router.get('/', getMyGroups);
router.post('/join', joinGroupByCode);

router.get('/:id', requireGroupMember, getGroupById);
router.get('/:id/balances', requireGroupMember, getGroupBalances);
router.get('/:id/history', requireGroupMember, getGroupHistory);

module.exports = router;
