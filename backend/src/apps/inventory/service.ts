import { InventoryItem } from './types';
import { NotFoundError } from '../../core/errors';

export class InventoryService {
  private items: InventoryItem[] = [
    { id: 'inv_1', ingredient: 'Arborio rice · 890104', location: 'Dry store', onHand: '8.4 kg', reorderPoint: '5 kg', batchExpiry: 'B-214 · 30 Nov', unitCost: 220, status: 'In stock' },
    { id: 'inv_2', ingredient: 'Burrata · 890281', location: 'Walk-in chiller', onHand: '2.0 kg', reorderPoint: '3 kg', batchExpiry: 'B-047 · 22 Oct', unitCost: 680, status: 'Low stock' },
    { id: 'inv_3', ingredient: 'Blood orange', location: 'Produce prep', onHand: '4 kg', reorderPoint: '5 kg', batchExpiry: 'B-118 · 21 Oct', unitCost: 160, status: 'Expiring soon' },
    { id: 'inv_4', ingredient: 'Olive oil · 890480', location: 'Dry store', onHand: '12 L', reorderPoint: '4 L', batchExpiry: 'B-032 · 18 Feb 27', unitCost: 940, status: 'In stock' },
  ];

  public getAll(status?: string) {
    if (status && status !== 'All') {
      return this.items.filter(i => i.status.toLowerCase() === status.toLowerCase());
    }
    return this.items;
  }

  public getAlerts() {
    return {
      lowStock: this.items.filter(i => i.status === 'Low stock'),
      expiringSoon: this.items.filter(i => i.status === 'Expiring soon'),
    };
  }

  public updateStock(id: string, onHand: string, status?: InventoryItem['status']): InventoryItem {
    const item = this.items.find(i => i.id === id);
    if (!item) {
      throw new NotFoundError(`Inventory item ${id} not found`);
    }
    item.onHand = onHand;
    if (status) item.status = status;
    return item;
  }
}

export const inventoryService = new InventoryService();

