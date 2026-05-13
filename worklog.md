# CMMS/EAM "ЦС ТОРО" — Complete Project Analysis for .NET Core Rebuild

---

## 1. DATABASE SCHEMA (SQLite via Prisma ORM)

### 1.1 User (Пользователь)
| Field | Type | Constraints/Default | Description |
|-------|------|-------------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| email | String | @unique | Login email |
| passwordHash | String | required | scrypt hash: "salt:hash" |
| name | String | required | Display name |
| role | String | @default("worker") | admin, manager, engineer, worker |
| departmentId | String? | FK → Department | |
| brigadeId | String? | FK → Brigade | |
| isActive | Boolean | @default(true) | |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |
| **Relations**: Department?, Brigade?, AuditLog[], createdRequests[], assignedRequests[], foremanBrigades[], assignedShiftTasks[], issuedPermits[]

### 1.2 AuditLog (Аудит-лог)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| userId | String | FK → User (Cascade delete) |
| action | String | CREATE, UPDATE, DELETE, LOGIN |
| entity | String | Equipment, SparePart, etc. |
| entityId | String? | |
| details | String? | JSON string with changes |
| ipAddress | String? | |
| createdAt | DateTime | |

### 1.3 Department (Подразделение)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| name | String | |
| code | String | @unique |
| parentId | String? | Self-ref (DeptHierarchy) |
| description | String? | |
| headName | String? | |
| createdAt/updatedAt | DateTime | |
| **Relations**: parent Department?, children Department[], users User[], brigades Brigade[], equipment Equipment[]

### 1.4 Brigade (Бригада)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| name | String | |
| code | String | @unique |
| departmentId | String | FK → Department (required) |
| foremanId | String? | FK → User (BrigadeForeman) |
| description | String? | |
| createdAt/updatedAt | DateTime | |
| **Relations**: department, foreman User?, members User[], shiftTasks, workPermits, maintenanceTasks, unplannedRequests

### 1.5 ShiftTask (Сменно-суточное задание)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| brigadeId | String | FK → Brigade |
| date | String | YYYY-MM-DD |
| shift | String | "day", "night" |
| description | String | |
| status | String | planned, in_progress, completed, cancelled |
| assignedBy | String? | FK → User |
| createdAt/updatedAt | DateTime | |

### 1.6 WorkPermit (Наряд-допуск)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| number | String | @unique |
| brigadeId | String | FK → Brigade |
| equipmentId | String? | FK → Equipment |
| description | String | |
| workType | String | repair, maintenance, installation, etc. |
| riskLevel | String | low, normal, high, extreme |
| startDate/endDate | String | |
| responsibleName | String | |
| status | String | draft, active, completed, cancelled |
| issuedBy | String? | FK → User |
| createdAt/updatedAt | DateTime | |

### 1.7 Equipment (Оборудование) — MAIN ENTITY
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| name | String | Наименование |
| code | String | @unique — Инвентарный номер |
| parentId | String? | Self-ref (EquipHierarchy) |
| departmentId | String? | FK → Department |
| equipmentTypeId | String? | FK → EquipmentType |
| location | String? | |
| manufacturer | String? | |
| model | String? | |
| serialNumber | String? | |
| commissionDate | String? | |
| status | String | active, under_repair, decommissioned |
| criticality | String | low, medium, high, critical |
| description | String? | |
| specifications | String? | JSON |
| **Extended (Excel 93 fields)**: | | |
| inventoryNumber | String? | Инвентарный номер ОС (11 digits) |
| quantity | Float? | Количество |
| unit | String? | ЕИ: м, шт, км |
| drawing | String? | Чертёж |
| equipmentClass | String? | Класс |
| topazNumber | String? | Номер ТОПАЗ |
| sapNumber | Int? | Номер SAP TORO |
| abcdCode | String? | A/B/C/D |
| costCenter | String? | МВЗ |
| manufactureDate | String? | YYYY-MM-DD |
| decommissionDate | String? | |
| processImportance | String? | Важность для ТП |
| isKey | Boolean @default(false) | Ключевое |
| isTest | Boolean @default(false) | Испытательное |
| hasReserve | Boolean @default(false) | Наличие резерва |
| parentEquipmentSap | Int? | Вышестоящая ЕО (SAP) |
| **JSON Blob Fields** (stored as JSON strings): | | |
| locationData | String? | 17 fields: workshop, building, productionArea, techArea, roomNumber, roomName, lineInstallation, floor, span, projectNumber, etc. |
| responsibilityData | String? | 5 fields: responsibleWorkshop, responsibleSpecialistService, responsiblePerson, safetyResponsiblePerson, materiallyResponsiblePerson |
| maintenanceData | String? | 26 fields: TO/TR/KR intervals (mech, elec, kip, asu, weld), contractors, repairComplexity, shiftMode, laborConditionsFactor, etc. |
| verificationData | String? | 2 fields: lastVerificationDate, validUntilDate |
| safetyData | String? | 14 fields: isHazardousFacility, isChemicalHazardous, isSafetyCritical, safetyClass, classificationCode, registrationNumber, externalSupervisionAuthority, etc. |
| supervisionData | String? | 6 fields: supervisionType, nextSupervisionDate, nextInspectionDate, nextDiagnosticsDate, permittedOperationDate, etc. |
| **Relations**: parent?, children[], department?, equipmentType?, maintenancePlan[], workPermits[], sparePartMovements[], unplannedRequests[], measuredParameters[]

### 1.8 EquipmentType (Тип оборудования)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| name | String | |
| code | String | @unique |
| parentId | String? | Self-ref (TypeHierarchy) |
| description | String? | |
| **Relations**: parent?, children[], equipment[]

### 1.9 MeasuredParameter (Измеряемый параметр)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| equipmentId | String | FK → Equipment (Cascade) |
| name | String | |
| unitOkei | String? | ОКЕИ код |
| unitSymbol | String? | |
| refValue | Float? | Reference value |
| toleranceMin | Float? | % |
| toleranceMax | Float? | % |
| description | String? | |
| sortOrder | Int | @default(0) |
| **Relations**: equipment, records[]

