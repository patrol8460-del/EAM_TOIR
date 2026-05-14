import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'


// ========== Types ==========

interface SearchCondition {
  field: string
  operator: 'includes' | 'excludes' | 'equals' | 'notEquals' | 'greaterThan' | 'lessThan'
  value: string | number | boolean
  values?: (string | number | boolean)[]
}

// ========== Field Definitions ==========

type ScalarFieldType = 'string' | 'number' | 'boolean' | 'date'

/** Maps searchable field key → Prisma column name and value type */
const SCALAR_FIELDS: Record<string, { column: string; type: ScalarFieldType }> = {
  name:                { column: 'name', type: 'string' },
  code:                { column: 'code', type: 'string' },
  manufacturer:        { column: 'manufacturer', type: 'string' },
  model:               { column: 'model', type: 'string' },
  serialNumber:        { column: 'serialNumber', type: 'string' },
  inventoryNumber:     { column: 'inventoryNumber', type: 'string' },
  topazNumber:         { column: 'topazNumber', type: 'string' },
  sapNumber:           { column: 'sapNumber', type: 'number' },
  abcdCode:            { column: 'abcdCode', type: 'string' },
  costCenter:          { column: 'costCenter', type: 'string' },
  unit:                { column: 'unit', type: 'string' },
  drawing:             { column: 'drawing', type: 'string' },
  equipmentClass:      { column: 'equipmentClass', type: 'string' },
  processImportance:   { column: 'processImportance', type: 'string' },
  description:         { column: 'description', type: 'string' },
  location:            { column: 'location', type: 'string' },
  status:              { column: 'status', type: 'string' },
  criticality:         { column: 'criticality', type: 'string' },
  quantity:            { column: 'quantity', type: 'number' },
  parentEquipmentSap:  { column: 'parentEquipmentSap', type: 'number' },
  commissionDate:      { column: 'commissionDate', type: 'date' },
  manufactureDate:     { column: 'manufactureDate', type: 'date' },
  decommissionDate:    { column: 'decommissionDate', type: 'date' },
  isKey:               { column: 'isKey', type: 'boolean' },
  isTest:              { column: 'isTest', type: 'boolean' },
  hasReserve:          { column: 'hasReserve', type: 'boolean' },
}

