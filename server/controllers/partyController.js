const Party = require('../models/Party');
const PartyTransaction = require('../models/PartyTransaction');

// Helper function to calculate interest between two dates on a specific balance
const calculateInterestForPeriod = (balance, rate, rateType, startDate, endDate) => {
  if (balance === 0 || !rate) return 0;
  
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = (endDate - startDate) / msPerDay;
  if (days <= 0) return 0;
  
  // Convert rate percentage to daily decimal
  const ratePerDay = rateType === 'monthly' 
    ? (rate / 100) / 30 
    : (rate / 100) / 365;
    
  // Interest is calculated on the absolute balance, keeping its sign
  return balance * ratePerDay * days;
};

// Re-calculate the ledger with accrued interest up to 'now'
const calculateLedger = (party, transactions) => {
  let runningBalance = 0; // Positive = You'll Get, Negative = You'll Give
  let totalAccruedInterest = 0;
  let lastDate = null;
  
  const processedTransactions = [];
  
  // Sort transactions by date (oldest first)
  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  sorted.forEach((txn) => {
    // If interest is active, calculate interest accrued from last transaction date to this transaction date
    if (party.isInterestActive && lastDate) {
      const interest = calculateInterestForPeriod(
        runningBalance, 
        party.interestRate, 
        party.interestType, 
        lastDate, 
        new Date(txn.date)
      );
      if (Math.abs(interest) >= 0.01) {
        totalAccruedInterest += interest;
        runningBalance += interest;
        processedTransactions.push({
          isVirtualInterest: true,
          amount: Math.abs(interest),
          type: interest > 0 ? 'get' : 'give',
          description: 'Accrued Interest',
          date: txn.date,
          runningBalance
        });
      }
    }
    
    // Process actual transaction
    // 'get' means you gave them money/goods, so you will get it back (+ balance)
    // 'give' means you took money/goods from them, so you owe them (- balance)
    const amountVal = txn.type === 'get' ? txn.amount : -txn.amount;
    runningBalance += amountVal;
    
    processedTransactions.push({
      ...txn._doc,
      runningBalance
    });
    
    lastDate = new Date(txn.date);
  });
  
  // Calculate interest from last transaction to TODAY
  if (party.isInterestActive && lastDate) {
    const today = new Date();
    // Only if today is after the last transaction
    if (today > lastDate) {
      const interest = calculateInterestForPeriod(
        runningBalance, 
        party.interestRate, 
        party.interestType, 
        lastDate, 
        today
      );
      if (Math.abs(interest) >= 0.01) {
        totalAccruedInterest += interest;
        runningBalance += interest;
        processedTransactions.push({
          isVirtualInterest: true,
          amount: Math.abs(interest),
          type: interest > 0 ? 'get' : 'give',
          description: 'Accrued Interest (Up to Today)',
          date: today,
          runningBalance
        });
      }
    }
  }
  
  return { processedTransactions, runningBalance, totalAccruedInterest };
};

exports.getParties = async (req, res, next) => {
  try {
    const parties = await Party.find({ userId: req.user.id });
    const result = [];
    
    let totalYoullGet = 0;
    let totalYoullGive = 0;

    for (let party of parties) {
      const transactions = await PartyTransaction.find({ partyId: party._id });
      const { runningBalance, totalAccruedInterest } = calculateLedger(party, transactions);
      
      if (runningBalance > 0) {
        totalYoullGet += runningBalance;
      } else {
        totalYoullGive += Math.abs(runningBalance);
      }
      
      result.push({
        ...party._doc,
        balance: runningBalance,
        accruedInterest: totalAccruedInterest,
      });
    }

    res.json({
      success: true,
      data: result,
      summary: {
        totalYoullGet,
        totalYoullGive,
        netBalance: totalYoullGet - totalYoullGive
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPartyDetails = async (req, res, next) => {
  try {
    const party = await Party.findOne({ _id: req.params.id, userId: req.user.id });
    if (!party) return res.status(404).json({ success: false, error: 'Party not found' });
    
    const transactions = await PartyTransaction.find({ partyId: party._id });
    const { processedTransactions, runningBalance, totalAccruedInterest } = calculateLedger(party, transactions);
    
    // Reverse array so newest is top
    processedTransactions.reverse();

    res.json({
      success: true,
      data: {
        party,
        transactions: processedTransactions,
        balance: runningBalance,
        totalAccruedInterest
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.addParty = async (req, res, next) => {
  try {
    const party = await Party.create({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json({ success: true, data: party });
  } catch (error) {
    next(error);
  }
};

exports.updateParty = async (req, res, next) => {
  try {
    const party = await Party.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!party) return res.status(404).json({ success: false, error: 'Party not found' });
    res.json({ success: true, data: party });
  } catch (error) {
    next(error);
  }
};

exports.deleteParty = async (req, res, next) => {
  try {
    const party = await Party.findOne({ _id: req.params.id, userId: req.user.id });
    if (!party) return res.status(404).json({ success: false, error: 'Party not found' });
    
    await PartyTransaction.deleteMany({ partyId: party._id });
    await party.deleteOne();
    
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

exports.addTransaction = async (req, res, next) => {
  try {
    const { amount, type, description, date } = req.body;
    
    const party = await Party.findOne({ _id: req.params.id, userId: req.user.id });
    if (!party) return res.status(404).json({ success: false, error: 'Party not found' });

    const transaction = await PartyTransaction.create({
      partyId: party._id,
      userId: req.user.id,
      amount: Number(amount),
      type,
      description,
      date: date ? new Date(date) : Date.now()
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await PartyTransaction.findOne({ 
      _id: req.params.txnId, 
      partyId: req.params.id,
      userId: req.user.id 
    });
    
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    
    await transaction.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
