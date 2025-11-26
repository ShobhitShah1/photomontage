import { create } from "zustand";

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
        layers: s.layers.map((l) =>
          l.id === id ? { ...l, z: maxZ + 1 } : l
        ),
      };
    }),

  sendToBack: (id) =>
    set((s) => {
      pushHistory(s);
      const minZ = s.layers.reduce((m, l) => Math.min(m, l.z), 0);
      return {
        layers: s.layers.map((l) =>
          l.id === id ? { ...l, z: minZ - 1 } : l
        ),
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

      // console.log("Updated layers:", updatedLayers);

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
        const scaledWidth = layer.width * layer.scale;
        const scaledHeight = layer.height * layer.scale;

        const maxX = canvasWidth - scaledWidth;
        const maxY = canvasHeight - scaledHeight;

        const newX = Math.max(0, Math.random() * maxX);
        const newY = Math.max(0, Math.random() * maxY);

        return {
          ...layer,
          x: newX,
          y: newY,
          rotation: Math.random() * 40 - 20, // Also adds a slight random rotation
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
