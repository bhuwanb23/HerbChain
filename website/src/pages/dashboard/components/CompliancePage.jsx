// src/components/CompliancePage.jsx
import React, { useState, useMemo } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { CheckCircle, Warning } from '@mui/icons-material';
import { batches } from '../constants/mockData';

// =======================================================
// PART 1: MOCK COMPLIANCE ENGINE
// This function checks a single batch against our rules.
// =======================================================
const checkBatchCompliance = (batch) => {
  const violations = [];

  // Rule 1: Check for pre-set alerts
  if (batch.hasAlert) {
    violations.push("Manual compliance alert was triggered.");
  }

  // Rule 2: Check transit time (must be less than 3 days)
  const startTime = new Date(batch.history[0].timestamp);
  const endTime = new Date(batch.history[batch.history.length - 1].timestamp);
  const transitHours = (endTime - startTime) / (1000 * 60 * 60);
  if (transitHours > 72) {
    violations.push(`Exceeded max transit time of 72 hours (took ${Math.round(transitHours)} hours).`);
  }

  // Rule 3: Must have a quality check before delivery
  const hasQualityCheck = batch.history.some(h => h.stage.includes("Quality Check") || h.stage.includes("Lab Testing"));
  if (batch.status === "Delivered" && !hasQualityCheck) {
    violations.push("Batch was delivered without a completed quality check.");
  }

  return {
    isCompliant: violations.length === 0,
    violations: violations,
  };
};


// =======================================================
// PART 2: MAIN PAGE COMPONENT
// This is the visual part of the page that uses the engine.
// =======================================================
function CompliancePage() {
  const [filter, setFilter] = useState('all'); // 'all', 'compliant', 'non-compliant'

  const processedBatches = useMemo(() => 
    batches.map(batch => ({
      ...batch,
      compliance: checkBatchCompliance(batch),
    })), []);
  
  const filteredBatches = processedBatches.filter(batch => {
    if (filter === 'compliant') return batch.compliance.isCompliant;
    if (filter === 'non-compliant') return !batch.compliance.isCompliant;
    return true; // 'all'
  });

  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  return (
    <Box>
      <Typography variant="h2" gutterBottom>Compliance & Regulation</Typography>
      
      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Active AYUSH Standards</Typography>
        <ul>
          <li>Geo-fencing must be active for all transit routes.</li>
          <li>Maximum transit time between stages must not exceed 72 hours.</li>
          <li>Lab quality checks must be completed before distribution.</li>
        </ul>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Batch Compliance Status</Typography>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          color="primary"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="compliant">Compliant</ToggleButton>
          <ToggleButton value="non-compliant">Non-Compliant</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Batch ID</TableCell>
              <TableCell>Herb Name</TableCell>
              <TableCell>Current Status</TableCell>
              <TableCell align="center">Compliance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBatches.map((batch) => (
              <TableRow key={batch.batchId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>{batch.batchId}</TableCell>
                <TableCell>{batch.herbName}</TableCell>
                <TableCell>{batch.status}</TableCell>
                <TableCell align="center">
                  {batch.compliance.isCompliant ? (
                    <Chip icon={<CheckCircle />} label="Compliant" color="success" />
                  ) : (
                    <Tooltip 
                      title={
                        <Box>
                          {batch.compliance.violations.map((v, i) => <Typography key={i} sx={{ fontSize: '0.8rem' }}>• {v}</Typography>)}
                        </Box>
                      }
                      arrow
                    >
                      <Chip icon={<Warning />} label="Non-Compliant" color="error" clickable />
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default CompliancePage;