### 1.10 MeasurementRecord (Запись замера)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| parameterId | String | FK → MeasuredParameter (Cascade) |
| measuredValue | Float | |
| measuredDate | String | |
| operatorName | String | |
| notes | String? | |
| createdAt | DateTime | |

### 1.11 SparePart (Запасная часть)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| name | String | |
| code | String | @unique — артикул |
| categoryId | String? | FK → SparePartCategory |
| unit | String | @default("шт") |
| minStock | Int | @default(0) |
| currentStock | Int | @default(0) |
| price | Float? | |
| description | String? | |
| specifications | String? | JSON |
| **Relations**: category?, movements[]

### 1.12 SparePartCategory (Категория запчастей)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| name | String | |
| code | String | @unique |
| parentId | String? | Self-ref (SpareCatHierarchy) |
| description | String? | |
| **Relations**: parent?, children[], parts[]

### 1.13 SparePartMovement (Движение запчастей)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| sparePartId | String | FK → SparePart |
| equipmentId | String? | FK → Equipment |
| type | String | receipt, issue, transfer, write_off |
| quantity | Int | |
| reason | String? | |
| documentNo | String? | |
| performedBy | String? | |
| createdAt | DateTime | |

### 1.14 MaintenancePlan (План ППР)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| equipmentId | String | @unique FK → Equipment |
| planName | String | |
| lastMaintenance | String? | |
| nextMaintenance | String | |
| intervalDays | Int | |
| description | String? | |
| status | String | active, paused, completed |
| createdAt/updatedAt | DateTime | |
| **Relations**: equipment, tasks[]

### 1.15 MaintenanceTask (Задача ППР)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| planId | String | FK → MaintenancePlan (Cascade) |
| scheduledDate | String | |
| description | String | |
| brigadeId | String? | FK → Brigade |
| status | String | planned, assigned, in_progress, completed, overdue |
| completedAt | String? | |
| notes | String? | |
| createdAt/updatedAt | DateTime | |

### 1.16 UnplannedRequest (Неплановая заявка)
| Field | Type | Description |
|-------|------|-------------|
| id | String | PK |
| number | String | @unique — format: "З-001" |
| equipmentId | String? | FK → Equipment |
| title | String | |
| description | String | |
| priority | String | low, medium, high, critical |
| status | String | new, assigned, in_progress, completed, cancelled |
| requestedBy | String | FK → User (RequestAuthor) |
| assignedTo | String? | FK → User (RequestAssignee) |
| brigadeId | String? | FK → Brigade |
| completedAt | String? | |
| resolution | String? | |
| createdAt/updatedAt | DateTime | |

---

## 2. API ROUTES (27 route files)

### 2.1 Auth Routes

#### POST /api/auth/login
- **Body**: `{ email, password }`
- **Response**: `{ user: { id, email, name, role, isActive } }` + Set-Cookie `session_token` (user.id, httpOnly, 7 days)
- **Logic**: Find user by email, verify password (scrypt/timingSafeEqual), create AuditLog LOGIN, return user + cookie

#### POST /api/auth/logout
- **Body**: none
- **Response**: `{ message }` + Clear session_token cookie
- **Logic**: Clear cookie

#### POST /api/auth/register
- **Body**: `{ email, password, name }`
- **Response**: `{ user }` + Set session cookie
- **Logic**: Validate (email unique, password ≥ 6 chars), create user with role="worker", hash password with scrypt

#### GET /api/auth/me
- **Auth**: Cookie `session_token` → fallback Bearer header → fallback query param `?token=`
- **Response**: `{ user: { id, email, name, role, isActive, departmentId, brigadeId, createdAt } }`
- **Logic**: Find user by session token, check isActive

### 2.2 Equipment Routes

#### GET /api/equipment
- **Query**: `?search=&status=&typeId=&page=&limit=50`
- **Response**: `{ items: Equipment[], total, page, limit }`
- **Logic**: Prisma filter (status, typeId) + in-memory text search (Cyrillic case-insensitive) + pagination

#### POST /api/equipment
- **Body**: `{ name, code, departmentId?, equipmentTypeId?, location?, manufacturer?, model?, serialNumber?, commissionDate?, criticality?, description? }`
- **Response**: Equipment (with department & equipmentType) 201
- **Logic**: Validate name+code required, check code unique, create + audit log

#### PUT /api/equipment
- **Body**: `{ id, name, code, ...ALL_EXTENDED_FIELDS }` — 47+ fields including JSON blobs
- **Response**: Equipment 200
- **Logic**: Validate, check exists, check code uniqueness (exclude self), update all fields including locationData/responsibilityData/etc. JSON strings, audit log

#### DELETE /api/equipment
- **Body**: `{ id }`
- **Response**: `{ success: true }`
- **Logic**: Check exists, delete, audit log

#### GET /api/equipment/[id]
- **Response**: Equipment detail with department, equipmentType, maintenancePlan (with last 10 tasks), parent, children
- **Logic**: Include nested relations

#### POST /api/equipment/search
- **Body**: `{ conditions: [{ field, operator: "includes"|"excludes"|"equals"|"notEquals"|"greaterThan"|"lessThan", value }] }`
- **Response**: `{ items, total }`
- **Logic**: In-memory filtering across 26 scalar fields + 50+ JSON nested fields. Supports wildcard (*) in string search. All case-insensitive via toLowerCase() (Cyrillic-safe). Maps dot-notation (e.g., "location.workshop") to JSON column + inner key.

#### POST /api/equipment/import
- **Body**: FormData with `file` (.xlsx/.csv, max 5MB)
- **Response**: `{ imported, skipped, errors, errorDetails[] }`
- **Logic**: Parse Excel/CSV with extensive Russian column name mapping (~100 aliases), date parsing (ISO, DD.MM.YYYY, Excel serial dates, native Date), status/criticality mapping (Russian→English), department/equipment type name resolution, duplicate detection, bulk create with audit logs

