export {};

declare global {
  interface Window {
    /**
     * base64 encoded JS object containing environment configurations.
     */
    _env: string;
  }
}
