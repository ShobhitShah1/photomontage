import { Layer } from "@/store/store";

/**
 * Creative collage layout algorithms for photo arrangements
 * Each layout creates a visually distinct and appealing arrangement
 */

type LayoutResult = Pick<Layer, "x" | "y" | "scale" | "rotation">[];

interface LayoutParams {
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Scattered Polaroid Layout
 * Images are arranged like scattered polaroid photos on a table
 * with natural-looking overlaps and varied rotations
 */
export function scatteredPolaroidLayout({
  layers,
  canvasWidth,
  canvasHeight,
}: LayoutParams): LayoutResult {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const spreadRadius = Math.min(canvasWidth, canvasHeight) * 0.35;

  return layers.map((layer, index) => {
    // Golden angle distribution for natural spread
    const angle = index * 137.508 * (Math.PI / 180);
    const radius = spreadRadius * (0.3 + Math.random() * 0.7);

    // Calculate position from center
    const targetX = centerX + Math.cos(angle) * radius;
    const targetY = centerY + Math.sin(angle) * radius;

    // Scale to fit nicely (larger images slightly smaller)
    const baseScale = 0.5 + Math.random() * 0.3;
    const scaledWidth = layer.width * baseScale;
    const scaledHeight = layer.height * baseScale;

    // Center the image on its target position
    const x = targetX - scaledWidth / 2;
    const y = targetY - scaledHeight / 2;

    // Natural rotation like dropped photos
    const rotation = (Math.random() - 0.5) * 30;

    return { x, y, scale: baseScale, rotation };
  });
}

/**
 * Masonry Grid Layout
 * Pinterest-style columns with images stacked vertically
 */
export function masonryLayout({
  layers,
  canvasWidth,
  canvasHeight,
}: LayoutParams): LayoutResult {
  const numColumns = layers.length <= 3 ? 2 : layers.length <= 6 ? 3 : 4;
  const gap = 10;
  const columnWidth = (canvasWidth - gap * (numColumns + 1)) / numColumns;
  const columnHeights = new Array(numColumns).fill(gap);

  return layers.map((layer) => {
    // Find shortest column
    const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));

    // Scale image to fit column width
    const scale = columnWidth / layer.width;
    const scaledHeight = layer.height * scale;

    const x = gap + shortestColumn * (columnWidth + gap);
    const y = columnHeights[shortestColumn];

    // Update column height
    columnHeights[shortestColumn] += scaledHeight + gap;

    return { x, y, scale, rotation: 0 };
  });
}

/**
 * Spiral Layout
 * Images arranged in a beautiful spiral pattern from center
 */
export function spiralLayout({
  layers,
  canvasWidth,
  canvasHeight,
}: LayoutParams): LayoutResult {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  return layers.map((layer, index) => {
    // Archimedean spiral
    const a = 30; // Initial radius
    const b = 25; // Spiral growth rate
    const theta = index * 0.8;
    const radius = a + b * theta;

    const x = centerX + radius * Math.cos(theta);
    const y = centerY + radius * Math.sin(theta);

    // Scale decreases as we go outward
    const baseScale = Math.max(0.3, 0.7 - index * 0.05);

    // Rotation follows the spiral
    const rotation = (theta * 180) / Math.PI + (Math.random() - 0.5) * 10;

    const scaledWidth = layer.width * baseScale;
    const scaledHeight = layer.height * baseScale;

    return {
      x: x - scaledWidth / 2,
      y: y - scaledHeight / 2,
      scale: baseScale,
      rotation: rotation % 360,
    };
  });
}

/**
 * Fan Layout
 * Images spread like a hand of cards
 */
export function fanLayout({
  layers,
  canvasWidth,
  canvasHeight,
}: LayoutParams): LayoutResult {
  const centerX = canvasWidth / 2;
  const baseY = canvasHeight * 0.6;
  const fanSpread = 60; // Total degrees of spread
  const angleStep = layers.length > 1 ? fanSpread / (layers.length - 1) : 0;
  const startAngle = -fanSpread / 2;

  return layers.map((layer, index) => {
    const angle = startAngle + index * angleStep;
    const radian = (angle * Math.PI) / 180;

    // All images pivot from a point below the canvas
    const pivotY = canvasHeight * 1.5;
    const pivotDistance = canvasHeight * 0.9;

    const x = centerX + Math.sin(radian) * pivotDistance;
    const y = baseY - Math.cos(radian) * pivotDistance * 0.3;

    const scale = 0.4 + Math.random() * 0.15;
    const scaledWidth = layer.width * scale;
    const scaledHeight = layer.height * scale;

    return {
      x: x - scaledWidth / 2,
      y: y - scaledHeight / 2,
      scale,
      rotation: angle,
    };
  });
}

/**
 * Stacked Center Layout
 * Images stacked in center with slight offsets, like a pile
 */