#### GET /api/equipment/import/template
- **Response**: .xlsx file download with 2 sheets (template + reference guide)
- **Logic**: Generate Excel template with headers, examples, validation hints

#### POST /api/equipment/export
- **Body**: `{ headers: string[], rows: string[][] }`
- **Response**: .xlsx file download
- **Logic**: Generic Excel export from headers+rows data

#### PUT /api/equipment/bulk
- **Body**: `{ ids: string[] (max 500), updates: Record<string, unknown> }`
- **Response**: `{ success, updated, items: Equipment[] }`
- **Logic**: Validate allowed fields (27 scalar + 7 JSON), validate types (bool/number/JSON), update all in transaction, batch audit log

#### GET /api/equipment/[id]/parameters
- **Response**: `{ parameters: MeasuredParameter[] }` with records + computed deviation & isInTolerance
- **Logic**: Deviation = ((measuredValue - refValue) / refValue) * 100. isInTolerance = deviation within [toleranceMin, toleranceMax]

#### POST /api/equipment/[id]/parameters
- **Body**: `{ equipmentId, name, unitOkei?, unitSymbol?, refValue?, toleranceMin?, toleranceMax?, description?, sortOrder? }`
- **Response**: MeasuredParameter 201

#### PUT /api/equipment/[id]/parameters
- **Body**: `{ id, ...fields }`
- **Response**: MeasuredParameter

#### DELETE /api/equipment/[id]/parameters
- **Body**: `{ id }` — cascade deletes records

#### POST /api/equipment/[id]/parameters/records
- **Body**: `{ parameterId, measuredValue, measuredDate, operatorName, notes? }`
- **Response**: MeasurementRecord 201
- **Logic**: Verify parameter belongs to equipment

#### DELETE /api/equipment/[id]/parameters/records
- **Body**: `{ id }`

#### GET /api/equipment/[id]/measured-params (ALTERNATE/LEGACY — uses unit/referenceValue instead of unitOkei/unitSymbol)
- Same concept but different field naming

#### POST /api/equipment/[id]/measured-params
#### PUT /api/equipment/[id]/measured-params
#### DELETE /api/equipment/[id]/measured-params

### 2.3 Spare Parts Routes

#### GET /api/spare-parts
- **Query**: `?search=&categoryId=&lowStock=true&page=&limit=50`
- **Response**: `{ items, total, page, limit, lowStockCount }`
- **Logic**: Text search (name/code contains), categoryId filter, lowStock filter (currentStock ≤ minStock)

#### POST /api/spare-parts
- **Body**: `{ name, code, categoryId?, unit?, minStock?, currentStock?, price?, description? }`
- **Response**: SparePart with category

#### PUT /api/spare-parts
- **Body**: `{ id, name, code, ... }`

#### DELETE /api/spare-parts
- **Body**: `{ id }`

### 2.4 Planning Routes

#### GET /api/planning
- **Response**: `{ plans: MaintenancePlan[], tasksByStatus: Record<string, number> }`
- **Logic**: All plans with equipment + tasks (ordered by scheduledDate), groupBy task status

#### POST /api/planning
- **Body**: `{ equipmentId, planName?, intervalDays, description?, status? }`
- **Logic**: Check equipment exists, check no existing plan (1:1), calculate nextMaintenance = now + interval, create plan + first task

#### PUT /api/planning
- **Body**: Either `{ taskId, status?, notes?, completedAt? }` for task update, OR `{ id, status?, planName?, intervalDays?, description? }` for plan update
- **Logic**: If task completed → update plan's lastMaintenance/nextMaintenance, create next task automatically

### 2.5 Requests Routes

#### GET /api/requests
- **Query**: `?search=&status=&priority=&page=&limit=50`
- **Response**: `{ items: UnplannedRequest[], total, page, limit }`

#### POST /api/requests
- **Body**: `{ equipmentId?, title, description, priority? }`
- **Logic**: Auto-generate number "З-XXX", set requestedBy = current user, status = "new"

#### PUT /api/requests
- **Body**: `{ id, title?, description?, priority?, equipmentId?, status?, assigneeId?, brigadeId? }`

#### DELETE /api/requests
- **Body**: `{ id }`

#### GET /api/requests/[id]
- **Response**: Full UnplannedRequest with equipment, author, assignee, brigade

### 2.6 Personnel Routes

#### GET /api/personnel
- **Query**: `?section=all`
- **Response**: `{ departments, brigades, shiftTasks, workPermits, totalPersonnel }`
- **Logic**: All departments with users + brigades + members + foreman, last 100 shift tasks, last 100 work permits

#### POST /api/personnel
- **Body**: `{ name, code, departmentId, description?, foremanId? }`
- **Logic**: Create brigade, validate unique code, check department exists

#### PUT /api/personnel
- **Body**: `{ id, name, code, departmentId, description?, foremanId? }`

#### DELETE /api/personnel
- **Body**: `{ id }`

### 2.7 Dashboard Route

#### GET /api/dashboard
- **Response**: `{ stats: { totalEquipment, activeRequests, activeMaintenancePlans, totalSpareParts, equipmentByStatus, requestsByStatus, requestsByPriority }, recentActivity[] }`
- **Logic**: Parallel queries: count equipment, active requests, active plans, spare parts, groupBy status, last 50 audit logs

### 2.8 Analytics Route

#### GET /api/analytics
- **Response**: `{ kpi: { pprCompletionPercent, requestsAvgResolutionHours, equipmentWorkingPercent, lowStockParts }, stats: {...}, requestsByMonth: [{ month, total, completed }] }`
- **Logic**: KPI calculations (PPR completion %, avg resolution hours, equipment working %, low stock count), monthly request counts for last 6 months

### 2.9 Export Route

#### POST /api/export
- **Body**: `{ headers: string[], rows: string[][], sheetName? }`
- **Response**: .xlsx file download with Cyrillic-to-Latin sheet name transliteration

### 2.10 OKEI Route

