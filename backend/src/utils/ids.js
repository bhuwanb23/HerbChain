/**
 * ID generators — same formats as the Flask backend
 * (uuid4 hex slices, uppercased, prefixed).
 */
const crypto = require("crypto");

function hex(n) {
  return crypto.randomBytes(Math.ceil(n / 2)).toString("hex").slice(0, n).toUpperCase();
}

const newUserId = (role) => `${role}_${hex(10)}`;
const newEventId = () => `EVT-${hex(12)}`;
const newBatchId = () => `HERB-${hex(8)}`;
const newReportId = () => `REPORT-${hex(10)}`;
const newProductId = () => `PROD-${hex(10)}`;
const newFarmId = () => `FARM-${hex(8)}`;
const newPlanId = () => `PLAN-${hex(8)}`;
const newQuoteId = () => `PQ-${hex(8)}`;
const newSnapshotId = () => `WX-${hex(8)}`;

module.exports = {
  newUserId,
  newEventId,
  newBatchId,
  newReportId,
  newProductId,
  newFarmId,
  newPlanId,
  newQuoteId,
  newSnapshotId,
};