const mongoose = require('mongoose');
const calculateWage = require('../utils/calculateWage');

const attendanceSchema = new mongoose.Schema(
  {
    labourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Labour', required: true },
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day'],
      required: true,
    },
    overtimeHours: { type: Number, default: 0 },
    workDescription: { type: String },
    wageForDay: { type: Number, default: 0 },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate attendance records per labour per day on a site
attendanceSchema.index({ labourId: 1, siteId: 1, date: 1 }, { unique: true });

// Pre-save hook to automatically calculate wageForDay
attendanceSchema.pre('save', async function (next) {
  if (this.isModified('status') || this.isModified('overtimeHours')) {
    try {
      const labour = await mongoose.model('Labour').findById(this.labourId);
      if (labour) {
        this.wageForDay = calculateWage(
          this.status,
          labour.dailyWage,
          this.overtimeHours,
          labour.overtimeRate
        );
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
