import type { ImagePickerAsset } from "expo-image-picker";
import { create } from "zustand";

export type SelectionSource = "library" | "camera";

export interface PickedImage {
  id: string;
  uri: string;
  width: number;
  height: number;
  filename?: string;
  source: SelectionSource;
  createdAt: number;
  thumbUri?: string;
}

interface SelectionState {
  sessionId: string | null;
  images: PickedImage[];
  activeId: string | null;
  status: "idle" | "ready";
  beginSession: (images: PickedImage[]) => void;
  appendImages: (images: PickedImage[]) => void;
  setActive: (id: string | null) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const createInternalId = () =>
  `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const ensureSize = (value?: number | null) => {
  if (!value || value <= 0) {
    return 512;
  }
  return value;
};

export const mapAssetsToImages = (
  assets: ImagePickerAsset[],
  source: SelectionSource
): PickedImage[] =>
  assets
    .filter((asset) => Boolean(asset?.uri))
    .map((asset) => ({
      id: createInternalId(),
      uri: asset.uri,
      width: ensureSize(asset.width),
      height: ensureSize(asset.height),
      filename: (asset as any).fileName ?? (asset as any).filename ?? undefined,
      source,
      createdAt: Date.now(),
    }));

const nextSessionId = () =>
  `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const useSelectionStore = create<SelectionState>((set, get) => ({
  sessionId: null,
  images: [],
  activeId: null,
  status: "idle",
  beginSession: (images) => {
    if (images.length === 0) {
      set({
        sessionId: null,
        images: [],
        activeId: null,
        status: "idle",
      });
      return;
    }
    const sessionId = nextSessionId();
    set({
      sessionId,
      images,
      activeId: images[0]?.id ?? null,
      status: "ready",
    });
  },
  appendImages: (images) => {
    if (images.length === 0) {
      return;
    }
    const currentSession = get().sessionId ?? nextSessionId();
    set((state) => {
      const nextImages = [...state.images, ...images];
      const activeId = images.at(-1)?.id ?? state.activeId;
      return {
        sessionId: currentSession,
        images: nextImages,
        activeId,
        status: nextImages.length > 0 ? "ready" : "idle",
      };
    });
  },
  setActive: (id) => {
    set((state) => {
      if (id && !state.images.some((image) => image.id === id)) {
        return state;
      }
      return { activeId: id };
    });
  },
  remove: (id) => {
    set((state) => {
      const images = state.images.filter((image) => image.id !== id);
      const activeId =
        state.activeId === id ? (images[0]?.id ?? null) : state.activeId;
      const status = images.length > 0 ? "ready" : "idle";
      const sessionId = images.length > 0 ? state.sessionId : null;
      return { images, activeId, status, sessionId };
    });
  },
  clear: () => {
    set({
      sessionId: null,
      images: [],
      activeId: null,
      status: "idle",
    });
  },
}));
