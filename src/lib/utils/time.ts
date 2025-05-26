export function formatDuration(milliseconds: number): string {
  if (isNaN(milliseconds) || milliseconds < 0) {
    return '0s';
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`; // Simplified for longer durations
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function getElapsedTime(startTime: string): number {
  const startDateTime = new Date(startTime);
  if (isNaN(startDateTime.getTime())) {
    return 0; // Return 0 or throw error if startTime is invalid
  }
  return Date.now() - startDateTime.getTime();
} 