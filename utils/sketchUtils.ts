// Simple PRNG to keep the "randomness" consistent between renders if needed
// For this UI, Math.random is fine as long as we use stable seeds or just let it wiggle on update.
// To prevent excessive jittering, in a real app we'd cache the path data, but for simplicity here we'll let it be dynamic.

export const getRoughPath = (x1: number, y1: number, x2: number, y2: number, roughness: number = 1, bowing: number = 1): string => {
  const len = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Add some random offset to the midpoint to create a bow
  const bowOffset = len * 0.05 * bowing;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const perpAngle = angle + Math.PI / 2;
  
  const randomBow = (Math.random() - 0.5) * bowOffset;
  const controlX = midX + Math.cos(perpAngle) * randomBow;
  const controlY = midY + Math.sin(perpAngle) * randomBow;

  // Roughness adds jaggedness. We'll do a simple Quad Bezier for smoothness with slight error
  const r1 = (Math.random() - 0.5) * roughness * 2;
  const r2 = (Math.random() - 0.5) * roughness * 2;
  const r3 = (Math.random() - 0.5) * roughness * 2;
  const r4 = (Math.random() - 0.5) * roughness * 2;

  return `M ${x1 + r1} ${y1 + r2} Q ${controlX} ${controlY} ${x2 + r3} ${y2 + r4}`;
};
