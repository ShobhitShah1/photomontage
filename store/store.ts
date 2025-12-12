import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

export type Layer = {
  id: string;
  originalUri: string;
  croppedUri?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  width: number;
  height: number;
  z: number;
  locked?: boolean;
  cropRect?: { x: number; y: number; width: number; height: number };
  maskPath?: string;
  maskBounds?: { x: number; y: number; width: number; height: number };
  thumbUri?: string;
  originalWidth?: number;
  originalHeight?: number;
};

export type EditorState = {
  canvas: {
    width: number;
    height: number;
    scale: number;
    offsetX: number;
    offsetY: number;
  };
  layers: Layer[];
  selectedLayerId: string | null;
  ui: { grid: boolean; gridSize: number };
  history: {
    past: Omit<EditorState, "history">[];
    future: Omit<EditorState, "history">[];
  };
};

type Actions = {
  addLayers: (layers: Layer[]) => void;
  updateLayer: (id: string, partial: Partial<Layer>) => void;
  updateLayerFast: (id: string, partial: Partial<Layer>) => void; // No history push - for dragging
  removeLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  reorder: (id: string, z: number) => void;
  setCanvas: (partial: Partial<EditorState["canvas"]>) => void;
  toggleGrid: () => void;
  setGridSize: (n: number) => void;
  randomizeLayers: () => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
};

const snapshot = (s: EditorState): Omit<EditorState, "history"> => ({
  canvas: { ...s.canvas },
  layers: s.layers.map((l) => ({ ...l })),
  selectedLayerId: s.selectedLayerId,
  ui: { ...s.ui },
});

const pushHistory = (s: EditorState) => {
  s.history.past.push(snapshot(s));
  s.history.future = [];
};

const createInitialEditorState = (): EditorState => ({
  canvas: { width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 },
  layers: [],
  selectedLayerId: null,
  ui: { grid: true, gridSize: 20 },
  history: {
    past: [] as Omit<EditorState, "history">[],
    future: [] as Omit<EditorState, "history">[],
  },
});

export const useEditorStore = create<EditorState & Actions>((set, get) => ({
  ...createInitialEditorState(),

  bringToFront: (id) =>
    set((s) => {
      pushHistory(s);
      const maxZ = s.layers.reduce((m, l) => Math.max(m, l.z), 0);
      return {
        layers: s.layers.map((l) => (l.id === id ? { ...l, z: maxZ + 1 } : l)),
      };
    }),

  sendToBack: (id) =>
    set((s) => {
      pushHistory(s);
      const minZ = s.layers.reduce((m, l) => Math.min(m, l.z), 0);
      return {
        layers: s.layers.map((l) => (l.id === id ? { ...l, z: minZ - 1 } : l)),
      };
    }),

  addLayers: (layers) =>
    set((s) => {
      pushHistory(s);
      const maxZ = s.layers.reduce((m, l) => Math.max(m, l.z), 0);
      const withZ = layers.map((l, i) => ({ ...l, z: maxZ + i + 1 }));
      return {
        layers: [...s.layers, ...withZ],
      };
    }),

  // Fast update without history - use for real-time dragging
  // Optimized to avoid unnecessary re-renders
  updateLayerFast: (id, partial) =>
    set((s) => {
      const layerIndex = s.layers.findIndex((l) => l.id === id);
      if (layerIndex === -1) return s;

      const layer = s.layers[layerIndex];

      // Check if any values actually changed to avoid unnecessary re-renders
      let hasChanges = false;
      for (const key in partial) {
        if (
          partial[key as keyof typeof partial] !==
          layer[key as keyof typeof layer]
        ) {
          hasChanges = true;
          break;
        }
      }

      if (!hasChanges) return s;

      // Create new array only when needed
      const newLayers = [...s.layers];
      newLayers[layerIndex] = { ...layer, ...partial };

      return { layers: newLayers };
    }),

  // Full update with history - use at end of gesture
  updateLayer: (id, partial) =>
    set((s) => {
      if (partial.width !== undefined && partial.width <= 0) {
        console.error("Invalid width:", partial.width);
        return {};
      }
      if (partial.height !== undefined && partial.height <= 0) {
        console.error("Invalid height:", partial.height);
        return {};
      }

      pushHistory(s);

      const updatedLayers = s.layers.map((l) =>
        l.id === id ? { ...l, ...partial } : l
      );

      return {
        layers: updatedLayers,
      };
    }),

  removeLayer: (id) =>
    set((s) => {
      pushHistory(s);
      const layers = s.layers.filter((l) => l.id !== id);
      return {
        layers,
        selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId,
      };
    }),

  selectLayer: (id) => set({ selectedLayerId: id }),

  reorder: (id, z) =>
    set((s) => {
      pushHistory(s);
      return { layers: s.layers.map((l) => (l.id === id ? { ...l, z } : l)) };
    }),

  setCanvas: (partial) => set((s) => ({ canvas: { ...s.canvas, ...partial } })),

  toggleGrid: () => set((s) => ({ ui: { ...s.ui, grid: !s.ui.grid } })),

  setGridSize: (n) => set((s) => ({ ui: { ...s.ui, gridSize: n } })),

  randomizeLayers: () =>
    set((s) => {
      if (s.layers.length === 0) return {};
      pushHistory(s);
      const { width: canvasWidth, height: canvasHeight } = get().canvas;

      const randomizedLayers = s.layers.map((layer) => {
        // Random scale between 0.4 and 0.8 to ensure they fit reasonably well
        const scale = 0.4 + Math.random() * 0.4;

        // Random rotation between -15 and 15 degrees
        const rotation = (Math.random() - 0.5) * 30;

        const scaledWidth = layer.width * scale;
        const scaledHeight = layer.height * scale;

        // Ensure strict bounds: random position ensuring fully inside canvas
        // Math.max(0, ...) ensures we don't get negative values if image is larger than canvas (though scale handles most cases)
        const maxX = Math.max(0, canvasWidth - scaledWidth);
        const maxY = Math.max(0, canvasHeight - scaledHeight);

        const x = Math.random() * maxX;
        const y = Math.random() * maxY;

        return {
          ...layer,
          x,
          y,
          scale,
          rotation,
        };
      });

      return {
        layers: randomizedLayers,
      };
    }),

  undo: () =>
    set((s) => {
      if (s.history.past.length === 0) return {} as any;

      const prev = s.history.past[s.history.past.length - 1];

      if (!prev) return {} as any;

      if (prev.layers.length === 0 && s.layers.length > 0) {
        return {} as any;
      }

      const popped = s.history.past.pop();

      if (!popped) return {} as any;
      const curr = snapshot(s);

      s.history.future.unshift(curr);

      return { ...popped, history: s.history } as any;
    }),

  redo: () =>
    set((s) => {
      const next = s.history.future.shift();
      if (!next) return {} as any;
      const curr = snapshot(s);
      s.history.past.push(curr);
      return { ...next, history: s.history } as any;
    }),

  reset: () =>
    set(() => ({
      ...createInitialEditorState(),
    })),
}));

export const useLayerIds = () =>
  useEditorStore(useShallow((state) => state.layers.map((l) => l.id)));

export const useLayer = (id: string) =>
  useEditorStore((state) => state.layers.find((l) => l.id === id));
export const useSelectedLayerId = () =>
  useEditorStore((state) => state.selectedLayerId);

export const useSortedLayers = () =>
  useEditorStore(
    useShallow((state) =>
      state.layers.filter((l) => l.croppedUri || l.maskPath)
    )
  );

export { useShallow };