export function stackedCenterLayout({
  layers,
  canvasWidth,
  canvasHeight,
}: LayoutParams): LayoutResult {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const maxOffset = 40;

  return layers.map((layer, index) => {
    // Random offset from center
    const offsetX = (Math.random() - 0.5) * maxOffset * 2;
    const offsetY = (Math.random() - 0.5) * maxOffset * 2;

    // Scale all images to similar size
    const targetSize = Math.min(canvasWidth, canvasHeight) * 0.45;
    const scale = targetSize / Math.max(layer.width, layer.height);

    const scaledWidth = layer.width * scale;
    const scaledHeight = layer.height * scale;

    const x = centerX - scaledWidth / 2 + offsetX;
    const y = centerY - scaledHeight / 2 + offsetY;

    // Slight rotation for natural look
    const rotation = (Math.random() - 0.5) * 25;

    return { x, y, scale, rotation };
  });
}

/**
 * Grid with Overlap Layout
 * Organized grid but with slight overlaps and rotations for visual interest
 */
export function overlappingGridLayout({
  layers,
  canvasWidth,
  canvasHeight,
}: LayoutParams): LayoutResult {
  const count = layers.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const cellWidth = canvasWidth / cols;
  const cellHeight = canvasHeight / rows;
  const overlap = 0.15; // 15% overlap

  return layers.map((layer, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    // Base position in grid
    const baseX = col * cellWidth * (1 - overlap);
    const baseY = row * cellHeight * (1 - overlap);

    // Scale to fit cell with some padding
    const maxDim = Math.max(layer.width, layer.height);
    const scale = (Math.min(cellWidth, cellHeight) * 0.85) / maxDim;

    const scaledWidth = layer.width * scale;
    const scaledHeight = layer.height * scale;

    // Center in cell with small random offset
    const x =
      baseX + (cellWidth - scaledWidth) / 2 + (Math.random() - 0.5) * 20;
    const y =
      baseY + (cellHeight - scaledHeight) / 2 + (Math.random() - 0.5) * 20;

    // Subtle rotation
    const rotation = (Math.random() - 0.5) * 8;

    return { x, y, scale, rotation };
  });
}

/**
 * Diagonal Cascade Layout
 * Images flow diagonally across the canvas
 */
export function diagonalCascadeLayout({
  layers,
  canvasWidth,
  canvasHeight,
}: LayoutParams): LayoutResult {
  const stepX = (canvasWidth * 0.7) / Math.max(1, layers.length - 1);
  const stepY = (canvasHeight * 0.6) / Math.max(1, layers.length - 1);

  return layers.map((layer, index) => {
    const x = canvasWidth * 0.1 + index * stepX;
    const y = canvasHeight * 0.1 + index * stepY;

    // Varied scales
    const scale = 0.35 + Math.random() * 0.2;

    // Alternating slight rotation
    const rotation =
      index % 2 === 0 ? 5 + Math.random() * 5 : -5 - Math.random() * 5;

    const scaledWidth = layer.width * scale;
    const scaledHeight = layer.height * scale;

    return {
      x: x - scaledWidth / 2,
      y: y - scaledHeight / 2,
      scale,
      rotation,
    };
  });
}

/**
 * Random layout selector - picks one of the creative layouts
 */
export function getRandomCreativeLayout(params: LayoutParams): LayoutResult {
  const layouts = [
    scatteredPolaroidLayout,
    masonryLayout,
    spiralLayout,
    fanLayout,
    stackedCenterLayout,
    overlappingGridLayout,
    diagonalCascadeLayout,
  ];

  const randomLayout = layouts[Math.floor(Math.random() * layouts.length)];
  return randomLayout(params);
}

/**
 * Cycle through layouts in order
 */
let layoutIndex = 0;
export function getNextCreativeLayout(params: LayoutParams): LayoutResult {
  const layouts = [
    scatteredPolaroidLayout,
    masonryLayout,
    spiralLayout,
    fanLayout,
    stackedCenterLayout,
    overlappingGridLayout,
    diagonalCascadeLayout,
  ];

  layoutIndex = (layoutIndex + 1) % layouts.length;
  return layouts[layoutIndex](params);
}

/**
 * Get layout by name
 */
export type LayoutName =
  | "scattered"
  | "masonry"
  | "spiral"
  | "fan"
  | "stacked"
  | "grid"
  | "diagonal"
  | "random";

export function getLayoutByName(
  name: LayoutName,
  params: LayoutParams
): LayoutResult {
  switch (name) {
    case "scattered":
      return scatteredPolaroidLayout(params);
    case "masonry":
      return masonryLayout(params);
    case "spiral":
      return spiralLayout(params);
    case "fan":
      return fanLayout(params);
    case "stacked":
      return stackedCenterLayout(params);
    case "grid":
      return overlappingGridLayout(params);
    case "diagonal":
      return diagonalCascadeLayout(params);
    case "random":
    default:
      return getRandomCreativeLayout(params);
  }
}
