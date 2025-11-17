import type { Layer } from "@/store/store";

export const createLayersFromImages = (
  images: any[],
  canvasWidth: number,
  canvasHeight: number
) => {
  return images.map((image, index) => {
    const imgWidth = image.width || 640;
    const imgHeight = image.height || 640;

    const maxWidth = canvasWidth * 0.6;
    const maxHeight = canvasHeight * 0.6;

    let displayWidth = imgWidth;
    let displayHeight = imgHeight;

    if (imgWidth > maxWidth || imgHeight > maxHeight) {
      const scaleW = maxWidth / imgWidth;
      const scaleH = maxHeight / imgHeight;
      const scale = Math.min(scaleW, scaleH);
      displayWidth = imgWidth * scale;
      displayHeight = imgHeight * scale;
    }

    const x = (canvasWidth - displayWidth) / 2 + index * 20;
    const y = (canvasHeight - displayHeight) / 2 + index * 20;

    return {
      id: image.id,
      originalUri: image.uri,
      x: Math.max(0, x),
      y: Math.max(0, y),
      scale: 1,
      rotation: 0,
      width: displayWidth,
      height: displayHeight,
      z: index + 1,
    };
  });
};

export const calculateNextZIndex = (layers: Layer[]): number => {
  if (layers.length === 0) return 1;
  return layers.reduce((max, layer) => Math.max(max, layer.z), 0) + 1;
};

export const assignZIndexToLayers = (
  layers: Omit<Layer, "z">[],
  currentLayers: Layer[]
): Layer[] => {
  const maxZ = calculateNextZIndex(currentLayers);
  return layers.map((layer, index) => ({
    ...layer,
    z: maxZ + index,
  }));
};

interface LayoutBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const checkOverlap = (
  bounds1: LayoutBounds,
  bounds2: LayoutBounds,
  padding: number = 20
): boolean => {
  return (
    bounds1.x < bounds2.x + bounds2.width + padding &&
    bounds1.x + bounds1.width + padding > bounds2.x &&
    bounds1.y < bounds2.y + bounds2.height + padding &&
    bounds1.y + bounds1.height + padding > bounds2.y
  );
};

const findNonOverlappingPosition = (
  width: number,
  height: number,
  existingBounds: LayoutBounds[],
  canvasWidth: number,
  canvasHeight: number,
  maxAttempts: number = 50
): { x: number; y: number } | null => {
  const padding = 30;
  const margin = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = margin + Math.random() * (canvasWidth - width - margin * 2);
    const y = margin + Math.random() * (canvasHeight - height - margin * 2);

    const newBounds: LayoutBounds = { x, y, width, height };
    const overlaps = existingBounds.some((bounds) =>
      checkOverlap(newBounds, bounds, padding)
    );

    if (!overlaps) {
      return { x, y };
    }
  }

  return null;
};

const normalizeImageSize = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
  minSize: number = 100
): { width: number; height: number; scale: number } => {
  const aspectRatio = width / height;
  let newWidth = width;
  let newHeight = height;

  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }

  if (newWidth < minSize) {
    newWidth = minSize;
    newHeight = newWidth / aspectRatio;
  }

  if (newHeight < minSize) {
    newHeight = minSize;
    newWidth = newHeight * aspectRatio;
  }

  const scale = newWidth / width;
  return { width: newWidth, height: newHeight, scale };
};

