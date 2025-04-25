export interface Player {
  id: string;
  name: string;
  happiness: number;
  energy: number;
  money: number;
  cleanliness: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  energyCost: number;
  happinessImpact: number;
  moneyImpact: number;
  cleanlinessImpact: number;
  duration: number; // in minutes
}

export interface GameState {
  player: Player;
  day: number;
  time: number; // in minutes (0-1440)
  tasks: Task[];
  completedTasks: string[];
}

export type GameAction = 
  | { type: 'PERFORM_TASK'; taskId: string }
  | { type: 'ADVANCE_TIME'; minutes: number }
  | { type: 'START_NEW_DAY' }; 