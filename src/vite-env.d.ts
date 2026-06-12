/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI: {
      db: {
        find: (entity: string, options?: any) => Promise<any[]>;
        findOne: (entity: string, options?: any) => Promise<any>;
        save: (entity: string, data: any) => Promise<any>;
        remove: (entity: string, id: number) => Promise<any>;
        query: (sql: string, params?: any[]) => Promise<any[]>;
      };
      schedule: {
        generate: (date: string) => Promise<any>;
      };
    };
  }
}

export {};
