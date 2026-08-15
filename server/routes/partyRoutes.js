const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const partyController = require('../controllers/partyController');

router.use(protect);

router
  .route('/')
  .get(partyController.getParties)
  .post(partyController.addParty);

router
  .route('/:id')
  .get(partyController.getPartyDetails)
  .put(partyController.updateParty)
  .delete(partyController.deleteParty);

router
  .route('/:id/transactions')
  .post(partyController.addTransaction);

router
  .route('/:id/transactions/:txnId')
  .delete(partyController.deleteTransaction);

module.exports = router;
