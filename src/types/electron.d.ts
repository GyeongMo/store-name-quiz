export {};

declare global {
  interface Window {
    electronAPI?: {
      saveResult: (payload: {
        filename: string;
        content: string;
        type: 'json' | 'csv';
      }) => Promise<{ saved: boolean; filePath?: string }>;
      savePool?: (
        json: string,
      ) => Promise<{ saved: boolean; filePath?: string; reason?: string }>;
      isElectron?: boolean;
    };
  }
}
