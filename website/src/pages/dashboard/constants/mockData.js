// src/mockData.js

/**
 * MOCK DATA FOR BATCHES
 * This is the complete data needed for the dashboard and traceability pages.
 */
export const batches = [
  {
    batchId: "HERB-ASH-001",
    herbName: "Ashwagandha",
    status: "In Transit",
    hasAlert: true,
    createdDate: "2025-09-12",
    history: [
      { stage: "Farming", location: "Nashik, Maharashtra", timestamp: "2025-09-12T10:00:00Z", details: "Harvested by Farmer Ramesh." },
      { stage: "Processing", location: "Pune, Maharashtra", timestamp: "2025-09-14T15:30:00Z", details: "Processed and packaged." },
    ],
    path: [
      [19.9975, 73.7898], // Nashik
      [18.5204, 73.8567]  // Pune
    ]
  },
  {
    batchId: "HERB-TUL-002",
    herbName: "Tulsi",
    status: "Quality Check",
    hasAlert: false,
    createdDate: "2025-09-13",
    history: [
      { stage: "Farming", location: "Varanasi, UP", timestamp: "2025-09-13T09:00:00Z", details: "Harvested by Farmer Sunita." },
      { stage: "Lab Testing", location: "Prayagraj, UP", timestamp: "2025-09-15T11:00:00Z", details: "Sample sent for testing." },
    ],
    path: [
      [25.3176, 82.9739], // Varanasi
      [25.4358, 81.8463]  // Prayagraj
    ]
  },
  {
    batchId: "HERB-TUR-003",
    herbName: "Turmeric",
    status: "Delivered",
    hasAlert: false,
    createdDate: "2025-09-11",
    history: [
      { stage: "Farming", location: "Erode, Tamil Nadu", timestamp: "2025-09-11T12:00:00Z", details: "Harvested and dried." },
      { stage: "Distribution", location: "Bengaluru, Karnataka", timestamp: "2025-09-15T18:00:00Z", details: "Delivered to warehouse." },
    ],
    path: [
      [11.3410, 77.7172], // Erode
      [12.9716, 77.5946]  // Bengaluru
    ]
  },
  {
    batchId: "HERB-BRA-004",
    herbName: "Brahmi",
    status: "In Transit",
    hasAlert: false,
    createdDate: "2025-09-14",
    history: [
      { stage: "Farming", location: "Kollam, Kerala", timestamp: "2025-09-14T08:00:00Z", details: "Harvested from aquatic farms." },
      { stage: "Transport", location: "En route to Hyderabad", timestamp: "2025-09-15T20:00:00Z", details: "Dispatched via refrigerated truck." },
    ],
    path: [
      [8.8932, 76.6141], // Kollam
      [17.3850, 78.4867]  // Hyderabad (Destination)
    ]
  },
  {
    batchId: "HERB-GIL-005",
    herbName: "Giloy",
    status: "Quality Check",
    hasAlert: true,
    createdDate: "2025-09-15",
    history: [
      { stage: "Farming", location: "Dehradun, Uttarakhand", timestamp: "2025-09-15T10:00:00Z", details: "Harvested from wild climbers." },
      { stage: "Lab Testing", location: "Dehradun, Uttarakhand", timestamp: "2025-09-15T16:00:00Z", details: "Testing for heavy metal contamination. Alert raised." },
    ],
    path: [
      [30.3165, 78.0322], // Dehradun
      [30.3165, 78.0322]
    ]
  }
];


/**
 * MOCK DATA FOR USERS
 * This is the complete data needed for the user management page.
 */
export const users = [
  { id: 1, name: "Ramesh Kumar Farms", role: "Farmer", status: "Approved" },
  { id: 2, name: "Sunita Agro-Tech", role: "Farmer", status: "Approved" },
  { id: 3, name: "AYUSH Labs Pune", role: "Lab", status: "Approved" },
  { id: 4, name: "FastTrack Logistics", role: "Transporter", status: "Pending" },
  { id: 5, name: "HerbProcess Inc.", role: "Processor", status: "Approved" },
  { id: 6, "name": "Kerala Ayurveda Co.", "role": "Processor", "status": "Pending" },
  { id: 7, "name": "Safe Transits", "role": "Transporter", "status": "Approved" }
];