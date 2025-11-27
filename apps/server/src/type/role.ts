export interface Role {
  id: number;
  name: string;
  description?: string;
  databaseSources?: string[];
  apiSources?: string[];
  users?: number[];
}
