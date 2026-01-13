import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Dimensions 
} from 'react-native';

const { width } = Dimensions.get('window');

// Props definition (What this component needs to work)
interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: any) => void;
  categories: any[];
}

export default function CategoryModal({ visible, onClose, onSelect, categories }: CategoryModalProps) {
  
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.item} 
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{item.icon || '🏷️'}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Handle bar for dragging (visual only) */}
          <View style={styles.handle} />
          
          <Text style={styles.header}>Select Category</Text>
          
          <FlatList
            data={categories}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={3} // Grid Layout (3 items per row)
            contentContainerStyle={styles.listContent}
          />
          
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Dimmed background
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: '60%', // Takes up bottom 60% of screen
    padding: 20,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#0f172a',
  },
  listContent: {
    paddingBottom: 20,
  },
  item: {
    width: (width - 60) / 3, // Calculate width to fit 3 items
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9', // Light Slate
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 28,
  },
  name: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  closeBtn: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeText: {
    color: '#64748b',
    fontWeight: '600',
  }
});