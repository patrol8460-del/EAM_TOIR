import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { getSessionUser } from '@/lib/auth'

/**
 * GET /api/equipment/import/template
 * Returns a downloadable .xlsx template with correct column headers,
 * example values, and validation hints.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // ── Define template columns ──────────────────────────────────────
    const columns: { header: string; example: string; hint: string }[] = [
      { header: 'Наименование', example: 'Насос центробежный ЦН-200', hint: 'Обязательное поле' },
      { header: 'Инв. номер', example: 'Н-201', hint: 'Обязательное поле, уникальный' },
      { header: 'Тип/модель', example: 'ЦН-200/300', hint: '' },
      { header: 'Изготовитель', example: 'ГМС Насосы', hint: '' },
      { header: 'Серийный номер', example: 'SN-2024-00451', hint: '' },
      { header: 'Подразделение', example: 'Цех №1', hint: 'Название или код подразделения' },
      { header: 'Статус', example: 'В работе', hint: 'В работе / В ремонте / Списано' },
      { header: 'Критичность', example: 'Среднее', hint: 'Низкое / Среднее / Высокое / Критичное' },
      { header: 'Расположение', example: 'Цех №1, пом. А', hint: '' },
      { header: 'Описание', example: 'Основной насос подачи воды', hint: '' },
      { header: 'Инвентарный номер ОС', example: '12345678901', hint: '11 знаков, бухгалтерский учёт' },
      { header: 'Количество', example: '1', hint: 'Число' },
      { header: 'ЕИ', example: 'шт', hint: 'шт / м / км и т.д.' },
      { header: 'Чертёж', example: 'ЦН-200-СБ', hint: '' },
      { header: 'Класс', example: 'III', hint: 'Класс оборудования' },
      { header: 'Номер ТОПАЗ', example: 'ТОПАЗ-001', hint: '' },
      { header: 'Номер SAP TORO', example: '1000456', hint: 'Число' },
      { header: 'Код ABCD', example: 'A', hint: 'A / B / C / D' },
      { header: 'МВЗ', example: '2310', hint: 'Место затрат (ЦМО)' },
      { header: 'Дата выпуска', example: '15.03.2024', hint: 'ДД.ММ.ГГГГ' },
      { header: 'Дата ввода в эксплуатацию', example: '01.06.2024', hint: 'ДД.ММ.ГГГГ' },
      { header: 'Важность для ТП', example: 'Высокая', hint: 'Важность для технологического процесса' },
    ]

    // ── Create workbook ──────────────────────────────────────────────
    const wb = XLSX.utils.book_new()

    // Sheet 1: Template
    const headers = columns.map((c) => c.header)
    const examples = columns.map((c) => c.example)
    const hints = columns.map((c) => c.hint)

    const data = [headers, examples]
    if (hints.some((h) => h !== '')) {
      data.push(hints)
    }

    const ws = XLSX.utils.aoa_to_sheet(data)

    // Set column widths based on header length
    ws['!cols'] = headers.map((h) => ({
      wch: Math.max(h.length + 4, 16),
    }))

    // Freeze the header row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 }

    XLSX.utils.book_append_sheet(wb, ws, 'Шаблон импорта')

    // Sheet 2: Reference guide
    const refData = [
      ['Справочник по заполнению'],
      [],
      ['Столбец', 'Описание', 'Допустимые значения / Формат'],
      ['Наименование', 'Название оборудования', 'Обязательное. Текст, любой длины.'],
      ['Инв. номер', 'Инвентарный номер', 'Обязательный. Уникальный в системе.'],
      ['Тип/модель', 'Марка, модель или тип', 'Текст.'],
      ['Изготовитель', 'Завод-изготовитель', 'Текст.'],
      ['Серийный номер', 'Заводской / серийный номер', 'Текст.'],
      ['Подразделение', 'Цех, участок, служба', 'Должно совпадать с названием или кодом в системе.'],
      ['Статус', 'Текущее состояние', 'В работе / Работает / В ремонте / Списано'],
      ['Критичность', 'Уровень критичности', 'Низкое / Среднее / Высокое / Критичное'],
      ['Расположение', 'Место установки', 'Текст.'],
      ['Описание', 'Дополнительные сведения', 'Текст.'],
      ['Инвентарный номер ОС', 'Бухгалтерский номер', '11 знаков.'],
      ['Количество', 'Количество единиц', 'Число.'],
      ['ЕИ', 'Единица измерения', 'шт / м / км / кг и т.д.'],
      ['Чертёж', 'Номер чертежа', 'Текст.'],
      ['Класс', 'Класс оборудования', 'Текст (I, II, III, IV и т.д.).'],
      ['Номер ТОПАЗ', 'Идентификатор в ТОПАЗ', 'Текст.'],
      ['Номер SAP TORO', 'Идентификатор в SAP', 'Число.'],
      ['Код ABCD', 'ABC-классификация', 'A / B / C / D (одна буква).'],
      ['МВЗ', 'Место затрат', 'Текст (код или наименование).'],
      ['Дата выпуска', 'Дата изготовления', 'ДД.ММ.ГГГГ или ГГГГ-ММ-ДД.'],
      ['Дата ввода в эксплуатацию', 'Дата пуска в работу', 'ДД.ММ.ГГГГ или ГГГГ-ММ-ДД.'],
      ['Важность для ТП', 'Технологическая значимость', 'Текст.'],
      [],
      ['Правила:'],
      ['1. Строка 1 в шаблоне — заголовки (не удаляйте и не переименовывайте).'],
      ['2. Строка 2 — примеры значений (удалите перед заполнением).'],
      ['3. Строка 3 — подсказки (можно удалить).'],
      ['4. Обязательные столбцы: Наименование и Инв. номер.'],
      ['5. Строки без наименования и инв. номера пропускаются.'],
      ['6. Строки с дублирующим инв. номером пропускаются.'],
      ['7. Поддерживаются файлы .xlsx и .csv до 5 МБ.'],
    ]

    const wsRef = XLSX.utils.aoa_to_sheet(refData)
    wsRef['!cols'] = [{ wch: 30 }, { wch: 32 }, { wch: 44 }]

    XLSX.utils.book_append_sheet(wb, wsRef, 'Справочник')

    // ── Generate buffer ──────────────────────────────────────────────
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // ── Return as downloadable file ──────────────────────────────────
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="equipment_import_template.xlsx"',
        'Content-Length': String(buffer.length),
      },
    })
  } catch (error) {
    console.error('Template generation error:', error)
    return NextResponse.json({ error: 'Ошибка генерации шаблона' }, { status: 500 })
  }
}
