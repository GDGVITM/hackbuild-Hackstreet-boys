import 'package:flutter/material.dart';

class AssignmentsPage extends StatelessWidget {
  const AssignmentsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Assignments")),
      body: ListView(
        children: [
          ListTile(title: Text("📖 Notes"), subtitle: Text("Tagged by subject")),
          ListTile(title: Text("📌 To-Do List"), subtitle: Text("Finish AI project")),
          ListTile(title: Text("🕒 Attendance Check"), subtitle: Text("Math lecture - Are you attending?")),
        ],
      ),
    );
  }
}
