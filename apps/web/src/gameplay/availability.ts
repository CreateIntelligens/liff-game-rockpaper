export function canStartGame(energy: number | null): boolean {
  return energy !== null && energy > 0;
}
