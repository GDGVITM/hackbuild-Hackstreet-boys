import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
// ✅ CHANGE 1: Imported new functions to manage user message counts
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { Card } from '../components/common/Card';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../theme';

const MemberCard = ({ member, onPress }) => (
  <TouchableOpacity style={styles.memberCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.memberImageContainer}>
      <Image 
        source={member.photoURL ? { uri: member.photoURL } : require('../assets/default-avatar.png')} 
        style={styles.memberAvatar} 
      />
      <View style={styles.onlineIndicator} />
    </View>
    <Text style={styles.memberName} numberOfLines={2}>{member.name}</Text>
    <View style={styles.socialLinks}>
      {member.linkedin && (
        <TouchableOpacity 
          onPress={() => Linking.openURL(member.linkedin)} 
          style={[styles.socialIcon, { backgroundColor: `${COLORS.primary}15` }]}
        >
          <Ionicons name="logo-linkedin" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      )}
      {member.github && (
        <TouchableOpacity 
          onPress={() => Linking.openURL(member.github)} 
          style={[styles.socialIcon, { backgroundColor: `${COLORS.textPrimary}15` }]}
        >
          <Ionicons name="logo-github" size={16} color={COLORS.textPrimary} />
        </TouchableOpacity>
      )}
    </View>
  </TouchableOpacity>
);

// ✅ CHANGE: Replaced the MentorCard with a CourseCard component
const CourseCard = ({ course }) => (
  <Card style={styles.mentorCard}>
    <View style={styles.mentorHeader}>
      <View style={styles.mentorIcon}>
        <Ionicons name="school-outline" size={24} color={COLORS.primary} />
      </View>
      <View style={styles.mentorBadge}>
        <Text style={styles.mentorBadgeText}>{course.provider.toUpperCase()}</Text>
      </View>
    </View>
    <Text style={styles.mentorName}>{course.title}</Text>
    <Text style={styles.mentorSubject}>{course.category}</Text>
    <TouchableOpacity 
      style={styles.contactButton} 
      onPress={() => Linking.openURL(course.url)}
      activeOpacity={0.8}
    >
      <Ionicons name="open-outline" size={16} color={COLORS.surface} />
      <Text style={styles.contactButtonText}>View Course</Text>
    </TouchableOpacity>
  </Card>
);

const MessageBubble = ({ message, isCurrentUser }) => (
  <View style={[
    styles.messageBubble, 
    isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
  ]}>
    {!isCurrentUser && <Text style={styles.messageSender}>{message.sender}</Text>}
    <Text style={[styles.messageText, isCurrentUser && styles.currentUserMessageText]}>
      {message.text}
    </Text>
    <Text style={[styles.messageTime, isCurrentUser && styles.currentUserMessageTime]}>
      {message.createdAt}
    </Text>
  </View>
);

