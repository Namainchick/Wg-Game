'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  addedBy: string;
  purchasedBy?: string;
  isPurchased: boolean;
}

interface WG {
  id: string;
  name: string;
  members: Array<{ name: string }>;
  shoppingList?: ShoppingItem[];
}

export default function ShoppingList() {
  const params = useParams();
  const router = useRouter();
  const [wg, setWg] = useState<WG | null>(null);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: 'Stück' });
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    } else {
      // Wenn kein Benutzer eingeloggt ist, zurück zur Hauptseite
      router.push('/');
    }
  }, []);

  const fetchWG = async () => {
    try {
      const response = await fetch('/api/wg');
      const data = await response.json();
      if (!data.wgs) {
        throw new Error('Keine WGs gefunden');
      }

      const currentWG = data.wgs.find((w: WG) => w.id === params.id);
      if (currentWG) {
        if (!currentWG.shoppingList) {
          currentWG.shoppingList = [];
        }
        setWg(currentWG);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der WG:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchWG();
      const interval = setInterval(fetchWG, 2000);
      return () => clearInterval(interval);
    }
  }, [params.id]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wg || !newItem.name.trim() || !userName) return;

    const item: ShoppingItem = {
      id: Math.random().toString(),
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      addedBy: userName,
      isPurchased: false
    };

    const updatedWG = {
      ...wg,
      shoppingList: [...(wg.shoppingList || []), item]
    };

    try {
      const response = await fetch('/api/wg');
      const data = await response.json();
      if (!data.wgs) {
        throw new Error('Keine WGs gefunden');
      }

      const updatedWGs = data.wgs.map((w: WG) => w.id === wg.id ? updatedWG : w);

      await fetch('/api/wg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wgs: updatedWGs }),
      });

      setWg(updatedWG);
      setNewItem({ name: '', quantity: 1, unit: 'Stück' });
      await fetchWG();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    if (!wg || !userName) return;

    const updatedShoppingList = wg.shoppingList?.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          isPurchased: !item.isPurchased,
          purchasedBy: !item.isPurchased ? userName : undefined
        };
      }
      return item;
    });

    const updatedWG = {
      ...wg,
      shoppingList: updatedShoppingList
    };

    try {
      const response = await fetch('/api/wg');
      const data = await response.json();
      if (!data.wgs) {
        throw new Error('Keine WGs gefunden');
      }

      const updatedWGs = data.wgs.map((w: WG) => w.id === wg.id ? updatedWG : w);

      await fetch('/api/wg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wgs: updatedWGs }),
      });

      setWg(updatedWG);
      await fetchWG();
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!wg) return;

    const updatedShoppingList = wg.shoppingList?.filter(item => item.id !== itemId);
    const updatedWG = {
      ...wg,
      shoppingList: updatedShoppingList
    };

    try {
      const response = await fetch('/api/wg');
      const data = await response.json();
      if (!data.wgs) {
        throw new Error('Keine WGs gefunden');
      }

      const updatedWGs = data.wgs.map((w: WG) => w.id === wg.id ? updatedWG : w);

      await fetch('/api/wg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wgs: updatedWGs }),
      });

      setWg(updatedWG);
      await fetchWG();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const handleBack = () => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      router.push(`/?userName=${encodeURIComponent(storedName)}`);
    } else {
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!wg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">WG nicht gefunden</p>
          <button
            onClick={handleBack}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Zurück zur Hauptseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Einkaufsliste - {wg.name}</h1>
        <button
          onClick={handleBack}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Zurück
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formular für neue Einträge */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Neuen Artikel hinzufügen</h2>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Artikel
              </label>
              <input
                type="text"
                id="name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Menge
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                  Einheit
                </label>
                <select
                  id="unit"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option>Stück</option>
                  <option>kg</option>
                  <option>g</option>
                  <option>l</option>
                  <option>ml</option>
                  <option>Packung</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Hinzufügen
            </button>
          </form>
        </div>

        {/* Liste der Einkäufe */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Einkaufsliste</h2>
          <div className="space-y-4">
            {wg.shoppingList && wg.shoppingList.length > 0 ? (
              wg.shoppingList.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border ${
                    item.isPurchased ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium ${item.isPurchased ? 'line-through text-gray-500' : ''}`}>
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit}
                      </p>
                      <p className="text-xs text-gray-500">
                        Hinzugefügt von: {item.addedBy}
                        {item.purchasedBy && ` • Gekauft von: ${item.purchasedBy}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleItem(item.id)}
                        className={`p-2 rounded-md ${
                          item.isPurchased
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {item.isPurchased ? '↩' : '✓'}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">Keine Artikel in der Einkaufsliste</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 