import { initDatabase, getDb } from '../core/database';
import { authService } from '../apps/auth/service';
import { menuService } from '../apps/menu/service';
import { orderService } from '../apps/orders/service';
import { kitchenService } from '../apps/kitchen/service';
import { tableService } from '../apps/tables/service';
import { reservationService } from '../apps/reservations/service';
import { deliveryService } from '../apps/delivery/service';
import { recipeService } from '../apps/recipes/service';
import { inventoryService } from '../apps/inventory/service';

async function seedDatabase() {
  console.log('\n======================================================');
  console.log('🌱  RIFT RESTAURANT ERP - FULL DATABASE SEED SCRIPT  🌱');
  console.log('======================================================\n');

  // 1. Initialize Database Connection
  await initDatabase();
  const db = getDb();
  console.log(`[Database] Connected to ${db.type.toUpperCase()} database engine.`);

  // 2. Ensure all Schemas are initialized
  console.log('[Schema] Initializing database schemas across all 10 apps...');
  await authService.initDatabaseSchema();
  await menuService.initDatabaseSchema();
  await orderService.initDatabaseSchema();
  await kitchenService.initDatabaseSchema();
  await tableService.initDatabaseSchema();
  await reservationService.initDatabaseSchema();
  await deliveryService.initDatabaseSchema();
  await recipeService.initDatabaseSchema();
  await inventoryService.initDatabaseSchema();
  console.log('[Schema] All schemas initialized.');

  console.log('\n[Cleaner] Purging existing data to avoid duplicates...');
  const tablesToClear = [
    'order_status_history',
    'orders',
    'kitchen_tickets',
    'dining_tables',
    'waitlist_entries',
    'reservations',
    'delivery_dispatches',
    'delivery_drivers',
    'delivery_zones',
    'recipes',
    'inventory_batches',
    'inventory_items',
    'menu_items',
    'users',
  ];

  for (const tbl of tablesToClear) {
    try {
      await db.execute(`DELETE FROM ${tbl};`);
    } catch (e: any) {
      // Table might not exist yet or empty
    }
  }

  // 3. Re-seed Users
  console.log('[Seed] 1/9 Populating 8 Staff Personas (auth)...');
  await authService.initDatabaseSchema();

  // 4. Re-seed Menu Catalog
  console.log('[Seed] 2/9 Populating Menu Catalog with Starters, Mains, Desserts, Beverages (menu)...');
  const menuItems = [
    {
      name: 'Burrata Caprese Salad',
      category: 'Small plates',
      price: 425,
      description: 'Heirloom tomatoes, fresh burrata pugliese, basil pesto, balsamic reduction',
      allergens: ['Dairy'],
      availability: 'Available' as const,
      modifierGroups: [
        {
          id: 'mod_portion',
          name: 'Portion Size',
          minSelection: 1,
          maxSelection: 1,
          options: [
            { id: 'opt_reg', name: 'Regular', priceDelta: 0 },
            { id: 'opt_large', name: 'Large Sharing', priceDelta: 150 },
          ],
        },
      ],
    },
    {
      name: 'Truffle Mushroom Risotto',
      category: 'Mains',
      price: 750,
      description: 'Carnaroli rice, porcini mushrooms, black truffle oil, 24m parmigiano',
      allergens: ['Dairy'],
      availability: 'Available' as const,
    },
    {
      name: 'Charred Wagyu Ribeye Steak',
      category: 'Mains',
      price: 1450,
      description: 'A5 Miyazaki Wagyu ribeye, smoked bone marrow butter, chimichurri',
      allergens: [],
      availability: 'Available' as const,
      modifierGroups: [
        {
          id: 'mod_doneness',
          name: 'Meat Doneness',
          minSelection: 1,
          maxSelection: 1,
          options: [
            { id: 'opt_rare', name: 'Medium Rare (Chef Rec)', priceDelta: 0 },
            { id: 'opt_med', name: 'Medium Well', priceDelta: 0 },
          ],
        },
      ],
    },
    {
      name: 'Wood-Fired Margherita Pizza',
      category: 'Mains',
      price: 520,
      description: 'San Marzano DOP tomato sauce, fior di latte mozzarella, fresh basil',
      allergens: ['Dairy', 'Gluten'],
      availability: 'Available' as const,
    },
    {
      name: 'Hand-Rolled Fettuccine Alfredo',
      category: 'Mains',
      price: 580,
      description: 'Fresh artisanal fettuccine, parmigiano emulsion, cracked black pepper',
      allergens: ['Dairy', 'Gluten'],
      availability: 'Available' as const,
    },
    {
      name: 'Classic Italian Tiramisu',
      category: 'Desserts',
      price: 350,
      description: 'Savoiardi ladyfingers, illy espresso, mascarpone zabaglione, Valrhona cocoa',
      allergens: ['Dairy', 'Gluten', 'Eggs'],
      availability: 'Available' as const,
    },
    {
      name: 'Dark Chocolate Fondant',
      category: 'Desserts',
      price: 380,
      description: 'Molten center dark chocolate lava cake with Madagascar vanilla bean gelato',
      allergens: ['Dairy', 'Gluten'],
      availability: 'Available' as const,
    },
    {
      name: 'Smoked Bourbon Old Fashioned',
      category: 'Beverages',
      price: 490,
      description: 'Woodford Reserve bourbon, angostura bitters, orange peel, applewood smoke',
      allergens: [],
      availability: 'Available' as const,
    },
    {
      name: 'Signature Espresso Martini',
      category: 'Beverages',
      price: 450,
      description: 'Ketel One vodka, fresh illy espresso, Kahlua, vanilla bean foam',
      allergens: [],
      availability: 'Available' as const,
    },
    {
      name: 'Fresh Basil Limeade',
      category: 'Beverages',
      price: 220,
      description: 'Cold-pressed lime juice, crushed fresh basil, organic raw cane sugar, sparkling soda',
      allergens: [],
      availability: 'Available' as const,
    },
  ];

  for (const m of menuItems) {
    await menuService.create(m);
  }

  // 5. Re-seed Tables & Waitlist
  console.log('[Seed] 3/9 Populating Dining Floor & Waitlist (tables)...');
  const sampleTables = [
    { name: 'Table 01', zone: 'Main Room', capacity: 4, status: 'Occupied', currentTicket: 'GH-1045', guestCount: 3, server: 'Ravi', seatedAt: new Date(Date.now() - 35 * 60000).toISOString() },
    { name: 'Table 02', zone: 'Main Room', capacity: 2, status: 'Billed', currentTicket: 'GH-1049', guestCount: 2, server: 'Ravi', seatedAt: new Date(Date.now() - 55 * 60000).toISOString() },
    { name: 'Table 03', zone: 'Main Room', capacity: 4, status: 'Available', currentTicket: null, guestCount: null, server: null, seatedAt: null },
    { name: 'Table 04', zone: 'Main Room', capacity: 6, status: 'Occupied', currentTicket: 'GH-1048', guestCount: 4, server: 'Ravi', seatedAt: new Date(Date.now() - 18 * 60000).toISOString() },
    { name: 'Patio 01', zone: 'Patio', capacity: 4, status: 'Occupied', currentTicket: 'GH-1052', guestCount: 2, server: 'Ravi', seatedAt: new Date(Date.now() - 42 * 60000).toISOString() },
    { name: 'Patio 02', zone: 'Patio', capacity: 4, status: 'Reserved', currentTicket: null, guestCount: 4, server: null, seatedAt: null },
    { name: 'Patio 03', zone: 'Patio', capacity: 2, status: 'Needs Cleaning', currentTicket: null, guestCount: null, server: null, seatedAt: null },
    { name: 'Patio 04', zone: 'Patio', capacity: 6, status: 'Available', currentTicket: null, guestCount: null, server: null, seatedAt: null },
    { name: 'Bar 01', zone: 'Counter', capacity: 1, status: 'Occupied', currentTicket: 'GH-1050', guestCount: 1, server: 'Samira', seatedAt: new Date(Date.now() - 12 * 60000).toISOString() },
    { name: 'Bar 02', zone: 'Counter', capacity: 1, status: 'Available', currentTicket: null, guestCount: null, server: null, seatedAt: null },
    { name: 'VIP Suite A', zone: 'Private Dining', capacity: 10, status: 'Available', currentTicket: null, guestCount: null, server: null, seatedAt: null },
    { name: 'VIP Suite B', zone: 'Private Dining', capacity: 12, status: 'Reserved', currentTicket: null, guestCount: 10, server: null, seatedAt: null },
  ];

  for (const t of sampleTables) {
    const id = `tbl_${t.name.toLowerCase().replace(/\s+/g, '_')}`;
    await db.execute(
      `INSERT INTO dining_tables (id, name, zone, capacity, status, current_ticket_id, guest_count, server_name, seated_at, branch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, t.name, t.zone, t.capacity, t.status, t.currentTicket, t.guestCount, t.server, t.seatedAt, 'branch-south-01']
    );
  }

  const waitlist = [
    { guestName: 'Ananya Sharma', partySize: 2, phone: '98111 22334', zonePreference: 'Patio' as const, estWaitMinutes: 15, notes: 'Prefers outdoor sea breeze seating' },
    { guestName: 'Vikram Patel', partySize: 5, phone: '98222 33445', zonePreference: 'Main Room' as const, estWaitMinutes: 25, notes: 'Celebrating graduation' },
    { guestName: 'Priya Nair', partySize: 4, phone: '98333 44556', zonePreference: 'Main Room' as const, estWaitMinutes: 10, notes: 'High chair required' },
  ];
  for (const w of waitlist) {
    await tableService.addToWaitlist(w);
  }

  // 6. Re-seed Orders
  console.log('[Seed] 4/9 Populating Order Lifecycle Registry (orders)...');
  const sampleOrders = [
    {
      ticket: 'GH-1045',
      type: 'Dine-in' as const,
      tableOrGuest: 'Table 01',
      items: [
        { id: 'i1', name: 'Burrata Caprese Salad', quantity: 1, unitPrice: 425 },
        { id: 'i2', name: 'Wood-Fired Margherita Pizza', quantity: 1, unitPrice: 520 },
        { id: 'i3', name: 'Fresh Basil Limeade', quantity: 2, unitPrice: 220 },
      ],
      subtotal: 1385,
      gstAmount: 69.25,
      total: 1454.25,
      payment: 'Card' as const,
      status: 'Served' as const,
    },
    {
      ticket: 'GH-1046',
      type: 'Takeaway' as const,
      tableOrGuest: 'Customer Pickup - Rahul M.',
      items: [
        { id: 'i4', name: 'Hand-Rolled Fettuccine Alfredo', quantity: 1, unitPrice: 580 },
        { id: 'i5', name: 'Classic Italian Tiramisu', quantity: 1, unitPrice: 350 },
      ],
      subtotal: 930,
      gstAmount: 46.50,
      total: 976.50,
      payment: 'UPI' as const,
      status: 'Completed' as const,
    },
    {
      ticket: 'GH-1047',
      type: 'Delivery' as const,
      tableOrGuest: 'Maya S. (Koramangala)',
      items: [
        { id: 'i2', name: 'Wood-Fired Margherita Pizza', quantity: 2, unitPrice: 520 },
        { id: 'i5', name: 'Classic Italian Tiramisu', quantity: 1, unitPrice: 350 },
      ],
      subtotal: 1390,
      gstAmount: 69.50,
      total: 1459.50,
      payment: 'Online' as const,
      status: 'Dispatched' as const,
    },
    {
      ticket: 'GH-1048',
      type: 'Dine-in' as const,
      tableOrGuest: 'Table 04',
      items: [
        { id: 'i1', name: 'Burrata Caprese Salad', quantity: 1, unitPrice: 425, notes: 'Balsamic on side' },
        { id: 'i6', name: 'Truffle Mushroom Risotto', quantity: 2, unitPrice: 750, notes: 'Extra parmesan' },
      ],
      subtotal: 1925,
      gstAmount: 96.25,
      total: 2021.25,
      payment: 'Unpaid' as const,
      status: 'Preparing' as const,
    },
    {
      ticket: 'GH-1049',
      type: 'Dine-in' as const,
      tableOrGuest: 'Table 02',
      items: [
        { id: 'i7', name: 'Charred Wagyu Ribeye Steak', quantity: 1, unitPrice: 1450, notes: 'Medium Rare' },
        { id: 'i8', name: 'Smoked Bourbon Old Fashioned', quantity: 1, unitPrice: 490 },
      ],
      subtotal: 1940,
      gstAmount: 97.00,
      total: 2037.00,
      payment: 'Unpaid' as const,
      status: 'Ready' as const,
    },
    {
      ticket: 'GH-1050',
      type: 'Dine-in' as const,
      tableOrGuest: 'Bar 01',
      items: [
        { id: 'i8', name: 'Smoked Bourbon Old Fashioned', quantity: 2, unitPrice: 490, notes: 'NO NUT BITTERS' },
      ],
      subtotal: 980,
      gstAmount: 49.00,
      total: 1029.00,
      payment: 'Unpaid' as const,
      status: 'Accepted' as const,
    },
    {
      ticket: 'GH-1052',
      type: 'Dine-in' as const,
      tableOrGuest: 'Patio 01',
      items: [
        { id: 'i5', name: 'Classic Italian Tiramisu', quantity: 2, unitPrice: 350 },
        { id: 'i9', name: 'Dark Chocolate Fondant', quantity: 1, unitPrice: 380 },
      ],
      subtotal: 1080,
      gstAmount: 54.00,
      total: 1134.00,
      payment: 'Unpaid' as const,
      status: 'Preparing' as const,
    },
  ];

  for (const o of sampleOrders) {
    const id = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const itemsJson = JSON.stringify(o.items);
    const itemsSummary = o.items.map(it => `${it.name} ×${it.quantity}`).join(', ');
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO orders (id, ticket, type, table_or_guest, items_json, items_summary, subtotal, gst_amount, total, payment, status, branch_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, o.ticket, o.type, o.tableOrGuest, itemsJson, itemsSummary, o.subtotal, o.gstAmount, o.total, o.payment, o.status, 'branch-south-01', now, now]
    );

    const histId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.execute(
      `INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by, reason, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [histId, id, 'Created', o.status, 'Staff', 'Initial seeded order', now]
    );
  }

  // 7. Re-seed Kitchen Display Tickets
  console.log('[Seed] 5/9 Populating Kitchen Display System Stations (kitchen)...');
  const kitchenTickets = [
    {
      ticketNumber: 'GH-1048',
      tableNumber: 'Table 04',
      station: 'Hot line' as const,
      priority: 'Normal' as const,
      status: 'Preparing' as const,
      receivedAt: new Date(Date.now() - 7 * 60000).toISOString(),
      items: [
        { id: 'kit_1', name: 'Truffle Mushroom Risotto', quantity: 2, station: 'Hot line' as const, notes: 'Extra parmesan', isBumped: false },
        { id: 'kit_2', name: 'Burrata Caprese Salad', quantity: 1, station: 'Cold prep' as const, notes: 'Balsamic on side', isBumped: true, bumpedAt: new Date().toISOString() },
      ],
    },
    {
      ticketNumber: 'GH-1049',
      tableNumber: 'Table 02',
      station: 'Hot line' as const,
      priority: 'Rush' as const,
      status: 'Preparing' as const,
      receivedAt: new Date(Date.now() - 19 * 60000).toISOString(), // >15m elapsed -> triggers DELAYED badge!
      items: [
        { id: 'kit_3', name: 'Wagyu Ribeye Steak (Medium Rare)', quantity: 1, station: 'Hot line' as const, notes: 'VIP Table', isBumped: false },
        { id: 'kit_4', name: 'Truffle Jus Glaze', quantity: 1, station: 'Hot line' as const, notes: '', isBumped: false },
      ],
    },
    {
      ticketNumber: 'GH-1050',
      tableNumber: 'Bar 01',
      station: 'Bar' as const,
      priority: 'Allergy' as const,
      status: 'New' as const,
      receivedAt: new Date(Date.now() - 3 * 60000).toISOString(),
      items: [
        { id: 'kit_5', name: 'Smoked Bourbon Old Fashioned', quantity: 2, station: 'Bar' as const, notes: 'NO NUT BITTERS (Nut Allergy)', isBumped: false },
      ],
    },
    {
      ticketNumber: 'GH-1052',
      tableNumber: 'Patio 01',
      station: 'Dessert' as const,
      priority: 'Normal' as const,
      status: 'Preparing' as const,
      receivedAt: new Date(Date.now() - 5 * 60000).toISOString(),
      items: [
        { id: 'kit_6', name: 'Classic Italian Tiramisu', quantity: 2, station: 'Dessert' as const, notes: '', isBumped: false },
        { id: 'kit_7', name: 'Dark Chocolate Fondant', quantity: 1, station: 'Dessert' as const, notes: 'With vanilla gelato', isBumped: false },
      ],
    },
  ];

  for (const kt of kitchenTickets) {
    const id = `kds_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.execute(
      `INSERT INTO kitchen_tickets (id, ticket_number, table_number, station, items_json, priority, status, branch_id, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, kt.ticketNumber, kt.tableNumber, kt.station, JSON.stringify(kt.items), kt.priority, kt.status, 'branch-south-01', kt.receivedAt]
    );
  }

  // 8. Re-seed Reservations
  console.log('[Seed] 6/9 Populating Reservations & Bookings (reservations)...');
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const sampleReservations = [
    {
      guestName: 'Kavita Singhania',
      phone: '98200 45678',
      email: 'kavita.s@example.com',
      partySize: 4,
      reservationDate: today,
      reservationTime: '19:30',
      tablePreference: 'Patio 02',
      occasion: 'Anniversary Dinner',
      specialRequests: 'Candlelight setup and champagne flutes',
      depositAmount: 1000,
      depositStatus: 'Paid' as const,
    },
    {
      guestName: 'Rohan Mehra',
      phone: '98401 22334',
      email: 'rohan.m@example.com',
      partySize: 6,
      reservationDate: today,
      reservationTime: '20:15',
      tablePreference: 'Main Room',
      occasion: 'Birthday Celebration',
      specialRequests: 'Pre-ordered chocolate fondant with candle',
      depositAmount: 500,
      depositStatus: 'Paid' as const,
    },
    {
      guestName: 'Dr. Siddharth Verma',
      phone: '98199 88776',
      email: 'sid.verma@example.com',
      partySize: 2,
      reservationDate: today,
      reservationTime: '21:00',
      tablePreference: 'Bar 01',
      occasion: 'Casual Dining',
      specialRequests: 'Close to the bar',
      depositAmount: 0,
      depositStatus: 'None' as const,
    },
    {
      guestName: 'Sunita Kapoor',
      phone: '98205 66778',
      email: 'sunita.k@example.com',
      partySize: 10,
      reservationDate: tomorrow,
      reservationTime: '20:00',
      tablePreference: 'VIP Suite A',
      occasion: 'Corporate VIP Dinner',
      specialRequests: 'Set 5-course tasting menu with wine pairings',
      depositAmount: 5000,
      depositStatus: 'Paid' as const,
    },
  ];

  for (const r of sampleReservations) {
    await reservationService.create(r);
  }

  // 9. Re-seed Delivery Fleet & Dispatches
  console.log('[Seed] 7/9 Populating Delivery Fleet & Dispatches (delivery)...');
  const drivers = [
    { id: 'drv_1', name: 'Raju Kumar', phone: '98700 11223', vehicle: 'Scooter', status: 'On Delivery', active: 1 },
    { id: 'drv_2', name: 'Sunil Verma', phone: '98700 44556', vehicle: 'Bike', status: 'Available', active: 0 },
    { id: 'drv_3', name: 'Deepak Rao', phone: '98700 77889', vehicle: 'Bike', status: 'Available', active: 0 },
    { id: 'drv_4', name: 'Amit Singh', phone: '98700 99001', vehicle: 'Car', status: 'Off Duty', active: 0 },
  ];
  for (const d of drivers) {
    await db.execute(
      `INSERT INTO delivery_drivers (id, name, phone, vehicle_type, status, active_deliveries) VALUES (?, ?, ?, ?, ?, ?);`,
      [d.id, d.name, d.phone, d.vehicle, d.status, d.active]
    );
  }

  const zones = [
    { id: 'zone_1', name: 'Koramangala (0-3 km)', radius: 3, fee: 30, min: 250, est: 25 },
    { id: 'zone_2', name: 'Indiranagar (3-6 km)', radius: 6, fee: 50, min: 400, est: 35 },
    { id: 'zone_3', name: 'HSR Layout (6-10 km)', radius: 10, fee: 75, min: 500, est: 45 },
  ];
  for (const z of zones) {
    await db.execute(
      `INSERT INTO delivery_zones (id, name, radius_km, delivery_fee, min_order_amount, est_minutes) VALUES (?, ?, ?, ?, ?, ?);`,
      [z.id, z.name, z.radius, z.fee, z.min, z.est]
    );
  }

  const now = Date.now();
  const dispatches = [
    {
      orderTicket: 'GH-1047',
      customerName: 'Maya S.',
      phone: '98765 43210',
      address: 'Flat 402, Green Palms, 4th Cross, Koramangala',
      zone: 'Koramangala (0-3 km)',
      driverId: 'drv_1',
      driverName: 'Raju Kumar',
      status: 'Out for Delivery',
      orderTotal: 1459.50,
      promisedTime: new Date(now + 14 * 60000).toISOString(),
    },
    {
      orderTicket: 'GH-1051',
      customerName: 'Arjun Das',
      phone: '98901 23456',
      address: 'House #12, 100ft Road, Indiranagar',
      zone: 'Indiranagar (3-6 km)',
      driverId: null,
      driverName: null,
      status: 'Queued',
      orderTotal: 980.00,
      promisedTime: new Date(now + 35 * 60000).toISOString(),
    },
  ];
  for (const disp of dispatches) {
    const id = `dsp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.execute(
      `INSERT INTO delivery_dispatches (id, order_ticket, customer_name, phone, address, zone, order_total, driver_id, driver_name, status, promised_time, branch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, disp.orderTicket, disp.customerName, disp.phone, disp.address, disp.zone, disp.orderTotal, disp.driverId, disp.driverName, disp.status, disp.promisedTime, 'branch-south-01']
    );
  }

  // 10. Re-seed Recipes & Bill of Materials
  console.log('[Seed] 8/9 Populating Recipes & Bill of Materials (recipes)...');
  const recipes = [
    {
      dishName: 'Truffle Mushroom Risotto',
      category: 'Mains',
      sellingPrice: 750,
      yieldPortions: 1,
      preparationMinutes: 18,
      ingredients: [
        { name: 'Carnaroli Risotto Rice', quantity: 120, unit: 'g', costPerUnit: 0.35 },
        { name: 'Porcini Mushrooms (Fresh)', quantity: 80, unit: 'g', costPerUnit: 0.90 },
        { name: 'White Truffle Oil', quantity: 10, unit: 'ml', costPerUnit: 4.50 },
        { name: 'Parmigiano-Reggiano 24M', quantity: 30, unit: 'g', costPerUnit: 1.20 },
        { name: 'Cultured French Butter', quantity: 25, unit: 'g', costPerUnit: 0.60 },
      ],
    },
    {
      dishName: 'Burrata Caprese Salad',
      category: 'Small plates',
      sellingPrice: 425,
      yieldPortions: 1,
      preparationMinutes: 8,
      ingredients: [
        { name: 'Fresh Burrata Pugliese Ball', quantity: 1, unit: 'pcs', costPerUnit: 85.00 },
        { name: 'Heirloom Vine Tomatoes', quantity: 150, unit: 'g', costPerUnit: 0.18 },
        { name: 'Cold Pressed EVOO', quantity: 20, unit: 'ml', costPerUnit: 0.95 },
        { name: 'Organic Fresh Basil', quantity: 15, unit: 'g', costPerUnit: 0.40 },
      ],
    },
    {
      dishName: 'Charred Wagyu Ribeye Steak',
      category: 'Mains',
      sellingPrice: 1450,
      yieldPortions: 1,
      preparationMinutes: 20,
      ingredients: [
        { name: 'Miyazaki A5 Wagyu Ribeye', quantity: 280, unit: 'g', costPerUnit: 1.25 },
        { name: 'Smoked Bone Marrow Butter', quantity: 40, unit: 'g', costPerUnit: 0.75 },
        { name: 'Fresh Rosemary & Thyme', quantity: 10, unit: 'g', costPerUnit: 0.50 },
      ],
    },
    {
      dishName: 'Classic Italian Tiramisu',
      category: 'Desserts',
      sellingPrice: 350,
      yieldPortions: 1,
      preparationMinutes: 12,
      ingredients: [
        { name: 'Italian Mascarpone Cheese', quantity: 90, unit: 'g', costPerUnit: 0.55 },
        { name: 'Savoiardi Ladyfinger Biscuits', quantity: 40, unit: 'g', costPerUnit: 0.40 },
        { name: 'Illy Espresso Shot', quantity: 40, unit: 'ml', costPerUnit: 0.35 },
        { name: 'Valrhona Pure Cocoa Powder', quantity: 10, unit: 'g', costPerUnit: 0.90 },
      ],
    },
  ];

  for (const r of recipes) {
    await recipeService.create(r);
  }

  // 11. Re-seed Inventory & Batches
  console.log('[Seed] 9/9 Populating Inventory Stock & Expiration Batches (inventory)...');
  const dToday = new Date();
  const expSoon4d = new Date(dToday.getTime() + 4 * 86400000).toISOString().split('T')[0];
  const expSoon2d = new Date(dToday.getTime() + 2 * 86400000).toISOString().split('T')[0];
  const expSafe = new Date(dToday.getTime() + 90 * 86400000).toISOString().split('T')[0];

  const inventoryItems = [
    {
      name: 'Carnaroli Risotto Rice',
      sku: 'RCE-890104',
      category: 'Grains & Pasta',
      location: 'Dry store' as const,
      currentStock: 24.5,
      unit: 'kg',
      reorderLevel: 10.0,
      unitCost: 350.0,
      initialBatchNumber: 'LOT-RCE-01',
      expirationDate: expSafe,
    },
    {
      name: 'Fresh Burrata Pugliese',
      sku: 'DRY-104921',
      category: 'Dairy',
      location: 'Walk-in chiller' as const,
      currentStock: 6,
      unit: 'pcs',
      reorderLevel: 15, // Below min -> Low stock alert!
      unitCost: 85.0,
      initialBatchNumber: 'LOT-BRT-88',
      expirationDate: expSoon2d, // Expires in 2 days -> Red warning!
    },
    {
      name: 'Heirloom Vine Tomatoes',
      sku: 'PRD-330198',
      category: 'Produce',
      location: 'Produce prep' as const,
      currentStock: 5.2,
      unit: 'kg',
      reorderLevel: 8.0, // Low stock
      unitCost: 180.0,
      initialBatchNumber: 'LOT-TOM-44',
      expirationDate: expSoon4d, // Expires in 4 days -> Warning!
    },
    {
      name: 'Miyazaki A5 Wagyu Ribeye',
      sku: 'MEA-994012',
      category: 'Meat & Poultry',
      location: 'Freezer' as const,
      currentStock: 18.0,
      unit: 'kg',
      reorderLevel: 5.0,
      unitCost: 1250.0,
      initialBatchNumber: 'LOT-WGY-09',
      expirationDate: expSafe,
    },
    {
      name: 'Parmigiano-Reggiano 24M',
      sku: 'DRY-773829',
      category: 'Dairy',
      location: 'Walk-in chiller' as const,
      currentStock: 8.5,
      unit: 'kg',
      reorderLevel: 3.0,
      unitCost: 1200.0,
      initialBatchNumber: 'LOT-PAR-22',
      expirationDate: expSafe,
    },
    {
      name: 'Woodford Reserve Bourbon',
      sku: 'BEV-449102',
      category: 'Spirits',
      location: 'Bar' as const,
      currentStock: 11.0,
      unit: 'L',
      reorderLevel: 4.0,
      unitCost: 3400.0,
      initialBatchNumber: 'LOT-BRB-12',
      expirationDate: expSafe,
    },
    {
      name: 'Italian Mascarpone Cheese',
      sku: 'DRY-552019',
      category: 'Dairy',
      location: 'Walk-in chiller' as const,
      currentStock: 4.0,
      unit: 'kg',
      reorderLevel: 6.0, // Low stock
      unitCost: 550.0,
      initialBatchNumber: 'LOT-MSC-05',
      expirationDate: expSoon4d, // Expiring soon!
    },
  ];

  for (const item of inventoryItems) {
    await inventoryService.createItem(item);
  }

  // 12. Verification & Summary Report
  console.log('\n======================================================');
  console.log('✅  RIFT ERP SEED COMPLETE: SUMMARY REPORT');
  console.log('======================================================');

  const summaryQueries = [
    { label: 'Staff Users (auth)', table: 'users' },
    { label: 'Menu Catalog Items (menu)', table: 'menu_items' },
    { label: 'Dining Tables (tables)', table: 'dining_tables' },
    { label: 'Active Waitlist Entries (tables)', table: 'waitlist_entries' },
    { label: 'Orders & Receipts (orders)', table: 'orders' },
    { label: 'Kitchen Tickets (kitchen)', table: 'kitchen_tickets' },
    { label: 'Guest Reservations (reservations)', table: 'reservations' },
    { label: 'Delivery Fleet Drivers (delivery)', table: 'delivery_drivers' },
    { label: 'Active Delivery Dispatches (delivery)', table: 'delivery_dispatches' },
    { label: 'Dishes with BOM Recipes (recipes)', table: 'recipes' },
    { label: 'Inventory Stock Items (inventory)', table: 'inventory_items' },
    { label: 'Inventory Tracked Batches (inventory)', table: 'inventory_batches' },
  ];

  const reportRows: any[] = [];
  for (const sq of summaryQueries) {
    try {
      const res = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM ${sq.table};`);
      reportRows.push({ 'Module / Domain': sq.label, 'Records Seeded': res[0]?.count ?? 0, 'Status': 'Ready ✅' });
    } catch (e: any) {
      reportRows.push({ 'Module / Domain': sq.label, 'Records Seeded': 'N/A', 'Status': 'Error: ' + e.message });
    }
  }

  console.table(reportRows);
  console.log('✨ All 10 pluggable battery apps now have rich, realistic operational data!\n');
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error during seed execution:', err);
    process.exit(1);
  });
