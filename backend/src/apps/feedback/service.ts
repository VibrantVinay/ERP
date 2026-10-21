import { getDb } from '../../core/database';
import {
  GuestFeedback,
  CreateFeedbackDto,
  AssignFeedbackDto,
  ResolveFeedbackDto,
  FeedbackSummaryMetrics,
  FeedbackSentiment,
  FeedbackStatus,
} from './types';
import { NotFoundError, ValidationError } from '../../core/errors';

export class FeedbackService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createTableQuery = isSqlite
      ? `CREATE TABLE IF NOT EXISTS guest_feedback (
          id TEXT PRIMARY KEY,
          ticket_number TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          phone TEXT,
          table_or_channel TEXT NOT NULL,
          overall_rating REAL NOT NULL,
          food_rating REAL NOT NULL,
          service_rating REAL NOT NULL,
          ambiance_rating REAL NOT NULL,
          comments TEXT NOT NULL,
          dish_mentions_json TEXT NOT NULL,
          sentiment TEXT NOT NULL,
          status TEXT NOT NULL,
          assigned_to TEXT,
          resolution_notes TEXT,
          compensation_offered TEXT,
          resolved_at DATETIME,
          branch_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS guest_feedback (
          id VARCHAR(64) PRIMARY KEY,
          ticket_number VARCHAR(32) NOT NULL,
          customer_name VARCHAR(128) NOT NULL,
          phone VARCHAR(32),
          table_or_channel VARCHAR(64) NOT NULL,
          overall_rating NUMERIC(3, 1) NOT NULL,
          food_rating NUMERIC(3, 1) NOT NULL,
          service_rating NUMERIC(3, 1) NOT NULL,
          ambiance_rating NUMERIC(3, 1) NOT NULL,
          comments TEXT NOT NULL,
          dish_mentions_json TEXT NOT NULL,
          sentiment VARCHAR(32) NOT NULL,
          status VARCHAR(32) NOT NULL,
          assigned_to VARCHAR(128),
          resolution_notes TEXT,
          compensation_offered VARCHAR(255),
          resolved_at TIMESTAMP WITH TIME ZONE,
          branch_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    await db.execute(createTableQuery);

    const countRes = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM guest_feedback;`);
    if (Number(countRes[0]?.count || 0) === 0) {
      await this.seedInitialFeedback();
    }
  }

  private async seedInitialFeedback(): Promise<void> {
    const db = getDb();
    const now = Date.now();

    const sampleFeedbacks = [
      {
        id: 'fb_01',
        ticketNumber: 'GH-1045',
        customerName: 'Kavita Singhania',
        phone: '98200 45678',
        tableOrChannel: 'Patio 02',
        overallRating: 5.0,
        foodRating: 5.0,
        serviceRating: 5.0,
        ambianceRating: 5.0,
        comments: 'Magnificent anniversary celebration! The Truffle Risotto was velvety perfection, and the candlelight ambiance made our evening unforgettable.',
        dishMentions: ['Truffle Mushroom Risotto', 'Burrata Caprese Salad'],
        sentiment: 'Positive' as FeedbackSentiment,
        status: 'Resolved' as FeedbackStatus,
        assignedTo: 'Mina D’Souza (Manager)',
        resolutionNotes: 'VIP thank-you card and complimentary anniversary dessert offered.',
        compensationOffered: 'VIP Dessert on House',
        resolvedAt: new Date(now - 2 * 3600000).toISOString(),
      },
      {
        id: 'fb_02',
        ticketNumber: 'GH-1048',
        customerName: 'Rohan Mehra',
        phone: '98401 22334',
        tableOrChannel: 'Table 04',
        overallRating: 2.0,
        foodRating: 2.5,
        serviceRating: 2.0,
        ambianceRating: 4.0,
        comments: 'Main course Wagyu steak arrived lukewarm after a 25-minute wait during rush hour. Hostess apologized, but service was visibly stretched thin.',
        dishMentions: ['Charred Wagyu Ribeye Steak'],
        sentiment: 'Negative' as FeedbackSentiment,
        status: 'Escalated' as FeedbackStatus,
        assignedTo: 'Mina D’Souza (Manager)',
        resolutionNotes: 'Manager reached out via phone call. Offered 20% discount voucher for next visit.',
        compensationOffered: '20% Recovery Voucher',
      },
      {
        id: 'fb_03',
        ticketNumber: 'GH-1047',
        customerName: 'Maya S.',
        phone: '98765 43210',
        tableOrChannel: 'Online Delivery',
        overallRating: 4.5,
        foodRating: 5.0,
        serviceRating: 4.0,
        ambianceRating: 4.5,
        comments: 'Delivery was piping hot! Margherita pizza crust had amazing blistered leopard spots. Arrived within 22 minutes.',
        dishMentions: ['Wood-Fired Margherita Pizza'],
        sentiment: 'Positive' as FeedbackSentiment,
        status: 'New' as FeedbackStatus,
      },
      {
        id: 'fb_04',
        ticketNumber: 'GH-1050',
        customerName: 'Dr. Siddharth Verma',
        phone: '98199 88776',
        tableOrChannel: 'Bar 01',
        overallRating: 5.0,
        foodRating: 4.5,
        serviceRating: 5.0,
        ambianceRating: 5.0,
        comments: 'Best Old Fashioned in town! The applewood smoke presentation at the bar counter is a masterclass in mixology.',
        dishMentions: ['Smoked Bourbon Old Fashioned'],
        sentiment: 'Positive' as FeedbackSentiment,
        status: 'New' as FeedbackStatus,
      },
    ];

    for (let i = 0; i < sampleFeedbacks.length; i++) {
      const f = sampleFeedbacks[i];
      const createdAt = new Date(now - (sampleFeedbacks.length - i) * 7200000).toISOString();

      await db.execute(
        `INSERT INTO guest_feedback (
          id, ticket_number, customer_name, phone, table_or_channel,
          overall_rating, food_rating, service_rating, ambiance_rating,
          comments, dish_mentions_json, sentiment, status, assigned_to,
          resolution_notes, compensation_offered, resolved_at, branch_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'branch-south-01', ?)`,
        [
          f.id,
          f.ticketNumber,
          f.customerName,
          f.phone || null,
          f.tableOrChannel,
          f.overallRating,
          f.foodRating,
          f.serviceRating,
          f.ambianceRating,
          f.comments,
          JSON.stringify(f.dishMentions || []),
          f.sentiment,
          f.status,
          f.assignedTo || null,
          f.resolutionNotes || null,
          f.compensationOffered || null,
          f.resolvedAt || null,
          createdAt,
        ]
      );
    }
  }

  public async getFeedback(filters?: { status?: string; sentiment?: string }): Promise<GuestFeedback[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let sql = `SELECT * FROM guest_feedback WHERE 1=1`;
    const params: any[] = [];

    if (filters?.status && filters.status !== 'all') {
      sql += ` AND LOWER(status) = LOWER(?)`;
      params.push(filters.status);
    }
    if (filters?.sentiment && filters.sentiment !== 'all') {
      sql += ` AND LOWER(sentiment) = LOWER(?)`;
      params.push(filters.sentiment);
    }

    sql += ` ORDER BY created_at DESC;`;
    const rows = await db.query<any>(sql, params);
    return rows.map(r => this.hydrateFeedback(r));
  }

  public async getFeedbackById(id: string): Promise<GuestFeedback> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM guest_feedback WHERE id = ? LIMIT 1;`, [id]);
    if (rows.length === 0) {
      throw new NotFoundError(`Guest feedback '${id}' not found`);
    }
    return this.hydrateFeedback(rows[0]);
  }

  public async createFeedback(dto: CreateFeedbackDto): Promise<GuestFeedback> {
    await this.initDatabaseSchema();
    const db = getDb();
    const id = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const branchId = dto.branchId || 'branch-south-01';

    // Sentiment & Escalation auto-derivation
    let sentiment: FeedbackSentiment = 'Neutral';
    if (dto.overallRating >= 4.0) sentiment = 'Positive';
    else if (dto.overallRating < 3.0) sentiment = 'Negative';

    // Automatic escalation rule: Ratings < 3 stars are automatically escalated to Manager
    const status: FeedbackStatus = dto.overallRating < 3.0 ? 'Escalated' : 'New';

    await db.execute(
      `INSERT INTO guest_feedback (
        id, ticket_number, customer_name, phone, table_or_channel,
        overall_rating, food_rating, service_rating, ambiance_rating,
        comments, dish_mentions_json, sentiment, status, branch_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dto.ticketNumber,
        dto.customerName,
        dto.phone || null,
        dto.tableOrChannel,
        dto.overallRating,
        dto.foodRating,
        dto.serviceRating,
        dto.ambianceRating,
        dto.comments,
        JSON.stringify(dto.dishMentions || []),
        sentiment,
        status,
        branchId,
        now,
      ]
    );

    return this.getFeedbackById(id);
  }

  public async assignFeedback(id: string, dto: AssignFeedbackDto): Promise<GuestFeedback> {
    await this.initDatabaseSchema();
    const fb = await this.getFeedbackById(id);
    const db = getDb();

    await db.execute(
      `UPDATE guest_feedback SET
        assigned_to = ?,
        status = 'Under Review',
        resolution_notes = COALESCE(?, resolution_notes)
       WHERE id = ?`,
      [dto.assignedTo, dto.managerNotes || null, fb.id]
    );

    return this.getFeedbackById(fb.id);
  }

  public async resolveFeedback(id: string, dto: ResolveFeedbackDto): Promise<GuestFeedback> {
    await this.initDatabaseSchema();
    const fb = await this.getFeedbackById(id);
    const db = getDb();
    const now = new Date().toISOString();

    await db.execute(
      `UPDATE guest_feedback SET
        status = 'Resolved',
        resolution_notes = ?,
        compensation_offered = ?,
        assigned_to = COALESCE(assigned_to, ?),
        resolved_at = ?
       WHERE id = ?`,
      [dto.resolutionNotes, dto.compensationOffered || null, dto.resolvedBy, now, fb.id]
    );

    return this.getFeedbackById(fb.id);
  }

  public async getSummaryMetrics(): Promise<FeedbackSummaryMetrics> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM guest_feedback;`);

    if (rows.length === 0) {
      return {
        averageOverall: 5.0,
        averageFood: 5.0,
        averageService: 5.0,
        averageAmbiance: 5.0,
        totalReviews: 0,
        escalatedCount: 0,
        positivePercentage: 100,
      };
    }

    let sumOverall = 0;
    let sumFood = 0;
    let sumService = 0;
    let sumAmbiance = 0;
    let escalatedCount = 0;
    let positiveCount = 0;

    for (const r of rows) {
      sumOverall += Number(r.overall_rating);
      sumFood += Number(r.food_rating);
      sumService += Number(r.service_rating);
      sumAmbiance += Number(r.ambiance_rating);
      if (r.status === 'Escalated') escalatedCount += 1;
      if (r.sentiment === 'Positive') positiveCount += 1;
    }

    const total = rows.length;
    return {
      averageOverall: Math.round((sumOverall / total) * 10) / 10,
      averageFood: Math.round((sumFood / total) * 10) / 10,
      averageService: Math.round((sumService / total) * 10) / 10,
      averageAmbiance: Math.round((sumAmbiance / total) * 10) / 10,
      totalReviews: total,
      escalatedCount,
      positivePercentage: Math.round((positiveCount / total) * 100),
    };
  }

  private hydrateFeedback(row: any): GuestFeedback {
    let dishes = [];
    try {
      dishes = JSON.parse(row.dish_mentions_json || '[]');
    } catch (e) {
      dishes = [];
    }

    return {
      id: row.id,
      ticketNumber: row.ticket_number,
      customerName: row.customer_name,
      phone: row.phone || undefined,
      tableOrChannel: row.table_or_channel,
      overallRating: Number(row.overall_rating),
      foodRating: Number(row.food_rating),
      serviceRating: Number(row.service_rating),
      ambianceRating: Number(row.ambiance_rating),
      comments: row.comments,
      dishMentions: dishes,
      sentiment: row.sentiment as FeedbackSentiment,
      status: row.status as FeedbackStatus,
      assignedTo: row.assigned_to || undefined,
      resolutionNotes: row.resolution_notes || undefined,
      compensationOffered: row.compensation_offered || undefined,
      resolvedAt: row.resolved_at || undefined,
      branchId: row.branch_id,
      createdAt: row.created_at,
    };
  }
}

export const feedbackService = new FeedbackService();

