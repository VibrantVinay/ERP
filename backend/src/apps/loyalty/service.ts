import { getDb } from '../../core/database';
import {
  LoyaltyMember,
  PromoCampaign,
  CreateCampaignDto,
  ValidateCouponDto,
  ValidateCouponResult,
  AdjustPointsDto,
  TierName,
} from './types';
import { NotFoundError, ValidationError } from '../../core/errors';

export class LoyaltyService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createCampaigns = isSqlite
      ? `CREATE TABLE IF NOT EXISTS promo_campaigns (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          discount_type TEXT NOT NULL,
          discount_value REAL NOT NULL,
          min_spend REAL DEFAULT 0,
          max_discount REAL,
          usage_limit INTEGER DEFAULT 1000,
          used_count INTEGER DEFAULT 0,
          valid_from TEXT NOT NULL,
          valid_to TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          branch_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS promo_campaigns (
          id VARCHAR(64) PRIMARY KEY,
          code VARCHAR(32) NOT NULL UNIQUE,
          title VARCHAR(128) NOT NULL,
          discount_type VARCHAR(32) NOT NULL,
          discount_value NUMERIC(10, 2) NOT NULL,
          min_spend NUMERIC(10, 2) DEFAULT 0,
          max_discount NUMERIC(10, 2),
          usage_limit INTEGER DEFAULT 1000,
          used_count INTEGER DEFAULT 0,
          valid_from VARCHAR(32) NOT NULL,
          valid_to VARCHAR(32) NOT NULL,
          is_active INTEGER DEFAULT 1,
          branch_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    const createMembers = isSqlite
      ? `CREATE TABLE IF NOT EXISTS loyalty_members (
          id TEXT PRIMARY KEY,
          customer_id TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          phone TEXT NOT NULL UNIQUE,
          current_points INTEGER DEFAULT 0,
          lifetime_points INTEGER DEFAULT 0,
          tier TEXT NOT NULL,
          transactions_json TEXT NOT NULL,
          branch_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS loyalty_members (
          id VARCHAR(64) PRIMARY KEY,
          customer_id VARCHAR(64) NOT NULL,
          customer_name VARCHAR(128) NOT NULL,
          phone VARCHAR(32) NOT NULL UNIQUE,
          current_points INTEGER DEFAULT 0,
          lifetime_points INTEGER DEFAULT 0,
          tier VARCHAR(32) NOT NULL,
          transactions_json TEXT NOT NULL,
          branch_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    await db.execute(createCampaigns);
    await db.execute(createMembers);

    const countRes = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM promo_campaigns;`);
    if (Number(countRes[0]?.count || 0) === 0) {
      await this.seedInitialLoyalty();
    }
  }

  private async seedInitialLoyalty(): Promise<void> {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const endOfYear = '2026-12-31';

    const sampleCampaigns = [
      {
        id: 'camp_01',
        code: 'WELCOME20',
        title: 'New Guest 20% Welcome Discount',
        discountType: 'Percentage',
        discountValue: 20,
        minSpend: 500,
        maxDiscount: 400,
        usageLimit: 500,
        usedCount: 42,
        validFrom: today,
        validTo: endOfYear,
        isActive: 1,
      },
      {
        id: 'camp_02',
        code: 'FLAT250',
        title: 'Weekend Dining ₹250 Off',
        discountType: 'FixedAmount',
        discountValue: 250,
        minSpend: 1500,
        maxDiscount: 250,
        usageLimit: 300,
        usedCount: 78,
        validFrom: today,
        validTo: endOfYear,
        isActive: 1,
      },
      {
        id: 'camp_03',
        code: 'VIPROYAL',
        title: 'VIP Tasting Menu Special (₹500 Off)',
        discountType: 'FixedAmount',
        discountValue: 500,
        minSpend: 2500,
        maxDiscount: 500,
        usageLimit: 100,
        usedCount: 15,
        validFrom: today,
        validTo: endOfYear,
        isActive: 1,
      },
    ];

    for (const c of sampleCampaigns) {
      await db.execute(
        `INSERT INTO promo_campaigns (
          id, code, title, discount_type, discount_value, min_spend,
          max_discount, usage_limit, used_count, valid_from, valid_to,
          is_active, branch_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'branch-south-01')`,
        [c.id, c.code, c.title, c.discountType, c.discountValue, c.minSpend, c.maxDiscount, c.usageLimit, c.usedCount, c.validFrom, c.validTo, c.isActive]
      );
    }

    const sampleMembers = [
      {
        id: 'mem_01',
        customerId: 'cust_01',
        customerName: 'Kavita Singhania',
        phone: '98200 45678',
        currentPoints: 850,
        lifetimePoints: 1420,
        tier: 'Platinum',
        transactions: [
          { id: 'tx_1', points: 420, type: 'Earned', orderTicket: 'GH-1045', description: 'Anniversary Dinner 1.5x pts', createdAt: today },
          { id: 'tx_2', points: -200, type: 'Redeemed', orderTicket: 'GH-1040', description: 'Redeemed for complimentary wine pairing', createdAt: today },
        ],
      },
      {
        id: 'mem_02',
        customerId: 'cust_02',
        customerName: 'Rohan Mehra',
        phone: '98401 22334',
        currentPoints: 340,
        lifetimePoints: 520,
        tier: 'Gold',
        transactions: [
          { id: 'tx_3', points: 160, type: 'Earned', orderTicket: 'GH-1042', description: 'Weekend dining dinner', createdAt: today },
        ],
      },
    ];

    for (const m of sampleMembers) {
      await db.execute(
        `INSERT INTO loyalty_members (
          id, customer_id, customer_name, phone, current_points,
          lifetime_points, tier, transactions_json, branch_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'branch-south-01')`,
        [m.id, m.customerId, m.customerName, m.phone, m.currentPoints, m.lifetimePoints, m.tier, JSON.stringify(m.transactions)]
      );
    }
  }

  public async getCampaigns(activeOnly?: boolean): Promise<PromoCampaign[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let sql = `SELECT * FROM promo_campaigns WHERE 1=1`;
    const params: any[] = [];
    if (activeOnly) {
      sql += ` AND is_active = 1`;
    }
    sql += ` ORDER BY created_at DESC;`;

    const rows = await db.query<any>(sql, params);
    return rows.map(r => this.hydrateCampaign(r));
  }

  public async createCampaign(dto: CreateCampaignDto): Promise<PromoCampaign> {
    await this.initDatabaseSchema();
    const db = getDb();
    const id = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const code = dto.code.trim().toUpperCase();
    const today = new Date().toISOString().split('T')[0];
    const branchId = dto.branchId || 'branch-south-01';

    await db.execute(
      `INSERT INTO promo_campaigns (
        id, code, title, discount_type, discount_value, min_spend,
        max_discount, usage_limit, used_count, valid_from, valid_to,
        is_active, branch_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1, ?)`,
      [
        id,
        code,
        dto.title,
        dto.discountType,
        dto.discountValue,
        dto.minSpend || 0,
        dto.maxDiscount || null,
        dto.usageLimit || 1000,
        dto.validFrom || today,
        dto.validTo,
        branchId,
      ]
    );

    const rows = await db.query<any>(`SELECT * FROM promo_campaigns WHERE id = ? LIMIT 1;`, [id]);
    return this.hydrateCampaign(rows[0]);
  }

  public async validateCoupon(dto: ValidateCouponDto): Promise<ValidateCouponResult> {
    await this.initDatabaseSchema();
    const db = getDb();
    const code = dto.code.trim().toUpperCase();
    const rows = await db.query<any>(`SELECT * FROM promo_campaigns WHERE code = ? LIMIT 1;`, [code]);

    if (rows.length === 0) {
      return {
        isValid: false,
        code,
        calculatedDiscount: 0,
        finalTotal: dto.orderTotal,
        message: `Coupon code '${code}' not found or invalid`,
      };
    }

    const c = this.hydrateCampaign(rows[0]);
    const today = new Date().toISOString().split('T')[0];

    if (!c.isActive) {
      return { isValid: false, code, calculatedDiscount: 0, finalTotal: dto.orderTotal, message: 'This coupon campaign is currently inactive' };
    }
    if (today < c.validFrom || today > c.validTo) {
      return { isValid: false, code, calculatedDiscount: 0, finalTotal: dto.orderTotal, message: `Coupon expired or not yet valid (valid: ${c.validFrom} to ${c.validTo})` };
    }
    if (c.usedCount >= c.usageLimit) {
      return { isValid: false, code, calculatedDiscount: 0, finalTotal: dto.orderTotal, message: 'Coupon usage limit has been reached' };
    }
    if (dto.orderTotal < c.minSpend) {
      return { isValid: false, code, calculatedDiscount: 0, finalTotal: dto.orderTotal, message: `Minimum cart spend of ₹${c.minSpend} required (current: ₹${dto.orderTotal})` };
    }

    let calculatedDiscount = 0;
    if (c.discountType === 'Percentage') {
      calculatedDiscount = (dto.orderTotal * c.discountValue) / 100;
      if (c.maxDiscount && calculatedDiscount > c.maxDiscount) {
        calculatedDiscount = c.maxDiscount;
      }
    } else if (c.discountType === 'FixedAmount') {
      calculatedDiscount = c.discountValue;
    }
    calculatedDiscount = Math.min(calculatedDiscount, dto.orderTotal);
    calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;
    const finalTotal = Math.round((dto.orderTotal - calculatedDiscount) * 100) / 100;

    return {
      isValid: true,
      code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      calculatedDiscount,
      finalTotal,
      message: `Coupon '${code}' applied: ₹${calculatedDiscount} saved!`,
    };
  }

  public async getMembers(): Promise<LoyaltyMember[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM loyalty_members ORDER BY current_points DESC;`);
    return rows.map(r => this.hydrateMember(r));
  }

  public async getMemberById(id: string): Promise<LoyaltyMember> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM loyalty_members WHERE id = ? OR customer_id = ? OR phone = ? LIMIT 1;`, [id, id, id]);
    if (rows.length === 0) {
      throw new NotFoundError(`Loyalty member '${id}' not found`);
    }
    return this.hydrateMember(rows[0]);
  }

  public async adjustPoints(id: string, dto: AdjustPointsDto): Promise<LoyaltyMember> {
    await this.initDatabaseSchema();
    const member = await this.getMemberById(id);
    const db = getDb();
    const now = new Date().toISOString();

    const newCurrent = Math.max(0, member.currentPoints + dto.points);
    const newLifetime = dto.points > 0 ? member.lifetimePoints + dto.points : member.lifetimePoints;

    let newTier: TierName = 'Silver';
    if (newLifetime >= 1500) newTier = 'Platinum';
    else if (newLifetime >= 500) newTier = 'Gold';

    const newTx = {
      id: `tx_${Date.now()}`,
      points: dto.points,
      type: dto.type,
      orderTicket: dto.orderTicket,
      description: dto.description,
      createdAt: now,
    };
    const updatedTransactions = [newTx, ...member.transactions];

    await db.execute(
      `UPDATE loyalty_members SET
        current_points = ?, lifetime_points = ?, tier = ?,
        transactions_json = ?, updated_at = ?
       WHERE id = ?`,
      [newCurrent, newLifetime, newTier, JSON.stringify(updatedTransactions), now, member.id]
    );

    return this.getMemberById(member.id);
  }

  private hydrateCampaign(row: any): PromoCampaign {
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      discountType: row.discount_type,
      discountValue: Number(row.discount_value),
      minSpend: Number(row.min_spend || 0),
      maxDiscount: row.max_discount ? Number(row.max_discount) : undefined,
      usageLimit: Number(row.usage_limit),
      usedCount: Number(row.used_count || 0),
      validFrom: row.valid_from,
      validTo: row.valid_to,
      isActive: Boolean(row.is_active),
      branchId: row.branch_id,
      createdAt: row.created_at,
    };
  }

  private hydrateMember(row: any): LoyaltyMember {
    let txs = [];
    try {
      txs = JSON.parse(row.transactions_json || '[]');
    } catch (e) {
      txs = [];
    }
    return {
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      phone: row.phone,
      currentPoints: Number(row.current_points || 0),
      lifetimePoints: Number(row.lifetime_points || 0),
      tier: row.tier as TierName,
      transactions: txs,
      branchId: row.branch_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const loyaltyService = new LoyaltyService();
