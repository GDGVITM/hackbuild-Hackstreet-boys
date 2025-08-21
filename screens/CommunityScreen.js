// screens/CommunityScreen.js
import React, { useState, useEffect } from 'react';
// Ensure ScrollView is included in this import list
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, Alert, Linking, Image, ScrollView } from 'react-native';
import { auth, db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

// Mock data for mentors
const mentors = [
  { id: '1', name: 'Dr. Evelyn Reed', subject: 'Physics', email: 'e.reed@university.edu' },
  { id: '2', name: 'Prof. Samuel Chen', subject: 'Mathematics', email: 's.chen@university.edu' },
  { id: '3', name: 'Dr. Aisha Khan', subject: 'Computer Science', phone: '123-456-7890' },
];

export default function CommunityScreen() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [communityMembers, setCommunityMembers] = useState([]); // State for shared profiles
  const currentUser = auth.currentUser;

  // Fetch shared community profiles
  useEffect(() => {
    const q = query(collection(db, 'communityContacts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCommunityMembers(members);
    });
    return () => unsubscribe();
  }, []);

  // Fetch chat messages
  useEffect(() => {
    const q = query(collection(db, 'groupChat'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        sender: doc.data().senderName,
        createdAt: doc.data().createdAt?.toDate().toLocaleTimeString(),
      }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !currentUser) return;
    try {
      await addDoc(collection(db, 'groupChat'), {
        text: newMessage,
        senderName: currentUser.displayName || 'Anonymous',
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      Alert.alert("Error", "Message could not be sent.");
    }
  };

  const handleContact = (contact) => {
    if (contact.email) Linking.openURL(`mailto:${contact.email}`);
    else if (contact.phone) Linking.openURL(`tel:${contact.phone}`);
  };

  const openLink = (url) => {
    if (url) Linking.openURL(url).catch(() => Alert.alert("Invalid URL", "Could not open the link."));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community Hub</Text>
        </View>

        {/* Community Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Members</Text>
          {communityMembers.length > 0 ? (
            <FlatList
              horizontal
              data={communityMembers}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.memberCard}>
                  <Image source={item.photoURL ? { uri: item.photoURL } : require('../assets/default-avatar.png')} style={styles.memberAvatar} />
                  <Text style={styles.mentorName}>{item.name}</Text>
                  <View style={styles.socialLinks}>
                    {item.linkedin && <TouchableOpacity onPress={() => openLink(item.linkedin)}><Ionicons name="logo-linkedin" size={24} color="#0077B5" /></TouchableOpacity>}
                    {item.github && <TouchableOpacity onPress={() => openLink(item.github)}><Ionicons name="logo-github" size={24} color="#333" /></TouchableOpacity>}
                  </View>
                </View>
              )}
            />
          ) : (
            <Text style={styles.placeholderText}>No members are sharing their profile yet.</Text>
          )}
        </View>

        {/* Mentors Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect with Mentors</Text>
          <FlatList
            horizontal
            data={mentors}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.mentorCard}>
                <Text style={styles.mentorName}>{item.name}</Text>
                <Text style={styles.mentorSubject}>{item.subject}</Text>
                <TouchableOpacity style={styles.contactButton} onPress={() => handleContact(item)}>
                  <Text style={styles.contactButtonText}>Contact</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        {/* Group Chat Section */}
        <View style={styles.chatSection}>
            <Text style={styles.sectionTitle}>Group Chat</Text>
            {messages.map(item => (
                <View key={item.id} style={styles.messageBubble}>
                    <Text style={styles.messageSender}>{item.sender}</Text>
                    <Text style={styles.messageText}>{item.text}</Text>
                    <Text style={styles.messageTime}>{item.createdAt}</Text>
                </View>
            ))}
        </View>
      </ScrollView>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    header: { paddingHorizontal: 20, paddingVertical: 15 },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    section: { paddingLeft: 20, paddingVertical: 15, backgroundColor: '#fff', marginBottom: 10 },
    chatSection: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff' },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    placeholderText: { color: '#8e8e93' },
    memberCard: { backgroundColor: '#f0f2f5', borderRadius: 12, padding: 15, marginRight: 15, width: 160, alignItems: 'center' },
    memberAvatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 10 },
    mentorCard: { backgroundColor: '#f0f2f5', borderRadius: 12, padding: 15, marginRight: 15, width: 200 },
    mentorName: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    mentorSubject: { color: '#8e8e93', marginVertical: 5 },
    socialLinks: { flexDirection: 'row', justifyContent: 'space-evenly', width: '60%', marginTop: 10 },
    contactButton: { backgroundColor: '#007AFF', borderRadius: 20, paddingVertical: 8, marginTop: 10 },
    contactButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
    messageBubble: { backgroundColor: '#f0f2f5', borderRadius: 12, padding: 15, marginBottom: 10, maxWidth: '80%', alignSelf: 'flex-start' },
    messageSender: { fontWeight: 'bold', color: '#007AFF' },
    messageText: { fontSize: 16, marginVertical: 5 },
    messageTime: { fontSize: 12, color: '#8e8e93', textAlign: 'right' },
    inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#e5e5ea', backgroundColor: '#fff' },
    input: { flex: 1, backgroundColor: '#e5e5ea', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
    sendButton: { backgroundColor: '#007AFF', borderRadius: 25, width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
});
