declare module "throttle-debounce" {
  export function throttle<T extends (...args: any[]) => any>(
    delay: number,
    callback: T
  ): T & { cancel: () => void };

  export function debounce<T extends (...args: any[]) => any>(
    delay: number,
    callback: T
  ): T & { cancel: () => void };
}
