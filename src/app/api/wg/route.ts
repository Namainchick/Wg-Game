import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Initialisiere die Datenbank, falls sie nicht existiert
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ wgs: [] }));
}

// Hilfsfunktion zum Lesen der Datenbank
function readDB() {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

// Hilfsfunktion zum Schreiben in die Datenbank
function writeDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// WG erstellen
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = readDB();
    
    // Stelle sicher, dass wir die WGs korrekt speichern
    if (Array.isArray(body)) {
      data.wgs = body;
    } else if (Array.isArray(body.wgs)) {
      data.wgs = body.wgs;
    } else {
      throw new Error('Ungültiges Datenformat');
    }
    
    writeDB(data);
    return NextResponse.json({ wgs: data.wgs });
  } catch (error) {
    console.error('Fehler beim Speichern:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern der WGs' }, { status: 500 });
  }
}

// WGs abrufen
export async function GET() {
  try {
    const data = readDB();
    return NextResponse.json({ wgs: data.wgs });
  } catch (error) {
    console.error('Fehler beim Laden:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der WGs' }, { status: 500 });
  }
} 