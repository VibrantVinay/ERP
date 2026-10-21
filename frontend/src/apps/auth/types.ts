export type StaffRole =
  | 'owner'
  | 'manager'
  | 'cashier'
  | 'chef'
  | 'server'
  | 'driver'
  | 'cleaner'
  | 'accountant'
  | 'bartender'
  | 'host'
  | 'customer_terminal';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  restaurantId: string;
  branchScope: string;
  activeBranch: string;
  hasPin: boolean;
}

export interface AuthSessionResponse {
  token: string;
  user: UserProfile;
  availableBranches: string[];
}

export interface DemoPersona {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  pin: string;
  branch: string;
  description: string;
}

export const DEFAULT_DEMO_PERSONAS: DemoPersona[] = [
  { id: 'usr_owner_01', name: 'Aarav Mehta', email: 'aarav@rift.example', role: 'owner', pin: '1111', branch: 'Panaji Main', description: 'Restaurant Owner' },
  { id: 'usr_mgr_01', name: 'Rohan Sharma', email: 'rohan@rift.example', role: 'manager', pin: '2222', branch: 'Panaji Main', description: 'Floor Manager' },
  { id: 'usr_cashier_01', name: 'Priya Patel', email: 'priya@rift.example', role: 'cashier', pin: '3333', branch: 'Panaji Main', description: 'Head Cashier' },
  { id: 'usr_chef_01', name: 'Chef Vikram', email: 'vikram@rift.example', role: 'chef', pin: '4444', branch: 'Panaji Main', description: 'Executive Chef' },
  { id: 'usr_server_01', name: 'Ananya Roy', email: 'ananya@rift.example', role: 'server', pin: '5555', branch: 'Panaji Main', description: 'Lead Server' },
  { id: 'usr_driver_01', name: 'Karan Singh', email: 'karan@rift.example', role: 'driver', pin: '6666', branch: 'Panaji Main', description: 'Delivery Driver' },
  { id: 'usr_cleaner_01', name: 'Manoj Kumar', email: 'manoj@rift.example', role: 'cleaner', pin: '8888', branch: 'Panaji Main', description: 'Table Busser & Sanitizer' },
  { id: 'usr_acct_01', name: 'Neha Gupta', email: 'neha@rift.example', role: 'accountant', pin: '7777', branch: 'Panaji Main', description: 'Financial Accountant' },
  { id: 'usr_bar_01', name: 'Siddharth Rao', email: 'sid@rift.example', role: 'bartender', pin: '9999', branch: 'Panaji Main', description: 'Head Bartender & Mixologist' },
  { id: 'usr_host_01', name: 'Kavita Sen', email: 'kavita@rift.example', role: 'host', pin: '1234', branch: 'Panaji Main', description: 'Front Desk Hostess & Concierge' },
  { id: 'usr_terminal_01', name: 'Customer Terminal', email: 'terminal@rift.example', role: 'customer_terminal', pin: '', branch: 'Panaji Main', description: 'Public Self-Service Kiosk & Displays (No Login Required)' },
];
