// src/components/ReportsPage.jsx
import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

import { batches, users } from '../constants/mockData';

// This is important: it registers the chart components so we can use them
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Helper function to process data for a bar chart of batches per herb
const getBatchDataByHerb = () => {
  const herbCounts = batches.reduce((acc, batch) => {
    acc[batch.herbName] = (acc[batch.herbName] || 0) + 1;
    return acc;
  }, {});
  return {
    labels: Object.keys(herbCounts),
    datasets: [{
      label: '# of Batches',
      data: Object.values(herbCounts),
      backgroundColor: 'rgba(0, 123, 255, 0.6)',
      borderColor: 'rgba(0, 123, 255, 1)',
      borderWidth: 1,
    }],
  };
};

// Helper function to process data for a pie chart of user roles
const getUserDataByRole = () => {
    const roleCounts = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
    }, {});
    return {
        labels: Object.keys(roleCounts),
        datasets: [{
            data: Object.values(roleCounts),
            backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545'],
            hoverOffset: 4,
        }],
    };
};

function ReportsPage() {
  const barChartData = getBatchDataByHerb();
  const pieChartData = getUserDataByRole();

  const chartOptions = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
        },
    },
  };

  return (
    <Box>
      <Typography variant="h2" gutterBottom>Reports & Insights</Typography>
      
      <Grid container spacing={4}>
        {/* Bar Chart */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Batches per Herb</Typography>
            <Bar data={barChartData} options={chartOptions} />
          </Paper>
        </Grid>
        
        {/* Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>User Role Distribution</Typography>
            <Pie data={pieChartData} options={chartOptions} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ReportsPage;