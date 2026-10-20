export interface MenuItem {
  id: string;
  name: string;
  category: 'Small plates' | 'Mains' | 'Sides' | 'Desserts' | 'Drinks';
  price: number;
  note?: string;
  allergens?: string[];
  availability: 'Available' | 'Sold out' | 'Hidden';
  color?: string;
}

