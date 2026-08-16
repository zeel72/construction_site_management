const mongoose = require('mongoose');
const Labour = require('../models/Labour');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const MaterialBill = require('../models/MaterialBill');
const Supplier = require('../models/Supplier');

// @desc    Get Financial Report for a specific site (Labours & Suppliers)
// @route   GET /api/sites/:siteId/reports/financial
// @access  Private
exports.getSiteFinancialReport = async (req, res) => {
  const { siteId } = req.params;
  const siteObjectId = new mongoose.Types.ObjectId(siteId);

  // ============================================
  // 1. Process Labours
  // ============================================
  const labours = await Labour.find({ siteId }).lean();
  
  const laboursData = await Promise.all(labours.map(async (labour) => {
    const attendances = await Attendance.find({ labourId: labour._id });
    const totalEarned = attendances.reduce((sum, curr) => sum + curr.wageForDay, 0);

    const payments = await Payment.find({ referenceId: labour._id, type: 'labour' });
    const totalPaid = payments.reduce((sum, curr) => sum + curr.amount, 0);

    const balance = totalEarned - totalPaid;
    
    // Balance > 0 means we owe them (You'll Give)
    // Balance < 0 means we paid advance (You'll Get)
    
    return {
      id: labour._id,
      name: labour.name,
      type: 'Labour',
      totalEarned,
      totalPaid,
      balance,
      lastActivityDate: payments.length > 0 ? payments[payments.length - 1].paymentDate : (attendances.length > 0 ? attendances[attendances.length - 1].date : labour.createdAt)
    };
  }));

  // ============================================
  // 2. Process Material Suppliers (Site Specific)
  // ============================================
  
  // Get all bills for this site grouped by supplier
  const billsAggregation = await MaterialBill.aggregate([
    { $match: { siteId: siteObjectId, status: { $ne: 'cancelled' } } },
    { $group: {
        _id: '$supplierId',
        supplierName: { $first: '$supplierName' },
        totalBilled: { $sum: '$finalAmount' },
        lastBillDate: { $max: '$billDate' }
    }}
  ]);

  // Get all payments for this site grouped by supplier
  const paymentsAggregation = await Payment.aggregate([
    { $match: { siteId: siteObjectId, type: 'material' } },
    { $group: {
        _id: '$referenceId',
        referenceName: { $first: '$referenceName' },
        totalPaid: { $sum: '$amount' },
        lastPaymentDate: { $max: '$paymentDate' }
    }}
  ]);

  // Combine supplier data
  const suppliersMap = new Map();

  billsAggregation.forEach(billData => {
    suppliersMap.set(billData._id.toString(), {
      id: billData._id,
      name: billData.supplierName || 'Unknown Supplier',
      type: 'Supplier',
      totalEarned: billData.totalBilled, // Using 'Earned' generically for Billed amount
      totalPaid: 0,
      lastActivityDate: billData.lastBillDate
    });
  });

  paymentsAggregation.forEach(payData => {
    const idStr = payData._id.toString();
    if (suppliersMap.has(idStr)) {
      const existing = suppliersMap.get(idStr);
      existing.totalPaid += payData.totalPaid;
      if (new Date(payData.lastPaymentDate) > new Date(existing.lastActivityDate)) {
        existing.lastActivityDate = payData.lastPaymentDate;
      }
    } else {
      suppliersMap.set(idStr, {
        id: payData._id,
        name: payData.referenceName || 'Unknown Supplier',
        type: 'Supplier',
        totalEarned: 0,
        totalPaid: payData.totalPaid,
        lastActivityDate: payData.lastPaymentDate
      });
    }
  });

  const suppliersData = Array.from(suppliersMap.values()).map(supplier => ({
    ...supplier,
    balance: supplier.totalEarned - supplier.totalPaid
  }));

  // ============================================
  // 3. Combine & Calculate Global Totals
  // ============================================
  const allParties = [...laboursData, ...suppliersData];
  
  // Sort by name
  allParties.sort((a, b) => a.name.localeCompare(b.name));

  let totalYouWillGet = 0; // Total Advances / Overpaid (balance < 0)
  let totalYouWillGive = 0; // Total Owed (balance > 0)

  allParties.forEach(party => {
    if (party.balance > 0) {
      totalYouWillGive += party.balance;
    } else if (party.balance < 0) {
      totalYouWillGet += Math.abs(party.balance);
    }
  });

  const netBalance = totalYouWillGive - totalYouWillGet;

  res.json({
    success: true,
    data: {
      summary: {
        totalYouWillGet,
        totalYouWillGive,
        netBalance
      },
      parties: allParties
    }
  });
};
