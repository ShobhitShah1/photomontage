interface ImageWithDimensions {
  id: string;
  uri: string;
  width: number;
  height: number;
}

export interface ImageLayout {
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  width: number;
  height: number;
}

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const checkOverlap = (
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number,
  minGap: number
): boolean => {
  return !(
    x1 + w1 + minGap < x2 ||
    x2 + w2 + minGap < x1 ||
    y1 + h1 + minGap < y2 ||
    y2 + h2 + minGap < y1
  );
};

const getOptimalSize = (
  imgWidth: number,
  imgHeight: number,
  maxWidth: number,
  maxHeight: number,
  canvasW: number,
  canvasH: number
) => {
  const aspectRatio = imgWidth / imgHeight;
  let width = maxWidth;
  let height = maxWidth / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = maxHeight * aspectRatio;
  }

  const minSize = Math.min(canvasW, canvasH) * 0.35;
  if (width < minSize || height < minSize) {
    if (aspectRatio > 1) {
      width = minSize;
      height = minSize / aspectRatio;
    } else {
      height = minSize;
      width = minSize * aspectRatio;
    }
  }

  return { width, height };
};

const clampPosition = (
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number,
  padding: number
) => {
  const maxX = canvasWidth - width - padding;
  const maxY = canvasHeight - height - padding;

  return {
    x: Math.max(padding, Math.min(x, maxX)),
    y: Math.max(padding, Math.min(y, maxY)),
  };
};

export const generateStackedLayout = (
  images: ImageWithDimensions[],
  canvasWidth: number,
  canvasHeight: number
): ImageLayout[] => {
  const layouts: ImageLayout[] = [];
  const minGap = 20;
  const maxAttempts = 150;
  const padding = 10;

  images.forEach((image, i) => {
    const seed = image.id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const maxWidth = canvasWidth * 0.55;
    const maxHeight = canvasHeight * 0.5;

    const { width: imgWidth, height: imgHeight } = getOptimalSize(
      image.width,
      image.height,
      maxWidth,
      maxHeight,
      canvasWidth,
      canvasHeight
    );

    const preferredPositions = [
      { x: minGap, y: minGap },
      { x: canvasWidth - imgWidth - minGap, y: minGap },
      { x: minGap, y: canvasHeight - imgHeight - minGap },
      {
        x: canvasWidth - imgWidth - minGap,
        y: canvasHeight - imgHeight - minGap,
      },
    ];

    let x = 0;
    let y = 0;
    let rotation = 0;
    let foundPosition = false;

    if (i < preferredPositions.length) {
      const pos = preferredPositions[i];
      x = pos.x;
      y = pos.y;
      rotation = (seededRandom(seed + i * 13) - 0.5) * 15;
      foundPosition = true;
    } else {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const r1 = seededRandom(seed + i * 7 + attempt * 3);
        const r2 = seededRandom(seed + i * 11 + attempt * 5);
        const r3 = seededRandom(seed + i * 13 + attempt * 7);

        const safeWidth = Math.max(0, canvasWidth - imgWidth - minGap * 2);
        const safeHeight = Math.max(0, canvasHeight - imgHeight - minGap * 2);

        x = minGap + r1 * safeWidth;
        y = minGap + r2 * safeHeight;
        rotation = (r3 - 0.5) * 15;

        let hasOverlap = false;
        for (const existingLayout of layouts) {
          if (
            checkOverlap(
              x,
              y,
              imgWidth,
              imgHeight,
              existingLayout.x,
              existingLayout.y,
              existingLayout.width,
              existingLayout.height,
              minGap
            )
          ) {
            hasOverlap = true;
            break;
          }
        }

        if (!hasOverlap) {
          foundPosition = true;
          break;
        }
      }
    }

    if (!foundPosition) {
      const r1 = seededRandom(seed + i * 7);
      const r2 = seededRandom(seed + i * 11);
      const r3 = seededRandom(seed + i * 13);

      const safeWidth = Math.max(0, canvasWidth - imgWidth - minGap * 2);
      const safeHeight = Math.max(0, canvasHeight - imgHeight - minGap * 2);

      x = minGap + r1 * safeWidth;
      y = minGap + r2 * safeHeight;
      rotation = (r3 - 0.5) * 15;
    }

    const clampedPos = clampPosition(
      x,
      y,
      imgWidth,
      imgHeight,
      canvasWidth,
      canvasHeight,
      padding
    );

    layouts.push({
      x: clampedPos.x,
      y: clampedPos.y,
      rotation,
      zIndex: i,
      width: imgWidth,
      height: imgHeight,
    });
  });

  return layouts;
};

