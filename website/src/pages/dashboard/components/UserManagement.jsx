// src/components/UserManagement.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import UserForm from './UserForm.jsx';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Add, Settings } from '@mui/icons-material';

function UserManagement({ users, onAddUser, onUpdateUser, onDeleteUser }) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleAddNewClick = () => {
    setCurrentUser(null);
    setIsFormVisible(true);
  };

  const handleEditClick = (user) => {
    setCurrentUser(user);
    setIsFormVisible(true);
  };

  const handleSaveUser = (user) => {
    user.id ? onUpdateUser(user) : onAddUser(user);
    setIsFormVisible(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h2">User & Role Management</Typography>
        <Button component={Link} to="/settings" variant="outlined" startIcon={<Settings />}>
          Permissions
        </Button>
      </Box>

      {!isFormVisible && (
        <Button variant="contained" startIcon={<Add />} onClick={handleAddNewClick} sx={{ mb: 3 }}>
          Add New User
        </Button>
      )}
      
      {isFormVisible && (
        <UserForm currentUser={currentUser} onSave={handleSaveUser} onCancel={() => setIsFormVisible(false)} />
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell component="th" scope="row">{user.name}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <span className={`status-pill ${user.status.toLowerCase()}`}>{user.status}</span>
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => handleEditClick(user)} sx={{ mr: 1 }}>Edit</Button>
                  <Button size="small" color="error" onClick={() => onDeleteUser(user.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default UserManagement;