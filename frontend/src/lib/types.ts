export interface Message {
  sender_role: string;
  sender_name: string;
  content: string;
  timestamp?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  assignee_role: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
}

export interface Document {
  id: number;
  title: string;
  type: 'pitch_deck' | 'market_research' | 'code' | 'design';
  content: string;
  created_at: string;
}

export interface Simulation {
  id: number;
  name: string;
  idea: string;
  status: string;
  created_at: string;
}
