import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Aufgabe erstellen
export async function POST(req: Request) {
  try {
    const { title, description, points, wgId, createdById } = await req.json();

    const task = await prisma.task.create({
      data: {
        title,
        description,
        points,
        wg: {
          connect: { id: wgId }
        },
        createdBy: {
          connect: { id: createdById }
        }
      },
      include: {
        createdBy: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { error: 'Aufgabe konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}

// Aufgabe als erledigt markieren
export async function PATCH(req: Request) {
  try {
    const { taskId, completedById } = await req.json();

    // Aufgabe aktualisieren
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        isCompleted: true,
        completedBy: {
          connect: { id: completedById }
        }
      }
    });

    // Punkte dem Benutzer gutschreiben
    await prisma.user.update({
      where: { id: completedById },
      data: {
        points: {
          increment: task.points
        }
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Task completion error:', error);
    return NextResponse.json(
      { error: 'Aufgabe konnte nicht als erledigt markiert werden' },
      { status: 500 }
    );
  }
} 