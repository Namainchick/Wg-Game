interface TimeDisplayProps {
  day: number;
  time: number;
}

export default function TimeDisplay({ day, time }: TimeDisplayProps) {
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Tag {day}</h2>
        <p className="text-4xl font-mono mt-2">{formattedTime}</p>
      </div>
    </div>
  );
} 