/** Maps dot-notation JSON field key → (JSON column name, inner key) */
const JSON_FIELDS: Record<string, { column: string; key: string }> = {
  // locationData
  'location.workshop':         { column: 'locationData', key: 'workshop' },
  'location.building':         { column: 'locationData', key: 'building' },
  'location.productionArea':   { column: 'locationData', key: 'productionArea' },
  'location.techArea':         { column: 'locationData', key: 'techArea' },
  'location.roomNumber':       { column: 'locationData', key: 'roomNumber' },
  'location.roomName':         { column: 'locationData', key: 'roomName' },
  'location.lineInstallation': { column: 'locationData', key: 'lineInstallation' },
  'location.floor':            { column: 'locationData', key: 'floor' },
  'location.span':             { column: 'locationData', key: 'span' },
  'location.projectNumber':    { column: 'locationData', key: 'projectNumber' },

  // responsibilityData
  'responsibility.responsibleWorkshop':          { column: 'responsibilityData', key: 'responsibleWorkshop' },
  'responsibility.responsibleSpecialistService': { column: 'responsibilityData', key: 'responsibleSpecialistService' },
  'responsibility.responsiblePerson':            { column: 'responsibilityData', key: 'responsiblePerson' },
  'responsibility.safetyResponsiblePerson':      { column: 'responsibilityData', key: 'safetyResponsiblePerson' },
  'responsibility.materiallyResponsiblePerson':  { column: 'responsibilityData', key: 'materiallyResponsiblePerson' },

  // maintenanceData
  'maintenance.shiftMode':                   { column: 'maintenanceData', key: 'shiftMode' },
  'maintenance.repairCycleStartDate':        { column: 'maintenanceData', key: 'repairCycleStartDate' },
  'maintenance.laborConditionsFactor':       { column: 'maintenanceData', key: 'laborConditionsFactor' },
  'maintenance.additionalRepairCoefficient': { column: 'maintenanceData', key: 'additionalRepairCoefficient' },
  'maintenance.toMechContractor':            { column: 'maintenanceData', key: 'toMechContractor' },
  'maintenance.trMechContractor':            { column: 'maintenanceData', key: 'trMechContractor' },
  'maintenance.krMechContractor':            { column: 'maintenanceData', key: 'krMechContractor' },
  'maintenance.toElecContractor':            { column: 'maintenanceData', key: 'toElecContractor' },
  'maintenance.trElecContractor':            { column: 'maintenanceData', key: 'trElecContractor' },
  'maintenance.krElecContractor':            { column: 'maintenanceData', key: 'krElecContractor' },
  'maintenance.toKipContractor':             { column: 'maintenanceData', key: 'toKipContractor' },
  'maintenance.trKipContractor':             { column: 'maintenanceData', key: 'trKipContractor' },
  'maintenance.toAsuContractor':             { column: 'maintenanceData', key: 'toAsuContractor' },
  'maintenance.toWeldContractor':            { column: 'maintenanceData', key: 'toWeldContractor' },
  'maintenance.trWeldContractor':            { column: 'maintenanceData', key: 'trWeldContractor' },
  'maintenance.krWeldContractor':            { column: 'maintenanceData', key: 'krWeldContractor' },
  'maintenance.repairComplexityMech':        { column: 'maintenanceData', key: 'repairComplexityMech' },
  'maintenance.repairComplexityElec':        { column: 'maintenanceData', key: 'repairComplexityElec' },
  'maintenance.repairComplexityKip':         { column: 'maintenanceData', key: 'repairComplexityKip' },
  'maintenance.repairComplexityAsu':         { column: 'maintenanceData', key: 'repairComplexityAsu' },
  'maintenance.repairComplexityWeld':        { column: 'maintenanceData', key: 'repairComplexityWeld' },

  // verificationData
  'verification.lastVerificationDate': { column: 'verificationData', key: 'lastVerificationDate' },
  'verification.validUntilDate':       { column: 'verificationData', key: 'validUntilDate' },

  // safetyData
  'safety.isHazardousFacility':          { column: 'safetyData', key: 'isHazardousFacility' },
  'safety.isChemicalHazardous':          { column: 'safetyData', key: 'isChemicalHazardous' },
  'safety.isSafetyCritical':             { column: 'safetyData', key: 'isSafetyCritical' },
  'safety.isNuclearInstallation':        { column: 'safetyData', key: 'isNuclearInstallation' },
  'safety.isEnvironmentalImpact':        { column: 'safetyData', key: 'isEnvironmentalImpact' },
  'safety.isFireProtection':             { column: 'safetyData', key: 'isFireProtection' },
  'safety.safetyClass':                  { column: 'safetyData', key: 'safetyClass' },
  'safety.classificationCode':           { column: 'safetyData', key: 'classificationCode' },
  'safety.registrationNumber':           { column: 'safetyData', key: 'registrationNumber' },
  'safety.externalSupervisionAuthority': { column: 'safetyData', key: 'externalSupervisionAuthority' },
  'safety.internalSupervisionAuthority': { column: 'safetyData', key: 'internalSupervisionAuthority' },

  // supervisionData
  'supervision.supervisionType':        { column: 'supervisionData', key: 'supervisionType' },
  'supervision.nextSupervisionDate':    { column: 'supervisionData', key: 'nextSupervisionDate' },
  'supervision.nextInspectionDate':     { column: 'supervisionData', key: 'nextInspectionDate' },
  'supervision.nextDiagnosticsDate':    { column: 'supervisionData', key: 'nextDiagnosticsDate' },
  'supervision.permittedOperationDate': { column: 'supervisionData', key: 'permittedOperationDate' },
}

// ========== Helpers ==========

/** Strip `*` wildcards and indicate whether any were present */
function parseWildcard(value: string): { hasWildcard: boolean; text: string } {
  if (value.includes('*')) {
    return { hasWildcard: true, text: value.replace(/\*/g, '') }
  }
  return { hasWildcard: false, text: value }
}

/** Case-insensitive string comparison with wildcard support */
function stringCompare(fieldValue: string, operator: string, searchValue: string): boolean {
  const { hasWildcard, text } = parseWildcard(searchValue)
  const lowerField = fieldValue.toLowerCase()
  const lowerText = text.toLowerCase()
  const lowerSearch = searchValue.toLowerCase()

  switch (operator) {
    case 'includes':
      return hasWildcard ? lowerField.includes(lowerText) : lowerField === lowerSearch
    case 'excludes':
      return hasWildcard ? !lowerField.includes(lowerText) : lowerField !== lowerSearch
    case 'equals':
      return lowerField === lowerSearch
    case 'notEquals':
      return lowerField !== lowerSearch
    case 'greaterThan':
      return fieldValue > searchValue
    case 'lessThan':
      return fieldValue < searchValue
    default:
      return true
  }
}

/**
 * Evaluate a single condition against a DB record in memory.
 * All string comparisons are case-insensitive via toLowerCase() — works for Cyrillic.
 */
