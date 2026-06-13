# Smart Trash Pro 🗑️ - Real-Time IoT Monitoring Dashboard

## 📌 Overview
Smart Trash Pro is an advanced Internet of Things (IoT) web dashboard built to monitor trash capacity and remotely control a servo motor in real-time. Designed with a modern dark theme and glassmorphism UI, this application provides an intuitive interface for waste management monitoring.

## 🚀 Live Demo
**[👉 View Live Dashboard Here](https://dashboard-sampah.vercel.app)**

## 💻 Tech Stack
- **Frontend Framework:** React.js (Vite)
- **Styling:** CSS3 (Custom animations, Glassmorphism, Dark/Light Theme Support)
- **Backend/Database:** Firebase Realtime Database
- **Hardware Integration:** IoT NodeMCU/ESP8266 (Sensors & Servo via Firebase)
- **Deployment:** Vercel

## ✨ Key Features
- **Real-Time Data Sync:** Instantly visualizes trash bin capacity updates from Firebase without refreshing.
- **Remote Servo Control:** Interactive buttons to manually open/close the trash bin lid via IoT servo motors.
- **Dynamic Visualizers:** Real-time waveform visualizers and progress bars representing bin capacity.
- **Security & Rate Limiting:** Implemented security measures to prevent spamming the IoT commands.
- **Responsive UI/UX:** Fully optimized dashboard layout that adapts perfectly to desktop, tablet, and mobile screens.

## ⚙️ How It Works
1. The physical IoT device (NodeMCU/ESP8266) reads the ultrasonic sensor data to determine the trash level.
2. The data is pushed to **Firebase Realtime Database**.
3. This React dashboard listens to the Firebase data stream and updates the UI instantly.
4. When a user clicks "Buka Pintu" (Open Door), the React app sends a command to Firebase, which is then fetched by the IoT device to trigger the servo motor.

## 👨‍💻 Developed By
**Muhammad Abdillah Hijjaz Alfiqrie**
- [LinkedIn Profile](https://www.linkedin.com/in/abdillah-hijjaz)
- Role: Full-Stack Developer & IoT Integrator
