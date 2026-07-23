// Déclaration des types globaux pour TypeScript

declare global {
  interface Window {
    fbq: {
      (command: 'init', id: string): void;
      (command: 'track', event: string, params?: Record<string, any>): void;
      loaded: boolean;
      version: string;
      queue: any[];
      push: (...args: any[]) => void;
      callMethod?: (...args: any[]) => void;
    };
    _fbq?: any;
  }
}

export {};