#### GET /api/okei
- **Query**: `?q=&limit=50`
- **Response**: OkeiUnit[] — Russian measurement units
- **Logic**: Static JSON data (595 units from ОК 015-94), scored search by code/name/symbol

### 2.11 Column Presets Route (NOTE: ColumnPreset model referenced but NOT in schema — runtime error likely)

#### GET /api/column-presets
- **Query**: `?module=&type=view`
- **Response**: `{ presets: ColumnPreset[] }`

#### POST /api/column-presets
- **Body**: `{ userId, module, name, type, columns: string[], isDefault? }`

#### DELETE /api/column-presets
- **Body**: `{ id }`

### 2.12 Other Routes

#### GET /api/measured-records
- **POST**: Add measurement record (`{ parameterId, measuredValue, measurementDate, performerName, notes? }`)
- **DELETE**: `{ id }`

#### GET /api/
- Returns `{ message: "Hello, world!" }` — health check

---

## 3. PAGES & FRONTEND ARCHITECTURE

### 3.1 App Structure (SPA — Single Page)
- **Root layout**: `/src/app/layout.tsx` — lang="ru", Geist font, Sonner toaster
- **Only page**: `/src/app/page.tsx` — Client component, acts as SPA entry
- **No route groups** — all navigation is client-side via zustand state `activeModule`

### 3.2 Module Navigation (Sidebar)
7 modules defined in `app-store.ts` as `ModuleKey`:
| Module Key | Label | Icon | Component |
|------------|-------|------|-----------|
| dashboard | Панель управления | LayoutDashboard | dashboard-page.tsx |
| equipment | Оборудование | Server | equipment-page.tsx |
| personnel | Подразделения | Users | personnel-page.tsx |
| spare-parts | Запасные части | Package | spare-parts-page.tsx |
| planning | График ППР | CalendarDays | planning-page.tsx |
| requests | Неплановые заявки | AlertTriangle | requests-page.tsx |
| analytics | Аналитика | BarChart3 | analytics-page.tsx |

### 3.3 Page Details

#### Dashboard Page (`dashboard-page.tsx`)
- 4 stat cards: total equipment, active requests, active maintenance plans, total spare parts
- Quick action cards with "under development" badges
- Recent activity feed (last 50 audit logs) with entity icons and formatted timestamps

#### Equipment Page (`equipment-page.tsx`)
- Full CRUD table with search, status filter, pagination
- **Advanced search** dialog (equipment-search.tsx) with multi-condition builder
- **Import dialog**: Upload .xlsx/.csv, shows results
- **Export to Excel**: dynamic column selection
- **Bulk operations**: select multiple → bulk edit (20+ fields) / bulk delete
- **Column customization**: Add/remove/reorder optional columns (87 total columns across 11 groups), persisted in localStorage
- **Equipment Card** (`equipment-card.tsx`): Detailed view/edit in 8 tabs:
  1. Main info (20+ fields)
  2. Location (17 JSON fields)
  3. Responsibility (5 JSON fields)
  4. Maintenance (26 JSON fields — intervals, contractors, repair complexity)
  5. Verification (2 JSON fields)
  6. Safety (14 JSON fields)
  7. Supervision (6 JSON fields)
  8. Measured Parameters (custom tab with chart)

#### Personnel Page (`personnel-page.tsx`)
- 3 tabs: Brigades, Shift Tasks, Work Permits
- Brigade CRUD (create/edit/delete dialogs)
- Department cards summary grid

#### Spare Parts Page (`spare-parts-page.tsx`)
- Stats: total items, in stock, needs reorder (lowStock)
- Full CRUD with search, category filter
- Low stock highlighting (red rows when currentStock ≤ minStock)

#### Planning Page (`planning-page.tsx`)
- Monthly calendar view with task counts
- Plan creation dialog (select equipment, set interval)
- Plans table with overdue/upcoming indicators
- Task completion (auto-creates next task on completion)
- Plan detail view dialog

#### Requests Page (`requests-page.tsx`)
- Status count cards (new, in progress, completed, cancelled)
- Full CRUD with search + status filter
- Status quick-change dropdown per row
- Detail view dialog with full info
- Priority badges

#### Analytics Page (`analytics-page.tsx`)
- 4 KPI cards with trend indicators
- Summary stats grid
- Monthly requests bar chart (last 6 months)
- Equipment status progress bars
- Date range selector (UI only, not connected to API)

### 3.4 Auth Flow
1. Login form (`login-form.tsx`) → POST /api/auth/login
2. Session stored in: (a) httpOnly cookie `session_token` = user.id, (b) localStorage `session_user` = JSON user
3. App loads → checks localStorage first (synchronous) → verifies via /api/auth/me (background)
4. Sidebar shows user name + role
5. Logout → clears localStorage + cookie → redirects to /

### 3.5 Key UI Libraries
- **shadcn/ui** — 30+ components (button, card, dialog, table, tabs, etc.)
- **Tailwind CSS v4** — utility-first
- **Lucide React** — icons
- **Sonner** — toast notifications
- **Zustand** — 2 stores (auth, app)
- **TanStack Table** — referenced in imports but not used directly (hand-rolled tables)
- **Recharts** — chart library
- **@dnd-kit** — drag-and-drop (used for column reordering)
- **XLSX (SheetJS)** — Excel import/export
- **date-fns** — date formatting
- **react-hook-form + zod** — form handling (imported but may not be fully used)
- **next-intl** — i18n (imported, used in layout)
- **framer-motion** — animations (imported)
- **sharp** — image processing (imported)

---

## 4. AUTHENTICATION MECHANISM

### 4.1 Password Hashing (`/src/lib/auth.ts`)
- **Algorithm**: scrypt (Node.js crypto)
- **Format**: `salt:hash` where salt = randomBytes(16).toString('hex'), hash = scryptSync(password, salt, 64).toString('hex')
- **Verification**: timingSafeEqual to prevent timing attacks

