/**
 * Mock permissioned ledger — the default provider for the SQLite stack.
 *
 * Implements the same `submitBlock` interface a Hyperledger Fabric adapter
 * would (docs/blockchain/architecture.md §ledger). It is an append-only hash
 * chain persisted in `blockchain_transactions`: each block links
 * `prev_hash` and carries the `payload_hash` of the canonical business
 * facts, so chain integrity is verifiable with no external service.
 *
 * Deterministic: the same block inputs always produce the same block hash
 * (sorted canonical serialization), so tests and the live system agree and
 * `verifyChain` can recompute every hash.
 */
const crypto = require("crypto");
const { prisma } = require("../../db/client");
const { env } = require("../../config/env");

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/** Canonical block serialization — sorted keys, stable encoding. */
function blockCanonical({ block_number, prev_hash, payload_hash, event_type, entity_id, performed_by, timestamp, chain }) {
  return JSON.stringify(
    {
      block_number,
      prev_hash: prev_hash || null,
      payload_hash,
      event_type,
      entity_id,
      performed_by: performed_by || null,
      timestamp: timestamp instanceof Date ? timestamp.toISOString() : String(timestamp || ""),
      chain: chain || env.BLOCKCHAIN_CHAIN_NAME,
    },
    Object.keys({ block_number: 1, prev_hash: 1, payload_hash: 1, event_type: 1, entity_id: 1, performed_by: 1, timestamp: 1, chain: 1 }).sort()
  );
}

/** Genesis block when the chain is empty (deterministic, never changes). */
function genesisBlock() {
  return {
    block_number: 0,
    prev_hash: null,
    payload_hash: sha256("herbchain-genesis"),
    event_type: "GENESIS",
    entity_id: "herbchain",
    performed_by: "network",
    timestamp: "2026-01-01T00:00:00.000Z",
    chain: env.BLOCKCHAIN_CHAIN_NAME,
  };
}

/** Last confirmed block (chain tip). */
async function chainTip() {
  const last = await prisma.blockchainTransaction.findFirst({ orderBy: { block_number: "desc" } });
  if (last) {
    return {
      block_number: last.block_number,
      prev_hash: last.prev_hash,
      payload_hash: last.payload_hash,
      event_type: last.event_type,
      entity_id: last.entity_id,
      performed_by: last.performed_by,
      timestamp: last.confirmed_at,
      chain: last.chain,
    };
  }
  return null;
}

/**
 * Submit one block. Returns the receipt the worker stores in
 * BlockchainTransaction (the worker owns the DB write; the ledger only
 * computes the block + hash deterministically).
 */
async function submitBlock({ eventType, entityId, performedBy, payloadHash, timestamp = new Date() }) {
  const tip = (await chainTip()) || genesisBlock();
  const block = {
    block_number: tip.block_number + 1,
    prev_hash: sha256(blockCanonical(tip)),
    payload_hash: payloadHash,
    event_type: eventType,
    entity_id: entityId,
    performed_by: performedBy || null,
    timestamp,
    chain: env.BLOCKCHAIN_CHAIN_NAME,
  };
  const blockHash = sha256(blockCanonical(block));
  return {
    transactionHash: blockHash,
    blockNumber: block.block_number,
    prevHash: block.prev_hash,
    blockTime: timestamp,
    status: "confirmed",
    chain: block.chain,
  };
}

/** Recompose + verify a stored block (chain-integrity check). */
function recomputeBlock(row) {
  return sha256(
    blockCanonical({
      block_number: row.block_number,
      prev_hash: row.prev_hash,
      payload_hash: row.payload_hash,
      event_type: row.event_type,
      entity_id: row.entity_id,
      performed_by: row.performed_by,
      timestamp: row.confirmed_at,
      chain: row.chain,
    })
  );
}

module.exports = {
  name: "mock",
  submitBlock,
  chainTip,
  genesisBlock,
  recomputeBlock,
  blockCanonical,
  sha256,
};