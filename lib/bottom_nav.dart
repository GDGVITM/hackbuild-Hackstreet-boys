import 'package:flutter/material.dart';
import 'home_page.dart';
import 'ocr_page.dart';
import 'assignments_page.dart';
import 'profile_page.dart';

class BottomNav extends StatefulWidget {
  const BottomNav({super.key});

  @override
  _BottomNavState createState() => _BottomNavState();
}

class _BottomNavState extends State<BottomNav> with TickerProviderStateMixin {
  int _selectedIndex = 0;
  late AnimationController _animationController;
  late Animation<double> _animation;

  final List<Widget> _pages = [
    const HomePage(),
    const OCRPage(),
    const AssignmentsPage(),
    const ProfilePage(),
  ];

  final List<IconData> _icons = [
    Icons.home_rounded,
    Icons.camera_alt_rounded,
    Icons.assignment_rounded,
    Icons.person_rounded,
  ];

  final List<String> _labels = [
    'Home',
    'Scanner',
    'Tasks',
    'Profile',
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _animation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
  }

  void _onItemTapped(int index) {
    if (index != _selectedIndex) {
      setState(() {
        _selectedIndex = index;
      });
      _animationController.reset();
      _animationController.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_selectedIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF2D2D2D),
          border: Border(
            top: BorderSide(
              color: const Color(0xFF404040),
              width: 0.5,
            ),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: Container(
            height: 70,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(
                4,
                (index) => _buildNavItem(index),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index) {
    bool isSelected = _selectedIndex == index;
    
    return GestureDetector(
      onTap: () => _onItemTapped(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected 
              ? const Color(0xFFFF6B35).withOpacity(0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: isSelected
              ? Border.all(
                  color: const Color(0xFFFF6B35).withOpacity(0.3),
                  width: 1,
                )
              : null,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icon with animation
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeInOut,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: isSelected 
                    ? const Color(0xFFFF6B35).withOpacity(0.2)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                _icons[index],
                size: isSelected ? 24 : 22,
                color: isSelected 
                    ? const Color(0xFFFF6B35)
                    : const Color(0xFFB0B0B0),
              ),
            ),
            
            const SizedBox(height: 4),
            
            // Label with animation
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: TextStyle(
                fontSize: isSelected ? 11 : 10,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected 
                    ? const Color(0xFFFF6B35)
                    : const Color(0xFFB0B0B0),
              ),
              child: Text(_labels[index]),
            ),
            
            // Active indicator dot
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(top: 2),
              width: isSelected ? 6 : 0,
              height: isSelected ? 6 : 0,
              decoration: BoxDecoration(
                color: const Color(0xFFFF6B35),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
}