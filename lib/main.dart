import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'login_page.dart';
import 'home_page.dart';
import 'bottom_nav.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: "AIzaSyDthFN0f6mxTZnzvEJUzAa6V_McR34Eyfo",
      authDomain: "edumitra-d2be8.firebaseapp.com",
      projectId: "edumitra-d2be8",
      storageBucket: "edumitra-d2be8.appspot.com",
      messagingSenderId: "595188989230",
      appId: "1:595188989230:web:d81564a67c70c517d7cebf",
      measurementId: "G-4M3JLNP30F",
    ),
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EduMitra',
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFFFF6B35), // LeetCode orange
        scaffoldBackgroundColor: const Color(0xFF1A1A1A), // Dark background
        cardColor: const Color(0xFF2D2D2D),
        textTheme: const TextTheme(
          headlineLarge: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          bodyLarge: TextStyle(color: Color(0xFFE0E0E0)),
          bodyMedium: TextStyle(color: Color(0xFFB0B0B0)),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFF6B35),
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF2D2D2D),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFF404040)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFF404040)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFFFF6B35)),
          ),
          labelStyle: const TextStyle(color: Color(0xFFB0B0B0)),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1A1A1A),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: AuthGate(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class AuthGate extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            backgroundColor: Color(0xFF1A1A1A),
            body: Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF6B35)),
              ),
            ),
          );
        }
        if (snapshot.hasData) {
          return const BottomNav();
        }
        return const LoginPage();
      },
    );
  }
}