import { HeartIcon, BoltIcon, CurrencyEuroIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface StatusBarProps {
  happiness: number;
  energy: number;
  money: number;
  cleanliness: number;
}

export default function StatusBar({ happiness, energy, money, cleanliness }: StatusBarProps) {
  const stats = [
    { name: 'Zufriedenheit', value: happiness, icon: HeartIcon, color: 'text-red-500' },
    { name: 'Energie', value: energy, icon: BoltIcon, color: 'text-yellow-500' },
    { name: 'Geld', value: money, icon: CurrencyEuroIcon, color: 'text-green-500' },
    { name: 'Sauberkeit', value: cleanliness, icon: SparklesIcon, color: 'text-blue-500' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-white rounded-lg shadow">
      {stats.map((stat) => (
        <div key={stat.name} className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <span className="font-medium">{stat.name}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
            <div
              className={`h-full rounded-full ${stat.color.replace('text', 'bg')}`}
              style={{ width: `${stat.value}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 mt-1">{stat.value}%</span>
        </div>
      ))}
    </div>
  );
} 