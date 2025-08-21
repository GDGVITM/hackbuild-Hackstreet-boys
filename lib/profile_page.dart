import 'package:flutter/material.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Profile")),
      body: ListView(
        children: [
          ListTile(title: Text("👤 Resume Builder"), subtitle: Text("Generate resume from data")),
          ListTile(title: Text("✏️ OneNote"), subtitle: Text("Draw/Annotate notes")),
          ListTile(title: Text("📋 To-Do List"), subtitle: Text("Manage goals")),
        ],
      ),
    );
  }
}
