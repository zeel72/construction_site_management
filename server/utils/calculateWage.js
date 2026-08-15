/**
 * Wage Calculation Utility
 *
 * Calculates daily wage for a labourer based on attendance status.
 *
 * Rules:
 *   - present  → dailyWage + (overtimeHours × overtimeRate)
 *   - half_day → dailyWage / 2
 *   - absent   → 0
 *
 * @param {string} status       - 'present' | 'half_day' | 'absent'
 * @param {number} dailyWage    - Base daily wage amount
 * @param {number} overtimeHours - Hours of overtime worked (default: 0)
 * @param {number} overtimeRate  - Rate per overtime hour (default: 0)
 * @returns {number} Calculated wage for the day
 */

const calculateWage = (status, dailyWage, overtimeHours = 0, overtimeRate = 0) => {
  if (!dailyWage || dailyWage < 0) {
    return 0;
  }

  switch (status) {
    case 'present': {
      const baseWage = dailyWage;
      const overtimePay = (overtimeHours || 0) * (overtimeRate || 0);
      return Math.round((baseWage + overtimePay) * 100) / 100; // Round to 2 decimals
    }

    case 'half_day': {
      return Math.round((dailyWage / 2) * 100) / 100;
    }

    case 'absent': {
      return 0;
    }

    default: {
      return 0;
    }
  }
};

module.exports = calculateWage;
