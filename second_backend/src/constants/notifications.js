/**
 * Phase 14 — Notifications & Alerts catalog (docs/phase_14.md).
 *
 * The event catalog drives EVERYTHING: templates are seeded from here (the
 * app never hardcodes a message), queue rows reference template codes, and
 * the worker renders bodies + picks channels + priority from the template.
 *
 * priority: LOW | MEDIUM | HIGH | CRITICAL
 * channel strategy (docs/phase_14.md "SMS/Email/Push Strategy"):
 *   sms   — rural users, field-critical events only (pickup, transfer, result)
 *   email — official communications (certificates, recalls, account activity)
 *   push  — live workflow events (assigned, received, approved)
 *   in_app — always
 */
const PRIORITIES = { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", CRITICAL: "CRITICAL" };

const QUEUE_STATUSES = { PENDING: "pending", PROCESSING: "processing", SENT: "sent", FAILED: "failed" };

const DELIVERY_STATUSES = { SENT: "sent", DELIVERED: "delivered", FAILED: "failed", READ: "read" };

const SCHEDULED_STATUSES = { PENDING: "pending", PROCESSED: "processed", FAILED: "failed", CANCELLED: "cancelled" };

/**
 * Event catalog. Each entry:
 *   code      — unique template code (also the queue template_code)
 *   name      — human label
 *   channels  — channels this event may use (worker still checks user prefs)
 *   category  — grouping for inbox filters + analytics
 *   priority  — LOW | MEDIUM | HIGH | CRITICAL
 *   title     — in-app/push title with {placeholders}
 *   body      — message body with {placeholders}
 */
const EVENT_CATALOG = [
  // ------------------------------------------------------------- batch events
  { code: "batch_created", name: "Batch registered", channels: "in_app,sms", category: "batch", priority: PRIORITIES.MEDIUM,
    title: "Batch {code} registered",
    body: "Your batch {code} ({species}) has been successfully registered. Keep the QR safe — it tracks every handoff.",
  },
  { code: "batch_requested", name: "Batch requested", channels: "in_app,push", category: "batch", priority: PRIORITIES.MEDIUM,
    title: "New batch request",
    body: "{requester} has requested your batch {code}. Review and respond in the app.",
  },
  // ---------------------------------------------------------- shipment events
  { code: "shipment_assigned", name: "Pickup assigned", channels: "in_app,push,sms", category: "shipment", priority: PRIORITIES.HIGH,
    title: "Shipment {code} assigned",
    body: "Shipment {code} has been assigned to you. Pickup scheduled for {pickupDate}.",
  },
  { code: "pickup_reminder", name: "Pickup reminder", channels: "in_app,sms", category: "shipment", priority: PRIORITIES.HIGH,
    title: "Pickup today: {code}",
    body: "Transporter arrives today for shipment {code}. Have the batch QR ready.",
  },
  { code: "shipment_delayed", name: "Shipment delayed", channels: "in_app,push,email", category: "shipment", priority: PRIORITIES.HIGH,
    title: "Shipment {code} delayed",
    body: "Shipment {code} is delayed by {delay}. Expected arrival has been updated.",
  },
  { code: "shipment_received", name: "Shipment received", channels: "in_app,push", category: "shipment", priority: PRIORITIES.MEDIUM,
    title: "Shipment {code} received",
    body: "Shipment {code} ({quantity}) was received and confirmed at {location}.",
  },
  // ---------------------------------------------------------- ownership events
  { code: "ownership_transferred", name: "Ownership transferred", channels: "in_app,push,sms", category: "ownership", priority: PRIORITIES.HIGH,
    title: "Ownership transferred",
    body: "Ownership of batch {code} transferred from {from} to {to}.",
  },
  { code: "transfer_requested", name: "Transfer requested", channels: "in_app,push", category: "ownership", priority: PRIORITIES.MEDIUM,
    title: "Transfer request for {code}",
    body: "{from} wants to transfer batch {code} to you. Approve or reject in the app.",
  },
  { code: "transfer_rejected", name: "Transfer rejected", channels: "in_app,push", category: "ownership", priority: PRIORITIES.MEDIUM,
    title: "Transfer rejected",
    body: "Your transfer of batch {code} was rejected{reason}.",
  },
  // ------------------------------------------------------------- lab events
  { code: "batch_received", name: "Batch received at lab", channels: "in_app,push", category: "lab", priority: PRIORITIES.MEDIUM,
    title: "Batch {code} received",
    body: "Batch {code} arrived at {lab}. Testing can begin.",
  },
  { code: "testing_started", name: "Testing started", channels: "in_app,push", category: "lab", priority: PRIORITIES.LOW,
    title: "Testing started on {code}",
    body: "Laboratory {lab} has started testing your batch {code}.",
  },
  { code: "certificate_issued", name: "Certificate issued", channels: "in_app,email", category: "lab", priority: PRIORITIES.HIGH,
    title: "Batch {code} certified ✅",
    body: "Batch {code} passed all tests. Certificate {certificateNumber} issued by {lab}.",
  },
  { code: "batch_rejected", name: "Batch rejected", channels: "in_app,email", category: "lab", priority: PRIORITIES.HIGH,
    title: "Batch {code} failed testing",
    body: "Batch {code} failed testing: {reason}. See the rejection record for details.",
  },
  // --------------------------------------------------------- manufacturer events
  { code: "request_submitted", name: "Request submitted", channels: "in_app,push", category: "manufacturer", priority: PRIORITIES.MEDIUM,
    title: "Batch request submitted",
    body: "{manufacturer} has requested {quantity} of batch {code}.",
  },
  { code: "request_approved", name: "Request approved", channels: "in_app,push,email", category: "manufacturer", priority: PRIORITIES.HIGH,
    title: "Request approved",
    body: "Your request for batch {code} was approved ({quantity}). Arrange pickup.",
  },
  { code: "product_created", name: "Product created", channels: "in_app,email", category: "manufacturer", priority: PRIORITIES.MEDIUM,
    title: "Product {code} created",
    body: "Product {code} ({name}) registered with {lots} lot(s).",
  },
  // ------------------------------------------------------------- recall events
  { code: "recall_issued", name: "Recall notice", channels: "in_app,email,sms", category: "recall", priority: PRIORITIES.CRITICAL,
    title: "🚨 RECALL: {reference}",
    body: "{reason} — Do NOT consume or sell {reference}. Return stock immediately. Full notice: {recallNumber}.",
  },
  // ------------------------------------------------------------- user events
  { code: "account_approved", name: "Account approved", channels: "in_app,email", category: "user", priority: PRIORITIES.MEDIUM,
    title: "Your account is approved",
    body: "Welcome to HerbChain! Your {role} account has been verified. You can now use the platform.",
  },
  { code: "account_suspended", name: "Account suspended", channels: "in_app,email", category: "user", priority: PRIORITIES.HIGH,
    title: "Account suspended",
    body: "Your account has been suspended{reason}. Contact support if you believe this is an error.",
  },
  // ------------------------------------------------------------- security events
  { code: "security_alert", name: "Security alert", channels: "in_app,email,sms", category: "security", priority: PRIORITIES.CRITICAL,
    title: "Security alert",
    body: "{summary} — {reference} flagged for review.",
  },
  { code: "compliance_alert", name: "Compliance alert", channels: "in_app,email", category: "security", priority: PRIORITIES.CRITICAL,
    title: "Compliance alert: {title}",
    body: "{description}",
  },
  // ------------------------------------------------ report / analytics events
  { code: "report_ready", name: "Report ready", channels: "in_app,email", category: "reports", priority: PRIORITIES.MEDIUM,
    title: "{scheduleName} is ready",
    body: "Your scheduled report '{scheduleName}' has been generated and is ready to download.",
  },
];

// Reminder engine offsets (docs/phase_14.md "Reminder Engine").
const REMINDERS = {
  PICKUP_HOURS_BEFORE: 24, // pickup reminder 24h before scheduled pickup
  CERT_EXPIRY_DAYS_BEFORE: 30, // certificate expiry 30 days before
};

// Escalation ladder for delayed shipments (docs/phase_14.md "Escalation System").
// Hop 0 = immediate transporter nudge; hop 1 = 4h later lab/manufacturer;
// hop 2 = 12h later AYUSH.
const ESCALATION = {
  hops: [
    { delay_hours: 0, event: "shipment_delayed", roles: [] }, // transporter (explicit recipient)
    { delay_hours: 4, event: "shipment_delayed", roles: [] }, // lab/manufacturer (resolved per shipment)
    { delay_hours: 12, event: "security_alert", roles: ["admin"] }, // AYUSH — CRITICAL
  ],
  CHECK_INTERVAL_MINUTES: 15,
};

  // Default retry/backoff for queue delivery.
const RETRY = {
  MAX_ATTEMPTS: 5,
  BASE_MS: 60_000, // 1m / 5m / 15m / 30m / 1h -> failed
};

module.exports = {
  PRIORITIES,
  QUEUE_STATUSES,
  DELIVERY_STATUSES,
  SCHEDULED_STATUSES,
  EVENT_CATALOG,
  REMINDERS,
  ESCALATION,
  RETRY,
};