import { get, set, keys, del } from 'idb-keyval';

export interface Project {
  id: string;
  name: string;
  lastModified: number;
  files: Record<string, string>;
  assets?: Record<string, string>; // path -> base64/dataUrl
  knowledge?: Record<string, string>; // name -> content
  chatHistory: any[];
  previewUrl?: string;
  settings?: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    githubRepo?: string;
    githubToken?: string;
  };
}

export interface HistoryEvent {
  id: string;
  projectId: string;
  timestamp: number;
  type: 'write' | 'delete' | 'rename' | 'shell';
  path?: string;
  content?: string;
  from?: string;
  to?: string;
  command?: string;
  summary?: string;
}

const PROJECTS_KEY = 'aether_projects';
const HISTORY_KEY = 'aether_history';

export const storage = {
  async saveProject(project: Project) {
    await set(`${PROJECTS_KEY}_${project.id}`, project);
  },

  async getProject(id: string): Promise<Project | undefined> {
    return await get(`${PROJECTS_KEY}_${id}`);
  },

  async getAllProjects(): Promise<Project[]> {
    const allKeys = await keys();
    const projectKeys = allKeys.filter(key => typeof key === 'string' && key.startsWith(PROJECTS_KEY));
    const projects = await Promise.all(projectKeys.map(key => get(key)));
    return projects.filter(Boolean).sort((a, b) => b.lastModified - a.lastModified);
  },

  async deleteProject(id: string) {
    await del(`${PROJECTS_KEY}_${id}`);
    await del(`${HISTORY_KEY}_${id}`);
  },

  async addHistoryEvent(event: Omit<HistoryEvent, 'id' | 'timestamp'>) {
    const id = Math.random().toString(36).substring(7);
    const timestamp = Date.now();
    const newEvent: HistoryEvent = { ...event, id, timestamp };
    
    const currentHistory = await this.getHistory(event.projectId);
    await set(`${HISTORY_KEY}_${event.projectId}`, [newEvent, ...currentHistory]);
    return newEvent;
  },

  async getHistory(projectId: string): Promise<HistoryEvent[]> {
    return (await get(`${HISTORY_KEY}_${projectId}`)) || [];
  }
};
