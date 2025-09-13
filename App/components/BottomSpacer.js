import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BottomSpacer = ({ extraPadding = 0 }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.spacer, { 
      height: Math.max(insets.bottom + extraPadding, 20) 
    }]} />
  );
};

const styles = StyleSheet.create({
  spacer: {
    width: '100%',
  },
});

export default BottomSpacer;
