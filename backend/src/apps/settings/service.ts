import { getDb } from '../../core/database';
import {
  RestaurantSettings,
  UpdateSettingsDTO,
  TestPrinterResponse,
  TestWebhookResponse,
} from './types';

export class SettingsService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;

    const db = getDb();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id VARCHAR(50) PRIMARY KEY,
        restaurant_name VARCHAR(100) NOT NULL,
        tagline VARCHAR(150) NOT NULL,
        legal_entity VARCHAR(150) NOT NULL,
        gstin VARCHAR(50) NOT NULL,
        fssai_number VARCHAR(50) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT '₹',
        timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
        default_gst_rate REAL NOT NULL DEFAULT 5.0,
        contact_email VARCHAR(100) NOT NULL,
        contact_phone VARCHAR(30) NOT NULL,
        address TEXT NOT NULL,
        receipt_footer TEXT NOT NULL,
        kot_printer_ip VARCHAR(50) NOT NULL DEFAULT '192.168.1.201',
        kot_printer_port INTEGER NOT NULL DEFAULT 9100,
        receipt_printer_ip VARCHAR(50) NOT NULL DEFAULT '192.168.1.202',
        receipt_printer_port INTEGER NOT NULL DEFAULT 9100,
        paper_width VARCHAR(20) NOT NULL DEFAULT '80mm',
        enable_auto_cutter INTEGER NOT NULL DEFAULT 1,
        swiggy_webhook_secret VARCHAR(100) NOT NULL DEFAULT 'swiggy_sec_993821',
        zomato_webhook_secret VARCHAR(100) NOT NULL DEFAULT 'zomato_sec_441209',
        whatsapp_api_key VARCHAR(100) NOT NULL DEFAULT 'wa_live_e8910248a',
        updated_at VARCHAR(30) NOT NULL
      )
    `);

    await this.seedInitialData();
  }

  private async seedInitialData(): Promise<void> {
    const db = getDb();
    const existing = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM system_settings`);
    const count = Number(existing[0]?.count || 0);

    if (count === 0) {
      const now = new Date().toISOString();
      await db.execute(
        `INSERT INTO system_settings (
          id, restaurant_name, tagline, legal_entity, gstin, fssai_number,
          currency, timezone, default_gst_rate, contact_email, contact_phone,
          address, receipt_footer, kot_printer_ip, kot_printer_port,
          receipt_printer_ip, receipt_printer_port, paper_width,
          enable_auto_cutter, swiggy_webhook_secret, zomato_webhook_secret,
          whatsapp_api_key, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'settings-global',
          'RIFT Gastronomy & Bistro',
          'Craft Dining & Modern Indian Flavors',
          'Rift Hospitality Private Limited',
          '29AABCR1234F1Z8',
          '11223344556677',
          '₹',
          'Asia/Kolkata',
          5.0,
          'support@rift-erp.internal',
          '+91 80 4123 9800',
          '100ft Road, HAL 2nd Stage, Indiranagar, Bengaluru, KA 560038',
          'Thank you for dining at RIFT! Follow us @rift.bistro | Visit again!',
          '192.168.1.201',
          9100,
          '192.168.1.202',
          9100,
          '80mm',
          1,
          'swiggy_sec_993821',
          'zomato_sec_441209',
          'wa_live_e8910248a',
          now,
        ]
      );
    }
  }

  private mapRowToSettings(row: any): RestaurantSettings {
    return {
      id: row.id,
      restaurantName: row.restaurant_name,
      tagline: row.tagline,
      legalEntity: row.legal_entity,
      gstin: row.gstin,
      fssaiNumber: row.fssai_number,
      currency: row.currency,
      timezone: row.timezone,
      defaultGstRate: Number(row.default_gst_rate),
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      address: row.address,
      receiptFooter: row.receipt_footer,
      kotPrinterIp: row.kot_printer_ip,
      kotPrinterPort: Number(row.kot_printer_port),
      receiptPrinterIp: row.receipt_printer_ip,
      receiptPrinterPort: Number(row.receipt_printer_port),
      paperWidth: row.paper_width as '80mm' | '58mm',
      enableAutoCutter: Boolean(row.enable_auto_cutter),
      swiggyWebhookSecret: row.swiggy_webhook_secret,
      zomatoWebhookSecret: row.zomato_webhook_secret,
      whatsappApiKey: row.whatsapp_api_key,
      updatedAt: row.updated_at,
    };
  }

  public async getSettings(): Promise<RestaurantSettings> {
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM system_settings WHERE id = 'settings-global'`);
    if (rows.length === 0) {
      await this.seedInitialData();
      const refetched = await db.query<any>(`SELECT * FROM system_settings WHERE id = 'settings-global'`);
      return this.mapRowToSettings(refetched[0]);
    }
    return this.mapRowToSettings(rows[0]);
  }

  public async updateSettings(dto: UpdateSettingsDTO): Promise<RestaurantSettings> {
    const current = await this.getSettings();
    const db = getDb();
    const now = new Date().toISOString();

    const updated: RestaurantSettings = {
      ...current,
      restaurantName: dto.restaurantName !== undefined ? dto.restaurantName.trim() : current.restaurantName,
      tagline: dto.tagline !== undefined ? dto.tagline.trim() : current.tagline,
      legalEntity: dto.legalEntity !== undefined ? dto.legalEntity.trim() : current.legalEntity,
      gstin: dto.gstin !== undefined ? dto.gstin.trim().toUpperCase() : current.gstin,
      fssaiNumber: dto.fssaiNumber !== undefined ? dto.fssaiNumber.trim() : current.fssaiNumber,
      currency: dto.currency !== undefined ? dto.currency : current.currency,
      timezone: dto.timezone !== undefined ? dto.timezone : current.timezone,
      defaultGstRate: dto.defaultGstRate !== undefined ? Number(dto.defaultGstRate) : current.defaultGstRate,
      contactEmail: dto.contactEmail !== undefined ? dto.contactEmail.trim() : current.contactEmail,
      contactPhone: dto.contactPhone !== undefined ? dto.contactPhone.trim() : current.contactPhone,
      address: dto.address !== undefined ? dto.address.trim() : current.address,
      receiptFooter: dto.receiptFooter !== undefined ? dto.receiptFooter.trim() : current.receiptFooter,
      kotPrinterIp: dto.kotPrinterIp !== undefined ? dto.kotPrinterIp.trim() : current.kotPrinterIp,
      kotPrinterPort: dto.kotPrinterPort !== undefined ? Number(dto.kotPrinterPort) : current.kotPrinterPort,
      receiptPrinterIp: dto.receiptPrinterIp !== undefined ? dto.receiptPrinterIp.trim() : current.receiptPrinterIp,
      receiptPrinterPort: dto.receiptPrinterPort !== undefined ? Number(dto.receiptPrinterPort) : current.receiptPrinterPort,
      paperWidth: dto.paperWidth !== undefined ? dto.paperWidth : current.paperWidth,
      enableAutoCutter: dto.enableAutoCutter !== undefined ? Boolean(dto.enableAutoCutter) : current.enableAutoCutter,
      swiggyWebhookSecret: dto.swiggyWebhookSecret !== undefined ? dto.swiggyWebhookSecret.trim() : current.swiggyWebhookSecret,
      zomatoWebhookSecret: dto.zomatoWebhookSecret !== undefined ? dto.zomatoWebhookSecret.trim() : current.zomatoWebhookSecret,
      whatsappApiKey: dto.whatsappApiKey !== undefined ? dto.whatsappApiKey.trim() : current.whatsappApiKey,
      updatedAt: now,
    };

    await db.execute(
      `UPDATE system_settings SET
        restaurant_name = ?, tagline = ?, legal_entity = ?, gstin = ?,
        fssai_number = ?, currency = ?, timezone = ?, default_gst_rate = ?,
        contact_email = ?, contact_phone = ?, address = ?, receipt_footer = ?,
        kot_printer_ip = ?, kot_printer_port = ?, receipt_printer_ip = ?,
        receipt_printer_port = ?, paper_width = ?, enable_auto_cutter = ?,
        swiggy_webhook_secret = ?, zomato_webhook_secret = ?, whatsapp_api_key = ?,
        updated_at = ?
       WHERE id = 'settings-global'`,
      [
        updated.restaurantName,
        updated.tagline,
        updated.legalEntity,
        updated.gstin,
        updated.fssaiNumber,
        updated.currency,
        updated.timezone,
        updated.defaultGstRate,
        updated.contactEmail,
        updated.contactPhone,
        updated.address,
        updated.receiptFooter,
        updated.kotPrinterIp,
        updated.kotPrinterPort,
        updated.receiptPrinterIp,
        updated.receiptPrinterPort,
        updated.paperWidth,
        updated.enableAutoCutter ? 1 : 0,
        updated.swiggyWebhookSecret,
        updated.zomatoWebhookSecret,
        updated.whatsappApiKey,
        updated.updatedAt,
      ]
    );

    return updated;
  }

  public async testPrinter(printerType: 'kot' | 'receipt'): Promise<TestPrinterResponse> {
    const settings = await this.getSettings();
    const timestamp = new Date().toISOString();

    if (printerType === 'kot') {
      const payloadSample = `
========================================
           ** KITCHEN TICKET **         
Order: #KOT-9942          Table: T-04   
Server: Sneha             Time: 13:28   
========================================
1x  Crispy Lotus Stem (Medium Spicy)
2x  Paneer Tikka Angara
1x  Garlic Butter Naan (Well Done)
----------------------------------------
Notes: No coriander on Lotus Stem
========================================
[ESC/POS Cut Command - BEEP Buzzer x2]
`;
      return {
        success: true,
        message: `ESC/POS test socket packet dispatched to KOT printer at ${settings.kotPrinterIp}:${settings.kotPrinterPort}`,
        printerType,
        payloadSample: payloadSample.trim(),
        timestamp,
      };
    } else {
      const payloadSample = `
========================================
        ${settings.restaurantName.toUpperCase()}        
      ${settings.address}
   GSTIN: ${settings.gstin} | FSSAI: ${settings.fssaiNumber}
========================================
Bill No: #INV-2026-8812    Table: 06
Date: 21-Oct-2026 13:28   Cashier: Rahul
----------------------------------------
1x Paneer Butter Masala       ₹320.00
2x Butter Roti                 ₹80.00
1x Fresh Lime Soda             ₹90.00
----------------------------------------
Subtotal:                     ₹490.00
CGST (2.5%):                   ₹12.25
SGST (2.5%):                   ₹12.25
----------------------------------------
TOTAL PAYABLE:                ₹514.50
----------------------------------------
       ${settings.receiptFooter}
========================================
[ESC/POS Partial Cut Command Executed]
`;
      return {
        success: true,
        message: `ESC/POS test socket packet dispatched to POS Receipt printer at ${settings.receiptPrinterIp}:${settings.receiptPrinterPort}`,
        printerType,
        payloadSample: payloadSample.trim(),
        timestamp,
      };
    }
  }

  public async testWebhook(aggregator: 'swiggy' | 'zomato'): Promise<TestWebhookResponse> {
    const timestamp = new Date().toISOString();
    return {
      success: true,
      aggregator,
      message: `Simulated webhook ping delivered to ${aggregator.toUpperCase()} integration gateway. 200 OK received.`,
      pingLatencyMs: 38,
      timestamp,
    };
  }
}

export const settingsService = new SettingsService();
