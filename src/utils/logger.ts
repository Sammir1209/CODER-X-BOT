export function log(message: string, ...optionalParams: any[]): void {
  console.log(`[${new Date().toISOString()}] ${message}`, ...optionalParams);
}
