import React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import LabBatchItem from './LabBatchItem';

const LabBatchList = ({ data, loading, onRefresh, acceptHerb, variant = 'all', onOpenDetails }) => {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={data}
        keyExtractor={(item, idx) => `${item.batch_id || idx}`}
        renderItem={({ item }) => (
          <LabBatchItem 
            item={item}
            variant={variant}
            onAccepted={onRefresh}
            acceptHerb={acceptHerb}
            onOpenDetails={onOpenDetails}
          />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      />
    </View>
  );
};

export default LabBatchList;


