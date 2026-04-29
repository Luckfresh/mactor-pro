export type UserRole = 'admin' | 'manager'

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  buildings: string[]  // building names this user can access; empty = all (admin)
}

export interface BuildingConfig {
  buildingName: string
  hoursPerCycle: number
  cycleDayStart: number   // day of month cycle resets (e.g. 1)
  managerEmail: string
  active: boolean
}

export type VisitSource = 'Inspection' | 'Repair'
export type VisitStatus = 'Completed' | 'Pending' | 'In Progress'

export interface Visit {
  date: string            // ISO date string
  source: VisitSource
  technician: string
  building: string
  unitId: string
  areaType: string
  areaName: string
  visitType: string
  timeIn: string
  timeOut: string
  duration: number        // decimal hours
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

export interface BuildingStats {
  name: string
  config: BuildingConfig
  units: UnitSummary[]
  pendingApprovals: number
  hoursBalance: HoursBalance
  materialsThisCycle: number
}
