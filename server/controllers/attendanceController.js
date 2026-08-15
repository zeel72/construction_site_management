/**
 * Attendance Controller
 * Scoped to a specific site: /api/sites/:siteId/attendance
 */
const Attendance = require('../models/Attendance');
const Labour = require('../models/Labour');

// @desc    Get attendance records for a specific date
// @route   GET /api/sites/:siteId/attendance?date=YYYY-MM-DD
// @access  Private
exports.getAttendance = async (req, res) => {
  const { date } = req.query;
  const siteId = req.params.siteId;
  
  let query = { siteId };

  if (date) {
    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setUTCHours(23, 59, 59, 999));
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const attendance = await Attendance.find(query)
    .populate('labourId', 'name skill dailyWage')
    .sort({ date: -1 });

  res.json({
    success: true,
    count: attendance.length,
    data: attendance,
  });
};

// @desc    Mark attendance (bulk or single)
// @route   POST /api/sites/:siteId/attendance
// @access  Private
exports.markAttendance = async (req, res) => {
  const { records } = req.body; // Array of { labourId, date, status, overtimeHours }
  const siteId = req.params.siteId;

  if (!records || !Array.isArray(records)) {
    const error = new Error('Please provide an array of attendance records');
    error.statusCode = 400;
    throw error;
  }

  const savedRecords = [];

  for (let record of records) {
    const { labourId, date, status, overtimeHours, workDescription } = record;
    
    // Check if labour belongs to this site
    const labour = await Labour.findOne({ _id: labourId, siteId });
    if (!labour) continue;

    // Check if already marked for this date (using upsert logic)
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));

    let attendance = await Attendance.findOne({
      labourId,
      siteId,
      date: {
        $gte: startOfDay,
        $lt: new Date(targetDate.setUTCHours(23, 59, 59, 999)),
      },
    });

    if (attendance) {
      // Update existing
      attendance.status = status;
      attendance.overtimeHours = overtimeHours || 0;
      attendance.workDescription = workDescription;
      attendance.markedBy = req.user.id;
      await attendance.save(); // triggers pre-save hook for wage
      savedRecords.push(attendance);
    } else {
      // Create new
      attendance = await Attendance.create({
        labourId,
        siteId,
        date: startOfDay,
        status,
        overtimeHours: overtimeHours || 0,
        workDescription,
        markedBy: req.user.id,
      });
      savedRecords.push(attendance);
    }
  }

  res.status(201).json({
    success: true,
    count: savedRecords.length,
    data: savedRecords,
  });
};
