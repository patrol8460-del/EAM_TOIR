import { db } from '../src/lib/db'
import { scryptSync, randomBytes } from 'crypto'

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

async function seed() {
  console.log('🌱 Seeding database...')

  // ============ USERS ============
  const adminExists = await db.user.findUnique({ where: { email: 'admin@enterprise.ru' } })
  let admin: { id: string }
  if (!adminExists) {
    admin = await db.user.create({
      data: {
        email: 'admin@enterprise.ru',
        passwordHash: hashPassword('admin123'),
        name: 'Администратор',
        role: 'admin',
        isActive: true,
      },
    })
    console.log('✅ Admin user created')
  } else {
    admin = adminExists
  }

  const managerExists = await db.user.findUnique({ where: { email: 'manager@enterprise.ru' } })
  let manager: { id: string }
  if (!managerExists) {
    manager = await db.user.create({
      data: {
        email: 'manager@enterprise.ru',
        passwordHash: hashPassword('manager123'),
        name: 'Иванов Иван Иванович',
        role: 'manager',
        isActive: true,
      },
    })
    console.log('✅ Manager user created')
  } else {
    manager = managerExists
  }

  const engineerExists = await db.user.findUnique({ where: { email: 'engineer@enterprise.ru' } })
  let engineer: { id: string }
  if (!engineerExists) {
    engineer = await db.user.create({
      data: {
        email: 'engineer@enterprise.ru',
        passwordHash: hashPassword('engineer123'),
        name: 'Петров Пётр Петрович',
        role: 'engineer',
        isActive: true,
      },
    })
    console.log('✅ Engineer user created')
  } else {
    engineer = engineerExists
  }

  const workerExists = await db.user.findUnique({ where: { email: 'worker@enterprise.ru' } })
  let worker: { id: string }
  if (!workerExists) {
    worker = await db.user.create({
      data: {
        email: 'worker@enterprise.ru',
        passwordHash: hashPassword('worker123'),
        name: 'Сидоров Сергей Сергеевич',
        role: 'worker',
        isActive: true,
      },
    })
    console.log('✅ Worker user created')
  } else {
    worker = workerExists
  }

  // Additional workers
  const worker2Email = 'kovalev@enterprise.ru'
  const worker2Exists = await db.user.findUnique({ where: { email: worker2Email } })
  let worker2: { id: string } = worker2Exists || (await db.user.create({
    data: {
      email: worker2Email,
      passwordHash: hashPassword('worker123'),
      name: 'Ковалёв Алексей Дмитриевич',
      role: 'worker',
      isActive: true,
    },
  }))

  const worker3Email = 'morozov@enterprise.ru'
  const worker3Exists = await db.user.findUnique({ where: { email: worker3Email } })
  let worker3: { id: string } = worker3Exists || (await db.user.create({
    data: {
      email: worker3Email,
      passwordHash: hashPassword('worker123'),
      name: 'Морозов Дмитрий Владимирович',
      role: 'worker',
      isActive: true,
    },
  }))

  const worker4Email = 'volkov@enterprise.ru'
  const worker4Exists = await db.user.findUnique({ where: { email: worker4Email } })
  let worker4: { id: string } = worker4Exists || (await db.user.create({
    data: {
      email: worker4Email,
      passwordHash: hashPassword('worker123'),
      name: 'Волков Николай Андреевич',
      role: 'engineer',
      isActive: true,
    },
  }))

  // ============ DEPARTMENTS ============
  const mechDept = await db.department.upsert({
    where: { code: 'MECH' },
    update: {},
    create: { name: 'Механический цех', code: 'MECH', headName: 'Иванов И.И.' },
  })

  const elecDept = await db.department.upsert({
    where: { code: 'ELEC' },
    update: {},
    create: { name: 'Электроцех', code: 'ELEC', headName: 'Петров П.П.' },
  })

  const autoDept = await db.department.upsert({
    where: { code: 'AUTO' },
    update: {},
    create: { name: 'Автоматизация и КИПиА', code: 'AUTO', headName: 'Волков Н.А.' },
  })

  const buildDept = await db.department.upsert({
    where: { code: 'BUILD' },
    update: {},
    create: { name: 'Строительно-ремонтный цех', code: 'BUILD', headName: 'Ковалёв А.Д.' },
  })

  // ============ BRIGADES ============
  const brigade1 = await db.brigade.upsert({
    where: { code: 'BRG-1' },
    update: {},
    create: { name: 'Бригада механиков №1', code: 'BRG-1', departmentId: mechDept.id, foremanId: engineer.id, description: 'Механический ремонт оборудования' },
  })

  const brigade2 = await db.brigade.upsert({
    where: { code: 'BRG-2' },
    update: {},
    create: { name: 'Бригада электриков №1', code: 'BRG-2', departmentId: elecDept.id, foremanId: worker4.id, description: 'Электромонтажные работы' },
  })

  const brigade3 = await db.brigade.upsert({
    where: { code: 'BRG-3' },
    update: {},
    create: { name: 'Бригада КИПиА', code: 'BRG-3', departmentId: autoDept.id, foremanId: worker2.id, description: 'Ремонт приборов автоматики' },
  })

  const brigade4 = await db.brigade.upsert({
    where: { code: 'BRG-4' },
    update: {},
    create: { name: 'Бригада универсальная', code: 'BRG-4', departmentId: buildDept.id, foremanId: worker3.id, description: 'Строительно-ремонтные и монтажные работы' },
  })

  // Assign users to brigades/departments
  await db.user.update({ where: { id: engineer.id }, data: { departmentId: mechDept.id, brigadeId: brigade1.id } })
  await db.user.update({ where: { id: worker.id }, data: { departmentId: mechDept.id, brigadeId: brigade1.id } })
  await db.user.update({ where: { id: worker2.id }, data: { departmentId: autoDept.id, brigadeId: brigade3.id } })
  await db.user.update({ where: { id: worker3.id }, data: { departmentId: buildDept.id, brigadeId: brigade4.id } })
  await db.user.update({ where: { id: worker4.id }, data: { departmentId: elecDept.id, brigadeId: brigade2.id } })
  await db.user.update({ where: { id: manager.id }, data: { departmentId: mechDept.id } })

  // ============ EQUIPMENT TYPES ============
  const pumpType = await db.equipmentType.upsert({
    where: { code: 'PUMP' },
    update: {},
    create: { name: 'Насосное оборудование', code: 'PUMP' },
  })

  const compressorType = await db.equipmentType.upsert({
    where: { code: 'COMP' },
    update: {},
    create: { name: 'Компрессорное оборудование', code: 'COMP' },
  })

  const motorType = await db.equipmentType.upsert({
    where: { code: 'MOTOR' },
    update: {},
    create: { name: 'Электродвигатели', code: 'MOTOR' },
  })

  const transformerType = await db.equipmentType.upsert({
    where: { code: 'TRANS' },
    update: {},
    create: { name: 'Трансформаторы', code: 'TRANS' },
  })

  const valveType = await db.equipmentType.upsert({
    where: { code: 'VALVE' },
    update: {},
    create: { name: 'Запорная арматура', code: 'VALVE' },
  })

  const conveyorType = await db.equipmentType.upsert({
    where: { code: 'CONV' },
    update: {},
    create: { name: 'Конвейерное оборудование', code: 'CONV' },
  })

  // ============ EQUIPMENT ============
  const equipmentData = [
    {
      name: 'Центробежный насос Н-201', code: 'Н-201', departmentId: mechDept.id, equipmentTypeId: pumpType.id, location: 'Цех №31, пом. 201', manufacturer: 'ГМС Насосы', model: 'ЦН-200/300', serialNumber: 'SN-2019-00451', commissionDate: '2019-06-15', status: 'active', criticality: 'critical',
      inventoryNumber: '31001234567', quantity: 1, unit: 'шт', drawing: 'Н-201-СБ', equipmentClass: '1300_03 Насосное оборудование',
      topazNumber: 'ТОПАЗ-001', sapNumber: 10001, abcdCode: 'A', costCenter: 'U310020101',
      manufactureDate: '2019-03-15', decommissionDate: null, processImportance: 'Основное технологическое оборудование',
      isKey: true, isTest: false, hasReserve: false, parentEquipmentSap: null,
      locationData: JSON.stringify({ workshop: '31', building: '103', productionArea: 'Участок насосов', techArea: 'Участок 2', roomNumber: '201', roomName: 'Насосная станция', lineInstallation: 'Линия подачи воды', elevationMark: 0.0, axisX1: 'A', axisX2: 'A+5', axisY1: '1', axisY2: '1+3', projectNumber: 'ПР-2019-001', projectPosition: 'Н-201', span: 'А-Б', floor: 'Отм. 0.000' }),
      responsibilityData: JSON.stringify({ responsibleWorkshop: 'Цех 31', responsibleSpecialistService: 'Служба главного механика', responsiblePerson: 'Иванов И.И.', safetyResponsiblePerson: 'Петров П.П.', materiallyResponsiblePerson: 'Сидоров С.С.' }),
      maintenanceData: JSON.stringify({ toMechInterval: 6, trMechInterval: 12, krMechInterval: 60, toElecInterval: 12, trElecInterval: 24, krElecInterval: 48, toKipInterval: 12, trKipInterval: 24, toAsuInterval: 24, toMechContractor: 'Бригада №1', trMechContractor: 'ООО "Реммаш"', krMechContractor: 'ООО "Спецремонт"', toElecContractor: 'Бригада №2', trElecContractor: 'ООО "Электросервис"', krElecContractor: 'ООО "Спецремонт"', toKipContractor: 'Бригада КИПиА', trKipContractor: 'ООО "Автоматика"', toAsuContractor: 'ООО "АСКЭ"', repairComplexityMech: 3.5, repairComplexityElec: 2.0, repairComplexityKip: 1.5, repairComplexityAsu: 1.0, repairCycleStartDate: '2024-01-01', shiftMode: 'Непрерывная (3 смены)', laborConditionsFactor: 1.1, additionalRepairCoefficient: 1.15 }),
      verificationData: JSON.stringify({ lastVerificationDate: '2025-01-10', validUntilDate: '2026-01-10' }),
      safetyData: JSON.stringify({ isHazardousFacility: false, isChemicalHazardous: false, isSafetyCritical: true, isNuclearInstallation: false, safetyNormativeDoc: 'ГОСТ Р 53672-2009', safetyClass: 3, classificationCode: 'Н - элемент нормальной эксплуатации', isEnvironmentalImpact: false, isFireProtection: false, externalSupervisionAuthority: '', internalSupervisionAuthority: 'ОТК Цеха 31', registrationNumber: '', serviceLifeYears: 25, serviceLifeExpiryDate: '2044-03-15' }),
      supervisionData: JSON.stringify({ supervisionType: 'Техническое освидетельствование', nextSupervisionDate: '2025-12-15', nextInspectionDate: '2025-09-15', nextDiagnosticsDate: '2026-03-15', serviceLifeExtensionDocType: null, serviceLifeExtensionDocNumber: null, permittedOperationDate: '2019-06-15' }),
    },
    {
      name: 'Центробежный насос Н-202', code: 'Н-202', departmentId: mechDept.id, equipmentTypeId: pumpType.id, location: 'Цех №31, пом. 202', manufacturer: 'ГМС Насосы', model: 'ЦН-200/300', serialNumber: 'SN-2019-00452', commissionDate: '2019-08-01', status: 'active', criticality: 'high',
      inventoryNumber: '31001234568', quantity: 1, unit: 'шт', drawing: 'Н-202-СБ', equipmentClass: '1300_03 Насосное оборудование',
      topazNumber: 'ТОПАЗ-002', sapNumber: 10002, abcdCode: 'A', costCenter: 'U310020101',
      manufactureDate: '2019-04-20', decommissionDate: null, processImportance: 'Основное технологическое оборудование',
      isKey: true, isTest: false, hasReserve: true, parentEquipmentSap: 10001,
      locationData: JSON.stringify({ workshop: '31', building: '103', productionArea: 'Участок насосов', techArea: 'Участок 2', roomNumber: '202', roomName: 'Насосная станция', lineInstallation: 'Линия подачи воды', elevationMark: 0.0, axisX1: 'A+6', axisX2: 'A+11', axisY1: '1', axisY2: '1+3', projectNumber: 'ПР-2019-001', projectPosition: 'Н-202', span: 'А-Б', floor: 'Отм. 0.000' }),
      responsibilityData: JSON.stringify({ responsibleWorkshop: 'Цех 31', responsibleSpecialistService: 'Служба главного механика', responsiblePerson: 'Иванов И.И.', safetyResponsiblePerson: 'Петров П.П.', materiallyResponsiblePerson: 'Сидоров С.С.' }),
      maintenanceData: JSON.stringify({ toMechInterval: 6, trMechInterval: 12, krMechInterval: 60, toElecInterval: 12, trElecInterval: 24, krElecInterval: 48, toKipInterval: 12, trKipInterval: 24, toAsuInterval: 24, toMechContractor: 'Бригада №1', trMechContractor: 'ООО "Реммаш"', krMechContractor: 'ООО "Спецремонт"', toElecContractor: 'Бригада №2', trElecContractor: 'ООО "Электросервис"', krElecContractor: 'ООО "Спецремонт"', toKipContractor: 'Бригада КИПиА', trKipContractor: 'ООО "Автоматика"', toAsuContractor: 'ООО "АСКЭ"', repairComplexityMech: 3.5, repairComplexityElec: 2.0, repairComplexityKip: 1.5, repairComplexityAsu: 1.0, repairCycleStartDate: '2024-01-01', shiftMode: 'Непрерывная (3 смены)', laborConditionsFactor: 1.1, additionalRepairCoefficient: 1.15 }),
      verificationData: JSON.stringify({ lastVerificationDate: '2025-01-10', validUntilDate: '2026-01-10' }),
      safetyData: JSON.stringify({ isHazardousFacility: false, isChemicalHazardous: false, isSafetyCritical: true, isNuclearInstallation: false, safetyNormativeDoc: 'ГОСТ Р 53672-2009', safetyClass: 3, classificationCode: 'Н - элемент нормальной эксплуатации', isEnvironmentalImpact: false, isFireProtection: false, externalSupervisionAuthority: '', internalSupervisionAuthority: 'ОТК Цеха 31', registrationNumber: '', serviceLifeYears: 25, serviceLifeExpiryDate: '2044-04-20' }),
      supervisionData: JSON.stringify({ supervisionType: 'Техническое освидетельствование', nextSupervisionDate: '2026-01-15', nextInspectionDate: '2025-10-15', nextDiagnosticsDate: '2026-04-20', serviceLifeExtensionDocType: null, serviceLifeExtensionDocNumber: null, permittedOperationDate: '2019-08-01' }),
    },
    {
      name: 'Поршневой насос Н-205', code: 'Н-205', departmentId: mechDept.id, equipmentTypeId: pumpType.id, location: 'Цех №31, пом. 301', manufacturer: 'Уралгидромаш', model: 'ПН-100/250', serialNumber: 'SN-2018-00123', commissionDate: '2018-09-10', status: 'under_repair', criticality: 'critical',
      inventoryNumber: '31001234569', quantity: 1, unit: 'шт', drawing: 'Н-205-СБ', equipmentClass: '1300_03 Насосное оборудование',
      topazNumber: 'ТОПАЗ-005', sapNumber: 10005, abcdCode: 'A', costCenter: 'U310020101',
      manufactureDate: '2018-05-10', decommissionDate: null, processImportance: 'Основное технологическое оборудование',
      isKey: true, isTest: false, hasReserve: false, parentEquipmentSap: null,
      locationData: JSON.stringify({ workshop: '31', building: '103', productionArea: 'Участок насосов', techArea: 'Участок 3', roomNumber: '301', roomName: 'Помещение насосов высокого давления', lineInstallation: 'Линия гидравлики', elevationMark: 3.5, axisX1: 'Б', axisX2: 'Б+4', axisY1: '2', axisY2: '2+4', projectNumber: 'ПР-2018-003', projectPosition: 'Н-205', span: 'Б-В', floor: 'Отм. +3.500' }),
      responsibilityData: JSON.stringify({ responsibleWorkshop: 'Цех 31', responsibleSpecialistService: 'Служба главного механика', responsiblePerson: 'Ковалёв А.Д.', safetyResponsiblePerson: 'Морозов Д.В.', materiallyResponsiblePerson: 'Сидоров С.С.' }),
      maintenanceData: JSON.stringify({ toMechInterval: 3, trMechInterval: 6, krMechInterval: 48, toElecInterval: 12, trElecInterval: 24, krElecInterval: 48, toKipInterval: 6, trKipInterval: 12, toAsuInterval: 24, toMechContractor: 'Бригада №1', trMechContractor: 'ООО "Реммаш"', krMechContractor: 'ООО "Спецремонт"', toElecContractor: 'Бригада №2', trElecContractor: 'ООО "Электросервис"', krElecContractor: 'ООО "Спецремонт"', toKipContractor: 'Бригада КИПиА', trKipContractor: 'ООО "Автоматика"', toAsuContractor: 'ООО "АСКЭ"', repairComplexityMech: 5.0, repairComplexityElec: 2.5, repairComplexityKip: 2.0, repairComplexityAsu: 1.5, repairCycleStartDate: '2024-01-01', shiftMode: 'Непрерывная (3 смены)', laborConditionsFactor: 1.15, additionalRepairCoefficient: 1.2 }),
      verificationData: JSON.stringify({ lastVerificationDate: '2024-11-05', validUntilDate: '2025-11-05' }),
      safetyData: JSON.stringify({ isHazardousFacility: true, isChemicalHazardous: false, isSafetyCritical: true, isNuclearInstallation: false, safetyNormativeDoc: 'ФНП в области промышленной безопасности', safetyClass: 2, classificationCode: 'В - элемент безопасности', isEnvironmentalImpact: false, isFireProtection: false, externalSupervisionAuthority: 'Ростехнадзор', internalSupervisionAuthority: 'ОТК Цеха 31', registrationNumber: 'РТН-31-2018-0045', serviceLifeYears: 20, serviceLifeExpiryDate: '2038-05-10' }),
      supervisionData: JSON.stringify({ supervisionType: 'Экспертиза промышленной безопасности', nextSupervisionDate: '2025-11-10', nextInspectionDate: '2025-08-10', nextDiagnosticsDate: '2025-12-15', serviceLifeExtensionDocType: null, serviceLifeExtensionDocNumber: null, permittedOperationDate: '2018-09-10' }),
    },
    {
      name: 'Винтовой компрессор К-101', code: 'К-101', departmentId: mechDept.id, equipmentTypeId: compressorType.id, location: 'Компрессорная №1', manufacturer: 'Atlas Copco', model: 'GA-55+', serialNumber: 'SN-2020-78432', commissionDate: '2020-03-01', status: 'active', criticality: 'high',
      inventoryNumber: '31002345678', quantity: 1, unit: 'шт', drawing: 'К-101-СБ', equipmentClass: '1400_02 Компрессорное оборудование',
      topazNumber: 'ТОПАЗ-010', sapNumber: 10010, abcdCode: 'A', costCenter: 'U310020102',
      manufactureDate: '2020-01-15', decommissionDate: null, processImportance: 'Основное технологическое оборудование',
      isKey: true, isTest: false, hasReserve: true, parentEquipmentSap: null,
      locationData: JSON.stringify({ workshop: '31', building: '105', productionArea: 'Компрессорная', techArea: 'Участок 1', roomNumber: '101', roomName: 'Компрессорная станция', lineInstallation: 'Система сжатого воздуха', elevationMark: 0.0, axisX1: '1', axisX2: '4', axisY1: 'А', axisY2: 'Б', projectNumber: 'ПР-2020-002', projectPosition: 'К-101', span: '1-4', floor: 'Отм. 0.000' }),
      responsibilityData: JSON.stringify({ responsibleWorkshop: 'Цех 31', responsibleSpecialistService: 'Служба главного механика', responsiblePerson: 'Волков Н.А.', safetyResponsiblePerson: 'Петров П.П.', materiallyResponsiblePerson: 'Ковалёв А.Д.' }),
      maintenanceData: JSON.stringify({ toMechInterval: 3, trMechInterval: 12, krMechInterval: 84, toElecInterval: 12, trElecInterval: 24, krElecInterval: 60, toKipInterval: 6, trKipInterval: 12, toAsuInterval: 12, toMechContractor: 'Бригада №1', trMechContractor: 'ООО "Реммаш"', krMechContractor: 'Atlas Copco Service', toElecContractor: 'Бригада №2', trElecContractor: 'ООО "Электросервис"', krElecContractor: 'ООО "Спецремонт"', toKipContractor: 'Бригада КИПиА', trKipContractor: 'ООО "Автоматика"', toAsuContractor: 'ООО "АСКЭ"', repairComplexityMech: 6.0, repairComplexityElec: 3.0, repairComplexityKip: 2.0, repairComplexityAsu: 1.5, repairCycleStartDate: '2024-03-01', shiftMode: 'Непрерывная (3 смены)', laborConditionsFactor: 1.1, additionalRepairCoefficient: 1.1 }),
      verificationData: JSON.stringify({ lastVerificationDate: null, validUntilDate: null }),
      safetyData: JSON.stringify({ isHazardousFacility: true, isChemicalHazardous: false, isSafetyCritical: true, isNuclearInstallation: false, safetyNormativeDoc: 'ПБ 03-576-03', safetyClass: 2, classificationCode: 'В - элемент безопасности', isEnvironmentalImpact: false, isFireProtection: false, externalSupervisionAuthority: 'Ростехнадзор', internalSupervisionAuthority: 'ОТК Цеха 31', registrationNumber: 'РТН-31-2020-0012', serviceLifeYears: 30, serviceLifeExpiryDate: '2050-01-15' }),
      supervisionData: JSON.stringify({ supervisionType: 'Техническое освидетельствование', nextSupervisionDate: '2026-03-01', nextInspectionDate: '2025-09-01', nextDiagnosticsDate: '2026-06-01', serviceLifeExtensionDocType: null, serviceLifeExtensionDocNumber: null, permittedOperationDate: '2020-03-01' }),
    },
    {
      name: 'Винтовой компрессор К-102', code: 'К-102', departmentId: mechDept.id, equipmentTypeId: compressorType.id, location: 'Компрессорная №1', manufacturer: 'Atlas Copco', model: 'GA-37', serialNumber: 'SN-2017-56210', commissionDate: '2017-11-20', status: 'active', criticality: 'medium',
      inventoryNumber: '31002345679', quantity: 1, unit: 'шт', drawing: 'К-102-СБ', equipmentClass: '1400_02 Компрессорное оборудование',
      topazNumber: 'ТОПАЗ-011', sapNumber: 10011, abcdCode: 'B', costCenter: 'U310020102',
      manufactureDate: '2017-08-10', decommissionDate: null, processImportance: 'Вспомогательное оборудование',
      isKey: false, isTest: false, hasReserve: false, parentEquipmentSap: 10010,
      locationData: JSON.stringify({ workshop: '31', building: '105', productionArea: 'Компрессорная', techArea: 'Участок 1', roomNumber: '101', roomName: 'Компрессорная станция', lineInstallation: 'Система сжатого воздуха', elevationMark: 0.0, axisX1: '5', axisX2: '8', axisY1: 'А', axisY2: 'Б', projectNumber: 'ПР-2017-004', projectPosition: 'К-102', span: '5-8', floor: 'Отм. 0.000' }),
      responsibilityData: JSON.stringify({ responsibleWorkshop: 'Цех 31', responsibleSpecialistService: 'Служба главного механика', responsiblePerson: 'Волков Н.А.', safetyResponsiblePerson: 'Петров П.П.', materiallyResponsiblePerson: 'Ковалёв А.Д.' }),
      maintenanceData: JSON.stringify({ toMechInterval: 3, trMechInterval: 12, krMechInterval: 84, toElecInterval: 12, trElecInterval: 24, krElecInterval: 60, toKipInterval: 6, trKipInterval: 12, toAsuInterval: 12, toMechContractor: 'Бригада №1', trMechContractor: 'ООО "Реммаш"', krMechContractor: 'Atlas Copco Service', toElecContractor: 'Бригада №2', trElecContractor: 'ООО "Электросервис"', krElecContractor: 'ООО "Спецремонт"', toKipContractor: 'Бригада КИПиА', trKipContractor: 'ООО "Автоматика"', toAsuContractor: 'ООО "АСКЭ"', repairComplexityMech: 4.5, repairComplexityElec: 2.5, repairComplexityKip: 1.5, repairComplexityAsu: 1.0, repairCycleStartDate: '2024-03-01', shiftMode: 'Двухсменная', laborConditionsFactor: 1.05, additionalRepairCoefficient: 1.1 }),
      verificationData: JSON.stringify({ lastVerificationDate: null, validUntilDate: null }),
      safetyData: JSON.stringify({ isHazardousFacility: true, isChemicalHazardous: false, isSafetyCritical: false, isNuclearInstallation: false, safetyNormativeDoc: 'ПБ 03-576-03', safetyClass: 3, classificationCode: 'Н - элемент нормальной эксплуатации', isEnvironmentalImpact: false, isFireProtection: false, externalSupervisionAuthority: '', internalSupervisionAuthority: 'ОТК Цеха 31', registrationNumber: '', serviceLifeYears: 30, serviceLifeExpiryDate: '2047-08-10' }),
      supervisionData: JSON.stringify({ supervisionType: 'Техническое освидетельствование', nextSupervisionDate: '2026-06-01', nextInspectionDate: '2025-12-01', nextDiagnosticsDate: '2026-09-01', serviceLifeExtensionDocType: null, serviceLifeExtensionDocNumber: null, permittedOperationDate: '2017-11-20' }),
    },
    {
      name: 'Электродвигатель М-301', code: 'М-301', departmentId: elecDept.id, equipmentTypeId: motorType.id, location: 'Цех №31, пом. 201', manufacturer: 'ЭЛДИН', model: 'АИР250М4', serialNumber: 'SN-2021-33001', commissionDate: '2021-04-10', status: 'active', criticality: 'high',
      inventoryNumber: '32002345670', quantity: 1, unit: 'шт', drawing: 'М-301-СБ', equipmentClass: '1500_01 Электродвигатели',
      topazNumber: 'ТОПАЗ-020', sapNumber: 10020, abcdCode: 'A', costCenter: 'U320020101',
      manufactureDate: '2021-02-01', decommissionDate: null, processImportance: 'Основное технологическое оборудование',
      isKey: true, isTest: false, hasReserve: false, parentEquipmentSap: 10001,
      locationData: JSON.stringify({ workshop: '31', building: '103', productionArea: 'Участок насосов', techArea: 'Участок 2', roomNumber: '201', roomName: 'Насосная станция', lineInstallation: 'Привод насоса Н-201', elevationMark: 0.0, axisX1: 'A+1', axisX2: 'A+3', axisY1: '1', axisY2: '1+2', projectNumber: 'ПР-2021-001', projectPosition: 'М-301', span: 'А-Б', floor: 'Отм. 0.000' }),
      responsibilityData: JSON.stringify({ responsibleWorkshop: 'Электроцех', responsibleSpecialistService: 'Служба главного энергетика', responsiblePerson: 'Волков Н.А.', safetyResponsiblePerson: 'Морозов Д.В.', materiallyResponsiblePerson: 'Сидоров С.С.' }),
      maintenanceData: JSON.stringify({ toMechInterval: 12, trMechInterval: 24, krMechInterval: 120, toElecInterval: 6, trElecInterval: 12, krElecInterval: 48, toKipInterval: 12, trKipInterval: 24, toAsuInterval: 12, toMechContractor: 'Бригада №1', trMechContractor: 'Бригада №1', krMechContractor: 'ООО "Электродвигатель"', toElecContractor: 'Бригада №2', trElecContractor: 'ООО "Электросервис"', krElecContractor: 'ООО "Спецремонт"', toKipContractor: 'Бригада КИПиА', trKipContractor: 'ООО "Автоматика"', toAsuContractor: 'ООО "АСКЭ"', repairComplexityMech: 1.0, repairComplexityElec: 4.0, repairComplexityKip: 1.0, repairComplexityAsu: 0.5, repairCycleStartDate: '2024-04-10', shiftMode: 'Непрерывная (3 смены)', laborConditionsFactor: 1.1, additionalRepairCoefficient: 1.1 }),
      verificationData: JSON.stringify({ lastVerificationDate: null, validUntilDate: null }),
      safetyData: JSON.stringify({ isHazardousFacility: false, isChemicalHazardous: false, isSafetyCritical: true, isNuclearInstallation: false, safetyNormativeDoc: 'ПУЭ', safetyClass: 3, classificationCode: 'Н - элемент нормальной эксплуатации', isEnvironmentalImpact: false, isFireProtection: false, externalSupervisionAuthority: '', internalSupervisionAuthority: 'ОТК Электроцеха', registrationNumber: '', serviceLifeYears: 20, serviceLifeExpiryDate: '2041-02-01' }),
      supervisionData: JSON.stringify({ supervisionType: 'Техническое освидетельствование', nextSupervisionDate: '2026-04-10', nextInspectionDate: '2025-10-10', nextDiagnosticsDate: '2026-07-10', serviceLifeExtensionDocType: null, serviceLifeExtensionDocNumber: null, permittedOperationDate: '2021-04-10' }),
    },
    {
      name: 'Электродвигатель М-302', code: 'М-302', departmentId: elecDept.id, equipmentTypeId: motorType.id, location: 'Цех №31, пом. 301', manufacturer: 'ВЭМЗ', model: 'АИР200L4', serialNumber: 'SN-2019-22045', commissionDate: '2019-10-15', status: 'under_repair', criticality: 'medium',
      inventoryNumber: '32002345671', quantity: 1, unit: 'шт', drawing: 'М-302-СБ', equipmentClass: '1500_01 Электродвигатели',
      topazNumber: 'ТОПАЗ-021', sapNumber: 10021, abcdCode: 'B', costCenter: 'U320020101',
      manufactureDate: '2019-07-01', decommissionDate: null, processImportance: 'Вспомогательное оборудование',
      isKey: false, isTest: false, hasReserve: true, parentEquipmentSap: 10005,
      locationData: JSON.stringify({ workshop: '31', building: '103', productionArea: 'Участок насосов', techArea: 'Участок 3', roomNumber: '301', roomName: 'Помещение насосов ВД', lineInstallation: 'Привод насоса Н-205', elevationMark: 3.5, axisX1: 'Б+1', axisX2: 'Б+3', axisY1: '2', axisY2: '2+2', projectNumber: 'ПР-2019-005', projectPosition: 'М-302', span: 'Б-В', floor: 'Отм. +3.500' }),
      responsibilityData: JSON.stringify({ responsibleWorkshop: 'Электроцех', responsibleSpecialistService: 'Служба главного энергетика', responsiblePerson: 'Волков Н.А.', safetyResponsiblePerson: 'Морозов Д.В.', materiallyResponsiblePerson: 'Ковалёв А.Д.' }),
      maintenanceData: JSON.stringify({ toMechInterval: 12, trMechInterval: 24, krMechInterval: 120, toElecInterval: 6, trElecInterval: 12, krElecInterval: 48, toKipInterval: 12, trKipInterval: 24, toAsuInterval: 12, toMechContractor: 'Бригада №1', trMechContractor: 'Бригада №1', krMechContractor: 'ООО "Электродвигатель"', toElecContractor: 'Бригада №2', trElecContractor: 'ООО "Электросервис"', krElecContractor: 'ООО "Спецремонт"', toKipContractor: 'Бригада КИПиА', trKipContractor: 'ООО "Автоматика"', toAsuContractor: 'ООО "АСКЭ"', repairComplexityMech: 0.8, repairComplexityElec: 3.0, repairComplexityKip: 0.8, repairComplexityAsu: 0.5, repairCycleStartDate: '2024-01-01', shiftMode: 'Двухсменная', laborConditionsFactor: 1.05, additionalRepairCoefficient: 1.1 }),
      verificationData: JSON.stringify({ lastVerificationDate: null, validUntilDate: null }),
      safetyData: JSON.stringify({ isHazardousFacility: false, isChemicalHazardous: false, isSafetyCritical: false, isNuclearInstallation: false, safetyNormativeDoc: 'ПУЭ', safetyClass: 3, classificationCode: 'Н - элемент нормальной эксплуатации', isEnvironmentalImpact: false, isFireProtection: false, externalSupervisionAuthority: '', internalSupervisionAuthority: 'ОТК Электроцеха', registrationNumber: '', serviceLifeYears: 20, serviceLifeExpiryDate: '2039-07-01' }),
      supervisionData: JSON.stringify({ supervisionType: 'Техническое освидетельствование', nextSupervisionDate: '2025-10-15', nextInspectionDate: '2025-06-15', nextDiagnosticsDate: '2026-01-15', serviceLifeExtensionDocType: null, serviceLifeExtensionDocNumber: null, permittedOperationDate: '2019-10-15' }),
    },
    {
      name: 'Силовой трансформатор Т-401', code: 'Т-401', departmentId: elecDept.id, equipmentTypeId: transformerType.id, location: 'ТП-1', manufacturer: 'СВЭЛ', model: 'ТМ-630/10', serialNumber: 'SN-2016-10008', commissionDate: '2016-05-20', status: 'active', criticality: 'critical',
      inventoryNumber: '32003456789', quantity: 1, unit: 'шт', drawing: 'Т-401-СБ', equipmentClass: '1500_03 Трансформаторы',
      topazNumber: 'ТОПАЗ-030', sapNumber: 10030, abcdCode: 'A', costCenter: 'U320020201',
      manufactureDate: '2016-01-10', decommissionDate: null, processImportance: 'Основное технологическое оборудование',
      isKey: true, isTest: false, hasReserve: false, parentEquipmentSap: null,
      locationData: JSON.stringify({ workshop: '32', building: '201', productionArea: 'ТП-1', techArea: 'ТП-1', roomNumber: '01', roomName: 'Камера трансформаторов', lineInstallation: 'ВЛ-10кВ', elevationMark: 0.0, axisX1: '1', axisX2: '3', axisY1: 'А', axisY2: 'Б', projectNumber: 'ПР-2016-001', projectPosition: 'Т-401', span: '1-3', floor: 'Отм. -0.500' }),
      responsibilityData: JSON.stringify({ responsibleWorkshop: 'Электроцех', responsibleSpecialistService: 'Служба главного энергетика', responsiblePerson: 'Волков Н.А.', safetyResponsiblePerson: 'Петров П.П.', materiallyResponsiblePerson: 'Морозов Д.В.' }),
      maintenanceData: JSON.stringify({ toMechInterval: 12, trMechInterval: 36, krMechInterval: 180, toElecInterval: 6, trElecInterval: 12, krElecInterval: 60, toKipInterval: 12, trKipInterval: 24, toAsuInterval: 6, toMechContractor: 'Бригада №4', trMechContractor: 'ООО "Спецтранс"', krMechContractor: 'Завод-изготовитель', toElecContractor: 'Бригада №2', trElecContractor: 'ООО "Электросервис"', krElecContractor: 'ООО "Спецремонт"', toKipContractor: 'Бригада КИПиА', trKipContractor: 'ООО "Автоматика"', toAsuContractor: 'ООО "АСКЭ"', repairComplexityMech: 2.0, repairComplexityElec: 5.0, repairComplexityKip: 2.0, repairComplexityAsu: 1.5, repairCycleStartDate: '2024-01-01', shiftMode: 'Непрерывная (3 смены)', laborConditionsFactor: 1.1, additionalRepairCoefficient: 1.15 }),
      verificationData: JSON.stringify({ lastVerificationDate: null, validUntilDate: null }),
      safetyData: JSON.stringify({ isHazardousFacility: true, isChemicalHazardous: false, isSafetyCritical: true, isNuclearInstallation: false, safetyNormativeDoc: 'ПУЭ, ПТЭЭП', safetyClass: 1, classificationCode: 'А - элемент безопасности', isEnvironmentalImpact: true, isFireProtection: true, externalSupervisionAuthority: 'Ростехнадзор', internalSupervisionAuthority: 'ОТК Электроцеха', registrationNumber: 'РТН-32-2016-0001', serviceLifeYears: 30, serviceLifeExpiryDate: '2046-01-10' }),
      supervisionData: JSON.stringify({ supervisionType: 'Экспертиза промышленной безопасности', nextSupervisionDate: '2026-05-20', nextInspectionDate: '2025-11-20', nextDiagnosticsDate: '2026-08-20', serviceLifeExtensionDocType: null, serviceLifeExtensionDocNumber: null, permittedOperationDate: '2016-05-20' }),
    },
    {
      name: 'Задвижка З-501', code: 'З-501', departmentId: mechDept.id, equipmentTypeId: valveType.id, location: 'Цех №31, трубопровод', manufacturer: 'АКМЗ', model: 'ЗКЛ-2-200', serialNumber: 'SN-2020-55001', commissionDate: '2020-07-01', status: 'active', criticality: 'medium',
      inventoryNumber: '31004567890', quantity: 1, unit: 'шт', drawing: 'З-501-СБ', equipmentClass: '1600_01 Запорная арматура',
      topazNumber: 'ТОПАЗ-040', sapNumber: 10040, abcdCode: 'B', costCenter: 'U310020103',
      manufactureDate: '2020-04-01', decommissionDate: null, processImportance: 'Вспомогательное оборудование',
      isKey: false, isTest: false, hasReserve: false, parentEquipmentSap: null,
      locationData: JSON.stringify({ workshop: '31', building: '103', productionArea: 'Трубопроводная обвязка', techArea: 'Участок 2', roomNumber: '201', roomName: 'Насосная станция', lineInstallation: 'Трубопровод подачи воды', elevationMark: 0.5, axisX1: 'Г', axisX2: 'Г+1', axisY1: '3', axisY2: '3+1', projectNumber: 'ПР-2020-003', projectPosition: 'З-501', span: 'Г-Д', floor: 'Отм. +0.500' }),
      responsibilityData: JSON.stringify({ responsibleWorkshop: 'Цех 31', responsibleSpecialistService: 'Служба главного механика', responsiblePerson: 'Ковалёв А.Д.', safetyResponsiblePerson: 'Иванов И.И.', materiallyResponsiblePerson: 'Сидоров С.С.' }),
      maintenanceData: JSON.stringify({ toMechInterval: 12, trMechInterval: 24, krMechInterval: 120, toElecInterval: 24, trElecInterval: 48, krElecInterval: 120, toKipInterval: 24, trKipInterval: 48, toAsuInterval: 24, toMechContractor: 'Бригада №1', trMechContractor: 'Бригада №4', krMechContractor: 'Завод-изготовитель', toElecContractor: 'Бригада №2', trElecContractor: 'Бригада №2', krElecContractor: 'Бригада №2', toKipContractor: 'Бригада КИПиА', trKipContractor: 'Бригада КИПиА', toAsuContractor: 'ООО "АСКЭ"', repairComplexityMech: 1.0, repairComplexityElec: 0.5, repairComplexityKip: 0.3, repairComplexityAsu: 0.2, repairCycleStartDate: '2024-01-01', shiftMode: 'Двухсменная', laborConditionsFactor: 1.0, additionalRepairCoefficient: 1.0 }),
      verificationData: JSON.stringify({ lastVerificationDate: '2024-07-01', validUntilDate: '2027-07-01' }),
      safetyData: JSON.stringify({ isHazardousFacility: false, isChemicalHazardous: false, isSafetyCritical: false, isNuclearInstallation: false, safetyNormativeDoc: 'ГОСТ 9544-2015', safetyClass: 3, classificationCode: 'Н - элемент нормальной эксплуатации', isEnvironmentalImpact: false, isFireProtection: false, externalSupervisionAuthority: '', internalSupervisionAuthority: 'ОТК Цеха 31', registrationNumber: '', serviceLifeYears: 15, serviceLifeExpiryDate: '2035-04-01' }),
      supervisionData: JSON.stringify({ supervisionType: null, nextSupervisionDate: null, nextInspectionDate: null, nextDiagnosticsDate: null, serviceLifeExtensionDocType: null, serviceLifeExtensionDocNumber: null, permittedOperationDate: '2020-07-01' }),
    },
    {
      name: 'Ленточный конвейер ЛК-601', code: 'ЛК-601', departmentId: buildDept.id, equipmentTypeId: conveyorType.id, location: 'Склад сырья', manufacturer: 'Рудгормаш', model: '1ЛУ-120', serialNumber: 'SN-2015-66001', commissionDate: '2015-09-01', status: 'active', criticality: 'low',
      inventoryNumber: '33005678901', quantity: 1, unit: 'шт', drawing: 'ЛК-601-СБ', equipmentClass: '1700_01 Конвейерное оборудование',
      topazNumber: 'ТОПАЗ-050', sapNumber: 10050, abcdCode: 'C', costCenter: 'U330020101',
      manufactureDate: '2015-05-15', decommissionDate: null, processImportance: 'Вспомогательное оборудование',
      isKey: false, isTest: false, hasReserve: false, parentEquipmentSap: null,
      locationData: JSON.stringify({ workshop: '33', building: '301', productionArea: 'Склад сырья', techArea: 'Участок погрузки', roomNumber: '01', roomName: 'Зона конвейера', lineInstallation: 'Линия подачи сырья', elevationMark: 0.0, axisX1: '1', axisX2: '20', axisY1: 'А', axisY2: 'А+1', projectNumber: 'ПР-2015-001', projectPosition: 'ЛК-601', span: '1-20', floor: 'Отм. 0.000' }),
      responsibilityData: JSON.stringify({ responsibleWorkshop: 'СРЦ', responsibleSpecialistService: 'Служба главного механика', responsiblePerson: 'Морозов Д.В.', safetyResponsiblePerson: 'Ковалёв А.Д.', materiallyResponsiblePerson: 'Морозов Д.В.' }),
      maintenanceData: JSON.stringify({ toMechInterval: 6, trMechInterval: 12, krMechInterval: 120, toElecInterval: 12, trElecInterval: 24, krElecInterval: 120, toKipInterval: 12, trKipInterval: 24, toAsuInterval: 24, toMechContractor: 'Бригада №4', trMechContractor: 'Бригада №4', krMechContractor: 'ООО "Реммаш"', toElecContractor: 'Бригада №2', trElecContractor: 'Бригада №2', krElecContractor: 'Бригада №2', toKipContractor: 'Бригада КИПиА', trKipContractor: 'Бригада КИПиА', toAsuContractor: 'ООО "АСКЭ"', repairComplexityMech: 4.0, repairComplexityElec: 2.0, repairComplexityKip: 1.0, repairComplexityAsu: 0.5, repairCycleStartDate: '2024-01-01', shiftMode: 'Односменная', laborConditionsFactor: 1.0, additionalRepairCoefficient: 1.05 }),
      verificationData: JSON.stringify({ lastVerificationDate: null, validUntilDate: null }),
      safetyData: JSON.stringify({ isHazardousFacility: false, isChemicalHazardous: false, isSafetyCritical: false, isNuclearInstallation: false, safetyNormativeDoc: 'ГОСТ 22644-77', safetyClass: 4, classificationCode: 'Н - элемент нормальной эксплуатации', isEnvironmentalImpact: false, isFireProtection: false, externalSupervisionAuthority: '', internalSupervisionAuthority: 'ОТК СРЦ', registrationNumber: '', serviceLifeYears: 20, serviceLifeExpiryDate: '2035-05-15' }),
      supervisionData: JSON.stringify({ supervisionType: null, nextSupervisionDate: null, nextInspectionDate: null, nextDiagnosticsDate: null, serviceLifeExtensionDocType: null, serviceLifeExtensionDocNumber: null, permittedOperationDate: '2015-09-01' }),
    },
    {
      name: 'Насос-дозатор НД-701', code: 'НД-701', departmentId: mechDept.id, equipmentTypeId: pumpType.id, location: 'Цех №34, хим. участок', manufacturer: 'Иртыш', model: 'НД-50/100', serialNumber: 'SN-2022-77001', commissionDate: '2022-02-15', status: 'active', criticality: 'medium',
      inventoryNumber: '34006789012', quantity: 1, unit: 'шт', drawing: 'НД-701-СБ', equipmentClass: '1300_03 Насосное оборудование',
      topazNumber: 'ТОПАЗ-060', sapNumber: 10060, abcdCode: 'B', costCenter: 'U340020101',
      manufactureDate: '2021-11-01', decommissionDate: null, processImportance: 'Вспомогательное оборудование',
      isKey: false, isTest: false, hasReserve: false, parentEquipmentSap: null,
      locationData: JSON.stringify({ workshop: '34', building: '401', productionArea: 'Химический участок', techArea: 'Участок дозирования', roomNumber: '105', roomName: 'Помещение дозирования', lineInstallation: 'Линия хим. подготовки', elevationMark: 0.0, axisX1: '2', axisX2: '5', axisY1: 'В', axisY2: 'Г', projectNumber: 'ПР-2022-001', projectPosition: 'НД-701', span: '2-5', floor: 'Отм. 0.000' }),
      responsibilityData: JSON.stringify({ responsibleWorkshop: 'Цех 34', responsibleSpecialistService: 'Служба главного химика', responsiblePerson: 'Ковалёв А.Д.', safetyResponsiblePerson: 'Волков Н.А.', materiallyResponsiblePerson: 'Сидоров С.С.' }),
      maintenanceData: JSON.stringify({ toMechInterval: 3, trMechInterval: 6, krMechInterval: 48, toElecInterval: 6, trElecInterval: 12, krElecInterval: 48, toKipInterval: 6, trKipInterval: 12, toAsuInterval: 12, toMechContractor: 'Бригада №1', trMechContractor: 'Завод-изготовитель', krMechContractor: 'Завод-изготовитель', toElecContractor: 'Бригада №2', trElecContractor: 'ООО "Электросервис"', krElecContractor: 'ООО "Спецремонт"', toKipContractor: 'Бригада КИПиА', trKipContractor: 'Завод-изготовитель', toAsuContractor: 'Завод-изготовитель', repairComplexityMech: 2.0, repairComplexityElec: 1.5, repairComplexityKip: 2.0, repairComplexityAsu: 1.5, repairCycleStartDate: '2024-01-01', shiftMode: 'Двухсменная', laborConditionsFactor: 1.1, additionalRepairCoefficient: 1.1 }),
      verificationData: JSON.stringify({ lastVerificationDate: '2024-06-01', validUntilDate: '2025-06-01' }),
      safetyData: JSON.stringify({ isHazardousFacility: false, isChemicalHazardous: true, isSafetyCritical: true, isNuclearInstallation: false, safetyNormativeDoc: 'ФНП ХОПО', safetyClass: 2, classificationCode: 'В - элемент безопасности', isEnvironmentalImpact: true, isFireProtection: false, externalSupervisionAuthority: 'Ростехнадзор', internalSupervisionAuthority: 'ОТК Цеха 34', registrationNumber: 'РТН-34-2022-0003', serviceLifeYears: 15, serviceLifeExpiryDate: '2036-11-01' }),
      supervisionData: JSON.stringify({ supervisionType: 'Техническое освидетельствование', nextSupervisionDate: '2025-08-15', nextInspectionDate: '2025-05-15', nextDiagnosticsDate: '2025-11-15', serviceLifeExtensionDocType: null, serviceLifeExtensionDocNumber: null, permittedOperationDate: '2022-02-15' }),
    },
    {
      name: 'Вентилятор ВО-801', code: 'ВО-801', departmentId: buildDept.id, equipmentTypeId: motorType.id, location: 'Цех №31, приточная', manufacturer: 'Вентс', model: 'ВР-300-45', serialNumber: 'SN-2010-88001', commissionDate: '2010-12-01', status: 'decommissioned', criticality: 'low',
      inventoryNumber: '33007890123', quantity: 1, unit: 'шт', drawing: 'ВО-801-СБ', equipmentClass: '1800_01 Вентиляционное оборудование',
      topazNumber: 'ТОПАЗ-070', sapNumber: 10070, abcdCode: 'D', costCenter: 'U330020102',
      manufactureDate: '2010-08-15', decommissionDate: '2024-06-01', processImportance: 'Вспомогательное оборудование',
      isKey: false, isTest: false, hasReserve: false, parentEquipmentSap: null,
      locationData: JSON.stringify({ workshop: '31', building: '103', productionArea: 'Приточная вентиляция', techArea: 'Венткамера', roomNumber: 'ВК-01', roomName: 'Вентиляционная камера', lineInstallation: 'Система вентиляции цеха 31', elevationMark: 6.0, axisX1: 'Д', axisX2: 'Д+3', axisY1: '1', axisY2: '5', projectNumber: 'ПР-2010-002', projectPosition: 'ВО-801', span: 'Д-Е', floor: 'Отм. +6.000' }),
      responsibilityData: JSON.stringify({ responsibleWorkshop: 'СРЦ', responsibleSpecialistService: 'Служба главного механика', responsiblePerson: 'Морозов Д.В.', safetyResponsiblePerson: 'Ковалёв А.Д.', materiallyResponsiblePerson: 'Морозов Д.В.' }),
      maintenanceData: JSON.stringify({ toMechInterval: 12, trMechInterval: 24, krMechInterval: 120, toElecInterval: 12, trElecInterval: 24, krElecInterval: 120, toKipInterval: 24, trKipInterval: 48, toAsuInterval: 24, toMechContractor: 'Бригада №4', trMechContractor: 'Бригада №4', krMechContractor: 'Завод-изготовитель', toElecContractor: 'Бригада №2', trElecContractor: 'Бригада №2', krElecContractor: 'Бригада №2', toKipContractor: 'Бригада КИПиА', trKipContractor: 'Бригада КИПиА', toAsuContractor: 'ООО "АСКЭ"', repairComplexityMech: 2.0, repairComplexityElec: 1.0, repairComplexityKip: 0.5, repairComplexityAsu: 0.5, repairCycleStartDate: '2024-01-01', shiftMode: 'Односменная', laborConditionsFactor: 1.0, additionalRepairCoefficient: 1.0 }),
      verificationData: JSON.stringify({ lastVerificationDate: null, validUntilDate: null }),
      safetyData: JSON.stringify({ isHazardousFacility: false, isChemicalHazardous: false, isSafetyCritical: false, isNuclearInstallation: false, safetyNormativeDoc: '', safetyClass: 4, classificationCode: 'Н - элемент нормальной эксплуатации', isEnvironmentalImpact: false, isFireProtection: false, externalSupervisionAuthority: '', internalSupervisionAuthority: '', registrationNumber: '', serviceLifeYears: 15, serviceLifeExpiryDate: '2025-08-15' }),
      supervisionData: JSON.stringify({ supervisionType: null, nextSupervisionDate: null, nextInspectionDate: null, nextDiagnosticsDate: null, serviceLifeExtensionDocType: null, serviceLifeExtensionDocNumber: null, permittedOperationDate: null }),
    },
  ]

  for (const eq of equipmentData) {
    await db.equipment.upsert({
      where: { code: eq.code },
      update: eq,
      create: eq,
    })
  }
  console.log(`✅ ${equipmentData.length} equipment items created`)

  // ============ SPARE PART CATEGORIES ============
  const bearingsCat = await db.sparePartCategory.upsert({
    where: { code: 'BEARINGS' },
    update: {},
    create: { name: 'Подшипники', code: 'BEARINGS' },
  })

  const sealsCat = await db.sparePartCategory.upsert({
    where: { code: 'SEALS' },
    update: {},
    create: { name: 'Уплотнения и сальники', code: 'SEALS' },
  })

  const beltsCat = await db.sparePartCategory.upsert({
    where: { code: 'BELTS' },
    update: {},
    create: { name: 'Ремни и приводные элементы', code: 'BELTS' },
  })

  const elecCat = await db.sparePartCategory.upsert({
    where: { code: 'ELEC' },
    update: {},
    create: { name: 'Электрооборудование', code: 'ELEC' },
  })

  const filtersCat = await db.sparePartCategory.upsert({
    where: { code: 'FILTERS' },
    update: {},
    create: { name: 'Фильтры', code: 'FILTERS' },
  })

  const hydraulicCat = await db.sparePartCategory.upsert({
    where: { code: 'HYDRAULIC' },
    update: {},
    create: { name: 'Гидравлика', code: 'HYDRAULIC' },
  })

  // ============ SPARE PARTS ============
  const sparePartsData = [
    { name: 'Подшипник 6308-2RS', code: '6308-2RS', categoryId: bearingsCat.id, unit: 'шт', minStock: 10, currentStock: 25, price: 1200 },
    { name: 'Подшипник 6310-2RS', code: '6310-2RS', categoryId: bearingsCat.id, unit: 'шт', minStock: 8, currentStock: 4, price: 1800 },
    { name: 'Подшипник 22222КМ', code: '22222КМ', categoryId: bearingsCat.id, unit: 'шт', minStock: 4, currentStock: 6, price: 8500 },
    { name: 'Подшипник 32216А', code: '32216А', categoryId: bearingsCat.id, unit: 'шт', minStock: 2, currentStock: 0, price: 12300 },
    { name: 'Сальник 80x100x12', code: 'С-80100', categoryId: sealsCat.id, unit: 'шт', minStock: 15, currentStock: 20, price: 350 },
    { name: 'Сальник 50x70x10', code: 'С-5070', categoryId: sealsCat.id, unit: 'шт', minStock: 20, currentStock: 30, price: 220 },
    { name: 'Манжета ГОСТ 8752-79', code: 'МЖ-6080', categoryId: sealsCat.id, unit: 'шт', minStock: 10, currentStock: 5, price: 180 },
    { name: 'Ремень клиновой B-2000', code: 'РК-В2000', categoryId: beltsCat.id, unit: 'шт', minStock: 8, currentStock: 12, price: 650 },
    { name: 'Ремень клиновой SPB-3550', code: 'РК-SPB3550', categoryId: beltsCat.id, unit: 'шт', minStock: 4, currentStock: 2, price: 1400 },
    { name: 'Контактор КМИ-22510', code: 'КМИ-22510', categoryId: elecCat.id, unit: 'шт', minStock: 3, currentStock: 5, price: 4500 },
    { name: 'Автоматический выключатель ВА47-63', code: 'ВА-47-63', categoryId: elecCat.id, unit: 'шт', minStock: 5, currentStock: 8, price: 2100 },
    { name: 'Термореле ТРН-25', code: 'ТРН-25', categoryId: elecCat.id, unit: 'шт', minStock: 5, currentStock: 3, price: 800 },
    { name: 'Фильтр масляный FO-220', code: 'FM-FO220', categoryId: filtersCat.id, unit: 'шт', minStock: 6, currentStock: 10, price: 3200 },
    { name: 'Фильтр воздушный AF-25057', code: 'FV-AF25057', categoryId: filtersCat.id, unit: 'шт', minStock: 4, currentStock: 0, price: 2800 },
    { name: 'Гидроцилиндр ЦГ-80/50-250', code: 'ГЦ-8050250', categoryId: hydraulicCat.id, unit: 'шт', minStock: 2, currentStock: 1, price: 18000 },
  ]

  for (const sp of sparePartsData) {
    await db.sparePart.upsert({
      where: { code: sp.code },
      update: {},
      create: sp,
    })
  }
  console.log(`✅ ${sparePartsData.length} spare parts created`)

  // ============ UNPLANNED REQUESTS ============
  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000

  // Build equipment code→id map
  const allEquip = await db.equipment.findMany({ select: { id: true, code: true } })
  const eqCodeToId: Record<string, string> = {}
  allEquip.forEach((e) => { eqCodeToId[e.code] = e.id })

  const requestsData = [
    { number: 'З-001', equipmentId: eqCodeToId['Н-205'] || null, title: 'Утечка через сальник насоса Н-205', description: 'Обнаружена утечка через сальниковое уплотнение. Требуется замена сальника и проверка вала на износ.', priority: 'high', status: 'in_progress', requestedBy: worker.id, assignedTo: engineer.id, brigadeId: brigade1.id, createdAt: new Date(now.getTime() - 2 * dayMs) },
    { number: 'З-002', equipmentId: eqCodeToId['М-302'] || null, title: 'Повышенная вибрация двигателя М-302', description: 'Замерена вибрация 8 мм/с при норме 4.5 мм/с. Возможна неисправность подшипников.', priority: 'critical', status: 'assigned', requestedBy: worker3.id, assignedTo: engineer.id, brigadeId: brigade2.id, createdAt: new Date(now.getTime() - 1 * dayMs) },
    { number: 'З-003', title: 'Замена фильтра в компрессорной', description: 'Необходимо заменить воздушный фильтр AF-25057 в компрессоре К-102.', priority: 'low', status: 'new', requestedBy: worker2.id, createdAt: new Date(now.getTime() - 3 * dayMs) },
    { number: 'З-004', title: 'Смазка подшипников конвейера ЛК-601', description: 'Плановая замена смазки в подшипниковых узлах ленточного конвейера.', priority: 'low', status: 'completed', requestedBy: manager.id, assignedTo: worker3.id, brigadeId: brigade4.id, completedAt: new Date(now.getTime() - 5 * dayMs).toISOString(), createdAt: new Date(now.getTime() - 7 * dayMs) },
    { number: 'З-005', equipmentId: eqCodeToId['Т-401'] || null, title: 'Проверка уровня масла трансформатора Т-401', description: 'Текущая проверка состояния масла и уровней. Запланирован отбор пробы.', priority: 'medium', status: 'completed', requestedBy: engineer.id, assignedTo: worker4.id, brigadeId: brigade2.id, completedAt: new Date(now.getTime() - 2 * dayMs).toISOString(), createdAt: new Date(now.getTime() - 4 * dayMs) },
    { number: 'З-006', equipmentId: eqCodeToId['К-101'] || null, title: 'Замена ремня компрессора К-101', description: 'Обнаружен износ клинового ремня. Замена на новый SPB-3550.', priority: 'medium', status: 'completed', requestedBy: worker.id, assignedTo: engineer.id, brigadeId: brigade1.id, completedAt: new Date(now.getTime() - 10 * dayMs).toISOString(), resolution: 'Ремень заменён, компрессор работает в штатном режиме.', createdAt: new Date(now.getTime() - 12 * dayMs) },
    { number: 'З-007', title: 'Ремонт задвижки З-501', description: 'Задвижка не закрывается до конца. Требуется ревизия и притирка уплотнительных поверхностей.', priority: 'medium', status: 'new', requestedBy: worker3.id, createdAt: new Date(now.getTime() - 0.5 * dayMs) },
    { number: 'З-008', equipmentId: eqCodeToId['Н-201'] || null, title: 'Контроль температуры подшипников Н-201', description: 'Температура подшипникового узла достигла 72°C при норме 65°C. Необходим контроль.', priority: 'high', status: 'in_progress', requestedBy: engineer.id, assignedTo: worker.id, brigadeId: brigade1.id, createdAt: new Date(now.getTime() - 0.2 * dayMs) },
  ]

  for (const r of requestsData) {
    await db.unplannedRequest.upsert({
      where: { number: r.number },
      update: {},
      create: r,
    })
  }
  console.log(`✅ ${requestsData.length} unplanned requests created`)

  // ============ MAINTENANCE PLANS (PPR) ============
  const equipment = await db.equipment.findMany({ select: { id: true, code: true } })
  const eqMap: Record<string, string> = {}
  equipment.forEach((e) => { eqMap[e.code] = e.id })

  const plansData = [
    { equipmentId: eqMap['Н-201'], planName: 'ППР насоса Н-201', lastMaintenance: '2025-05-15', nextMaintenance: '2025-08-15', intervalDays: 90, status: 'active' },
    { equipmentId: eqMap['Н-202'], planName: 'ППР насоса Н-202', lastMaintenance: '2025-06-01', nextMaintenance: '2025-09-01', intervalDays: 90, status: 'active' },
    { equipmentId: eqMap['К-101'], planName: 'ППР компрессора К-101', lastMaintenance: '2025-04-20', nextMaintenance: '2025-07-20', intervalDays: 90, status: 'active' },
    { equipmentId: eqMap['К-102'], planName: 'ППР компрессора К-102', lastMaintenance: '2025-03-10', nextMaintenance: '2025-06-10', intervalDays: 90, status: 'active' },
    { equipmentId: eqMap['Т-401'], planName: 'ППР трансформатора Т-401', lastMaintenance: '2025-01-15', nextMaintenance: '2026-01-15', intervalDays: 365, status: 'active' },
    { equipmentId: eqMap['М-301'], planName: 'ППР двигателя М-301', lastMaintenance: '2025-05-01', nextMaintenance: '2025-08-01', intervalDays: 90, status: 'active' },
  ]

  for (const p of plansData) {
    if (!p.equipmentId) continue
    await db.maintenancePlan.upsert({
      where: { equipmentId: p.equipmentId },
      update: {},
      create: p,
    })
  }
  console.log(`✅ ${plansData.filter(p => p.equipmentId).length} maintenance plans created`)

  // ============ MAINTENANCE TASKS ============
  const plans = await db.maintenancePlan.findMany({ select: { id: true, equipment: { select: { code: true } } } })

  const tasksData = [
    { planId: plans[0]?.id, scheduledDate: '2025-08-15', description: 'Замена подшипников и сальников насоса Н-201', brigadeId: brigade1.id, status: 'planned' },
    { planId: plans[1]?.id, scheduledDate: '2025-09-01', description: 'ТО насоса Н-202: проверка, замена масла', brigadeId: brigade1.id, status: 'planned' },
    { planId: plans[2]?.id, scheduledDate: '2025-07-20', description: 'Замена фильтров и масла компрессора К-101', brigadeId: brigade1.id, status: 'planned' },
    { planId: plans[2]?.id, scheduledDate: '2025-07-20', description: 'Замена ремня компрессора К-101', brigadeId: brigade1.id, status: 'completed', completedAt: '2025-07-18T14:00:00.000Z' },
    { planId: plans[3]?.id, scheduledDate: '2025-06-10', description: 'Замена воздушного фильтра компрессора К-102', brigadeId: brigade1.id, status: 'overdue' },
    { planId: plans[4]?.id, scheduledDate: '2026-01-15', description: 'Химический анализ масла трансформатора Т-401', brigadeId: brigade2.id, status: 'planned' },
    { planId: plans[5]?.id, scheduledDate: '2025-08-01', description: 'Проверка изоляции обмоток двигателя М-301', brigadeId: brigade2.id, status: 'planned' },
  ]

  for (const t of tasksData) {
    if (!t.planId) continue
    await db.maintenanceTask.create({
      data: t,
    }).catch(() => {})
  }
  console.log('✅ Maintenance tasks created')

  // ============ SHIFT TASKS ============
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(now.getTime() - dayMs).toISOString().split('T')[0]

  const shiftTasksData = [
    { brigadeId: brigade1.id, date: today, shift: 'day', description: 'Проверка и обслуживание насосного оборудования цеха №1', status: 'in_progress', assignedBy: manager.id },
    { brigadeId: brigade2.id, date: today, shift: 'day', description: 'Осмотр электрооборудования цеха №1 и ТП-1', status: 'planned', assignedBy: manager.id },
    { brigadeId: brigade3.id, date: today, shift: 'night', description: 'Настройка приборов КИПиА на хим. участке', status: 'planned', assignedBy: manager.id },
    { brigadeId: brigade4.id, date: yesterday, shift: 'day', description: 'Сварочные работы на конвейере ЛК-601', status: 'completed', assignedBy: manager.id },
  ]
  for (const st of shiftTasksData) {
    await db.shiftTask.create({ data: st }).catch(() => {})
  }
  console.log('✅ Shift tasks created')

  // ============ WORK PERMITS ============
  const wpData = [
    { number: 'НД-2025-001', brigadeId: brigade1.id, equipmentId: eqMap['Н-205'], description: 'Демонтаж и замена сальникового узла насоса Н-205', workType: 'repair', riskLevel: 'normal', startDate: today, endDate: new Date(now.getTime() + 2 * dayMs).toISOString().split('T')[0], responsibleName: engineer.name, status: 'active', issuedBy: manager.id },
    { number: 'НД-2025-002', brigadeId: brigade2.id, equipmentId: eqMap['М-302'], description: 'Замена подшипников электродвигателя М-302', workType: 'repair', riskLevel: 'high', startDate: new Date(now.getTime() + dayMs).toISOString().split('T')[0], endDate: new Date(now.getTime() + 3 * dayMs).toISOString().split('T')[0], responsibleName: worker4.name, status: 'draft', issuedBy: manager.id },
  ]
  for (const wp of wpData) {
    await db.workPermit.create({ data: wp }).catch(() => {})
  }
  console.log('✅ Work permits created')

  // ============ AUDIT LOGS ============
  const auditData = [
      { userId: worker.id, action: 'CREATE', entity: 'UnplannedRequest', entityId: 'audit-1', details: JSON.stringify({ number: 'З-001', title: 'Утечка через сальник насоса Н-205' }), createdAt: new Date(now.getTime() - 2 * dayMs) },
      { userId: manager.id, action: 'UPDATE', entity: 'UnplannedRequest', entityId: 'audit-2', details: JSON.stringify({ number: 'З-001', field: 'status', from: 'new', to: 'in_progress' }), createdAt: new Date(now.getTime() - 1.5 * dayMs) },
      { userId: engineer.id, action: 'CREATE', entity: 'UnplannedRequest', entityId: 'audit-3', details: JSON.stringify({ number: 'З-008', title: 'Контроль температуры подшипников Н-201' }), createdAt: new Date(now.getTime() - 0.2 * dayMs) },
      { userId: manager.id, action: 'CREATE', entity: 'WorkPermit', entityId: 'audit-4', details: JSON.stringify({ number: 'НД-2025-001', description: 'Ремонт насоса Н-205' }), createdAt: new Date(now.getTime() - 0.3 * dayMs) },
      { userId: admin.id, action: 'LOGIN', entity: 'User', entityId: admin.id, createdAt: new Date(now.getTime() - 0.1 * dayMs) },
      { userId: worker3.id, action: 'CREATE', entity: 'UnplannedRequest', entityId: 'audit-5', details: JSON.stringify({ number: 'З-002', title: 'Повышенная вибрация двигателя М-302' }), createdAt: new Date(now.getTime() - 1 * dayMs) },
      { userId: worker2.id, action: 'CREATE', entity: 'UnplannedRequest', entityId: 'audit-6', details: JSON.stringify({ number: 'З-003', title: 'Замена фильтра в компрессорной' }), createdAt: new Date(now.getTime() - 3 * dayMs) },
      { userId: engineer.id, action: 'UPDATE', entity: 'Equipment', entityId: 'audit-7', details: JSON.stringify({ code: 'Н-205', field: 'status', from: 'active', to: 'under_repair' }), createdAt: new Date(now.getTime() - 1.8 * dayMs) },
    ]
    for (const al of auditData) {
      await db.auditLog.create({ data: al }).catch(() => {})
    }
  console.log('✅ Audit logs created')

  // ============ APPROVAL ROUTES ============
  const existingRoutes = await db.approvalRoute.count()
  if (existingRoutes === 0) {
    // Route 1: Заказ запчастей по ОЗМ БЕЗ привязки к оборудованию
    const route1 = await db.approvalRoute.create({
      data: {
        name: 'Заказ ЗИП без привязки к оборудованию',
        type: 'purchase_no_equip',
        description: 'Заказ запчастей по ОЗМ из ОЗМ-справочника без привязки к оборудованию',
        steps: {
          create: [
            { stepOrder: 1, role: 'engineer', position: 'Инженер ТО', description: 'Проверка технической необходимости и корректности заявки' },
            { stepOrder: 2, role: 'manager', position: 'Руководитель службы', description: 'Согласование закупки и бюджета' },
            { stepOrder: 3, role: 'admin', position: 'Администратор', description: 'Финальное утверждение заявки' },
          ],
        },
      },
    })
    console.log('✅ Approval route 1 created (purchase_no_equip)')

    // Route 2: Заказ запчастей по ОЗМ С привязкой к оборудованию
    const route2 = await db.approvalRoute.create({
      data: {
        name: 'Заказ ЗИП с привязкой к оборудованию',
        type: 'purchase_with_equip',
        description: 'Заказ запчастей по ОЗМ из ОЗМ-справочника с привязкой к конкретному оборудованию',
        steps: {
          create: [
            { stepOrder: 1, role: 'engineer', position: 'Инженер-механик', description: 'Проверка применимости запчасти к оборудованию' },
            { stepOrder: 2, role: 'engineer', position: 'Начальник смены', description: 'Подтверждение потребности в запчасти', isOptional: true },
            { stepOrder: 3, role: 'manager', position: 'Руководитель службы', description: 'Согласование закупки и выделение бюджета' },
            { stepOrder: 4, role: 'admin', position: 'Администратор', description: 'Финальное утверждение и направление в снабжение' },
          ],
        },
      },
    })
    console.log('✅ Approval route 2 created (purchase_with_equip)')

    // Route 3: Заказ изготовления запчастей с привязкой к оборудованию
    const route3 = await db.approvalRoute.create({
      data: {
        name: 'Изготовление ЗИП с привязкой к оборудованию',
        type: 'manufacturing',
        description: 'Заказ изготовления нестандартных запчастей с привязкой к оборудованию',
        steps: {
          create: [
            { stepOrder: 1, role: 'engineer', position: 'Инженер-конструктор', description: 'Проверка чертежей и спецификаций' },
            { stepOrder: 2, role: 'engineer', position: 'Технолог', description: 'Оценка технологической возможности изготовления', isOptional: true },
            { stepOrder: 3, role: 'manager', position: 'Руководитель службы', description: 'Согласование стоимости и сроков изготовления' },
            { stepOrder: 4, role: 'admin', position: 'Администратор', description: 'Финальное утверждение заказа на изготовление' },
          ],
        },
      },
    })
    console.log('✅ Approval route 3 created (manufacturing)')
  }

  console.log('🌱 Seeding complete!')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    db.$disconnect()
  })
