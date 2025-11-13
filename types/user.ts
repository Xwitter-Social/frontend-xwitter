export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
}
