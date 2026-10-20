import { TableRecord, TableStatus } from './types';
import { NotFoundError } from '../../core/errors';

export class TableService {
  private tables: TableRecord[] = [
    { id: 'tbl_1', tableNumber: '01', zone: 'Main room', seats: 2, party: '', seatedAt: '', status: 'Available' },
    { id: 'tbl_2', tableNumber: '02', zone: 'Main room', seats: 4, party: 'Maya Patel · 2', seatedAt: '12:10', status: 'Ordering' },
    { id: 'tbl_3', tableNumber: '03', zone: 'Patio', seats: 4, party: 'Reserved · Rao party', seatedAt: '13:00', status: 'Reserved' },
    { id: 'tbl_4', tableNumber: '04', zone: 'Patio', seats: 6, party: 'Chen party · 4', seatedAt: '12:24', status: 'Dining' },
    { id: 'tbl_5', tableNumber: '05', zone: 'Counter', seats: 2, party: '', seatedAt: '', status: 'Available' },
  ];

  public getAll(zone?: string) {
    if (zone && zone !== 'All') {
      return this.tables.filter(t => t.zone.toLowerCase() === zone.toLowerCase());
    }
    return this.tables;
  }

  public updateStatus(id: string, status: TableStatus, party?: string): TableRecord {
    const table = this.tables.find(t => t.id === id || t.tableNumber === id);
    if (!table) {
      throw new NotFoundError(`Table ${id} not found`);
    }
    table.status = status;
    if (party !== undefined) table.party = party;
    if (status === 'Seated' || status === 'Ordering') {
      table.seatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (status === 'Available') {
      table.party = '';
      table.seatedAt = '';
    }
    return table;
  }
}

export const tableService = new TableService();

