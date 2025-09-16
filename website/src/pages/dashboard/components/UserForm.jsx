// src/components/UserForm.jsx
import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Select, MenuItem, FormControl, InputLabel, Paper, Typography } from '@mui/material';

function UserForm({ currentUser, onSave, onCancel }) {
  const [formData, setFormData] = useState({ name: '', role: 'Farmer', status: 'Pending' });

  useEffect(() => {
    setFormData(currentUser || { name: '', role: 'Farmer', status: 'Pending' });
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {currentUser ? 'Edit User' : 'Add New User'}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <TextField label="Name" name="name" value={formData.name} onChange={handleChange} required />
        <FormControl>
          <InputLabel>Role</InputLabel>
          <Select name="role" label="Role" value={formData.role} onChange={handleChange}>
            <MenuItem value="Farmer">Farmer</MenuItem>
            <MenuItem value="Lab">Lab</MenuItem>
            <MenuItem value="Processor">Processor</MenuItem>
            <MenuItem value="Transporter">Transporter</MenuItem>
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>Status</InputLabel>
          <Select name="status" label="Status" value={formData.status} onChange={handleChange}>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
        <Button type="submit" variant="contained" color="primary">Save</Button>
        <Button type="button" variant="text" onClick={onCancel}>Cancel</Button>
      </Box>
    </Paper>
  );
}

export default UserForm;