/**
 * GST Calculation Utility
 *
 * Computes full GST breakup for material bills based on Indian GST rules.
 *
 * Supports:
 *   - Intra-State: CGST (half rate) + SGST (half rate)
 *   - Inter-State: IGST (full rate)
 *   - Multiple GST rates in a single bill (5%, 12%, 18%, 28%)
 *   - Discount calculation
 *   - Rate-wise breakup for GST reporting
 *
 * @param {Array} items - Array of bill items, each with:
 *   { quantity, ratePerUnit, gstRate }
 * @param {boolean} isInterState - true for IGST, false for CGST+SGST
 * @param {number} discountPercent - Discount percentage on subtotal (default: 0)
 * @returns {Object} Full GST calculation result
 */

const calculateGst = (items = [], isInterState = false, discountPercent = 0) => {
  // Validate inputs
  if (!Array.isArray(items) || items.length === 0) {
    return {
      subtotal: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 0,
      gstBreakup: {
        isInterState,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalGstAmount: 0,
        rateWiseBreakup: [],
      },
      grandTotal: 0,
    };
  }

  // ---- Step 1: Calculate item amounts and subtotal ----
  let subtotal = 0;
  const itemsWithAmounts = items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const ratePerUnit = Number(item.ratePerUnit) || 0;
    const amount = roundTo2(quantity * ratePerUnit);
    subtotal += amount;

    return {
      ...item,
      quantity,
      ratePerUnit,
      amount,
      gstRate: Number(item.gstRate) || 0,
    };
  });

  subtotal = roundTo2(subtotal);

  // ---- Step 2: Calculate discount ----
  const validDiscount = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  const discountAmount = roundTo2((subtotal * validDiscount) / 100);
  const taxableAmount = roundTo2(subtotal - discountAmount);

  // ---- Step 3: Group items by GST rate ----
  const rateGroups = {};

  itemsWithAmounts.forEach((item) => {
    const rate = item.gstRate;
    if (!rateGroups[rate]) {
      rateGroups[rate] = {
        gstRate: rate,
        taxableAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
      };
    }
    // Proportional discount applied per item
    const itemDiscountRatio = subtotal > 0 ? item.amount / subtotal : 0;
    const itemTaxable = roundTo2(item.amount - discountAmount * itemDiscountRatio);
    rateGroups[rate].taxableAmount = roundTo2(
      rateGroups[rate].taxableAmount + itemTaxable
    );
  });

  // ---- Step 4: Calculate GST per rate group ----
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const rateWiseBreakup = Object.values(rateGroups).map((group) => {
    if (isInterState) {
      // IGST = full rate
      group.igst = roundTo2((group.taxableAmount * group.gstRate) / 100);
      group.cgst = 0;
      group.sgst = 0;
    } else {
      // CGST = half rate, SGST = half rate
      group.cgst = roundTo2((group.taxableAmount * group.gstRate) / 200);
      group.sgst = roundTo2((group.taxableAmount * group.gstRate) / 200);
      group.igst = 0;
    }

    group.totalTax = roundTo2(group.cgst + group.sgst + group.igst);

    totalCgst += group.cgst;
    totalSgst += group.sgst;
    totalIgst += group.igst;

    return group;
  });

  // Sort by GST rate ascending
  rateWiseBreakup.sort((a, b) => a.gstRate - b.gstRate);

  // ---- Step 5: Final totals ----
  totalCgst = roundTo2(totalCgst);
  totalSgst = roundTo2(totalSgst);
  totalIgst = roundTo2(totalIgst);
  const totalGstAmount = roundTo2(totalCgst + totalSgst + totalIgst);
  const grandTotal = roundTo2(taxableAmount + totalGstAmount);

  return {
    subtotal,
    discountPercent: validDiscount,
    discountAmount,
    taxableAmount,
    gstBreakup: {
      isInterState,
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      igstAmount: totalIgst,
      totalGstAmount,
      rateWiseBreakup,
    },
    grandTotal,
  };
};

/**
 * Round a number to 2 decimal places
 */
function roundTo2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

module.exports = calculateGst;
