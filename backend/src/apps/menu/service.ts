import { MenuItem } from './types';
import { NotFoundError } from '../../core/errors';

export class MenuService {
  private items: MenuItem[] = [
    { id: 'm_1', name: 'Burrata & heirloom tomato', category: 'Small plates', price: 485, note: 'Basil oil · sourdough', allergens: ['Dairy', 'Gluten'], availability: 'Available', color: 'sage' },
    { id: 'm_2', name: 'Wild mushroom risotto', category: 'Mains', price: 720, note: 'Aged parmesan · thyme', allergens: ['Dairy'], availability: 'Available', color: 'olive' },
    { id: 'm_3', name: 'Charred lemon chicken', category: 'Mains', price: 840, note: 'Herb jus · crispy potato', allergens: ['Dairy'], availability: 'Available', color: 'sand' },
    { id: 'm_4', name: 'Roasted pumpkin bowl', category: 'Small plates', price: 560, note: 'Whipped feta · hazelnut', allergens: ['Dairy', 'Nuts'], availability: 'Available', color: 'peach' },
    { id: 'm_5', name: 'House sourdough', category: 'Sides', price: 180, note: 'Cultured butter', allergens: ['Gluten', 'Dairy'], availability: 'Available', color: 'cream' },
    { id: 'm_6', name: 'Pistachio olive oil cake', category: 'Desserts', price: 360, note: 'Crème fraîche', allergens: ['Tree nuts', 'Dairy'], availability: 'Sold out', color: 'pink' },
    { id: 'm_7', name: 'Blood orange spritz', category: 'Drinks', price: 420, note: 'Orange · rosemary · soda', allergens: [], availability: 'Available', color: 'citrus' },
    { id: 'm_8', name: 'Cold brew tonic', category: 'Drinks', price: 290, note: 'Slow steep · citrus', allergens: [], availability: 'Available', color: 'coffee' }
  ];

  public getAll(category?: string) {
    if (category && category !== 'All dishes') {
      return this.items.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }
    return this.items;
  }

  public getById(id: string): MenuItem {
    const item = this.items.find(i => i.id === id);
    if (!item) {
      throw new NotFoundError(`Menu item ${id} not found`);
    }
    return item;
  }

  public setAvailability(id: string, availability: 'Available' | 'Sold out' | 'Hidden'): MenuItem {
    const item = this.getById(id);
    item.availability = availability;
    return item;
  }
}

export const menuService = new MenuService();

