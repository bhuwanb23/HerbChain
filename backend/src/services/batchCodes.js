/**
 * Human batch codes — HERB-<year>-<6-digit> (docs/phase_3.md).
 * Never the DB id; UNIQUE column on Batch.code. Caller wraps create in a
 * retry loop: two concurrent creates can observe the same count, and the
 * second gets a P2002 and regenerates.
 */
async function nextBatchCode(tx) {
  const year = new Date().getFullYear();
  const prefix = `HERB-${year}-`;
  const count = await tx.batch.count({ where: { code: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(6, "0")}`;
}

module.exports = { nextBatchCode };
