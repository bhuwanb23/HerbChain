import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const StatusCards = ({ statusCards, onCardPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getCardIcon = (icon) => {
    switch (icon) {
      case '📦': return 'inventory';
      case '🚚': return 'local-shipping';
      case '📍': return 'place';
      default: return 'info';
    }
  };

  const getCardColors = (index) => {
    const colorSets = [
      ['#ff6b6b', '#ee5a52', '#ff8a80'],
      ['#4ecdc4', '#26a69a', '#80cbc4'],
      ['#45b7d1', '#2196f3', '#90caf9'],
    ];
    return colorSets[index % colorSets.length];
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {statusCards.map((card, index) => (
        <TouchableOpacity
          key={card.id}
          style={styles.card}
          onPress={() => onCardPress(card.id)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={getCardColors(index)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Decorative elements */}
            <View style={styles.decorativeCircle} />
            
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Icon name={getCardIcon(card.icon)} size={22} color="white" />
              </View>
              <Text style={styles.count}>{card.count}</Text>
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.title}>{card.title}</Text>
              <Text style={styles.description}>{card.description}</Text>
            </View>
            
            <View style={styles.cardFooter}>
              <View style={styles.arrowContainer}>
                <Icon name="arrow-forward" size={16} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 16, // Reduced margin to minimize spacing
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cardGradient: {
    padding: 16,
    minHeight: 130,
    position: 'relative',
  },
  decorativeCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 1,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  count: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 12,
    zIndex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  description: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
    zIndex: 1,
  },
  arrowContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});

export default StatusCards;
