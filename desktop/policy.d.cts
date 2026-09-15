declare const policy: {
  GAME_URL: string;
  assetPath(value: string, root: string): string | null;
  isGameDocument(value: string): boolean;
  windowOptions: {
    minWidth: number;
    minHeight: number;
    webPreferences: { sandbox: boolean; contextIsolation: boolean; nodeIntegration: boolean; webSecurity: boolean; preload?: string };
  };
};
export = policy;
