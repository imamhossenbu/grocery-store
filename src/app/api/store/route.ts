import { NextRequest, NextResponse } from 'next/server';
import { readCloudStore, writeCloudStore } from '@/lib/supabase-db';
import { INITIAL_STORE_DATA } from '@/lib/seed-data';
import { Order } from '@/types/store';

export async function GET() {
  try {
    const db = await readCloudStore();
    return NextResponse.json(db, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to load store data', details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const db = await readCloudStore();

    if (action === 'PLACE_ORDER') {
      const orderInput = payload as Omit<Order, 'id' | 'createdAt' | 'status'>;
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const newOrder: Order = {
        ...orderInput,
        id: `FB-${randomNum}`,
        createdAt: new Date().toISOString(),
        status: 'Pending',
      };

      // Deduct stock for ordered items
      const updatedProducts = db.products.map((prod) => {
        const line = newOrder.items.find((item) => item.productId === prod.id);
        if (line) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - line.qty),
          };
        }
        return prod;
      });

      const updatedDb = await writeCloudStore({
        ...db,
        products: updatedProducts,
        orders: [newOrder, ...db.orders],
      });

      return NextResponse.json({
        success: true,
        order: newOrder,
        db: updatedDb,
      });
    }

    if (action === 'RESET_DEMO') {
      const resetDb = await writeCloudStore(INITIAL_STORE_DATA);
      return NextResponse.json({ success: true, db: resetDb });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to process store action', details: String(err) },
      { status: 500 }
    );
  }
}

