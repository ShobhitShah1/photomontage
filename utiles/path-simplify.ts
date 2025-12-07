/**
 * Path simplification using Douglas-Peucker algorithm
 * Reduces the number of points in a path while maintaining its shape
 */

interface Point {
  x: number;
  y: number;
}

/**
 * Calculate perpendicular distance from a point to a line segment
 */
function perpendicularDistance(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  // Handle case where line is a point
  const lineLengthSquared = dx * dx + dy * dy;
  if (lineLengthSquared === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
    );
  }

  // Calculate projection onto line
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
        lineLengthSquared
    )
  );

  const projectionX = lineStart.x + t * dx;
  const projectionY = lineStart.y + t * dy;

  return Math.sqrt(
    Math.pow(point.x - projectionX, 2) + Math.pow(point.y - projectionY, 2)
  );
}

/**
 * Douglas-Peucker path simplification algorithm
 * @param points - Array of points to simplify
 * @param epsilon - Maximum distance tolerance (higher = more simplification)
 * @returns Simplified array of points
 */
export function simplifyPath(points: Point[], epsilon: number = 3): Point[] {
  if (points.length <= 2) {
    return points;
  }

  // Find the point with the maximum distance from the line between first and last points
  let maxDistance = 0;
  let maxIndex = 0;

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], firstPoint, lastPoint);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const leftPart = simplifyPath(points.slice(0, maxIndex + 1), epsilon);
    const rightPart = simplifyPath(points.slice(maxIndex), epsilon);

    // Combine results (avoid duplicating the shared point)
    return [...leftPart.slice(0, -1), ...rightPart];
  } else {
    // All points are close enough to the line, keep only endpoints
    return [firstPoint, lastPoint];
  }
}

/**
 * Simplify a path string and rebuild it
 * @param pathString - SVG path string (M x y L x y L x y ... Z)
 * @param epsilon - Maximum distance tolerance
 * @returns Simplified SVG path string
 */
export function simplifyPathString(
  pathString: string,
  epsilon: number = 3
): string {
  if (!pathString || pathString.length === 0) {
    return pathString;
  }

  // Parse path string to points
  const points: Point[] = [];
  const regex = /([ML])\s*([\d.]+)\s+([\d.]+)/gi;
  let match;

  while ((match = regex.exec(pathString)) !== null) {
    points.push({
      x: parseFloat(match[2]),
      y: parseFloat(match[3]),
    });
  }

  if (points.length <= 2) {
    return pathString;
  }

  // Simplify points
  const simplified = simplifyPath(points, epsilon);

  // Check if path was closed
  const isClosed = pathString.toUpperCase().includes("Z");

  // Rebuild path string
  if (simplified.length === 0) {
    return "";
  }

  let result = `M ${simplified[0].x} ${simplified[0].y}`;
  for (let i = 1; i < simplified.length; i++) {
    result += ` L ${simplified[i].x} ${simplified[i].y}`;
  }

  if (isClosed) {
    result += " Z";
  }

  return result;
}

/**
 * Count the number of points in a path string
 */
export function countPathPoints(pathString: string): number {
  if (!pathString) return 0;
  const matches = pathString.match(/[ML]\s*[\d.]+\s+[\d.]+/gi);
  return matches ? matches.length : 0;
}