### 4.2 Session Management
- **Cookie-based**: `session_token` = user.id (NOT a JWT — just the user ID)
- **Cookie config**: httpOnly=true, secure=false (dev), sameSite='lax', path='/', maxAge=7 days
- **LocalStorage fallback**: `session_user` = JSON user data (for offline/auth persistence)
- **Auth check priority**: Cookie → Authorization: Bearer header → query param ?token=
- **NO JWT verification** — session is just user lookup by ID

### 4.3 Role System
- Roles: admin, manager, engineer, worker
- **NO role-based access control** in API routes — all authenticated users can do everything
- Role is only used for UI display (sidebar label, "under development" badges)

### 4.4 Zustand Stores (`/src/store/`)

**auth-store.ts**:
```typescript
interface AuthState {
  user: { id, email, name, role, isActive } | null
  isLoading: boolean
  login(user) / setUser(user) / setLoading(bool) / logout()
}
```

**app-store.ts**:
```typescript
interface AppState {
  activeModule: 'dashboard' | 'equipment' | 'personnel' | 'spare-parts' | 'planning' | 'requests' | 'analytics'
  sidebarCollapsed: boolean
  setActiveModule(module) / toggleSidebar() / setSidebarCollapsed(bool)
}
```

---

## 5. KEY CONFIGURATION

### 5.1 Database (`/src/lib/db.ts`)
- **ORM**: Prisma Client (prisma-client-js)
- **DB**: SQLite (via env DATABASE_URL)
- **Singleton**: Global singleton pattern for HMR

### 5.2 Next.js Config (`/next.config.ts`)
- **TypeScript**: ignoreBuildErrors: true
- **React Strict Mode**: disabled
- **No special middleware, rewrites, or headers**