export const createSmartLayout = (
  layers: Layer[],
  canvasWidth: number,
  canvasHeight: number
): Layer[] => {
  if (layers.length === 0) return layers;

  const padding = 40;
  const margin = 30;
  const usableWidth = canvasWidth - margin * 2;
  const usableHeight = canvasHeight - margin * 2;

  const sortedLayers = [...layers].sort((a, b) => {
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    return areaB - areaA;
  });

  const layoutLayers: Layer[] = [];
  const existingBounds: LayoutBounds[] = [];
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  if (layers.length === 1) {
    const layer = sortedLayers[0];
    const maxSize = Math.min(usableWidth * 0.8, usableHeight * 0.8);
    const { width, height, scale } = normalizeImageSize(
      layer.width,
      layer.height,
      maxSize,
      maxSize
    );

    layoutLayers.push({
      ...layer,
      x: centerX - width / 2,
      y: centerY - height / 2,
      rotation: (Math.random() - 0.5) * 8,
      scale: layer.scale * scale,
    });
    return layoutLayers;
  }

  if (layers.length === 2) {
    sortedLayers.forEach((layer, index) => {
      const maxSize = Math.min(usableWidth * 0.4, usableHeight * 0.6);
      const { width, height, scale } = normalizeImageSize(
        layer.width,
        layer.height,
        maxSize,
        maxSize
      );

      const spacing = Math.max(width, height) + padding;
      const offsetX = index === 0 ? -spacing / 2 : spacing / 2;

      layoutLayers.push({
        ...layer,
        x: centerX - width / 2 + offsetX,
        y: centerY - height / 2,
        rotation: (Math.random() - 0.5) * 10,
        scale: layer.scale * scale,
      });
    });
    return layoutLayers;
  }

  if (layers.length === 3) {
    sortedLayers.forEach((layer, index) => {
      const maxSize = Math.min(usableWidth * 0.35, usableHeight * 0.4);
      const { width, height, scale } = normalizeImageSize(
        layer.width,
        layer.height,
        maxSize,
        maxSize
      );

      const radius = Math.min(usableWidth, usableHeight) * 0.2;
      const angle = (index * 2 * Math.PI) / 3 - Math.PI / 2;

      layoutLayers.push({
        ...layer,
        x: centerX + Math.cos(angle) * radius - width / 2,
        y: centerY + Math.sin(angle) * radius - height / 2,
        rotation: (Math.random() - 0.5) * 12,
        scale: layer.scale * scale,
      });
    });
    return layoutLayers;
  }

  if (layers.length <= 6) {
    const cols = layers.length <= 4 ? 2 : 3;
    const rows = Math.ceil(layers.length / cols);
    const cellWidth = usableWidth / cols;
    const cellHeight = usableHeight / rows;

    sortedLayers.forEach((layer, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const maxWidth = cellWidth - padding;
      const maxHeight = cellHeight - padding;
      const { width, height, scale } = normalizeImageSize(
        layer.width,
        layer.height,
        maxWidth,
        maxHeight
      );

      const cellX = margin + col * cellWidth;
      const cellY = margin + row * cellHeight;

      layoutLayers.push({
        ...layer,
        x: cellX + (cellWidth - width) / 2,
        y: cellY + (cellHeight - height) / 2,
        rotation: (Math.random() - 0.5) * 15,
        scale: layer.scale * scale,
      });
    });
    return layoutLayers;
  }

  const cols = Math.ceil(Math.sqrt(layers.length));
  const rows = Math.ceil(layers.length / cols);
  const cellWidth = usableWidth / cols;
  const cellHeight = usableHeight / rows;

  sortedLayers.forEach((layer, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    const maxWidth = cellWidth - padding;
    const maxHeight = cellHeight - padding;
    const { width, height, scale } = normalizeImageSize(
      layer.width,
      layer.height,
      maxWidth,
      maxHeight
    );

    const cellX = margin + col * cellWidth;
    const cellY = margin + row * cellHeight;

    const baseX = cellX + (cellWidth - width) / 2;
    const baseY = cellY + (cellHeight - height) / 2;

    let finalX = baseX;
    let finalY = baseY;

    const bounds: LayoutBounds = {
      x: finalX,
      y: finalY,
      width,
      height,
    };

    let attempts = 0;
    while (
      existingBounds.some((existing) =>
        checkOverlap(bounds, existing, padding)
      ) &&
      attempts < 20
    ) {
      const offsetX = (Math.random() - 0.5) * (cellWidth - width) * 0.3;
      const offsetY = (Math.random() - 0.5) * (cellHeight - height) * 0.3;
      finalX = Math.max(
        margin,
        Math.min(canvasWidth - width - margin, baseX + offsetX)
      );
      finalY = Math.max(
        margin,
        Math.min(canvasHeight - height - margin, baseY + offsetY)
      );
      bounds.x = finalX;
      bounds.y = finalY;
      attempts++;
    }

    existingBounds.push({ ...bounds });

    layoutLayers.push({
      ...layer,
      x: finalX,
      y: finalY,
      rotation: (Math.random() - 0.5) * 18,
      scale: layer.scale * scale,
    });
  });

  return layoutLayers;
};