function matchesInMemory(record: any, condition: SearchCondition): boolean {
  const { field, operator, value } = condition
  const strValue = String(value ?? '')

  // --- JSON field ---
  if (JSON_FIELDS[field]) {
    const { column, key } = JSON_FIELDS[field]
    const jsonStr = record[column]
    if (!jsonStr) {
      // Null JSON column: only matches excludes / notEquals
      return operator === 'excludes' || operator === 'notEquals'
    }
    try {
      const data = JSON.parse(jsonStr)
      const fieldValue = data[key]

      if (fieldValue === null || fieldValue === undefined) {
        return operator === 'excludes' || operator === 'notEquals'
      }

      // Boolean JSON value
      if (typeof fieldValue === 'boolean') {
        const boolSearch = value === true || value === 'true'
        if (operator === 'equals') return fieldValue === boolSearch
        if (operator === 'notEquals') return fieldValue !== boolSearch
        return true
      }

      // Numeric JSON value
      if (typeof fieldValue === 'number') {
        if (operator === 'includes' || operator === 'excludes') {
          const { hasWildcard, text } = parseWildcard(strValue)
          const fieldStr = String(fieldValue)
          const match = hasWildcard
            ? fieldStr.toLowerCase().includes(text.toLowerCase())
            : fieldStr.toLowerCase() === strValue.toLowerCase()
          return operator === 'includes' ? match : !match
        }
        const numSearch = Number(value)
        if (isNaN(numSearch)) return false
        switch (operator) {
          case 'equals': return fieldValue === numSearch
          case 'notEquals': return fieldValue !== numSearch
          case 'greaterThan': return fieldValue > numSearch
          case 'lessThan': return fieldValue < numSearch
          default: return true
        }
      }

      // String JSON value
      return stringCompare(String(fieldValue), operator, strValue)
    } catch {
      return false
    }
  }

  // --- Scalar field ---
  const scalarDef = SCALAR_FIELDS[field]
  if (!scalarDef) return true // unknown field, don't filter

  const { column, type } = scalarDef
  const fieldValue = record[column]

  // Null field values
  if (fieldValue === null || fieldValue === undefined) {
    return operator === 'excludes' || operator === 'notEquals'
  }

  // Boolean scalar
  if (type === 'boolean') {
    const boolSearch = value === true || value === 'true'
    if (operator === 'equals') return fieldValue === boolSearch
    if (operator === 'notEquals') return fieldValue !== boolSearch
    return true
  }

  // Number scalar
  if (type === 'number') {
    if (operator === 'includes' || operator === 'excludes') {
      const { hasWildcard, text } = parseWildcard(strValue)
      const fieldStr = String(fieldValue)
      const match = hasWildcard
        ? fieldStr.toLowerCase().includes(text.toLowerCase())
        : fieldStr.toLowerCase() === strValue.toLowerCase()
      return operator === 'includes' ? match : !match
    }
    const numSearch = Number(value)
    if (isNaN(numSearch)) return false
    switch (operator) {
      case 'equals': return fieldValue === numSearch
      case 'notEquals': return fieldValue !== numSearch
      case 'greaterThan': return fieldValue > numSearch
      case 'lessThan': return fieldValue < numSearch
      default: return true
    }
  }

  // String / Date scalar — use case-insensitive string comparison
  return stringCompare(String(fieldValue), operator, strValue)
}

// ========== POST Handler ==========

export async function POST(request: NextRequest) {
  try {
    // --- Auth ---
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // --- Parse body ---
    const body = await request.json()
    const conditions: SearchCondition[] = Array.isArray(body.conditions) ? body.conditions : []

    // --- All conditions processed in-memory for guaranteed case-insensitive search (Cyrillic) ---
    // SQLite LIKE is case-insensitive only for ASCII; JS toLowerCase() handles all Unicode including Russian.
    const memoryConditions: SearchCondition[] = []

    for (const cond of conditions) {
      const { field } = cond
      // Only keep known fields
      if (JSON_FIELDS[field] || SCALAR_FIELDS[field]) {
        memoryConditions.push(cond)
      }
    }

    let records = await db.equipment.findMany({
      include: {
        department: { select: { name: true, code: true } },
        equipmentType: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // --- Apply all filters in-memory (case-insensitive via toLowerCase) ---
    if (memoryConditions.length > 0) {
      records = records.filter((record) =>
        memoryConditions.every((cond) => {
          // Multi-value support (OR logic): condition matches if ANY value matches
          if (cond.values && cond.values.length > 0) {
            return cond.values.some((v) =>
              matchesInMemory(record, { ...cond, value: v }),
            )
          }
          // Single value fallback
          return matchesInMemory(record, cond)
        }),
      )
    }

    // --- Response ---
    return NextResponse.json({
      items: records,
      total: records.length,
    })
  } catch (error) {
    console.error('Equipment search error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
