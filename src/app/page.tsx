'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Member {
  name: string;
  points: number;
  id?: string;  // Optional id field for member identification
}

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  createdBy: Member;
  completedBy?: Member;
  isCompleted: boolean;
}

interface TaskHistory {
  taskId: string;
  taskTitle: string;
  points: number;
  completedBy: string;
  completedAt: string;
}

interface WG {
  id: string;
  name: string;
  members: Member[];
  tasks: Task[];
  taskHistory: TaskHistory[];
}

// Hilfsfunktionen für localStorage
const saveWGsToStorage = (wgs: WG[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('wgs', JSON.stringify(wgs));
  }
};

const loadWGsFromStorage = (): WG[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('wgs');
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

const clearStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wgs');
  }
};

const fetchWGs = async () => {
  const response = await fetch('/api/wg');
  const data = await response.json();
  return data.wgs as WG[];
};

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wgs, setWgs] = useState<WG[]>([]);
  const [selectedWg, setSelectedWg] = useState<WG | null>(null);
  const [newTask, setNewTask] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'tracking' | 'leaderboard'>('tasks');
  const [isWGCreator, setIsWGCreator] = useState(false);
  const [accessibleWGs, setAccessibleWGs] = useState<WG[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invitedWg, setInvitedWg] = useState<WG | null>(null);

  // Initialisiere die WGs
  useEffect(() => {
    const loadWGs = async () => {
      try {
        console.log('Lade WGs...');
        const response = await fetch('/api/wg');
        const data = await response.json();
        const loadedWGs = data.wgs || [];
        console.log('Geladene WGs:', loadedWGs);
        setWgs(loadedWGs);

        // Prüfe auf Einladung
        const invitedWgId = searchParams.get('wgId');
        console.log('Suche nach WG mit ID:', invitedWgId);
        if (invitedWgId) {
          const foundWg = loadedWGs.find((wg: WG) => wg.id === invitedWgId);
          console.log('Gefundene WG:', foundWg);
          if (foundWg) {
            setInvitedWg(foundWg);
          }
        }

        // Setze die zugänglichen WGs nur wenn eingeloggt
        if (isLoggedIn) {
          const userWGs = loadedWGs.filter((wg: WG) => 
            wg.members.some((member: Member) => member.name === userName)
          );
          setAccessibleWGs(userWGs);

          // Update selected WG if needed
          if (selectedWg) {
            const updatedSelectedWg = loadedWGs.find((wg: WG) => wg.id === selectedWg.id);
            if (updatedSelectedWg) {
              setSelectedWg(updatedSelectedWg);
            }
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der WGs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWGs();

    // Polling für Live-Updates
    if (isLoggedIn) {
      const interval = setInterval(loadWGs, 1000);
      return () => clearInterval(interval);
    }
  }, [searchParams, isLoggedIn, userName, selectedWg?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUserName = params.get('userName');
    
    // Nur den Namen setzen, aber nicht automatisch einloggen
    if (urlUserName) {
      setUserName(urlUserName);
    }
  }, []);

  const getInviteLink = () => {
    if (!selectedWg) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/?wgId=${selectedWg.id}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    try {
      console.log('Login-Versuch für:', userName);
      localStorage.setItem('userName', userName);
      setIsLoggedIn(true);

      // Hole aktuelle WGs
      const response = await fetch('/api/wg');
      const data = await response.json();
      const currentWgs = data.wgs || [];
      console.log('Aktuelle WGs:', currentWgs);
      
      const invitedWgId = searchParams.get('wgId');
      console.log('Einladungs-ID:', invitedWgId);
      
      if (invitedWgId) {
        console.log('Suche eingeladene WG...');
        const invitedWg = currentWgs.find((wg: WG) => wg.id === invitedWgId);
        
        if (!invitedWg) {
          console.log('WG nicht gefunden!');
          alert('Diese WG existiert nicht mehr oder der Link ist ungültig.');
          return;
        }

        console.log('WG gefunden:', invitedWg);

        // Prüfe, ob der Benutzer bereits Mitglied ist
        if (invitedWg.members.some((member: Member) => member.name === userName)) {
          console.log('Benutzer ist bereits Mitglied');
          setSelectedWg(invitedWg);
          setAccessibleWGs([invitedWg]);
          return;
        }

        console.log('Füge Benutzer zur WG hinzu');
        // Füge den Benutzer zur WG hinzu
        const updatedWG = {
          ...invitedWg,
          members: [...invitedWg.members, { name: userName, points: 0 }]
        };
        
        const updatedWGs = currentWgs.map((wg: WG) => 
          wg.id === invitedWg.id ? updatedWG : wg
        );
        
        console.log('Speichere aktualisierte WGs:', updatedWGs);
        await fetch('/api/wg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wgs: updatedWGs }),
        });
        
        setSelectedWg(updatedWG);
        setAccessibleWGs([updatedWG]);
        console.log('Erfolgreich zur WG beigetreten');
      } else {
        // Normaler Login ohne Einladung
        console.log('Normaler Login ohne Einladung');
        const userWGs = currentWgs.filter((wg: WG) => 
          wg.members.some((member: Member) => member.name === userName)
        );
        setAccessibleWGs(userWGs);
      }
    } catch (error) {
      console.error('Fehler beim Login:', error);
      alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedWg(null);
    setUserName('');
    setAccessibleWGs([]);
    localStorage.removeItem('userName');
    router.push('/');
  };

  // Speichere WGs auf dem Server
  const saveWGs = async (updatedWGs: WG[]) => {
    try {
      await fetch('/api/wg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedWGs),
      });
      await fetchWGs(); // Sofort nach dem Speichern neu laden
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWg && newTask.trim()) {
      const task: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: newTask,
        description: newTaskDescription,
        points: 10,
        createdBy: { name: userName, points: 0 },
        isCompleted: false
      };

      const updatedWG = {
        ...selectedWg,
        tasks: [...selectedWg.tasks, task]
      };

      const updatedWGs = wgs.map(wg => 
        wg.id === selectedWg.id ? updatedWG : wg
      );

      setWgs(updatedWGs);
      setSelectedWg(updatedWG);
      setNewTask('');
      setNewTaskDescription('');
      await saveWGs(updatedWGs);
    }
  };

  const handleCompleteTask = async (task: Task) => {
    if (selectedWg) {
      const updatedTask = {
        ...task,
        isCompleted: true,
        completedBy: { name: userName, points: 0 }
      };

      const updatedWG = {
        ...selectedWg,
        tasks: selectedWg.tasks.map(t => t.id === updatedTask.id ? updatedTask : t),
        members: selectedWg.members.map(member => 
          member.name === userName 
            ? { ...member, points: member.points + (updatedTask?.points || 0) }
            : member
        ),
        taskHistory: [
          ...(selectedWg.taskHistory || []),
          {
            taskId: updatedTask.id,
            taskTitle: updatedTask.title,
            points: updatedTask.points,
            completedBy: userName,
            completedAt: new Date().toISOString()
          }
        ]
      };

      const updatedWGs = wgs.map(wg => wg.id === selectedWg.id ? updatedWG : wg);
      setWgs(updatedWGs);
      setSelectedWg(updatedWG);
      await saveWGs(updatedWGs);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert('Link kopiert!');
      } else {
        // Fallback für Browser ohne Clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link kopiert!');
      }
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
      alert('Fehler beim Kopieren des Links');
    }
  };

  const handleBackToWGSelection = () => {
    setSelectedWg(null);
  };

  const handleJoinWG = async (wg: WG) => {
    if (!wg.members.some(member => member.name === userName)) {
      const updatedWG = {
        ...wg,
        members: [...wg.members, { name: userName, points: 0 }]
      };
      
      const wgs = await fetchWGs();
      const updatedWGs = wgs.map((w: WG) => w.id === wg.id ? updatedWG : w);
      
      await saveWGs(updatedWGs);
      setSelectedWg(updatedWG);
    } else {
      setSelectedWg(wg);
    }
  };

  if (!isLoggedIn) {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    const invitedWgId = searchParams.get('wgId');

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <h1 className="text-4xl font-bold text-center mb-8">WG Planner by Namanh</h1>
          {invitedWgId ? (
            invitedWg ? (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h2 className="text-xl font-semibold text-blue-800 mb-2">
                    Einladung zur WG "{invitedWg.name}"
                  </h2>
                  <p className="text-blue-600">
                    {invitedWg.members[0]?.name} hat dich eingeladen, dieser WG beizutreten. 
                    Gib deinen Namen ein, um Mitglied zu werden.
                  </p>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Aktuelle Mitglieder: {invitedWg.members.map(m => m.name).join(', ')}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">
                  Diese WG existiert nicht mehr oder der Link ist ungültig.
                </p>
              </div>
            )
          ) : (
            <p className="text-center text-gray-600 mb-6">
              Gib deinen Namen ein, um zu starten
            </p>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Dein Name
              </label>
              <input
                type="text"
                id="name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {invitedWg ? 'WG beitreten' : 'Starten'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">WG Planner by Namanh</h1>
        <div className="flex gap-4 items-center">
          <p className="text-lg">Willkommen, {userName}!</p>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
          >
            Ausloggen
          </button>
        </div>
      </div>

      {/* WG erstellen oder auswählen */}
      {!selectedWg && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">WG erstellen</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const wgName = (e.target as HTMLFormElement).wgName.value;
            const newWg: WG = {
              id: `wg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,  // Eindeutige, stabile ID
              name: wgName,
              members: [{ id: '1', name: userName, points: 0 }],
              tasks: [],
              taskHistory: []
            };
            const updatedWGs = [...wgs, newWg];
            setWgs(updatedWGs);
            setSelectedWg(newWg);
            setAccessibleWGs([...accessibleWGs, newWg]);
            saveWGs(updatedWGs);
          }} className="space-y-4">
            <div>
              <label htmlFor="wgName" className="block text-sm font-medium text-gray-700">
                WG-Name
              </label>
              <input
                type="text"
                id="wgName"
                name="wgName"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              WG erstellen
            </button>
          </form>

          {accessibleWGs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Deine WGs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accessibleWGs.map((wg) => (
                  <button
                    key={wg.id}
                    onClick={() => setSelectedWg(wg)}
                    className="p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors text-left"
                  >
                    <h3 className="font-medium text-lg">{wg.name}</h3>
                    <p className="text-sm text-gray-600">{wg.members.length} Mitglieder</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedWg && (
        <>
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToWGSelection}
                  className="bg-white/20 text-white py-2 px-4 rounded-md hover:bg-white/30 transition-colors"
                >
                  Zurück zur WG-Auswahl
                </button>
                <h2 className="text-3xl font-bold">WG: {selectedWg.name}</h2>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const wgId = selectedWg?.id;
                    if (wgId) {
                      router.push(`/wg/${wgId}/shopping`);
                    }
                  }}
                  className="bg-white/20 text-white py-2 px-4 rounded-md hover:bg-white/30 transition-colors flex items-center gap-2"
                >
                  <span>🛒</span>
                  <span>Einkaufsliste</span>
                </button>
                <button
                  onClick={() => setShowInviteLink(!showInviteLink)}
                  className="bg-white/20 text-white py-2 px-4 rounded-md hover:bg-white/30 transition-colors"
                >
                  Mitglieder einladen
                </button>
                {isWGCreator && (
                  <button
                    onClick={() => {
                      if (window.confirm('Möchtest du diese WG wirklich löschen? Dies kann nicht rückgängig gemacht werden.')) {
                        const updatedWGs = wgs.filter(wg => wg.id !== selectedWg.id);
                        saveWGs(updatedWGs);
                        setWgs(updatedWGs);
                        setSelectedWg(null);
                      }
                    }}
                    className="bg-red-500/50 text-white py-2 px-4 rounded-md hover:bg-red-500/70 transition-colors"
                  >
                    WG löschen
                  </button>
                )}
              </div>
            </div>
            {showInviteLink && (
              <div className="mt-4 p-4 bg-white/10 rounded-lg">
                <p className="text-sm text-white/90 mb-2">Teile diesen Link mit deinen WG-Mitgliedern:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getInviteLink()}
                    className="flex-1 p-2 bg-white/5 border border-white/20 rounded-md text-sm text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(getInviteLink())}
                    className="px-4 py-2 bg-white/20 text-white rounded-md hover:bg-white/30"
                  >
                    Kopieren
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Linke Spalte: Mitglieder und Bestenliste */}
            <div className="space-y-8">
              {/* Mitglieder-Karten */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Mitglieder</h2>
                <div className="space-y-4">
                  {[...selectedWg.members]
                    .sort((a, b) => b.points - a.points)
                    .map((member, index) => (
                      <div 
                        key={member.id} 
                        className={`p-4 rounded-lg ${
                          index === 0 ? 'bg-yellow-100' : 
                          index === 1 ? 'bg-gray-100' : 
                          index === 2 ? 'bg-orange-100' : 
                          'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                            <div>
                              <h3 className="font-bold text-gray-800">{member.name}</h3>
                              <p className="text-sm text-gray-600">Level {Math.floor(member.points / 100) + 1}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-500">{member.points}</p>
                            <p className="text-xs text-gray-500">Punkte</p>
                          </div>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${(member.points % 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Mittlere Spalte: Aufgaben */}
            <div className="space-y-8">
              {/* Neue Aufgabe erstellen */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Neue Quest</h2>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Questname
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Questbeschreibung
                    </label>
                    <textarea
                      id="description"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label htmlFor="points" className="block text-sm font-medium text-gray-700">
                      Belohnung (Punkte)
                    </label>
                    <input
                      type="number"
                      id="points"
                      value={10}
                      onChange={(e) => setNewTask(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Quest erstellen
                  </button>
                </form>
              </div>

              {/* Offene Aufgaben */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Offene Quests</h2>
                <div className="space-y-4">
                  {selectedWg.tasks
                    .filter((task) => !task.isCompleted)
                    .map((task) => (
                      <div key={task.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{task.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Quest von: {task.createdBy?.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <span className="block text-2xl font-bold text-green-500">+{task.points}</span>
                              <span className="text-xs text-gray-500">Punkte</span>
                            </div>
                            <button
                              onClick={() => handleCompleteTask(task)}
                              className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
                            >
                              Abschließen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Rechte Spalte: Aktivitäten */}
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Aktivitäten</h2>
                <div className="space-y-4">
                  {(selectedWg.taskHistory || []).reverse().map((history, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-500 text-lg">✓</span>
                        </div>
                        <div>
                          <p className="text-gray-800">
                            <span className="font-bold">{history.completedBy}</span> hat{' '}
                            <span className="font-medium">{history.taskTitle}</span> abgeschlossen
                          </p>
                          <div className="flex justify-between mt-1">
                            <span className="text-sm text-gray-500">
                              {new Date(history.completedAt).toLocaleString('de-DE')}
                            </span>
                            <span className="text-sm font-medium text-green-500">+{history.points} Punkte</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
