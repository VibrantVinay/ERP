export type TaskCategory = 'opening' | 'shift_change' | 'closing' | 'hygiene' | 'safety';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'flagged';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface OperationalTask {
  id: string;
  branchId: string;
  category: TaskCategory;
  title: string;
  description?: string;
  assignedRole: string;
  assignedStaffName?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemperatureLog {
  id: string;
  branchId: string;
  unitName: string;
  targetMinTemp: number;
  targetMaxTemp: number;
  recordedTemp: number;
  unit: 'C' | 'F';
  isOutOfRange: boolean;
  recordedBy: string;
  notes?: string;
  recordedAt: string;
}

export interface CreateTaskDTO {
  branchId: string;
  category: TaskCategory;
  title: string;
  description?: string;
  assignedRole?: string;
  assignedStaffName?: string;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface CompleteTaskDTO {
  completedBy: string;
  notes?: string;
  status?: TaskStatus;
}

export interface LogTemperatureDTO {
  branchId: string;
  unitName: string;
  recordedTemp: number;
  unit?: 'C' | 'F';
  targetMinTemp?: number;
  targetMaxTemp?: number;
  recordedBy: string;
  notes?: string;
}
