import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const StatusCards = ({ statusCards, onCardPress }) => {
  const getCardIcon = (icon) => {
    switch (icon) {
      case '📦': return 'inventory';
      case '🚚': return 'local-shipping';
      case '📍': return 'place';
      default: return 'info';
    }
  };

  return (
    <View style={styles.container}>
      {statusCards.map((card) => (
        <TouchableOpacity
          key={card.id}
          style={styles.card}
          onPress={() => onCardPress(card.id)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={card.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Icon name={getCardIcon(card.icon)} size={20} color="white" />
              </View>
              <Text style={styles.count}>{card.count}</Text>
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.title}>{card.title}</Text>
              <Text style={styles.description}>{card.description}</Text>
            </View>
            
            <View style={styles.cardFooter}>
              <Icon name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
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
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardGradient: {
    padding: 12,
    minHeight: 110, // Increased from 100 to prevent text cutoff
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 6,
  },
  count: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 8, // Added margin to prevent text cutoff
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  description: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 12, // Added line height for better text display
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
});

export default StatusCards;
