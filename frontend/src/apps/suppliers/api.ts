import { apiClient } from '../../core/api-client';
import { Supplier, PurchaseOrder, CreateSupplierDto, CreatePurchaseOrderDto, UpdatePOStatusDto } from './types';

export const supplierApi = {
  async getSuppliers(category?: string): Promise<Supplier[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await apiClient.get<Supplier[]>(`/suppliers${qs}`);
    return res.data;
  },

  async getSupplierById(id: string): Promise<Supplier> {
    const res = await apiClient.get<Supplier>(`/suppliers/${id}`);
    return res.data;
  },

  async createSupplier(dto: CreateSupplierDto): Promise<Supplier> {
    const res = await apiClient.post<Supplier>('/suppliers', dto);
    return res.data;
  },

  async getPurchaseOrders(status?: string): Promise<PurchaseOrder[]> {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await apiClient.get<PurchaseOrder[]>(`/suppliers/orders${qs}`);
    return res.data;
  },

  async getPOById(id: string): Promise<PurchaseOrder> {
    const res = await apiClient.get<PurchaseOrder>(`/suppliers/orders/${id}`);
    return res.data;
  },

  async createPurchaseOrder(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const res = await apiClient.post<PurchaseOrder>('/suppliers/orders', dto);
    return res.data;
  },

  async updatePOStatus(id: string, dto: UpdatePOStatusDto): Promise<PurchaseOrder> {
    const res = await apiClient.patch<PurchaseOrder>(`/suppliers/orders/${id}/status`, dto);
    return res.data;
  },
};