export default function CommunityScreen() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [communityMembers, setCommunityMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const currentUser = auth.currentUser;

  // ✅ CHANGE: Replaced mentors data with real-world Coursera courses
  const recommendedCourses = [
    { 
      id: '1', 
      title: 'Google Data Analytics Professional Certificate', 
      provider: 'Coursera',
      category: 'Data Science',
      url: 'https://www.coursera.org/professional-certificates/google-data-analytics' 
    },
    { 
      id: '2', 
      title: 'Python for Everybody Specialization', 
      provider: 'Coursera',
      category: 'Computer Science',
      url: 'https://www.coursera.org/specializations/python' 
    },
    { 
      id: '3', 
      title: 'IBM Full Stack Software Developer Certificate', 
      provider: 'Coursera',
      category: 'Web Development',
      url: 'https://www.coursera.org/professional-certificates/ibm-full-stack-cloud-developer'
    },
    {
      id: '4',
      title: 'Deep Learning Specialization',
      provider: 'DeepLearning.AI',
      category: 'Machine Learning',
      url: 'https://www.coursera.org/specializations/deep-learning'
    },
  ];

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

  useEffect(() => {
    const q = query(collection(db, 'groupChat'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        sender: doc.data().senderName,
        senderId: doc.data().senderId,
        createdAt: doc.data().createdAt?.toDate().toLocaleTimeString(),
      }));
      setMessages(msgs.reverse());
    });
    return () => unsubscribe();
  }, []);

  // ✅ CHANGE 2: Updated function to check for daily message limit before sending
  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !currentUser) return;
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    try {
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
            Alert.alert("Error", "Could not find your user profile.");
            return;
        }

        const userData = userDocSnap.data();
        const messageStats = userData.dailyMessageStats || { count: 0, lastMessageDate: '' };

        // Reset count if it's a new day
        if (messageStats.lastMessageDate !== today) {
            messageStats.count = 0;
        }

        // Check if user has reached the daily limit
        if (messageStats.count >= 5) {
            Alert.alert("Limit Reached", "You have reached your daily limit of 5 messages in the community chat.");
            return;
        }

        // Proceed to send message
        await addDoc(collection(db, 'groupChat'), {
            text: newMessage,
            senderName: currentUser.displayName || 'Anonymous',
            senderId: currentUser.uid,
            createdAt: serverTimestamp(),
        });
        
        // Update the user's message count for today
        await updateDoc(userDocRef, {
          'dailyMessageStats.count': increment(1),
          'dailyMessageStats.lastMessageDate': today,
        });

        setNewMessage('');

    } catch (error) {
        console.error("Error sending message:", error);
        Alert.alert("Error", "Message could not be sent.");
    }
  };

  // ⛔️ REMOVED: handleContact function is no longer needed

  const TabButton = ({ tab, title, icon }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.8}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === tab ? COLORS.primary : COLORS.textTertiary} 
      />
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'members':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Community Members</Text>
            {communityMembers.length > 0 ? (
              <View style={styles.membersGrid}>
                {communityMembers.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </View>
            ) : (
              <Card style={styles.emptyStateCard}>
                <Ionicons name="people-outline" size={48} color={COLORS.textTertiary} />
                <Text style={styles.emptyStateText}>No members are sharing their profile yet.</Text>
              </Card>
            )}
          </ScrollView>
        );
      
      // ✅ CHANGE: Updated tab from 'mentors' to 'courses' to show recommended courses
      case 'courses':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Recommended Courses</Text>
            <View style={styles.mentorsGrid}>
              {recommendedCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </View>
          </ScrollView>
        );
      
      default:
        return (
          <KeyboardAvoidingView 
            style={styles.chatContainer} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isCurrentUser={message.senderId === currentUser?.uid}
                />
              ))}
            </ScrollView>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.messageInput}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Type a message..."
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity 
                  style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]} 
                  onPress={handleSendMessage}
                  disabled={!newMessage.trim()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="send" size={20} color={COLORS.surface} />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={COLORS.primaryGradient}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Community Hub</Text>
            <Text style={styles.headerSubtitle}>Connect with peers and mentors</Text>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <TabButton tab="chat" title="Chat" icon="chatbubbles-outline" />
        <TabButton tab="members" title="Members" icon="people-outline" />
        {/* ✅ CHANGE: Updated tab from 'Mentors' to 'Courses' */}
        <TabButton tab="courses" title="Courses" icon="school-outline" />
      </View>

      {renderTabContent()}
    </SafeAreaView>
  );
}

// NOTE: I've reused the existing 'mentor' styles for the new 'CourseCard' 
// to maintain a consistent look and feel without adding redundant styles.
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.surface,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.surface,
    opacity: 0.9,
    marginTop: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.small,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  activeTabButton: {
    backgroundColor: `${COLORS.primary}15`,
  },
  tabText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  tabContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  memberCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  memberImageContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.borderLight,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  memberName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  socialIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentorsGrid: {
    gap: SPACING.md,
  },
  mentorCard: {
    padding: SPACING.lg,
  },
  mentorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  mentorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentorBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mentorBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.surface,
    fontWeight: '700',
  },
  mentorName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  mentorSubject: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textTertiary,
    marginBottom: SPACING.md,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  contactButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.surface,
    fontWeight: '600',
  },
  emptyStateCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  messageBubble: {
    maxWidth: '80%',
    marginVertical: SPACING.xs,
    borderRadius: 16,
    padding: SPACING.md,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    ...SHADOWS.small,
  },
  messageSender: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  currentUserMessageText: {
    color: COLORS.surface,
  },
  messageTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 4,
    textAlign: 'right',
  },
  currentUserMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    ...SHADOWS.small,
  },
  messageInput: {
    flex: 1,
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
    maxHeight: 100,
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});