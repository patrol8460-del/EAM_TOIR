---
Task ID: 1
Agent: Main
Task: Implement Spare Parts (ЗИП) module with 3 ordering routes, file attachments, and approval workflow

Work Log:
- Updated Prisma schema with 6 new models: ZipRequest, ZipRequestItem, ZipRequestFile, ApprovalRoute, ApprovalStep, ApprovalAction
- Added relations to existing User, Equipment, SparePart models
- Pushed schema to SQLite database and regenerated Prisma client
- Seeded 3 default approval routes with steps (purchase_no_equip, purchase_with_equip, manufacturing)
- Created 6 API route files:
  - /api/zip-requests (GET list + POST create)
  - /api/zip-requests/[id] (GET detail + PUT update + DELETE)
  - /api/zip-requests/[id]/approve (POST approve/reject/skip)
  - /api/zip-requests/[id]/files (GET list + POST upload + DELETE)
  - /api/approval-routes (GET list + POST create)
  - /api/approval-routes/[id] (GET + PUT + DELETE)
- Fixed schema: added decidedByUser relation to ApprovalAction model
- Completely rewrote spare-parts-page.tsx with 3 tabs:
  - Каталог (existing spare parts CRUD preserved)
  - Потребности (ZIP requests list, create dialog with 4 steps, detail with approval timeline)
  - Маршруты согласования (admin-only route configuration)
- Built and deployed to standalone server
- Tested all APIs successfully (list, create, approval workflow)

Stage Summary:
- Full ЗИП (Spare Parts) ordering system with 3 routes implemented
- Approval workflow with configurable multi-step routes
- File attachment support for ZIP requests
- Auto-numbering for requests (ЗИП-YYYYMMDD-NNN)
- Admin-only approval route management
- All deployed and verified working
