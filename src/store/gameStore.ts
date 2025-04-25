import { create } from 'zustand';
import { GameState, GameAction, Task } from '../types/game';

const initialTasks: Task[] = [
  {
    id: 'clean-kitchen',
    title: 'Küche putzen',
    description: 'Die Küche gründlich reinigen',
    energyCost: 20,
    happinessImpact: -5,
    moneyImpact: 0,
    cleanlinessImpact: 15,
    duration: 30,
  },
  {
    id: 'cook-meal',
    title: 'Kochen',
    description: 'Eine leckere Mahlzeit zubereiten',
    energyCost: 15,
    happinessImpact: 10,
    moneyImpact: -10,
    cleanlinessImpact: -5,
    duration: 45,
  },
  {
    id: 'work',
    title: 'Arbeiten',
    description: 'Geld verdienen',
    energyCost: 30,
    happinessImpact: -10,
    moneyImpact: 50,
    cleanlinessImpact: 0,
    duration: 240,
  },
  {
    id: 'sleep',
    title: 'Schlafen',
    description: 'Sich ausruhen',
    energyCost: -50,
    happinessImpact: 10,
    moneyImpact: 0,
    cleanlinessImpact: 0,
    duration: 480,
  },
];

const initialState: GameState = {
  player: {
    id: '1',
    name: 'Spieler',
    happiness: 100,
    energy: 100,
    money: 100,
    cleanliness: 100,
  },
  day: 1,
  time: 480, // Start at 8:00
  tasks: initialTasks,
  completedTasks: [],
};

export const useGameStore = create<GameState & {
  dispatch: (action: GameAction) => void;
}>((set) => ({
  ...initialState,
  dispatch: (action: GameAction) =>
    set((state) => {
      switch (action.type) {
        case 'PERFORM_TASK': {
          const task = state.tasks.find((t) => t.id === action.taskId);
          if (!task) return state;

          return {
            ...state,
            player: {
              ...state.player,
              happiness: Math.max(0, Math.min(100, state.player.happiness + task.happinessImpact)),
              energy: Math.max(0, Math.min(100, state.player.energy - task.energyCost)),
              money: Math.max(0, state.player.money + task.moneyImpact),
              cleanliness: Math.max(0, Math.min(100, state.player.cleanliness + task.cleanlinessImpact)),
            },
            time: state.time + task.duration,
            completedTasks: [...state.completedTasks, task.id],
          };
        }
        case 'ADVANCE_TIME': {
          const newTime = state.time + action.minutes;
          if (newTime >= 1440) {
            return {
              ...state,
              time: newTime % 1440,
              day: state.day + 1,
              completedTasks: [],
            };
          }
          return {
            ...state,
            time: newTime,
          };
        }
        case 'START_NEW_DAY': {
          return {
            ...state,
            day: state.day + 1,
            time: 480,
            completedTasks: [],
            player: {
              ...state.player,
              energy: Math.min(100, state.player.energy + 20),
            },
          };
        }
        default:
          return state;
      }
    }),
})); 