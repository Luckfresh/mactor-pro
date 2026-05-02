export type UserRole = 'admin' | 'manager'

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  buildings: string[]
}

export interface BuildingConfig {
  buildingName: string
  hoursPerCycle: number
  cycleDayStart: number
  managerEmail: string
  clientId: string
  active: boolean
}

export interface ClientPlan {
  clientId: string
  clientName: string
  managerEmail: string
  buildings: string[]
  hoursPerCycle: number
  active: boolean
}

export interface CycleBalance {
  clientId: string
  cycleLabel: string
  plannedHours: number
  usedHours: number
  rolledOverIn: number
  rolledOverOut: number
  extraHours: number
  closedAt: string
}

export type VisitSource = 'Inspection' | 'Repair'
export type VisitStatus = 'Completed' | 'Pending' | 'In Progress'

export interface Visit {
  date: string
  source: VisitSource
  technician: string
  building: string
  unitId: string
  areaType: string
  areaName: string
  visitType: string
  timeIn: string
  timeOut: string
  duration: number
  problem: string
  workPerformed: string
  priority: string
  status: VisitStatus
  materialCost: number
  photos: VisitPhotos
}

export interface VisitPhotos {
  common: string | null
  exterior: string | null
  windows: string | null
  wallCeiling: string | null
  bath: string | null
  kitchen: string | null
  floor: string | null
  electrical: string | null
  plumbing: string | null
  hvac: string | null
  extra: string | null
  before: string | null
  after: string | null
}

export interface ReviewEntry {
  visitKey: string
  date: string
  technician: string
  building: string
  unitId: string
  areaName: string
  visitType: string
  workPerformed: string
  duration: number
  materialCost: number
  approved: boolean
  pmComments: string
  approvedBy: string
  approvalDate: string
  cycleLabel: string
}

export interface UnitSummary {
  unitId: string
  building: string
  areaType: string
  areaName: string
  totalVisits: number
  lastVisit: string
  totalHours: number
  totalMaterialCost: number
  inspectionVisits: number
  repairVisits: number
}

export interface HoursBalance {
  planHours: number
  usedHours: number
  rolledOverHours: number
  availableHours: number
  cycleLabel: string
  cycleStart: string
  cycleEnd: string
}

export interface ClientHoursBalance {
  clientId: string
  planHours: number
  rolledOverHours: number
  availableHours: number
  usedHours: number
  extraHours: number
  cycleLabel: string
  cycleStart: string
  cycleEnd: string
  byBuilding: Record<string, number>
}

export type WorkOrderStatus = 'Pending' | 'Claimed' | 'In Progress' | 'Completed'
export type WorkOrderPriority = 'Low' | 'Medium' | 'High' | 'Emergency'

export interface WorkOrder {
  id: string
  createdAt: string
  building: string
  unitId: string
  areaName: string
  description: string
  priority: WorkOrderPriority
  createdBy: string
  status: WorkOrderStatus
  claimedBy: string
  claimedAt: string
  startedAt: string
  completedAt: string
  duration: number
  materialCost: number
  cycleLabel: string
  notes: string
}

export interface BuildingStats {
  name: string
  config: BuildingConfig
  units: UnitSummary[]
  pendingApprovals: number
  hoursUsedThisCycle: number
  materialsThisCycle: number
}
