# Project Architecture

## Overview
This project is a **React Native** application built with **Expo**, designed for creating photo montages and editing images. It allows users to select multiple images, arrange them on a canvas, crop them (including freeform cropping), and export the final composition.

## Tech Stack
- **Framework**: [Expo](https://expo.dev/) (Managed workflow)
- **UI Library**: React Native
- **Language**: TypeScript
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Gestures**: [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Image Manipulation**: `expo-image-manipulator`, `react-native-svg`

## Directory Structure
- **`app/`**: Contains the application screens and routing logic (Expo Router).
    - `editor.tsx`: The main editing screen where the canvas and tools reside.
- **`components/`**: Reusable UI components.
    - `canvas/`: Components related to the editing canvas (e.g., `CanvasImage`, `MiniCanvasPreview`).
    - `editor/`: Editor-specific UI (e.g., `EditorTopBar`, `EditorBottomBar`, `DetailEditingView`).
- **`store/`**: Global state management using Zustand.
    - `store.ts`: The main editor store (layers, canvas state, history).
    - `selection-store.ts`: Manages the image selection session.
- **`hooks/`**: Custom React hooks (e.g., `useTransformGesture`).
- **`services/`**: Utility services like `DownloadService`.

## Key Components

### 1. Editor Screen (`app/editor.tsx`)
This is the core of the application. It orchestrates the editing process:
- Initializes the canvas with selected images.
- Manages the `ViewShot` ref for capturing the canvas.
- Handles global UI states like modals (Quality, Share, Image Picker).
- Coordinates between the `EditorStore` and the UI.

### 2. State Management

#### `useEditorStore` (`store/store.ts`)
Manages the state of the editing canvas.
- **Layers**: An array of `Layer` objects representing images on the canvas. Each layer has properties like `x`, `y`, `scale`, `rotation`, `z` (index), and `croppedUri`.
- **History**: Implements Undo/Redo functionality by snapshotting the state.
- **Actions**: `addLayers`, `updateLayer`, `selectLayer`, `reorder`, `randomizeLayers`, etc.

#### `useSelectionStore` (`store/selection-store.ts`)
Manages the flow of selecting images before they are added to the canvas.
- Tracks the current `sessionId` and the list of `PickedImage`s.

### 3. Canvas & Layers
- **`CanvasImage` (`components/canvas/canvas-image.tsx`)**:
    - Renders a single image layer.
    - Uses `GestureDetector` to handle translation, scaling, and rotation.
    - Supports masking using `react-native-svg` for cropped images.
- **`DetailEditingView` (`components/editor/detail-editing-view.tsx`)**:
    - Provides a specialized view for cropping and masking a specific layer.
    - Supports freeform cropping (drawing a path) and fixed aspect ratios.
    - Uses `expo-image-manipulator` to apply the crop.

## Data Flow
1.  **Selection**: User picks images from the library. `SelectionStore` holds these images.
2.  **Initialization**: When `EditorScreen` mounts, it reads from `SelectionStore` and initializes `EditorStore` with new layers.
3.  **Interaction**:
    - **Gestures**: User pinches/drags a `CanvasImage`. `useTransformGesture` updates local shared values for performance, then syncs with `EditorStore` on end.
    - **Tools**: User clicks "Crop". `EditorScreen` switches to `DetailEditingView`.
4.  **Rendering**: The canvas re-renders based on the `layers` array in `EditorStore`.
5.  **Export**: `ViewShot` captures the canvas view as an image. `DownloadService` saves it to the device.

## LLM / Developer Guide
- **Adding a new tool**: Add the UI in `EditorBottomBar` or `EditorTopBar`, and implement the logic in `EditorScreen` or a new hook. Update `EditorStore` if it needs new state.
- **Modifying Gestures**: Check `components/canvas/canvas-image.tsx` and `hooks/use-transform-gesture.ts`.
- **Changing Export Logic**: Look at `handleQualitySelect` in `app/editor.tsx` and `services/download-service.ts`.
