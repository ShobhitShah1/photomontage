# Photomontage

A powerful, modern, and feature-rich image editing application built with React Native and Expo. This app provides a seamless experience for editing photos, managing galleries, and viewing stories, all wrapped in a beautiful and responsive interface.

## Overview

Photomontage is designed to be a complete solution for mobile image manipulation. Whether you're looking to crop, filter, draw, or simply organize your photo collection, this app delivers high-performance tools with a user-friendly design. It leverages the latest React Native technologies for smooth animations and efficient state management.

## Key Features

### Advanced Image Editor
- **Precision Editing**: Fine-tune your images with detailed control (`detail-editing-view`).
- **Interactive Canvas**: Draw and annotate directly on your photos.
- **Crop & Rotate**: Essential tools for framing your shots perfectly.
- **Filters & Adjustments**: Enhance your images with professional-grade processing.
- **Draggable Preview**: Intuitive UI for comparing changes.

### Gallery Management
- **Smart Organization**: Browse your device's media library with ease.
- **Fast Loading**: Optimized for handling large collections of photos.
- **Seamless Navigation**: Smooth transitions between grid views and full-screen previews.

### Story Viewer
- **Immersive Experience**: View images in a story format, similar to popular social media platforms.
- **Interactive Elements**: Swipe, tap, and interact with story content.

### Export & Share
- **High-Quality Export**: Save your masterpieces with customizable quality settings (`quality-selection-modal`).
- **Instant Sharing**: Share directly to social media or other apps (`share-image-modal`).
- **Download Options**: Save locally to your device with a single tap.

### Modern UI/UX
- **Dark/Light Mode**: Themed interface support.
- **Smooth Animations**: Powered by `react-native-reanimated` and `lottie-react-native`.
- **Gesture Controls**: Intuitive gestures for zooming, panning, and navigating.

## Tech Stack

This project is built using a modern and robust technology stack:

- **Framework**: [React Native](https://reactnative.dev/) & [Expo SDK 54](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animations**: [Reanimated](https://docs.swmansion.com/react-native-reanimated/) & [Lottie](https://github.com/lottie-react-native/lottie-react-native)
- **Storage**: [React Native MMKV](https://github.com/mimecorg/react-native-mmkv-storage)
- **Image Handling**: 
  - `expo-image` for high-performance rendering
  - `expo-image-manipulator` for editing
  - `expo-media-library` for file access
- **UI Components**: `react-native-svg`, `@expo/vector-icons`

## Project Structure

The project follows a clean and scalable structure:

```
/app
  ├── (tabs)          # Main tab navigation (Gallery, Settings, etc.)
  ├── editor.tsx      # Main editor screen
  ├── gallery-view.tsx # Full-screen image viewer
  └── ...             # Other screens and routes

/components
  ├── editor/         # Editor-specific components (Top/Bottom bars, tools)
  ├── canvas/         # Drawing and canvas tools
  ├── preview/        # Preview components
  └── ...             # Shared UI components (Modals, Icons, etc.)

/store                # Zustand stores for global state
/hooks                # Custom React hooks
/services             # Utility services and helpers
/constants            # App constants and theme configurations
```

## Getting Started

Follow these steps to run the project locally:

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the development server**:
    ```bash
    npx expo start
    ```
4.  **Run on device/emulator**:
    - Scan the QR code with the **Expo Go** app (Android/iOS).
    - Press `a` for Android Emulator.
    - Press `i` for iOS Simulator.

---

*Built with Expo and React Native.*
