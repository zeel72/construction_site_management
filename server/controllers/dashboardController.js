/**
 * Dashboard & Reports Controller
 * Scoped to a specific site: /api/sites/:siteId/...
 */
const mongoose = require('mongoose');
const Site = require('../models/Site');
const Labour = require('../models/Labour');
const Attendance = require('../models/Attendance');
const MaterialBill = require('../models/MaterialBill');
const Payment = require('../models/Payment');

// @desc    Get dashboard summary statistics
// @route   GET /api/sites/:siteId/dashboard
// @access  Private
exports.getDashboardSummary = async (req, res) => {
  const siteId = new mongoose.Types.ObjectId(req.params.siteId);

  // 1. Active Labours Count
  const activeLaboursCount = await Labour.countDocuments({ siteId, isActive: true });

  // 2. Today's Attendance Count
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todaysAttendanceCount = await Attendance.countDocuments({
    siteId,
    date: { $gte: today },
    status: { $in: ['present', 'half_day'] }
  });

  // 3. Total Labour Cost (sum of all wageForDay)
  const labourCostAgg = await Attendance.aggregate([
    { $match: { siteId } },
    { $group: { _id: null, total: { $sum: '$wageForDay' } } }
  ]);
  const totalLabourCost = labourCostAgg.length > 0 ? labourCostAgg[0].total : 0;

  // 4. Total Material Cost (sum of all finalAmount in MaterialBills excluding cancelled)
  const materialCostAgg = await MaterialBill.aggregate([
    { $match: { siteId, status: { $ne: 'cancelled' } } },
    { $group: { _id: null, total: { $sum: '$finalAmount' } } }
  ]);
  const totalMaterialCost = materialCostAgg.length > 0 ? materialCostAgg[0].total : 0;

  // 5. Total Payments Made (sum of all payments)
  const paymentsAgg = await Payment.aggregate([
    { $match: { siteId } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalPaymentsMade = paymentsAgg.length > 0 ? paymentsAgg[0].total : 0;

  // 6. Total Outstanding (Total Costs - Total Payments)
  const totalCost = totalLabourCost + totalMaterialCost;
  const totalOutstanding = totalCost - totalPaymentsMade;

  res.json({
    success: true,
    data: {
      activeLaboursCount,
      todaysAttendanceCount,
      totalLabourCost,
      totalMaterialCost,
      totalPaymentsMade,
      totalOutstanding,
      totalCost
    },
  });
};

// @desc    Get reports data (e.g., GST summary, expense breakdown)
// @route   GET /api/sites/:siteId/reports
// @access  Private
exports.getReports = async (req, res) => {
  const siteId = new mongoose.Types.ObjectId(req.params.siteId);

  // 1. Monthly Expense Trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Material Expenses over time
  const materialExpenses = await MaterialBill.aggregate([
    { $match: { siteId, status: { $ne: 'cancelled' }, billDate: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $month: '$billDate' }, year: { $year: '$billDate' } },
        total: { $sum: '$finalAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Labour Expenses over time
  const labourExpenses = await Attendance.aggregate([
    { $match: { siteId, date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $month: '$date' }, year: { $year: '$date' } },
        total: { $sum: '$wageForDay' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // 2. GST Summary Report
  const gstSummary = await MaterialBill.aggregate([
    { $match: { siteId, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: null,
        totalTaxableAmount: { $sum: '$taxableAmount' },
        totalCgst: { $sum: '$gstBreakup.cgstAmount' },
        totalSgst: { $sum: '$gstBreakup.sgstAmount' },
        totalIgst: { $sum: '$gstBreakup.igstAmount' },
        totalGstAmount: { $sum: '$gstBreakup.totalGstAmount' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      monthlyTrend: {
        material: materialExpenses,
        labour: labourExpenses
      },
      gstSummary: gstSummary.length > 0 ? gstSummary[0] : {
        totalTaxableAmount: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        totalGstAmount: 0
      }
    }
  });
};
