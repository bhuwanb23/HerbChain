import React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import LabBatchItem from './LabBatchItem';

const LabBatchList = ({ data, loading, onRefresh }) => {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={data}
        keyExtractor={(item, idx) => `${item.batch_id || idx}`}
        renderItem={({ item }) => <LabBatchItem item={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      />
    </View>
  );
};

export default LabBatchList;


