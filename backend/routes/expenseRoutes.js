const express = require('express');
const router = express.Router();
const {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  deleteExpense
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createExpense);
router.get('/group/:groupId', getGroupExpenses);
router.get('/:id', getExpenseById);
router.delete('/:id', deleteExpense);

module.exports = router;
