export type MenuAvailability = 'Available' | 'Sold out' | 'Hidden';

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelection: number;
  maxSelection: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  allergens: string[];
  modifierGroups?: ModifierGroup[];
  availability: MenuAvailability;
  taxRatePercent: number;
  branchId: string;
  updatedAt: string;
}

export interface CreateMenuItemDto {
  name: string;
  category: string;
  price: number;
  description?: string;
  allergens?: string[];
  modifierGroups?: ModifierGroup[];
  availability?: MenuAvailability;
  taxRatePercent?: number;
}
