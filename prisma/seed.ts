/**
 * Seed script for ЦС ТОРО CMMS
 * Creates: departments, spare parts (ОЗМ), zip requests with items and approval actions
 *
 * Run:  bun run prisma/seed.ts
 * Idempotent: checks for existing data before inserting.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ── Realistic industrial spare parts (ОЗМ) ──────────────────────────────
const SPARE_PARTS = [
  // Подшипники
  { name: 'Подшипник 6310-2RS', code: 'ОЗМ-П001', unit: 'шт', minStock: 10, currentStock: 6, price: 2800 },
  { name: 'Подшипник 6308 ZZ', code: 'ОЗМ-П002', unit: 'шт', minStock: 8, currentStock: 4, price: 1950 },
  { name: 'Подшипник 22222 SKF', code: 'ОЗМ-П003', unit: 'шт', minStock: 4, currentStock: 2, price: 12500 },
  { name: 'Подшипник NU 316 E', code: 'ОЗМ-П004', unit: 'шт', minStock: 6, currentStock: 3, price: 8700 },

  // Уплотнения / манжеты
  { name: 'Манжета 120×150×14', code: 'ОЗМ-М001', unit: 'шт', minStock: 20, currentStock: 12, price: 350 },
  { name: 'Манжета 85×110×12', code: 'ОЗМ-М002', unit: 'шт', minStock: 15, currentStock: 8, price: 280 },
  { name: 'Сальник 60×80×10', code: 'ОЗМ-М003', unit: 'шт', minStock: 12, currentStock: 5, price: 190 },
  { name: 'Уплотнение торцевое Т-150', code: 'ОЗМ-М004', unit: 'шт', minStock: 8, currentStock: 3, price: 4200 },

  // Клиноремённые передачи
  { name: 'Ремень клиновой SPB-2360', code: 'ОЗМ-Р001', unit: 'шт', minStock: 10, currentStock: 6, price: 950 },
  { name: 'Ремень клиновой SPA-1500', code: 'ОЗМ-Р002', unit: 'шт', minStock: 8, currentStock: 4, price: 720 },
  { name: 'Ремень клиновой SPC-3150', code: 'ОЗМ-Р003', unit: 'шт', minStock: 6, currentStock: 2, price: 1450 },

  // Насосное оборудование
  { name: 'Рабочее колесо ЦН-200', code: 'ОЗМ-Н001', unit: 'шт', minStock: 2, currentStock: 1, price: 35000 },
  { name: 'Вал насоса К-90/55', code: 'ОЗМ-Н002', unit: 'шт', minStock: 1, currentStock: 0, price: 68000 },
  { name: 'Направляющий аппарат НА-150', code: 'ОЗМ-Н003', unit: 'шт', minStock: 2, currentStock: 1, price: 18500 },

  // Электродвигатели и ЭПА
  { name: 'Электродвигатель АИР200М4', code: 'ОЗМ-Э001', unit: 'шт', minStock: 2, currentStock: 1, price: 85000 },
  { name: 'Датчик давления ДМ-500М', code: 'ОЗМ-Э002', unit: 'шт', minStock: 5, currentStock: 3, price: 3400 },
  { name: 'Датчик температуры ТС-100', code: 'ОЗМ-Э003', unit: 'шт', minStock: 8, currentStock: 4, price: 2100 },
  { name: 'Реле тепловое РТЛ-25', code: 'ОЗМ-Э004', unit: 'шт', minStock: 10, currentStock: 6, price: 850 },

  // Трубопроводная арматура
  { name: 'Задвижка клиновая 15КЧ19П Ду150', code: 'ОЗМ-Т001', unit: 'шт', minStock: 2, currentStock: 1, price: 45000 },
  { name: 'Клапан обратный 16КЧ19П Ду100', code: 'ОЗМ-Т002', unit: 'шт', minStock: 3, currentStock: 1, price: 22000 },
  { name: 'Фланец плоский Ду150 Ру16', code: 'ОЗМ-Т003', unit: 'шт', minStock: 20, currentStock: 8, price: 650 },
  { name: 'Прокладка паронитовая Ду100', code: 'ОЗМ-Т004', unit: 'шт', minStock: 50, currentStock: 30, price: 45 },

  // Масла и смазки
  { name: 'Масло индустриальное ИГП-46', code: 'ОЗМ-С001', unit: 'кг', minStock: 100, currentStock: 65, price: 320 },
  { name: 'Смазка Литол-24', code: 'ОЗМ-С002', unit: 'кг', minStock: 50, currentStock: 28, price: 580 },
  { name: 'Масло турбинное ТП-22С', code: 'ОЗМ-С003', unit: 'кг', minStock: 200, currentStock: 120, price: 440 },

  // Ремкомплекты
  { name: 'Ремкомплект насоса ЦН-200', code: 'ОЗМ-К001', unit: 'компл', minStock: 1, currentStock: 0, price: 42000 },
  { name: 'Ремкомплект задвижки Ду150', code: 'ОЗМ-К002', unit: 'компл', minStock: 2, currentStock: 1, price: 15000 },
  { name: 'Фильтр масляный ФМ-001', code: 'ОЗМ-К003', unit: 'шт', minStock: 6, currentStock: 2, price: 3800 },

  // Метизы
  { name: 'Болт М20×80 прочн. 8.8', code: 'ОЗМ-Б001', unit: 'шт', minStock: 100, currentStock: 45, price: 85 },
  { name: 'Болт М16×60 прочн. 10.9', code: 'ОЗМ-Б002', unit: 'шт', minStock: 100, currentStock: 55, price: 65 },
]

// ── Departments ─────────────────────────────────────────────────────────
const DEPARTMENTS = [
  { name: 'Механическая служба', code: 'МС' },
  { name: 'Электроцех', code: 'ЭЦ' },
  { name: 'Участок КИПиА', code: 'КИП' },
]

// ── Zip requests (approved, with items) ───────────────────────────────────
function buildZipRequests(
  adminId: string,
  engineerId: string,
  managerId: string,
  purchaseRouteId: string,
  mfgRouteId: string,
  deptIds: string[],
  sparePartIds: string[],  // 30 items, index-matched to SPARE_PARTS
) {
  return [
    {
      number: 'ЗН-2025-001',
      type: 'purchase',
      status: 'approved',
      priority: 'annual',
      title: 'Годовая потребность в подшипниках и уплотнениях',
      description: 'Плановое пополнение склада на 2025 год. Подшипники, манжеты, сальники.',
      neededBy: '2025-06-30',
      requestedBy: engineerId,
      applicantName: 'Петров Пётр Петрович',
      applicantDepartmentId: deptIds[0],
      approvalRouteId: purchaseRouteId,
      currentStepOrder: 2,
      itemIndexes: [0, 1, 2, 4, 5, 6], // indexes in SPARE_PARTS
      itemQuantities: [20, 10, 6, 30, 20, 15],
    },
    {
      number: 'ЗН-2025-002',
      type: 'purchase',
      status: 'approved',
      priority: 'urgent',
      title: 'Срочная закупка запчастей для насосов',
      description: 'Критический износ рабочих колёс и вала насоса К-90/55. Нужна замена.',
      neededBy: '2025-04-15',
      requestedBy: engineerId,
      applicantName: 'Волков Николай Андреевич',
      applicantDepartmentId: deptIds[0],
      approvalRouteId: purchaseRouteId,
      currentStepOrder: 2,
      itemIndexes: [10, 11, 12], // Насосное оборудование
      itemQuantities: [2, 1, 1],
    },
    {
      number: 'ЗН-2025-003',
      type: 'purchase',
      status: 'approved',
      priority: 'additional',
      title: 'Пополнение склада расходников и масел',
      description: 'Дополнительная потребность — ремни, масла, смазки, фильтры.',
      neededBy: '2025-07-01',
      requestedBy: managerId,
      applicantName: 'Иванов Иван Иванович',
      applicantDepartmentId: deptIds[1],
      approvalRouteId: purchaseRouteId,
      currentStepOrder: 2,
      itemIndexes: [8, 9, 10, 21, 22, 23, 28, 29], // Ремни, масла, метизы
      itemQuantities: [12, 8, 5, 100, 60, 200, 200, 200],
    },
    {
      number: 'ЗН-2025-004',
      type: 'manufacturing',
      status: 'approved',
      priority: 'additional',
      title: 'Изготовление валов и деталей по чертежам',
      description: 'Вал насоса и направляющий аппарат — изготовление по чертежам в мехмастерской.',
      neededBy: '2025-05-20',
      requestedBy: engineerId,
      applicantName: 'Петров Пётр Петрович',
      applicantDepartmentId: deptIds[0],
      approvalRouteId: mfgRouteId,
      currentStepOrder: 3,
      itemIndexes: [11, 12], // Вал насоса, направляющий аппарат
      itemQuantities: [1, 2],
    },
  ]
}

async function main() {
  console.log('🌱 Seeding ЦС ТОРО database...\n')

  // ── 1. Check existing users ────────────────────────────────────────
  const users = await db.user.findMany({
    select: { id: true, name: true, role: true },
  })
  if (users.length === 0) {
    console.log('⚠️  No users found. Run the app first to create default users via register endpoint.')
    process.exit(1)
  }

  const admin = users.find((u) => u.role === 'admin')!
  const manager = users.find((u) => u.role === 'manager')!
  const engineers = users.filter((u) => u.role === 'engineer')
  const engineer1 = engineers[0] || manager

  console.log(`✅ Found ${users.length} users`)

  // ── 2. Departments ───────────────────────────────────────────────────
  const existingDepts = await db.department.count()
  let deptIds: string[] = []

  if (existingDepts === 0) {
    console.log('\n📦 Creating departments...')
    for (const d of DEPARTMENTS) {
      const dept = await db.department.create({ data: d })
      deptIds.push(dept.id)
      console.log(`   + ${d.name} (${d.code})`)
    }
  } else {
    console.log('\n📦 Departments already exist, skipping...')
    const depts = await db.department.findMany({ select: { id: true } })
    deptIds = depts.map((d) => d.id)
  }

  // ── 3. Spare Parts (ОЗМ) ───────────────────────────────────────────
  const existingParts = await db.sparePart.count()
  let sparePartIds: string[] = []

  if (existingParts === 0) {
    console.log('\n🔩 Creating 30 spare parts (ОЗМ)...')
    for (const sp of SPARE_PARTS) {
      const part = await db.sparePart.create({ data: sp })
      sparePartIds.push(part.id)
    }
    console.log(`   + ${sparePartIds.length} items created`)
  } else {
    console.log(`\n🔩 Spare parts already exist (${existingParts}), skipping...`)
    const parts = await db.sparePart.findMany({ select: { id: true }, orderBy: { code: 'asc' } })
    sparePartIds = parts.map((p) => p.id)
  }

  // ── 4. Approval Routes ────────────────────────────────────────────
  const routes = await db.approvalRoute.findMany({
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  })
  const purchaseRoute = routes.find((r) => r.type === 'purchase')
  const mfgRoute = routes.find((r) => r.type === 'manufacturing')

  // ── 5. Zip Requests ────────────────────────────────────────────────
  const existingRequests = await db.zipRequest.count()

  if (existingRequests === 0) {
    console.log('\n📋 Creating zip requests with items...')

    const requestsData = buildZipRequests(
      admin.id,
      engineer1.id,
      manager.id,
      purchaseRoute?.id || '',
      mfgRoute?.id || '',
      deptIds,
      sparePartIds,
    )

    for (const rd of requestsData) {
      // Create the request
      const zipReq = await db.zipRequest.create({
        data: {
          number: rd.number,
          type: rd.type,
          status: rd.status,
          priority: rd.priority,
          title: rd.title,
          description: rd.description,
          neededBy: rd.neededBy,
          requestedBy: rd.requestedBy,
          applicantName: rd.applicantName,
          applicantDepartmentId: rd.applicantDepartmentId,
          approvalRouteId: rd.approvalRouteId,
          currentStepOrder: rd.currentStepOrder,
        },
      })

      // Create items
      for (let i = 0; i < rd.itemIndexes.length; i++) {
        const spIdx = rd.itemIndexes[i]
        const sp = SPARE_PARTS[spIdx]
        const qty = rd.itemQuantities[i]
        const spId = sparePartIds[spIdx] || undefined

        await db.zipRequestItem.create({
          data: {
            zipRequestId: zipReq.id,
            sparePartId: spId,
            articleNumber: sp.code,
            name: sp.name,
            quantity: qty,
            unit: sp.unit,
            unitPrice: sp.price,
            totalPrice: sp.price ? sp.price * qty : undefined,
            material: sp.code.startsWith('ОЗМ-Н') ? 'Сталь 45 ГОСТ 1050' : undefined,
            drawingNumber: sp.code.startsWith('ОЗМ-Н') ? `Ч-${sp.code}` : undefined,
          },
        })
      }

      // Create approval actions — all steps approved
      const route = rd.type === 'purchase' ? purchaseRoute : mfgRoute
      if (route) {
        for (const step of route.steps) {
          const approver =
            step.role === 'engineer' ? engineer1 :
            step.role === 'manager' ? manager :
            admin

          await db.approvalAction.create({
            data: {
              zipRequestId: zipReq.id,
              approvalStepId: step.id,
              decidedBy: approver.id,
              status: 'approved',
              comment: `Согласовано — ${step.position || step.role}`,
              decidedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000), // 7 days ago
            },
          })
        }
      }

      console.log(`   + ${rd.number}: ${rd.title} (${rd.itemIndexes.length} items, approved)`)
    }
  } else {
    console.log(`\n📋 Zip requests already exist (${existingRequests}), skipping...`)
  }

  // ── Summary ─────────────────────────────────────────────────────────
  const stats = {
    departments: await db.department.count(),
    spareParts: await db.sparePart.count(),
    zipRequests: await db.zipRequest.count(),
    zipRequestItems: await db.zipRequestItem.count(),
    approvalActions: await db.approvalAction.count(),
  }

  console.log('\n📊 Seed complete:')
  console.log(`   Departments:    ${stats.departments}`)
  console.log(`   Spare Parts:    ${stats.spareParts}`)
  console.log(`   Zip Requests:   ${stats.zipRequests}`)
  console.log(`   Request Items:  ${stats.zipRequestItems}`)
  console.log(`   Approvals:      ${stats.approvalActions}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
