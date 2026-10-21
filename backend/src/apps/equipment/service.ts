import { getDb } from '../../core/database';
import {
  EquipmentAsset,
  BreakdownTicket,
  EquipmentStatus,
  CreateEquipmentDTO,
  LogMaintenanceDTO,
  CreateBreakdownDTO,
  ResolveTicketDTO,
} from './types';

export class EquipmentService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;

    const db = getDb();

    // Table: equipment_assets
    await db.execute(`
      CREATE TABLE IF NOT EXISTS equipment_assets (
        id VARCHAR(50) PRIMARY KEY,
        branch_id VARCHAR(50) NOT NULL,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(50) NOT NULL,
        serial_number VARCHAR(100),
        location VARCHAR(100) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'operational',
        purchase_date VARCHAR(30),
        service_interval_days INTEGER NOT NULL DEFAULT 90,
        last_service_date VARCHAR(30),
        next_service_date VARCHAR(30),
        technician_contact VARCHAR(100),
        notes TEXT,
        created_at VARCHAR(30) NOT NULL,
        updated_at VARCHAR(30) NOT NULL
      )
    `);

    // Table: breakdown_tickets
    await db.execute(`
      CREATE TABLE IF NOT EXISTS breakdown_tickets (
        id VARCHAR(50) PRIMARY KEY,
        branch_id VARCHAR(50) NOT NULL,
        equipment_id VARCHAR(50) NOT NULL,
        equipment_name VARCHAR(150) NOT NULL,
        reported_by VARCHAR(100) NOT NULL,
        issue_description TEXT NOT NULL,
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        status VARCHAR(30) NOT NULL DEFAULT 'open',
        technician_name VARCHAR(100),
        service_cost REAL DEFAULT 0,
        parts_replaced TEXT,
        resolved_at VARCHAR(30),
        created_at VARCHAR(30) NOT NULL,
        updated_at VARCHAR(30) NOT NULL
      )
    `);

    await this.seedInitialData();
  }

  private async seedInitialData(): Promise<void> {
    const db = getDb();
    const existing = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM equipment_assets`);
    const count = Number(existing[0]?.count || 0);

    if (count === 0) {
      const now = new Date().toISOString();
      const today = now.slice(0, 10);

      const sampleAssets = [
        {
          id: 'eq-101',
          branchId: 'main-branch',
          name: 'Rational iCombi Pro 10-Grid Combi Oven',
          category: 'Cooking',
          serialNumber: 'RAT-2023-99814',
          location: 'Hot Line Center Station',
          status: 'operational',
          purchaseDate: '2023-04-15',
          serviceIntervalDays: 90,
          lastServiceDate: '2024-01-10',
          nextServiceDate: '2024-04-10',
          technicianContact: 'Rational Service Direct (+1-800-455-8890)',
          notes: 'Requires OEM calcium cleaner tabs weekly.',
        },
        {
          id: 'eq-102',
          branchId: 'main-branch',
          name: 'Foster Walk-in Chiller Compressor & Evaporator',
          category: 'Refrigeration',
          serialNumber: 'FOS-CH-88210',
          location: 'Cold Storage Room B',
          status: 'operational',
          purchaseDate: '2022-11-20',
          serviceIntervalDays: 60,
          lastServiceDate: '2024-02-01',
          nextServiceDate: '2024-04-01',
          technicianContact: 'Apex Refrigeration (+1-555-019-4821)',
          notes: 'Door seal gasket replaced Feb 2024.',
        },
        {
          id: 'eq-103',
          branchId: 'main-branch',
          name: 'Hobart Profi AMX Pass-Through Dishwasher',
          category: 'Warewashing',
          serialNumber: 'HOB-DW-44109',
          location: 'Dish Pit Scullery',
          status: 'needs_maintenance',
          purchaseDate: '2023-01-05',
          serviceIntervalDays: 30,
          lastServiceDate: '2024-01-15',
          nextServiceDate: '2024-02-14',
          technicianContact: 'Ecolab Service Center (+1-800-352-5326)',
          notes: 'Rinse booster pressure fluctuating slightly below 1.5 bar.',
        },
        {
          id: 'eq-104',
          branchId: 'main-branch',
          name: 'Pitco Solstice High-Output Double Fryer',
          category: 'Cooking',
          serialNumber: 'PIT-FR-33018',
          location: 'Fry Station Line 2',
          status: 'under_repair',
          purchaseDate: '2022-08-12',
          serviceIntervalDays: 45,
          lastServiceDate: '2024-01-20',
          nextServiceDate: '2024-03-06',
          technicianContact: 'Heritage Foodservice Parts (+1-800-458-5593)',
          notes: 'Pilot thermocouple sensor faulty. Tech dispatch scheduled.',
        },
        {
          id: 'eq-105',
          branchId: 'main-branch',
          name: 'La Marzocco Linea PB 2-Group Espresso Machine',
          category: 'Beverage',
          serialNumber: 'LM-PB-99023',
          location: 'Front Beverage Bar',
          status: 'operational',
          purchaseDate: '2023-06-18',
          serviceIntervalDays: 90,
          lastServiceDate: '2024-01-05',
          nextServiceDate: '2024-04-05',
          technicianContact: 'Blackwood Coffee Tech (+1-555-883-1940)',
          notes: 'Dual boiler water hardness filtered through RO system.',
        },
      ];

      for (const a of sampleAssets) {
        await db.execute(
          `INSERT INTO equipment_assets (
            id, branch_id, name, category, serial_number, location,
            status, purchase_date, service_interval_days, last_service_date,
            next_service_date, technician_contact, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            a.id, a.branchId, a.name, a.category, a.serialNumber, a.location,
            a.status, a.purchaseDate, a.serviceIntervalDays, a.lastServiceDate,
            a.nextServiceDate, a.technicianContact, a.notes, now, now
          ]
        );
      }

      // Seed tickets
      const sampleTickets = [
        {
          id: 'ticket-101',
          branchId: 'main-branch',
          equipmentId: 'eq-104',
          equipmentName: 'Pitco Solstice High-Output Double Fryer',
          reportedBy: 'Chef Roberto Gomez',
          issueDescription: 'Left fryer well fails to ignite after oil change. Thermocouple reading cold.',
          priority: 'urgent',
          status: 'in_progress',
          technicianName: 'Dave Miller (Heritage Parts)',
          serviceCost: 285.0,
          partsReplaced: 'Pilot Burner Assembly, Thermocouple #11823',
          resolvedAt: null,
        },
        {
          id: 'ticket-102',
          branchId: 'main-branch',
          equipmentId: 'eq-103',
          equipmentName: 'Hobart Profi AMX Pass-Through Dishwasher',
          reportedBy: 'Marcus Vance',
          issueDescription: 'Chemical sanitizer feed tube has minor micro-leak at injector valve.',
          priority: 'medium',
          status: 'open',
          technicianName: null,
          serviceCost: 0,
          partsReplaced: null,
          resolvedAt: null,
        },
        {
          id: 'ticket-103',
          branchId: 'main-branch',
          equipmentId: 'eq-102',
          equipmentName: 'Foster Walk-in Chiller Compressor & Evaporator',
          reportedBy: 'Chef Roberto Gomez',
          issueDescription: 'Gasket seal split on left lower hinge causing slight ice buildup.',
          priority: 'high',
          status: 'resolved',
          technicianName: 'Kevin Patel (Apex Refrigeration)',
          serviceCost: 195.0,
          partsReplaced: 'Magnetic Door Gasket Profile B',
          resolvedAt: `${today}T11:00:00Z`,
        },
      ];

      for (const t of sampleTickets) {
        await db.execute(
          `INSERT INTO breakdown_tickets (
            id, branch_id, equipment_id, equipment_name, reported_by,
            issue_description, priority, status, technician_name, service_cost,
            parts_replaced, resolved_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id, t.branchId, t.equipmentId, t.equipmentName, t.reportedBy,
            t.issueDescription, t.priority, t.status, t.technicianName,
            t.serviceCost, t.partsReplaced, t.resolvedAt, now, now
          ]
        );
      }
    }
  }

  public async getEquipment(branchId?: string, category?: string, status?: string): Promise<EquipmentAsset[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let query = `SELECT * FROM equipment_assets WHERE 1=1`;
    const params: any[] = [];

    if (branchId) {
      query += ` AND branch_id = ?`;
      params.push(branchId);
    }
    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY name ASC`;
    const rows = await db.query<any>(query, params);

    return rows.map((r: any) => ({
      id: r.id,
      branchId: r.branch_id,
      name: r.name,
      category: r.category,
      serialNumber: r.serial_number || undefined,
      location: r.location,
      status: r.status,
      purchaseDate: r.purchase_date || undefined,
      serviceIntervalDays: Number(r.service_interval_days),
      lastServiceDate: r.last_service_date || undefined,
      nextServiceDate: r.next_service_date || undefined,
      technicianContact: r.technician_contact || undefined,
      notes: r.notes || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public async createEquipment(dto: CreateEquipmentDTO): Promise<EquipmentAsset> {
    await this.initDatabaseSchema();
    const db = getDb();
    const now = new Date().toISOString();
    const id = `eq-${Date.now()}`;
    const intervalDays = dto.serviceIntervalDays || 90;

    const nextService = new Date(Date.now() + intervalDays * 86400000).toISOString().slice(0, 10);

    await db.execute(
      `INSERT INTO equipment_assets (
        id, branch_id, name, category, serial_number, location,
        status, purchase_date, service_interval_days, last_service_date,
        next_service_date, technician_contact, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'operational', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dto.branchId || 'main-branch',
        dto.name,
        dto.category,
        dto.serialNumber || null,
        dto.location,
        dto.purchaseDate || null,
        intervalDays,
        now.slice(0, 10),
        nextService,
        dto.technicianContact || null,
        dto.notes || null,
        now,
        now,
      ]
    );

    const assets = await this.getEquipment(dto.branchId || 'main-branch');
    const created = assets.find(a => a.id === id);
    if (!created) throw new Error('Failed to create equipment');
    return created;
  }

  public async updateStatus(id: string, status: EquipmentStatus): Promise<EquipmentAsset> {
    await this.initDatabaseSchema();
    const db = getDb();
    const now = new Date().toISOString();

    await db.execute(
      `UPDATE equipment_assets SET status = ?, updated_at = ? WHERE id = ?`,
      [status, now, id]
    );

    const rows = await db.query<any>(`SELECT * FROM equipment_assets WHERE id = ?`, [id]);
    const r = rows[0];
    if (!r) throw new Error(`Equipment ${id} not found`);

    return {
      id: r.id,
      branchId: r.branch_id,
      name: r.name,
      category: r.category,
      serialNumber: r.serial_number || undefined,
      location: r.location,
      status: r.status,
      purchaseDate: r.purchase_date || undefined,
      serviceIntervalDays: Number(r.service_interval_days),
      lastServiceDate: r.last_service_date || undefined,
      nextServiceDate: r.next_service_date || undefined,
      technicianContact: r.technician_contact || undefined,
      notes: r.notes || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  public async logMaintenance(id: string, dto: LogMaintenanceDTO): Promise<EquipmentAsset> {
    await this.initDatabaseSchema();
    const db = getDb();
    const now = new Date().toISOString();

    const assets = await db.query<any>(`SELECT * FROM equipment_assets WHERE id = ?`, [id]);
    const asset = assets[0];
    if (!asset) throw new Error(`Equipment ${id} not found`);

    const interval = Number(asset.service_interval_days) || 90;
    const serviceDate = dto.serviceDate || now.slice(0, 10);
    const nextDate = new Date(new Date(serviceDate).getTime() + interval * 86400000).toISOString().slice(0, 10);

    await db.execute(
      `UPDATE equipment_assets SET
        status = 'operational',
        last_service_date = ?,
        next_service_date = ?,
        notes = COALESCE(?, notes),
        updated_at = ?
      WHERE id = ?`,
      [serviceDate, nextDate, dto.notes || null, now, id]
    );

    const updated = await db.query<any>(`SELECT * FROM equipment_assets WHERE id = ?`, [id]);
    const r = updated[0];

    return {
      id: r.id,
      branchId: r.branch_id,
      name: r.name,
      category: r.category,
      serialNumber: r.serial_number || undefined,
      location: r.location,
      status: r.status,
      purchaseDate: r.purchase_date || undefined,
      serviceIntervalDays: Number(r.service_interval_days),
      lastServiceDate: r.last_service_date || undefined,
      nextServiceDate: r.next_service_date || undefined,
      technicianContact: r.technician_contact || undefined,
      notes: r.notes || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  public async getBreakdownTickets(branchId?: string, status?: string): Promise<BreakdownTicket[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let query = `SELECT * FROM breakdown_tickets WHERE 1=1`;
    const params: any[] = [];

    if (branchId) {
      query += ` AND branch_id = ?`;
      params.push(branchId);
    }
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;
    const rows = await db.query<any>(query, params);

    return rows.map((r: any) => ({
      id: r.id,
      branchId: r.branch_id,
      equipmentId: r.equipment_id,
      equipmentName: r.equipment_name,
      reportedBy: r.reported_by,
      issueDescription: r.issue_description,
      priority: r.priority,
      status: r.status,
      technicianName: r.technician_name || undefined,
      serviceCost: Number(r.service_cost || 0),
      partsReplaced: r.parts_replaced || undefined,
      resolvedAt: r.resolved_at || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public async createBreakdownTicket(dto: CreateBreakdownDTO): Promise<BreakdownTicket> {
    await this.initDatabaseSchema();
    const db = getDb();
    const now = new Date().toISOString();
    const id = `ticket-${Date.now()}`;

    // Get equipment details
    const assets = await db.query<any>(`SELECT * FROM equipment_assets WHERE id = ?`, [dto.equipmentId]);
    const asset = assets[0];
    const equipmentName = asset ? asset.name : 'Unknown Equipment';

    // Put equipment in needs_maintenance or under_repair
    await db.execute(
      `UPDATE equipment_assets SET status = 'under_repair', updated_at = ? WHERE id = ?`,
      [now, dto.equipmentId]
    );

    await db.execute(
      `INSERT INTO breakdown_tickets (
        id, branch_id, equipment_id, equipment_name, reported_by,
        issue_description, priority, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
      [
        id,
        dto.branchId || 'main-branch',
        dto.equipmentId,
        equipmentName,
        dto.reportedBy,
        dto.issueDescription,
        dto.priority || 'medium',
        now,
        now,
      ]
    );

    const tickets = await this.getBreakdownTickets(dto.branchId || 'main-branch');
    const created = tickets.find(t => t.id === id);
    if (!created) throw new Error('Failed to create breakdown ticket');
    return created;
  }

  public async resolveTicket(id: string, dto: ResolveTicketDTO): Promise<BreakdownTicket> {
    await this.initDatabaseSchema();
    const db = getDb();
    const now = new Date().toISOString();

    const tickets = await db.query<any>(`SELECT * FROM breakdown_tickets WHERE id = ?`, [id]);
    const ticket = tickets[0];
    if (!ticket) throw new Error(`Ticket ${id} not found`);

    await db.execute(
      `UPDATE breakdown_tickets SET
        status = 'resolved',
        technician_name = ?,
        service_cost = ?,
        parts_replaced = ?,
        resolved_at = ?,
        updated_at = ?
      WHERE id = ?`,
      [dto.technicianName, dto.serviceCost || 0, dto.partsReplaced || null, now, now, id]
    );

    // Return equipment to operational
    await db.execute(
      `UPDATE equipment_assets SET status = 'operational', last_service_date = ?, updated_at = ? WHERE id = ?`,
      [now.slice(0, 10), now, ticket.equipment_id]
    );

    const updated = await db.query<any>(`SELECT * FROM breakdown_tickets WHERE id = ?`, [id]);
    const r = updated[0];

    return {
      id: r.id,
      branchId: r.branch_id,
      equipmentId: r.equipment_id,
      equipmentName: r.equipment_name,
      reportedBy: r.reported_by,
      issueDescription: r.issue_description,
      priority: r.priority,
      status: r.status,
      technicianName: r.technician_name || undefined,
      serviceCost: Number(r.service_cost || 0),
      partsReplaced: r.parts_replaced || undefined,
      resolvedAt: r.resolved_at || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}

export const equipmentService = new EquipmentService();

