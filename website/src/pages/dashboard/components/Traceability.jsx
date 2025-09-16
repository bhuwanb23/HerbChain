import React, { useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { batches } from '../constants/mockData';
import { Box, Paper, Typography, Grid, Button, List, ListItem, ListItemText, Divider } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize() }, 100);
  }, [map]);
  return null;
};

function Traceability() {
  const { batchId } = useParams();
  const batch = batches.find(b => b.batchId === batchId);

  if (!batch) { return (<div>Batch Not Found</div>); }
  const currentPosition = batch.path[batch.path.length - 1];

  return (
    <Box>
      <Button component={RouterLink} to="/" startIcon={<ArrowBack />} sx={{ mb: 3 }}>Back to Dashboard</Button>
      <Typography variant="h2" gutterBottom>Tracking Details: {batch.batchId} ({batch.herbName})</Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}> {/* Corrected Grid Syntax */}
          <Paper variant="outlined" sx={{ height: '60vh', width: '100%' }}>
            <MapContainer center={currentPosition} zoom={7} style={{ height: '100%', width: '100%', borderRadius: '8px' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
              <Polyline positions={batch.path} pathOptions={{ color: '#007bff', weight: 5 }} />
              {batch.history.map((point, index) => (
                <Marker key={index} position={batch.path[index]}>
                  <Popup><b>{point.stage}</b><br/>{point.location}</Popup>
                </Marker>
              ))}
              <MapResizer />
            </MapContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}> {/* Corrected Grid Syntax */}
          <Paper variant="outlined" sx={{ p: 2, height: '60vh', overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, p: 1 }}>Journey History</Typography>
            <List disablePadding>
              {batch.history.map((point, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText primary={point.stage} secondary={<>{point.location}<br/>{new Date(point.timestamp).toLocaleString()}<br/>{point.details}</>} />
                  </ListItem>
                  {index < batch.history.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
export default Traceability;