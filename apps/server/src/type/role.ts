export interface Role {
  id: number;
  name: string;
  description?: string;
  databaseSources?: number[];
  apiSources?: number[];
  users?: number[];
  action: string[];
}
