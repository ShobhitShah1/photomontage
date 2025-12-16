# PhotoMontage Editor

A powerful and intuitive React Native application for creating photo montages and editing images. Built with Expo, it offers a seamless experience for selecting, arranging, and manipulating images on a canvas.

## Documentation

For a detailed technical overview of the codebase, including architecture, state management, and component structure, please refer to [ARCHITECTURE.md](./ARCHITECTURE.md).

## Features

- **Multi-Image Selection**: Pick multiple images from your library or camera.
- **Canvas Manipulation**: Freely scale, rotate, and move images using intuitive gestures.
- **Advanced Cropping**:
  - Freeform cropping (draw your own shape).
  - Standard aspect ratios (1:1, 4:3, 16:9, etc.).
- **Layer Management**: Reorder layers, bring to front/back.
- **High-Quality Export**: Save your creations in various qualities.
- **Undo/Redo**: Full history support for all your edits.

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Start the app**:
    ```bash
    npx expo start
    ```

3.  **Run on device/emulator**:
    - Press `a` for Android.
    - Press `i` for iOS.
    - Scan the QR code with Expo Go.

## 🛠 Tech Stack

- **Expo** & **React Native**
- **TypeScript**
- **Zustand** (State Management)
- **Reanimated** (Animations)
- **Gesture Handler** (Interactions)

## Project Structure

- **`app/`**: Application screens and routing.
- **`components/`**: Reusable UI components.
- **`store/`**: State management (Zustand).
- **`hooks/`**: Custom React hooks.
