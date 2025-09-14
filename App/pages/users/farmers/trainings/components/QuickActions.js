import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const QuickActions = ({ actions, onActionPress }) => {
  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.actionButton}
          onPress={() => onActionPress(action)}
        >
          <LinearGradient
            colors={action.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <View style={styles.iconContainer}>
              <Icon 
                name={action.icon === 'chat' ? 'chat' : 'phone'} 
                size={20} 
                color="white" 
              />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>{action.title}</Text>
              <Text style={styles.subtitle}>{action.subtitle}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    padding: 6,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default QuickActions;
