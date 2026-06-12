import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  db: {
    find: (entity: string, options?: any) => ipcRenderer.invoke('db:find', entity, options),
    findOne: (entity: string, options?: any) => ipcRenderer.invoke('db:findOne', entity, options),
    save: (entity: string, data: any) => ipcRenderer.invoke('db:save', entity, data),
    remove: (entity: string, id: number) => ipcRenderer.invoke('db:remove', entity, id),
    query: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params)
  },
  schedule: {
    generate: (date: string) => ipcRenderer.invoke('schedule:generate', date)
  }
});
