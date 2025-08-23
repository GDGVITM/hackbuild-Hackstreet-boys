import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

// A component for each item in our document list
const DocumentItem = ({ item, onPress }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <Ionicons name="document-text-outline" size={24} color="#007AFF" />
    <Text style={styles.itemText}>Semester {item.semester} Marksheet</Text>
    <Ionicons name="chevron-forward" size={22} color="#C7C7CC" />
  </TouchableOpacity>
);

export default function DocumentsScreen({ navigation }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists() && docSnap.data().grades) {
          const gradesData = docSnap.data().grades;
          // Filter out only the grades that have a marksheet URL
          const uploadedDocs = gradesData.filter(grade => grade.marksheetUrl);
          setDocuments(uploadedDocs);
        }
      } catch (error) {
        console.error("Failed to fetch documents:", error);
        alert('Could not load your documents.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleViewImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Documents</Text>
      </View>

      {documents.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={60} color="#C7C7CC" />
          <Text style={styles.emptyText}>You haven't uploaded any documents yet.</Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.semester.toString()}
          renderItem={({ item }) => (
            <DocumentItem item={item} onPress={() => handleViewImage(item.marksheetUrl)} />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close-circle" size={36} color="white" />
          </TouchableOpacity>
          <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginLeft: 15, },
  listContent: { padding: 20 },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemText: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '500' },
  emptyText: { marginTop: 15, fontSize: 16, color: '#8e8e93', textAlign: 'center' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 1 },
  fullImage: { width: '100%', height: '80%' },
});