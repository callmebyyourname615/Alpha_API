// ============================================================
// FILE: src/appointment/appointment.enum.ts
// ============================================================

export enum AppointmentStatus {
  PENDING     = 'PENDING',
  SCHEDULED   = 'SCHEDULED',
  RESCHEDULED = 'RESCHEDULED',
  CONFIRMED   = 'CONFIRMED',
  CANCELLED   = 'CANCELLED',
  COMPLETED   = 'COMPLETED',
}

export enum CreatorRole {
  SUPER_SUPER_ADMIN = 'SUPER_SUPER_ADMIN',
  SUPER_ADMIN       = 'SUPER_ADMIN',
  ADMIN             = 'ADMIN',
  TEACHER           = 'TEACHER',
  PARENT            = 'PARENT',
  // Add more roles here as needed
}

export enum PersonType {
  SUPER_SUPER_ADMIN = 'SUPER_SUPER_ADMIN',
  SUPER_ADMIN       = 'SUPER_ADMIN',
  ADMIN             = 'ADMIN',
  TEACHER           = 'TEACHER',
  PARENT            = 'PARENT',
  // Add more types here as needed
}

export enum ParticipantStatus {
  PENDING     = 'PENDING',
  ACCEPTED    = 'ACCEPTED',
  DECLINED    = 'DECLINED',
  RESCHEDULED = 'RESCHEDULED',
}