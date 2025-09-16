import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileInfo = ({ name, phone, avatar, vehicleName, onChangePhoto }) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <TouchableOpacity style={styles.cameraBtn} onPress={onChangePhoto}>
            <Icon name="photo-camera" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.infoWrap}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.phone}>{phone}</Text>
          <View style={styles.vehicleBadge}>
            <Icon name="local-shipping" size={12} color="#16A34A" />
            <Text style={styles.vehicleText}>{vehicleName}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#DBEAFE',
  },
  cameraBtn: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: '#2563EB',
    padding: 6,
    borderRadius: 999,
  },
  infoWrap: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  phone: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  vehicleText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ProfileInfo;


