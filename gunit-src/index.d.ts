export function test(title: string, callback: (t: {
  /**
   * @template T
   * @param {T} x
   * @param {T} y
   */
  is<T>(x: T, y: T): void;

  pass(): void;
}) => void): void;