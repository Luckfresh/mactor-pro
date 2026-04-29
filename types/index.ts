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

export interface Visit {
  date: string            // ISO date string
  source: string          // 'Inspection' | 'Repair'
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
  status: string
  materialCost: number
  photos: VisitPhotos
}

export interface VisitPhotos {
  common: string
  exterior: string
  windows: string
  wallCeiling: string
  bath: string
  kitchen: string
  floor: string
  electrical: string
  plumbing: string
  hvac: string
  extra: string
  before: string
  after: string
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

export interface BuildingStats {
  name: string
  config: BuildingConfig
  units: UnitSummary[]
  pendingApprovals: number
  hoursUsedThisCycle: number
  materialsThisCycle: number
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

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
      buildings: string[]
    }
  }
}
