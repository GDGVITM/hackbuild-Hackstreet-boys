import 'package:flutter/material.dart';

class OCRPage extends StatelessWidget {
  const OCRPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Upload Marks")),
      body: Center(
        child: ElevatedButton(
          onPressed: () {
            // TODO: Add OCR integration
          },
          child: Text("Upload Marksheet"),
        ),
      ),
    );
  }
}
