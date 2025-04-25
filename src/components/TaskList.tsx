import { Task } from '../types/game';
import { HeartIcon, BoltIcon, CurrencyEuroIcon, SparklesIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TaskListProps {
  tasks: Task[];
  completedTasks: string[];
  onTaskSelect: (taskId: string) => void;
  playerEnergy: number;
}

export default function TaskList({ tasks, completedTasks, onTaskSelect, playerEnergy }: TaskListProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {tasks.map((task) => {
        const isCompleted = completedTasks.includes(task.id);
        const hasEnoughEnergy = playerEnergy >= task.energyCost;

        return (
          <button
            key={task.id}
            onClick={() => hasEnoughEnergy && !isCompleted && onTaskSelect(task.id)}
            disabled={isCompleted || !hasEnoughEnergy}
            className={`p-4 rounded-lg shadow transition-all ${
              isCompleted
                ? 'bg-gray-100 cursor-not-allowed'
                : hasEnoughEnergy
                ? 'bg-white hover:bg-gray-50 cursor-pointer'
                : 'bg-gray-100 cursor-not-allowed'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-lg">{task.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{task.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">{task.duration}min</span>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1">
                <BoltIcon className="w-4 h-4 text-yellow-500" />
                <span className={`text-sm ${task.energyCost > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {task.energyCost > 0 ? `-${task.energyCost}` : `+${Math.abs(task.energyCost)}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <HeartIcon className="w-4 h-4 text-red-500" />
                <span className={`text-sm ${task.happinessImpact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {task.happinessImpact >= 0 ? `+${task.happinessImpact}` : task.happinessImpact}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <CurrencyEuroIcon className="w-4 h-4 text-green-500" />
                <span className={`text-sm ${task.moneyImpact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {task.moneyImpact >= 0 ? `+${task.moneyImpact}` : task.moneyImpact}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <SparklesIcon className="w-4 h-4 text-blue-500" />
                <span className={`text-sm ${task.cleanlinessImpact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {task.cleanlinessImpact >= 0 ? `+${task.cleanlinessImpact}` : task.cleanlinessImpact}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
} 