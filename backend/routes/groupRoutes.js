const express = require('express');
const router = express.Router();
const {
  createGroup,
  getMyGroups,
  getGroupById,
  joinGroupByCode,
  removeMember,
  getGroupBalances,
  getGroupHistory,
  getGroupActivities
} = require('../controllers/groupController');
const {
  confirmSettlement,
  rejectSettlement,
  getGroupSettlements
} = require('../controllers/settlementController');
const { protect, requireGroupMember } = require('../middleware/auth');

router.use(protect); // Tất cả group routes đều yêu cầu đăng nhập

router.post('/', createGroup);
router.get('/', getMyGroups);
router.post('/join', joinGroupByCode);

router.get('/:id', requireGroupMember, getGroupById);
router.get('/:id/balances', requireGroupMember, getGroupBalances);
router.get('/:id/history', requireGroupMember, getGroupHistory);
router.get('/:id/activities', requireGroupMember, getGroupActivities);
router.delete('/:id/members/:userId', requireGroupMember, removeMember);

// Rút gọn hoặc alias theo yêu cầu đề bài: /api/groups/:groupId/settlements/:id/confirm
router.get('/:groupId/settlements', requireGroupMember, getGroupSettlements);
router.patch('/:groupId/settlements/:id/confirm', requireGroupMember, confirmSettlement);
router.patch('/:groupId/settlements/:id/reject', requireGroupMember, rejectSettlement);

module.exports = router;