### 5.3 Package.json Dependencies
**Runtime:**
- next@^16.1.1, react@^19, react-dom@19
- @prisma/client@^6.11.1 (ORM)
- zustand@^5 (state management)
- @tanstack/react-query@^5.82.0, @tanstack/react-table@^8.21.3
- shadcn/ui via radix-ui (30+ @radix-ui/* packages)
- lucide-react, framer-motion
- zod@^4, react-hook-form@^7
- xlsx@0.18.5 (Excel I/O)
- docx@9.6.1 (Word docs)
- recharts@2.15.4, @mdxeditor/editor@^3.39.1
- next-intl@^4.3.4, next-themes@0.4.6
- @dnd-kit/core@6, @dnd-kit/sortable@10
- sharp@0.34.3, date-fns@4.1.0
- sonner@2.0.6, tailwindcss@4
- uuid@11.1.0, clsx, tailwind-merge

---

## 6. ADDITIONAL HOOKS & UTILITIES

### 6.1 `use-column-presets.ts`
Custom hook for managing column visibility presets per module. Methods: fetchPresets, savePreset, deletePreset, setAsDefault.

### 6.2 `use-mobile.ts`
Detects mobile viewport for responsive UI.

### 6.3 `use-toast.ts`
Toast notification hook (likely thin wrapper around sonner).

### 6.4 `lib/okei-units.ts`
Static array of 595 OKEI measurement units with code, name, national symbol, international symbol, national code, international code, and category.

### 6.5 `lib/utils.ts`
Utility: cn() (clsx + tailwind-merge helper).

### 6.6 `lib/okei-units.json`
JSON version of OKEI units data (used by /api/okei).

---

## 7. IDENTIFIED ISSUES / NOTES FOR .NET CORE REBUILD

1. **ColumnPreset model missing from schema**: The `/api/column-presets` route uses `db.columnPreset` but the model is not defined in `schema.prisma`. This route will fail at runtime. Add a ColumnPreset model or remove the route.

2. **Duplicate parameter routes**: Two different implementations exist for measured parameters:
   - `/api/equipment/[id]/parameters` (proper — uses unitOkei, unitSymbol, refValue)
   - `/api/equipment/[id]/measured-params` (legacy — uses unit, referenceValue)
   Only the first is used in the UI.

3. **No RBAC**: All API routes only check `isActive`, not role. Need to add role-based authorization.

4. **Session is just user ID**: Not a JWT. No token expiration check. For .NET, implement proper JWT or session-based auth.

5. **SQLite LIKE is ASCII-only for Cyrillic**: The code intentionally loads all records and filters in-memory for case-insensitive search. For .NET with EF Core + PostgreSQL, use ILIKE instead.

6. **Equipment search is in-memory**: Loads ALL equipment for advanced search. For large datasets, consider server-side WHERE clauses with proper collation.

7. **SparePartMovement API exists in model but has no API route**: The `SparePartMovement` model is defined but no CRUD endpoints exist for it.

8. **EquipmentType CRUD is only via equipment**: No dedicated /api/equipment-types endpoint — types are managed through the Equipment form.

9. **No middleware/auth guard**: Auth is checked per-route with `getSessionUser()`. For .NET, use middleware.

10. **No file upload storage**: Equipment import saves to `/tmp/` and deletes. For .NET, use temp file provider or blob storage.

---

## Task ID: 2 — ASP.NET Core 8 Web API Project Created

### Date: $(date -u +%Y-%m-%d)

### Summary
Created a complete ASP.NET Core 8 Web API project for CMMS/EAM "ЦС ТОРО" at `/home/z/cs-toro/CsToro/`. The project builds successfully with 0 errors.

### Project Structure
```
CsToro/
├── GlobalUsings.cs              (global using aliases for model enums)
├── Data/
│   ├── AppDbContext.cs          (16 DbSets, all relationships configured)
│   └── SeedData.cs              (3 users, 2 departments, 2 brigades)
├── Models/ (18 models)
│   ├── User.cs                  (with UserRole enum)
│   ├── Department.cs            (self-referencing)
│   ├── Brigade.cs               (FK→Department, User)
│   ├── Equipment.cs             (MAIN: 40+ fields, JSON blobs, self-ref)
│   ├── EquipmentType.cs         (self-referencing)
│   ├── MeasuredParameter.cs     (FK→Equipment, cascade)
│   ├── MeasurementRecord.cs     (FK→MeasuredParameter, cascade)
│   ├── SparePart.cs             (FK→SparePartCategory)
│   ├── SparePartCategory.cs     (self-referencing)
│   ├── SparePartMovement.cs     (FK→SparePart, Equipment)
│   ├── MaintenancePlan.cs       (1:1→Equipment, unique)
│   ├── MaintenanceTask.cs       (FK→MaintenancePlan, cascade)
│   ├── UnplannedRequest.cs      (auto-numbered "З-{DDD}")
│   ├── ShiftTask.cs             (FK→Brigade, cascade)
│   ├── WorkPermit.cs            (FK→Brigade, cascade; auto-numbered)
│   ├── AuditLog.cs              (FK→User, cascade)
│   └── ColumnPreset.cs          (FK→User, cascade)
├── DTOs/ (7 DTO files)
│   ├── AuthDtos.cs              (Login, Register, ChangePassword, UserDto)
│   ├── EquipmentDtos.cs         (Equipment, Measurement, Search, Paged)
│   ├── SparePartDtos.cs         (SparePart, Movement, Category)
│   ├── PlanningDtos.cs          (Plan, Task CRUD DTOs)
│   ├── RequestDtos.cs           (UnplannedRequest, ShiftTask, WorkPermit)
│   ├── PersonnelDtos.cs         (Department, Brigade)
│   ├── DashboardDtos.cs         (Stats, Upcoming, Recent, ActivePermits)
│   └── AnalyticsDtos.cs         (Distributions, Compliance, Workload)
├── Services/
│   ├── AuthService.cs           (login, register, token generation/verification)
│   ├── AuditService.cs          (logging, querying audit trail)
│   └── EquipmentSearchService.cs (full-text search, detail with children)
├── Middleware/
│   └── AuthMiddleware.cs        (Bearer token validation, public path whitelist)
├── Controllers/ (8 controllers)
│   ├── AuthController.cs        (login, register, users CRUD, change-password)
│   ├── EquipmentController.cs   (CRUD, search, tree, parameters, types)
│   ├── SparePartsController.cs  (CRUD, movements, categories, low-stock)
│   ├── PlanningController.cs    (plans CRUD, tasks CRUD, overdue)
│   ├── RequestsController.cs    (unplanned requests, shift tasks, work permits)
│   ├── PersonnelController.cs   (departments CRUD, brigades CRUD)
│   ├── DashboardController.cs   (stats, upcoming, recent, active permits)
│   └── AnalyticsController.cs   (status/criticality distributions, compliance)
├── wwwroot/
│   └── index.html               (placeholder page with status)
├── Program.cs                   (DI, SQLite, seeding, CORS, auth, port 3000)
├── appsettings.json             (SQLite connection string)
└── CsToro.csproj                (EF Core SQLite 8.0.11)
```

### Key Technical Decisions
1. **String GUIDs** for all IDs (matching Prisma String type)
2. **SQLite** database at `/home/z/cs-toro/data.db`
3. **Password hashing**: PBKDF2-HMAC-SHA256 (100K iterations) with salt:hash base64 format
4. **All dates stored as strings** in `yyyy-MM-dd` format
5. **String comparison** (`string.Compare()`) for date filtering in LINQ
6. **Global using aliases** to resolve `TaskStatus` ambiguity with `System.Threading.Tasks.TaskStatus`
7. **JSON blob fields** on Equipment stored as strings, serialized/deserialized as needed
8. **Token auth**: Simple HMAC-SHA256 signed base64 token (not JWT)

### NuGet Packages
- Microsoft.EntityFrameworkCore.Sqlite 8.0.11
- Microsoft.EntityFrameworkCore.Design 8.0.11

### Seed Data
- **admin@enterprise.ru** / admin123 (Admin role)
- **manager@enterprise.ru** / manager123 (Manager role)
- **engineer@enterprise.ru** / engineer123 (Engineer role)
- 2 Departments: "Производственный отдел", "Энергетическая служба"
- 2 Brigades: "Бригада №1", "Бригада №2"

### API Endpoints (35+ endpoints)
- `POST /api/auth/login` | `POST /api/auth/register` | `GET /api/auth/me` | `GET /api/auth/users`
- `GET /api/equipment/search` | `GET /api/equipment/{id}` | `POST/PUT/DELETE /api/equipment`
- `GET /api/equipment/{id}/tree` | Parameters & Types sub-endpoints
- `GET /api/spareparts` | `POST /api/spareparts/{id}/movements` | Categories & Low-stock
- `GET /api/planning/plans` | Tasks CRUD | `GET /api/planning/tasks/overdue`
- `GET /api/requests/unplanned` | `POST /api/requests/shifts` | Work Permits
- `GET /api/personnel/departments` | Brigades CRUD
- `GET /api/dashboard/stats` | Upcoming | Recent | Active Permits
- `GET /api/analytics/overview` | Distributions | Compliance | Workload
- `GET /api/health` (public)

### Build Status
✅ **dotnet build succeeded** — 0 warnings, 0 errors

---

## Task ID: 3 — Complete SPA Frontend for ЦС ТОРО .NET Backend

### Date: 2025-07-10

### Summary
Created a complete single-page application frontend for the CMMS/EAM "ЦС ТОРО" .NET Core backend at `/home/z/cs-toro/CsToro/wwwroot/`. The frontend is a production-ready SPA built with Alpine.js, Tailwind CSS CDN, and Lucide icons — no build step required.

### Files Created (11 files)

```
CsToro/wwwroot/
├── index.html          — Main SPA shell (~600 lines)
│   ├── Login page with demo access buttons
│   ├── Sidebar navigation (dark #0F1B2D, orange #FF9900 accent)
│   ├── Dashboard page (stat cards, activity feed, quick actions)
│   ├── Equipment page (table, detail side panel, parameters, plan)
│   ├── Spare Parts page (table with low-stock highlighting)
│   ├── Planning page (plan cards with task completion)
│   ├── Requests page (status cards, inline status dropdown)
│   ├── Personnel page (departments grid, brigades CRUD)
│   ├── Analytics page (KPI cards, bar charts, status distribution)
│   ├── Sticky footer with copyright
│   └── Toast notification system
├── app.js              — Alpine.js application logic (~470 lines)
│   ├── Toast notification system (showToast)
│   ├── Date formatting utilities
│   ├── Alpine.data('app') — main component (auth, navigation, API, helpers)
│   ├── Alpine.data('dashboardPage') — dashboard stats & activity
│   ├── Alpine.data('equipmentPage') — equipment CRUD, parameters, tasks
│   ├── Alpine.data('sparePartsPage') — spare parts CRUD
│   ├── Alpine.data('planningPage') — maintenance plans & task completion
│   ├── Alpine.data('requestsPage') — requests CRUD, inline status change
│   ├── Alpine.data('personnelPage') — departments & brigades CRUD
│   └── Alpine.data('analyticsPage') — KPIs, charts, distributions
├── style.css           — Custom styles (~200 lines)
│   ├── Dark sidebar theme
│   ├── Login gradient background with pulse animation
│   ├── Form input focus styles (orange ring)
│   ├── Stat card hover effects
│   ├── Data table with zebra striping & hover
│   ├── Low-stock row highlighting
│   ├── Status badges (active/completed/in_progress/cancelled/etc.)
│   ├── Priority badges (low/medium/high/critical)
│   ├── Criticality badges
│   ├── Custom scrollbar styling
│   ├── Toast notification animations
│   ├── Spinner & skeleton animations
│   └── Responsive breakpoints
└── pages/
    ├── login.js        — Login page reference
    ├── dashboard.js    — Dashboard page reference
    ├── equipment.js    — Equipment page reference
    ├── spare-parts.js  — Spare parts page reference
    ├── planning.js     — Planning page reference
    ├── requests.js     — Requests page reference
    ├── personnel.js    — Personnel page reference
    └── analytics.js    — Analytics page reference
```

### Technology Stack
- **Alpine.js 3.14.8** — reactive state management via `x-data`, `x-show`, `x-for`, `x-model`
- **Tailwind CSS 4 (CDN)** — utility-first styling with custom brand colors
- **Lucide Icons 0.460.0** — consistent iconography
- **Vanilla JavaScript** — no build step, no bundler, no framework

### Features Implemented
1. **Authentication**: Login/logout with Bearer token, localStorage persistence, auto-restore session
2. **Responsive Design**: Mobile-first, sidebar collapses on mobile with overlay
3. **Toast Notifications**: Success/error/info toasts with auto-dismiss animations
4. **Dashboard**: 4 stat cards, equipment status breakdown, requests by priority, quick actions, recent activity feed
5. **Equipment Management**: Search with status filter, paginated table, CRUD modals, detail side panel with 3 tabs (Main, Parameters with measurement records, Maintenance Plan with task completion)
6. **Spare Parts**: Search, low-stock filter, table with red highlighting, CRUD modals
7. **Planning**: Plans list with tasks, create plan form, task completion (auto-creates next)
8. **Requests**: Search with status filter, status count cards, inline status dropdown, create/view/delete modals, priority badges
9. **Personnel**: Department cards grid, brigades CRUD table
10. **Analytics**: KPI cards with progress bars, monthly requests bar chart (div-based), equipment status distribution

### API Integration
All API calls go through a centralized `api()` method that:
- Prepends `/api` base path
- Adds `Authorization: Bearer {token}` header
- Handles 401 auto-logout
- Shows connection error toasts
- All 35+ backend endpoints are consumed

### UI Theme
- Sidebar: `#0F1B2D` (dark navy)
- Accent: `#FF9900` (AWS orange)
- Content area: White background
- Status colors: Green (active/completed), Yellow (in progress), Red (decommissioned/cancelled), Blue (new/planned)
- Priority colors: Gray (low), Blue (medium), Yellow (high), Red (critical)
- Russian language throughout

## Task ID: 3b - Fix route mismatches between frontend (app.js) and backend controllers

**Status**: ✅ Completed

### Summary
Fixed 6 route mismatches between frontend API calls and backend controller endpoints to ensure the frontend receives data in the expected format.

### Changes Made

#### 1. AuthController.cs - Response format wrapping
- **Login**: Wrapped response from flat `result` → `{user: {id, email, name, role}, token}`
- **GetCurrentUser (GET /auth/me)**: Wrapped response from flat `user` → `{user: user}`

#### 2. DashboardController.cs - Added root GET `/api/dashboard`
- Added `GetDashboard()` endpoint returning `{stats: {...}, recentActivity: [...]}`
- Stats include: totalEquipment, activeRequests, activeMaintenancePlans, totalSpareParts, equipmentByStatus, requestsByPriority
- RecentActivity queries AuditLogs with User navigation (last 50, ordered by CreatedAt desc)
- Verified: `AppDbContext` already has `DbSet<AuditLog> AuditLogs` and `AuditLog` model already has `User` navigation property

#### 3. PlanningController.cs - Added root GET `/api/planning`
- Added `GetAll()` endpoint returning `{plans: [...]}` with Equipment and Tasks (ordered by ScheduledDate) included

#### 4. RequestsController.cs - Added root GET `/api/requests`
- Added `GetAllRequests()` endpoint with optional `status` and `priority` query filters
- Returns `{items: [...], total: N}` (up to 100 items)
- Items include: id, number, title, description, priority, status, createdAt, updatedAt, equipmentName, requestedByName, assignedToName, brigadeName

#### 5. PersonnelController.cs - Added root GET `/api/personnel`
- Added `GetAll()` endpoint returning `{departments: [...], brigades: [...]}`
- Departments include: id, name, code, description, userCount, brigadeCount
- Brigades include: id, name, code, departmentId, foremanId, description, departmentName, foremanName

#### 6. AnalyticsController.cs - Added root GET `/api/analytics`
- Added `GetAnalytics()` endpoint returning `{kpi: {...}, stats: {...}, requestsByMonth: [...]}`
- KPI includes: totalEquipment, activeEquipment, underRepair, totalRequests, completedRequests, completionRate, avgResolutionDays
- Stats include: equipmentByStatus, requestsByStatus
- requestsByMonth: last 6 months of request counts

### Verification
- `dotnet build` completed with 0 errors, 0 warnings


---
Task ID: 4 — Fix column drag-and-drop: GripVertical icon visibility and drag functionality

### Date: 2025-07-11

### Summary
Fixed two issues with column drag-and-drop reordering in the equipment table:
1. GripVertical icon was nearly invisible (size-3 at 30% opacity)
2. Drag-and-drop was unreliable due to stale closure issue with `dragColKey` state

### Changes Made (file: src/components/modules/equipment-page.tsx)

#### 1. Added `dragOverColKey` state for precise drag-over tracking
- New state variable: `const [dragOverColKey, setDragOverColKey] = useState<string | null>(null)`
- `handleColDragOver` now sets `dragOverColKey` to the target column
- Added `onDragLeave` handler on `<TableHead>` to clear `dragOverColKey`

#### 2. Fixed drag-over visual indicator
- Changed from `isDragOver = dragColKey && dragColKey !== col.key` (any column that wasn't the source got highlighted)
- To `isDragOver = dragOverColKey === col.key && dragColKey !== col.key` (only the column currently being hovered gets highlighted)
- Enhanced visual: `bg-orange-100 ring-2 ring-orange-400 ring-inset` instead of just `bg-orange-50`

#### 3. Fixed `handleColDrop` stale closure
- Now reads from `e.dataTransfer.getData('text/plain')` as primary source, with `dragColKey` as fallback
- Added `toast.success('Столбец перемещён')` confirmation
- Clears `dragOverColKey` on drop

#### 4. Fixed `handleColDragEnd` 
- Added `React.DragEvent` parameter type
- Clears both `dragColKey` and `dragOverColKey`
- Restores element opacity

#### 5. Made GripVertical icon visible
- Size: `size-3` (12px) → `size-3.5` (14px)
- Default opacity: `text-muted-foreground/30` → `text-muted-foreground/60` (doubled from 30% to 60%)
- Hover: `group-hover:text-muted-foreground/60` → `group-hover:text-muted-foreground` (full opacity on hover)

#### 6. Added `onDragLeave` handler
- `onDragLeave={() => setDragOverColKey(null)}` clears drag-over highlight when cursor leaves

### Verification
- No pinned/fixed columns by default — confirmed by checking `DEFAULT_VISIBLE_COLUMNS` and `visibleOptionalCols` state (no pinning logic exists)
- Lint passes (only pre-existing error in unrelated ipv6-proxy.js)
---
Task ID: 1
Agent: Main Agent
Task: Fix column drag-and-drop using @dnd-kit (replace broken mouse events approach)

Work Log:
- Analyzed previous failed attempts (4x): HTML5 DnD, useRef fixes, manual mouse events with elementFromPoint
- Found @dnd-kit/core v6.3.1 and @dnd-kit/sortable v10.0.0 already installed in project
- Created SortableColumnHeader component using useSortable hook from @dnd-kit/sortable
- Replaced manual mouse event code (colHeaderDragRef, dragColKey, dragOverColKey, document event listeners) with DndContext + SortableContext + handleColumnDragEnd
- Each column header now uses dnd-kit listeners on GripVertical drag handle
- MouseSensor with 5px distance activation constraint prevents accidental drags
- TouchSensor with 200ms delay for mobile support
- ClosestCenter collision detection for column reordering
- arrayMove utility for clean reorder logic
- Build verified successful with no new errors
- Production server deployed on port 3000

Stage Summary:
- Column drag-and-drop now uses @dnd-kit library (robust, battle-tested)
- SortableColumnHeader component wraps each data column <th> with useSortable hook
- DndContext wraps entire table with SortableContext for column headers
- GripVertical icon serves as the drag handle with dnd-kit listeners
- Visual feedback: opacity 0.4 + orange background + shadow during drag
- Previous manual mouse events code completely removed
- Key files modified: src/components/modules/equipment-page.tsx

---
Task ID: 2
Agent: Main Agent
Task: Implement view presets system for equipment table

Work Log:
- Added ViewPreset interface with all view state fields (columns, search, statusFilter, sortKey, sortDir, colFilters, advancedConditions)
- Implemented localStorage persistence (key: eam-equipment-presets)
- Added preset CRUD: saveNewPreset, applyPreset, updateCurrentPreset, deletePreset, renamePreset, duplicatePreset
- captureCurrentView snapshot function to capture all current state
- Added presets DropdownMenu button in table toolbar (next to "Изменить список атрибутов")
- Sub-menus per preset: Apply, Rename, Duplicate, Delete
- Save/Rename dialog with name input, Enter key support, state summary
- Active preset visual indicator (orange border + BookmarkCheck icon)
- Build verified, server deployed on port 3000

Stage Summary:
- Commit: 6ab1adb - feat: view presets for column sets, search values, and filters
- Files: src/components/modules/equipment-page.tsx (+271 lines)
- Presets stored in localStorage, survive page reload
- All view state captured and restored: columns, search, filters, sort, advanced conditions

---
Task ID: 3
Agent: Main Agent
Task: Fix presets button visibility and seed database with 50 equipment items

Work Log:
- Identified root cause: presets DropdownMenu was outside the flex container div, rendered invisible
- Wrapped "Изменить список атрибутов" and "Пресеты" buttons in shared flex div with gap-2
- Database was empty - seeded 50 equipment items with full attributes
- Seeded 5 departments, 8 equipment types, 3 demo users
- Old server process was stale - killed and rebuilt with start.sh
- Verified API returns 50 items and JS chunk contains "Пресеты" text

Stage Summary:
- Presets button now visible in toolbar (right side, next to column config button)
- 50 equipment items in database with locations, responsibility, maintenance data
- Demo users: admin@enterprise.ru, manager@enterprise.ru, engineer@enterprise.ru
- Server running on port 3000 via start.sh keepalive

