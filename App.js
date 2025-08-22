// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import StudyScreen from './screens/StudyScreen';
import CommunityScreen from './screens/CommunityScreen';
import CareerScreen from './screens/career/CareerScreen'; // Corrected Path
import ProfileScreen from './screens/ProfileScreen';
import ResumeBuilder from './screens/career/ResumeBuilder'; // --- NEW: Import ResumeBuilder ---
import PreviousResumes from './screens/career/PreviousResumes';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const CareerStack = createNativeStackNavigator(); // --- NEW: Create a stack for Career ---

// --- NEW: Define the Career navigation stack ---
// This stack contains the main Career Center and the Resume Builder.
function CareerStackScreen() {
  return (
    <CareerStack.Navigator screenOptions={{ headerShown: false }}>
      <CareerStack.Screen name="CareerHub" component={CareerScreen} />
      <CareerStack.Screen name="ResumeBuilder" component={ResumeBuilder} />
      <CareerStack.Screen name="PreviousResumes" component={PreviousResumes} />
    </CareerStack.Navigator>
  );
}

// This is the main part of the app after a user logs in
function MainAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Hide header for all tabs
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Study') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Community') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Career') iconName = focused ? 'briefcase' : 'briefcase-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Study" component={StudyScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      {/* --- CHANGE: The Career tab now points to the new stack navigator --- */}
      <Tab.Screen name="Career" component={CareerStackScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="MainApp" component={MainAppTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}