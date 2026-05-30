/**
 * ОКЕИ — Общероссийский классификатор единиц измерения
 * ОК 015-94 (МК 002-97)
 * Source: https://classifikators.ru/okei
 * Extracted: 595 units
 * 
 * Categories:
 *   - Единицы длины (Length)
 *   - Единицы площади (Area)
 *   - Единицы объема (Volume)
 *   - Единицы массы (Mass)
 *   - Технические единицы (Technical units)
 *   - Единицы времени (Time)
 *   - Экономические единицы (Economic units)
 *   - Дозировки лекарственных препаратов (Pharmaceutical dosages)
 */

export interface OkeiUnit {
  /** OKEI code (numeric string) */
  code: string;
  /** Full Russian name */
  name: string;
  /** Short national designation (Russian), e.g. "м", "кг", "шт" */
  nationalSymbol: string;
  /** Short international designation, e.g. "m", "kg", "pc" */
  symbol: string;
  /** National code designation (uppercase), e.g. "МТ", "КГ", "ШТ" */
  nationalCode: string;
  /** International code designation, e.g. "MTR", "KGM", "PCE" */
  internationalCode: string;
  /** Category group name in Russian */
  category: string;
}

export const OKEI_UNITS: readonly OkeiUnit[] = [
  { code: '354', name: 'Секунда', nationalSymbol: 'с', symbol: 's', nationalCode: 'С', internationalCode: 'SEC', category: 'Единицы времени' },
  { code: '355', name: 'Минута', nationalSymbol: 'мин', symbol: 'min', nationalCode: 'МИН', internationalCode: 'MIN', category: 'Единицы времени' },
  { code: '356', name: 'Час', nationalSymbol: 'ч', symbol: 'h', nationalCode: 'Ч', internationalCode: 'HUR', category: 'Единицы времени' },
  { code: '359', name: 'Сутки', nationalSymbol: 'сут; дн', symbol: 'd', nationalCode: 'СУТ; ДН', internationalCode: 'DAY', category: 'Единицы времени' },
  { code: '360', name: 'Неделя', nationalSymbol: 'нед', symbol: '-', nationalCode: 'НЕД', internationalCode: 'WEE', category: 'Единицы времени' },
  { code: '361', name: 'Декада', nationalSymbol: 'дек', symbol: '-', nationalCode: 'ДЕК', internationalCode: 'DAD', category: 'Единицы времени' },
  { code: '362', name: 'Месяц', nationalSymbol: 'мес', symbol: '-', nationalCode: 'МЕС', internationalCode: 'MON', category: 'Единицы времени' },
  { code: '364', name: 'Квартал', nationalSymbol: 'кварт', symbol: '-', nationalCode: 'КВАРТ', internationalCode: 'QAN', category: 'Единицы времени' },
  { code: '365', name: 'Полугодие', nationalSymbol: 'полгода', symbol: '-', nationalCode: 'ПОЛГОД', internationalCode: 'SAN', category: 'Единицы времени' },
  { code: '366', name: 'Год', nationalSymbol: 'г; лет', symbol: 'a', nationalCode: 'ГОД; ЛЕТ', internationalCode: 'ANN', category: 'Единицы времени' },
  { code: '368', name: 'Десятилетие', nationalSymbol: 'деслет', symbol: '-', nationalCode: 'ДЕСЛЕТ', internationalCode: 'DEC', category: 'Единицы времени' },
  { code: '003', name: 'Миллиметр', nationalSymbol: 'мм', symbol: 'mm', nationalCode: 'ММ', internationalCode: 'MMT', category: 'Единицы длины' },
  { code: '004', name: 'Сантиметр', nationalSymbol: 'см', symbol: 'cm', nationalCode: 'СМ', internationalCode: 'CMT', category: 'Единицы длины' },
  { code: '005', name: 'Дециметр', nationalSymbol: 'дм', symbol: 'dm', nationalCode: 'ДМ', internationalCode: 'DMT', category: 'Единицы длины' },
  { code: '006', name: 'Метр', nationalSymbol: 'м', symbol: 'm', nationalCode: 'М', internationalCode: 'MTR', category: 'Единицы длины' },
  { code: '008', name: 'Километр; тысяча метров', nationalSymbol: 'км; 103 м', symbol: 'km', nationalCode: 'КМ; ТЫС М', internationalCode: 'KMT', category: 'Единицы длины' },
  { code: '009', name: 'Мегаметр; миллион метров', nationalSymbol: 'Мм; 106 м', symbol: 'Mm', nationalCode: 'МЕГАМ; МЛН М', internationalCode: 'MAM', category: 'Единицы длины' },
  { code: '039', name: 'Дюйм (25,4 мм)', nationalSymbol: 'дюйм', symbol: 'in', nationalCode: 'ДЮЙМ', internationalCode: 'INH', category: 'Единицы длины' },
  { code: '041', name: 'Фут (0,3048 м)', nationalSymbol: 'фут', symbol: 'ft', nationalCode: 'ФУТ', internationalCode: 'FOT', category: 'Единицы длины' },
  { code: '043', name: 'Ярд (0,9144 м)', nationalSymbol: 'ярд', symbol: 'yd', nationalCode: 'ЯРД', internationalCode: 'YRD', category: 'Единицы длины' },
  { code: '047', name: 'Морская миля (1852 м)', nationalSymbol: 'миля', symbol: 'n mile', nationalCode: 'МИЛЬ', internationalCode: 'NMI', category: 'Единицы длины' },
  { code: '160', name: 'Гектограмм', nationalSymbol: 'гг', symbol: 'hg', nationalCode: 'ГГ', internationalCode: 'HGM', category: 'Единицы массы' },
  { code: '161', name: 'Миллиграмм', nationalSymbol: 'мг', symbol: 'mg', nationalCode: 'МГ', internationalCode: 'MGM', category: 'Единицы массы' },
  { code: '162', name: 'Метрический карат (1 карат = 200 мг = 2*10-4 кг)', nationalSymbol: 'кар', symbol: 'МС', nationalCode: 'КАР', internationalCode: 'CTM', category: 'Единицы массы' },
  { code: '163', name: 'Грамм', nationalSymbol: 'г', symbol: 'g', nationalCode: 'Г', internationalCode: 'GRM', category: 'Единицы массы' },
  { code: '164', name: 'Микрограмм', nationalSymbol: 'мкг', symbol: 'mg', nationalCode: 'МКГ', internationalCode: 'MG', category: 'Единицы массы' },
  { code: '166', name: 'Килограмм', nationalSymbol: 'кг', symbol: 'kg', nationalCode: 'КГ', internationalCode: 'KGM', category: 'Единицы массы' },
  { code: '168', name: 'Тонна; метрическая тонна (1000 кг)', nationalSymbol: 'т', symbol: 't', nationalCode: 'Т', internationalCode: 'TNE', category: 'Единицы массы' },
  { code: '170', name: 'Килотонна', nationalSymbol: '103 т', symbol: 'kt', nationalCode: 'КТ', internationalCode: 'KTN', category: 'Единицы массы' },
  { code: '173', name: 'Сантиграмм', nationalSymbol: 'сг', symbol: 'cg', nationalCode: 'СГ', internationalCode: 'CGM', category: 'Единицы массы' },
  { code: '181', name: 'Брутто-регистровая тонна (2,8316 м3)', nationalSymbol: 'БРТ', symbol: '-', nationalCode: 'БРУТТ. РЕГИСТР Т', internationalCode: 'GRT', category: 'Единицы массы' },
  { code: '185', name: 'Грузоподъемность в метрических тоннах', nationalSymbol: 'т грп', symbol: '-', nationalCode: 'Т ГРУЗОПОД', internationalCode: 'CCT', category: 'Единицы массы' },
  { code: '206', name: 'Центнер (метрический) (100 кг); гектокилограмм; квинтал (метрический); децитонна', nationalSymbol: 'ц', symbol: 'q; 102 kg', nationalCode: 'Ц', internationalCode: 'DTN', category: 'Единицы массы' },
  { code: '110', name: 'Кубический миллиметр', nationalSymbol: 'мм3', symbol: 'mm3', nationalCode: 'ММ3', internationalCode: 'MMQ', category: 'Единицы объема' },
  { code: '111', name: 'Кубический сантиметр; миллилитр', nationalSymbol: 'см3; мл', symbol: 'cm3; ml', nationalCode: 'СМ3; МЛ', internationalCode: 'CMQ; MLT', category: 'Единицы объема' },
  { code: '112', name: 'Литр; кубический дециметр', nationalSymbol: 'л; дм3', symbol: 'I; L; dm3', nationalCode: 'Л; ДМ3', internationalCode: 'LTR; DMQ', category: 'Единицы объема' },
  { code: '113', name: 'Кубический метр', nationalSymbol: 'м3', symbol: 'm3', nationalCode: 'М3', internationalCode: 'MTQ', category: 'Единицы объема' },
  { code: '118', name: 'Децилитр', nationalSymbol: 'дл', symbol: 'dl', nationalCode: 'ДЛ', internationalCode: 'DLT', category: 'Единицы объема' },
  { code: '122', name: 'Гектолитр', nationalSymbol: 'гл', symbol: 'hl', nationalCode: 'ГЛ', internationalCode: 'HLT', category: 'Единицы объема' },
  { code: '126', name: 'Мегалитр', nationalSymbol: 'Мл', symbol: 'Ml', nationalCode: 'МЕГАЛ', internationalCode: 'MAL', category: 'Единицы объема' },
  { code: '131', name: 'Кубический дюйм (16387,1 мм3)', nationalSymbol: 'дюйм3', symbol: 'in3', nationalCode: 'ДЮЙМ3', internationalCode: 'INQ', category: 'Единицы объема' },
  { code: '132', name: 'Кубический фут (0,02831685 м3)', nationalSymbol: 'фут3', symbol: 'ft3', nationalCode: 'ФУТ3', internationalCode: 'FTQ', category: 'Единицы объема' },
  { code: '133', name: 'Кубический ярд (0,764555 м3)', nationalSymbol: 'ярд3', symbol: 'yd3', nationalCode: 'ЯРД3', internationalCode: 'YDQ', category: 'Единицы объема' },
  { code: '159', name: 'Миллион кубических метров', nationalSymbol: '106 м3', symbol: '106 m3', nationalCode: 'МЛН М3', internationalCode: 'HMQ', category: 'Единицы объема' },
  { code: '050', name: 'Квадратный миллиметр', nationalSymbol: 'мм2', symbol: 'mm2', nationalCode: 'ММ2', internationalCode: 'MMK', category: 'Единицы площади' },
  { code: '051', name: 'Квадратный сантиметр', nationalSymbol: 'см2', symbol: 'cm2', nationalCode: 'СМ2', internationalCode: 'CMK', category: 'Единицы площади' },
  { code: '053', name: 'Квадратный дециметр', nationalSymbol: 'дм2', symbol: 'dm2', nationalCode: 'ДМ2', internationalCode: 'DMK', category: 'Единицы площади' },
  { code: '055', name: 'Квадратный метр', nationalSymbol: 'м2', symbol: 'm2', nationalCode: 'М2', internationalCode: 'MTK', category: 'Единицы площади' },
  { code: '058', name: 'Тысяча квадратных метров', nationalSymbol: '103 м2', symbol: 'daa', nationalCode: 'ТЫС М2', internationalCode: 'DAA', category: 'Единицы площади' },
  { code: '059', name: 'Гектар', nationalSymbol: 'га', symbol: 'ha', nationalCode: 'ГА', internationalCode: 'HAR', category: 'Единицы площади' },
  { code: '061', name: 'Квадратный километр', nationalSymbol: 'км2', symbol: 'km2', nationalCode: 'КМ2', internationalCode: 'KMK', category: 'Единицы площади' },
  { code: '071', name: 'Квадратный дюйм (645,16 мм2)', nationalSymbol: 'дюйм2', symbol: 'in2', nationalCode: 'ДЮЙМ2', internationalCode: 'INK', category: 'Единицы площади' },
  { code: '073', name: 'Квадратный фут (0,092903 м2)', nationalSymbol: 'фут2', symbol: 'ft2', nationalCode: 'ФУТ2', internationalCode: 'FTK', category: 'Единицы площади' },
  { code: '075', name: 'Квадратный ярд (0,8361274 м2)', nationalSymbol: 'ярд2', symbol: 'yd2', nationalCode: 'ЯРД2', internationalCode: 'YDK', category: 'Единицы площади' },
  { code: '109', name: 'Ар (100 м2)', nationalSymbol: 'а', symbol: 'a', nationalCode: 'АР', internationalCode: 'ARE', category: 'Единицы площади' },
  { code: '212', name: 'Ватт', nationalSymbol: 'Вт', symbol: 'W', nationalCode: 'ВТ', internationalCode: 'WTT', category: 'Технические единицы' },
  { code: '214', name: 'Киловатт', nationalSymbol: 'кВт', symbol: 'kW', nationalCode: 'КВТ', internationalCode: 'KWT', category: 'Технические единицы' },
  { code: '215', name: 'Мегаватт; тысяча киловатт', nationalSymbol: 'МВт; 103 кВт', symbol: 'MW', nationalCode: 'МЕГАВТ; ТЫС КВТ', internationalCode: 'MAW', category: 'Технические единицы' },
  { code: '222', name: 'Вольт', nationalSymbol: 'В', symbol: 'V', nationalCode: 'В', internationalCode: 'VLT', category: 'Технические единицы' },
  { code: '223', name: 'Киловольт', nationalSymbol: 'кВ', symbol: 'kV', nationalCode: 'КВ', internationalCode: 'KVT', category: 'Технические единицы' },
  { code: '227', name: 'Киловольт-ампер', nationalSymbol: 'кВ•А', symbol: 'kV•A', nationalCode: 'КВ•А', internationalCode: 'KVA', category: 'Технические единицы' },
  { code: '228', name: 'Мегавольт-ампер (тысяча киловольт-ампер)', nationalSymbol: 'МВ•А', symbol: 'MV•A', nationalCode: 'МЕГАВ•А', internationalCode: 'MVA', category: 'Технические единицы' },
  { code: '230', name: 'Киловар', nationalSymbol: 'квар', symbol: 'kVAR', nationalCode: 'КВАР', internationalCode: 'KVR', category: 'Технические единицы' },
  { code: '243', name: 'Ватт-час', nationalSymbol: 'Вт•ч', symbol: 'W•h', nationalCode: 'ВТ•Ч', internationalCode: 'WHR', category: 'Технические единицы' },
  { code: '245', name: 'Киловатт-час', nationalSymbol: 'кВт•ч', symbol: 'kW•h', nationalCode: 'КВТ•Ч', internationalCode: 'KWH', category: 'Технические единицы' },
  { code: '246', name: 'Мегаватт-час; 1000 киловатт-часов', nationalSymbol: 'МВт•ч; 103 кВт•ч', symbol: 'МW•h', nationalCode: 'МЕГАВТ•Ч; ТЫС КВТ•Ч', internationalCode: 'MWH', category: 'Технические единицы' },
  { code: '247', name: 'Гигаватт-час (миллион киловатт-часов)', nationalSymbol: 'ГВт•ч', symbol: 'GW•h', nationalCode: 'ГИГАВТ•Ч', internationalCode: 'GWH', category: 'Технические единицы' },
  { code: '260', name: 'Ампер', nationalSymbol: 'А', symbol: 'A', nationalCode: 'А', internationalCode: 'AMP', category: 'Технические единицы' },
  { code: '263', name: 'Ампер-час (3,6 кКл)', nationalSymbol: 'А•ч', symbol: 'A•h', nationalCode: 'А•Ч', internationalCode: 'AMH', category: 'Технические единицы' },
  { code: '264', name: 'Тысяча ампер-часов', nationalSymbol: '103 А•ч', symbol: '103 A•h', nationalCode: 'ТЫС А•Ч', internationalCode: 'TAH', category: 'Технические единицы' },
  { code: '270', name: 'Кулон', nationalSymbol: 'Кл', symbol: 'C', nationalCode: 'КЛ', internationalCode: 'COU', category: 'Технические единицы' },
  { code: '271', name: 'Джоуль', nationalSymbol: 'Дж', symbol: 'J', nationalCode: 'ДЖ', internationalCode: 'JOU', category: 'Технические единицы' },
  { code: '273', name: 'Килоджоуль', nationalSymbol: 'кДж', symbol: 'kJ', nationalCode: 'КДЖ', internationalCode: 'KJO', category: 'Технические единицы' },
  { code: '274', name: 'Ом', nationalSymbol: 'Ом', symbol: 'Ω', nationalCode: 'ОМ', internationalCode: 'OHM', category: 'Технические единицы' },
  { code: '276', name: 'Грей', nationalSymbol: 'Гр', symbol: 'Gy', nationalCode: 'ГР', internationalCode: 'GY', category: 'Технические единицы' },
  { code: '277', name: 'Микрогрей', nationalSymbol: 'мкГр', symbol: 'μGy', nationalCode: 'МКГР', internationalCode: 'MKGY', category: 'Технические единицы' },
  { code: '278', name: 'Миллигрей', nationalSymbol: 'мГр', symbol: 'mGy', nationalCode: 'МЛГР', internationalCode: 'MGY', category: 'Технические единицы' },
  { code: '279', name: 'Килогрей', nationalSymbol: 'кГр', symbol: 'kGy', nationalCode: 'КИЛОГР', internationalCode: 'KGY', category: 'Технические единицы' },
  { code: '280', name: 'Градус Цельсия', nationalSymbol: '°C', symbol: '°C', nationalCode: 'ГРАД ЦЕЛЬС', internationalCode: 'CEL', category: 'Технические единицы' },
  { code: '281', name: 'Градус Фаренгейта', nationalSymbol: '°F', symbol: '°F', nationalCode: 'ГРАД ФАРЕНГ', internationalCode: 'FAN', category: 'Технические единицы' },
  { code: '282', name: 'Кандела', nationalSymbol: 'кд', symbol: 'cd', nationalCode: 'КД', internationalCode: 'CDL', category: 'Технические единицы' },
  { code: '283', name: 'Люкс', nationalSymbol: 'лк', symbol: 'lx', nationalCode: 'ЛК', internationalCode: 'LUX', category: 'Технические единицы' },
  { code: '284', name: 'Люмен', nationalSymbol: 'лм', symbol: 'lm', nationalCode: 'ЛМ', internationalCode: 'LUM', category: 'Технические единицы' },
  { code: '288', name: 'Кельвин', nationalSymbol: 'K', symbol: 'K', nationalCode: 'К', internationalCode: 'KEL', category: 'Технические единицы' },
  { code: '289', name: 'Ньютон', nationalSymbol: 'Н', symbol: 'N', nationalCode: 'Н', internationalCode: 'NEW', category: 'Технические единицы' },
  { code: '290', name: 'Герц', nationalSymbol: 'Гц', symbol: 'Hz', nationalCode: 'ГЦ', internationalCode: 'HTZ', category: 'Технические единицы' },
  { code: '291', name: 'Килогерц', nationalSymbol: 'кГц', symbol: 'kHz', nationalCode: 'КГЦ', internationalCode: 'KHZ', category: 'Технические единицы' },
  { code: '292', name: 'Мегагерц', nationalSymbol: 'МГц', symbol: 'MHz', nationalCode: 'МЕГАГЦ', internationalCode: 'MHZ', category: 'Технические единицы' },
  { code: '293', name: 'Гигагерц', nationalSymbol: 'ГГц', symbol: 'GHz', nationalCode: 'ГИГАГЦ', internationalCode: 'GHZ', category: 'Технические единицы' },
  { code: '294', name: 'Паскаль', nationalSymbol: 'Па', symbol: 'Pa', nationalCode: 'ПА', internationalCode: 'PAL', category: 'Технические единицы' },
  { code: '295', name: 'Терагерц', nationalSymbol: 'ТГц', symbol: 'THz', nationalCode: 'ТЕРАГЦ', internationalCode: 'THZ', category: 'Технические единицы' },
  { code: '296', name: 'Сименс', nationalSymbol: 'См', symbol: 'S', nationalCode: 'СИ', internationalCode: 'SIE', category: 'Технические единицы' },
  { code: '297', name: 'Килопаскаль', nationalSymbol: 'кПа', symbol: 'kPa', nationalCode: 'КПА', internationalCode: 'KPA', category: 'Технические единицы' },
  { code: '298', name: 'Мегапаскаль', nationalSymbol: 'МПа', symbol: 'MPa', nationalCode: 'МЕГАПА', internationalCode: 'MPA', category: 'Технические единицы' },
  { code: '300', name: 'Физическая атмосфера (101325 Па)', nationalSymbol: 'атм', symbol: 'atm', nationalCode: 'АТМ', internationalCode: 'ATM', category: 'Технические единицы' },
  { code: '301', name: 'Техническая атмосфера (98066,5 Па)', nationalSymbol: 'ат', symbol: 'at', nationalCode: 'АТТ', internationalCode: 'ATT', category: 'Технические единицы' },
  { code: '302', name: 'Гигабеккерель', nationalSymbol: 'ГБк', symbol: 'GBq', nationalCode: 'ГИГАБК', internationalCode: 'GBQ', category: 'Технические единицы' },
  { code: '303', name: 'Килобеккерель', nationalSymbol: 'кБк', symbol: 'kBq', nationalCode: 'КИЛОБК', internationalCode: 'KBQ', category: 'Технические единицы' },
  { code: '304', name: 'Милликюри', nationalSymbol: 'мКи', symbol: 'mCi', nationalCode: 'МКИ', internationalCode: 'MCU', category: 'Технические единицы' },
  { code: '305', name: 'Кюри', nationalSymbol: 'Ки', symbol: 'Ci', nationalCode: 'КИ', internationalCode: 'CUR', category: 'Технические единицы' },
  { code: '306', name: 'Грамм делящихся изотопов', nationalSymbol: 'г Д/И', symbol: 'g fissile isotopes', nationalCode: 'Г ДЕЛЯЩ ИЗОТОП', internationalCode: 'GFI', category: 'Технические единицы' },
  { code: '307', name: 'Мегабеккерель', nationalSymbol: 'МБк', symbol: 'MBq', nationalCode: 'МЕГАБК', internationalCode: 'MBQ', category: 'Технические единицы' },
  { code: '308', name: 'Миллибар', nationalSymbol: 'мб', symbol: 'mbar', nationalCode: 'МБАР', internationalCode: 'MBR', category: 'Технические единицы' },
  { code: '309', name: 'Бар', nationalSymbol: 'бар', symbol: 'bar', nationalCode: 'БАР', internationalCode: 'BAR', category: 'Технические единицы' },
  { code: '310', name: 'Гектобар', nationalSymbol: 'гб', symbol: 'hbar', nationalCode: 'ГБАР', internationalCode: 'HBA', category: 'Технические единицы' },
  { code: '312', name: 'Килобар', nationalSymbol: 'кб', symbol: 'kbar', nationalCode: 'КБАР', internationalCode: 'KBA', category: 'Технические единицы' },
  { code: '314', name: 'Фарад', nationalSymbol: 'Ф', symbol: 'F', nationalCode: 'Ф', internationalCode: 'FAR', category: 'Технические единицы' },
  { code: '316', name: 'Килограмм на кубический метр', nationalSymbol: 'кг/м3', symbol: 'kg/m3', nationalCode: 'КГ/М3', internationalCode: 'KMQ', category: 'Технические единицы' },
  { code: '318', name: 'Зиверт', nationalSymbol: 'Зв', symbol: 'Sv', nationalCode: 'ЗВ', internationalCode: 'SV', category: 'Технические единицы' },
  { code: '319', name: 'Микрозиверт', nationalSymbol: 'мкЗв', symbol: 'μSv', nationalCode: 'МКЗВ', internationalCode: 'MKSV', category: 'Технические единицы' },
  { code: '320', name: 'Моль', nationalSymbol: 'моль', symbol: 'mol', nationalCode: 'МОЛЬ', internationalCode: 'MOL', category: 'Технические единицы' },
  { code: '321', name: 'Миллизиверт', nationalSymbol: 'мЗв', symbol: 'mSv', nationalCode: 'МЗВ', internationalCode: 'MSV', category: 'Технические единицы' },
  { code: '323', name: 'Беккерель', nationalSymbol: 'Бк', symbol: 'Bq', nationalCode: 'БК', internationalCode: 'BQL', category: 'Технические единицы' },
  { code: '324', name: 'Вебер', nationalSymbol: 'Вб', symbol: 'Wb', nationalCode: 'ВБ', internationalCode: 'WEB', category: 'Технические единицы' },
  { code: '327', name: 'Узел (миля/ч)', nationalSymbol: 'уз', symbol: 'kn', nationalCode: 'УЗ', internationalCode: 'KNT', category: 'Технические единицы' },
  { code: '328', name: 'Метр в секунду', nationalSymbol: 'м/с', symbol: 'm/s', nationalCode: 'М/С', internationalCode: 'MTS', category: 'Технические единицы' },
  { code: '330', name: 'Оборот в секунду', nationalSymbol: 'об/с', symbol: 'r/s', nationalCode: 'ОБ/С', internationalCode: 'RPS', category: 'Технические единицы' },
  { code: '331', name: 'Оборот в минуту', nationalSymbol: 'об/мин', symbol: 'r/min', nationalCode: 'ОБ/МИН', internationalCode: 'RPM', category: 'Технические единицы' },
  { code: '333', name: 'Километр в час', nationalSymbol: 'км/ч', symbol: 'km/h', nationalCode: 'КМ/Ч', internationalCode: 'KMH', category: 'Технические единицы' },
  { code: '335', name: 'Метр на секунду в квадрате', nationalSymbol: 'м/с2', symbol: 'm/s2', nationalCode: 'М/С2', internationalCode: 'MSK', category: 'Технические единицы' },
  { code: '349', name: 'Кулон на килограмм', nationalSymbol: 'Кл/кг', symbol: 'C/kg', nationalCode: 'КЛ/КГ', internationalCode: 'CKG', category: 'Технические единицы' },
  { code: '499', name: 'Килограмм в секунду', nationalSymbol: 'кг/с', symbol: '-', nationalCode: 'КГ/С', internationalCode: 'KGS', category: 'Экономические единицы' },
  { code: '533', name: 'Тонна пара в час', nationalSymbol: 'т пар/ч', symbol: '-', nationalCode: 'Т ПАР/Ч', internationalCode: 'TSH', category: 'Экономические единицы' },
  { code: '596', name: 'Кубический метр в секунду', nationalSymbol: 'м3/с', symbol: 'm3/s', nationalCode: 'М3/С', internationalCode: 'MQS', category: 'Экономические единицы' },
  { code: '598', name: 'Кубический метр в час', nationalSymbol: 'м3/ч', symbol: 'm3/h', nationalCode: 'М3/Ч', internationalCode: 'MQH', category: 'Экономические единицы' },
  { code: '599', name: 'Тысяча кубических метров в сутки', nationalSymbol: '103 м3/сут', symbol: '-', nationalCode: 'ТЫС М3/СУТ', internationalCode: 'TQD', category: 'Экономические единицы' },
  { code: '616', name: 'Бобина', nationalSymbol: 'боб', symbol: '-', nationalCode: 'БОБ', internationalCode: 'NBB', category: 'Экономические единицы' },
  { code: '625', name: 'Лист', nationalSymbol: 'л.', symbol: '-', nationalCode: 'ЛИСТ', internationalCode: 'LEF', category: 'Экономические единицы' },
  { code: '626', name: 'Сто листов', nationalSymbol: '100 л.', symbol: '-', nationalCode: '100 ЛИСТ', internationalCode: 'CLF', category: 'Экономические единицы' },
  { code: '630', name: 'Тысяча стандартных условных кирпичей', nationalSymbol: 'тыс станд. усл. кирп', symbol: '-', nationalCode: 'ТЫС СТАНД УСЛ КИРП', internationalCode: 'MBE', category: 'Экономические единицы' },
  { code: '641', name: 'Дюжина (12 шт.)', nationalSymbol: 'дюжина', symbol: 'Doz; 12', nationalCode: 'ДЮЖИНА', internationalCode: 'DZN', category: 'Экономические единицы' },
  { code: '657', name: 'Изделие', nationalSymbol: 'изд', symbol: '-', nationalCode: 'ИЗД', internationalCode: 'NAR', category: 'Экономические единицы' },
  { code: '683', name: 'Сто ящиков', nationalSymbol: '100 ящ.', symbol: 'Hbx', nationalCode: '100 ЯЩ', internationalCode: 'HBX', category: 'Экономические единицы' },
  { code: '704', name: 'Набор', nationalSymbol: 'набор', symbol: '-', nationalCode: 'НАБОР', internationalCode: 'SET', category: 'Экономические единицы' },
  { code: '715', name: 'Пара (2 шт.)', nationalSymbol: 'пар', symbol: 'pr; 2', nationalCode: 'ПАР', internationalCode: 'NPR', category: 'Экономические единицы' },
  { code: '730', name: 'Два десятка', nationalSymbol: '20', symbol: '20', nationalCode: '2 ДЕС', internationalCode: 'SCO', category: 'Экономические единицы' },
  { code: '732', name: 'Десять пар', nationalSymbol: '10 пар', symbol: '-', nationalCode: 'ДЕС ПАР', internationalCode: 'TPR', category: 'Экономические единицы' },
  { code: '733', name: 'Дюжина пар', nationalSymbol: 'дюжина пар', symbol: '-', nationalCode: 'ДЮЖИНА ПАР', internationalCode: 'DPR', category: 'Экономические единицы' },
  { code: '734', name: 'Посылка', nationalSymbol: 'посыл', symbol: '-', nationalCode: 'ПОСЫЛ', internationalCode: 'NPL', category: 'Экономические единицы' },
  { code: '735', name: 'Часть', nationalSymbol: 'часть', symbol: '-', nationalCode: 'ЧАСТЬ', internationalCode: 'NPT', category: 'Экономические единицы' },
  { code: '736', name: 'Рулон', nationalSymbol: 'рул', symbol: '-', nationalCode: 'РУЛ', internationalCode: 'NRL', category: 'Экономические единицы' },
  { code: '737', name: 'Дюжина рулонов', nationalSymbol: 'дюжина рул', symbol: '-', nationalCode: 'ДЮЖИНА РУЛ', internationalCode: 'DRL', category: 'Экономические единицы' },
  { code: '740', name: 'Дюжина штук', nationalSymbol: 'дюжина шт', symbol: '-', nationalCode: 'ДЮЖИНА ШТ', internationalCode: 'DPC', category: 'Экономические единицы' },
  { code: '745', name: 'Элемент', nationalSymbol: 'элем', symbol: 'CI', nationalCode: 'ЭЛЕМ', internationalCode: 'NCL', category: 'Экономические единицы' },
  { code: '778', name: 'Упаковка', nationalSymbol: 'упак', symbol: '-', nationalCode: 'УПАК', internationalCode: 'NMP', category: 'Экономические единицы' },
  { code: '780', name: 'Дюжина упаковок', nationalSymbol: 'дюжина упак', symbol: '-', nationalCode: 'ДЮЖИНА УПАК', internationalCode: 'DZP', category: 'Экономические единицы' },
  { code: '781', name: 'Сто упаковок', nationalSymbol: '100 упак', symbol: '-', nationalCode: '100 УПАК', internationalCode: 'CNP', category: 'Экономические единицы' },
  { code: '796', name: 'Штука', nationalSymbol: 'шт', symbol: 'pc; 1', nationalCode: 'ШТ', internationalCode: 'PCE; NMB', category: 'Экономические единицы' },
  { code: '797', name: 'Сто штук', nationalSymbol: '100 шт', symbol: '100', nationalCode: '100 ШТ', internationalCode: 'CEN', category: 'Экономические единицы' },
  { code: '798', name: 'Тысяча штук', nationalSymbol: 'тыс. шт; 1000 шт', symbol: '1000', nationalCode: 'ТЫС ШТ', internationalCode: 'MIL', category: 'Экономические единицы' },
  { code: '799', name: 'Миллион штук', nationalSymbol: '106 шт', symbol: '106', nationalCode: 'МЛН ШТ', internationalCode: 'MIO', category: 'Экономические единицы' },
  { code: '800', name: 'Миллиард штук', nationalSymbol: '109 шт', symbol: '109', nationalCode: 'МЛРД ШТ', internationalCode: 'MLD', category: 'Экономические единицы' },
  { code: '801', name: 'Биллион штук (Европа); триллион штук', nationalSymbol: '1012 шт', symbol: '1012', nationalCode: 'БИЛЛ ШТ (ЕВР); ТРИЛЛ ШТ', internationalCode: 'BIL', category: 'Экономические единицы' },
  { code: '802', name: 'Квинтильон штук (Европа)', nationalSymbol: '1018 шт', symbol: '1018', nationalCode: 'КВИНТ ШТ', internationalCode: 'TRL', category: 'Экономические единицы' },
  { code: '820', name: 'Крепость спирта по массе', nationalSymbol: 'креп. спирта по массе', symbol: '% mds', nationalCode: 'КРЕП СПИРТ ПО МАССЕ', internationalCode: 'ASM', category: 'Экономические единицы' },
  { code: '821', name: 'Крепость спирта по объему', nationalSymbol: 'креп. спирта по объему', symbol: '% vol', nationalCode: 'КРЕП СПИРТ ПО ОБЪЕМ', internationalCode: 'ASV', category: 'Экономические единицы' },
  { code: '831', name: 'Литр чистого (100%) спирта', nationalSymbol: 'л 100% спирта', symbol: '-', nationalCode: 'Л ЧИСТ СПИРТ', internationalCode: 'LPA', category: 'Экономические единицы' },
  { code: '833', name: 'Гектолитр чистого (100%) спирта', nationalSymbol: 'Гл 100% спирта', symbol: '-', nationalCode: 'ГЛ ЧИСТ СПИРТ', internationalCode: 'HPA', category: 'Экономические единицы' },
  { code: '841', name: 'Килограмм пероксида водорода', nationalSymbol: 'кг H2О2', symbol: '-', nationalCode: 'КГ ПЕРОКСИД ВОДОРОДА', internationalCode: '-', category: 'Экономические единицы' },
  { code: '845', name: 'Килограмм 90%-го сухого вещества', nationalSymbol: 'кг 90% с/в', symbol: '-', nationalCode: 'КГ 90 ПРОЦ СУХ ВЕЩ', internationalCode: 'KSD', category: 'Экономические единицы' },
  { code: '847', name: 'Тонна 90%-го сухого вещества', nationalSymbol: 'т 90% с/в', symbol: '-', nationalCode: 'Т 90 ПРОЦ СУХ ВЕЩ', internationalCode: 'TSD', category: 'Экономические единицы' },
  { code: '852', name: 'Килограмм оксида калия', nationalSymbol: 'кг К2О', symbol: '-', nationalCode: 'КГ ОКСИД КАЛИЯ', internationalCode: 'KPO', category: 'Экономические единицы' },
  { code: '859', name: 'Килограмм гидроксида калия', nationalSymbol: 'кг КОН', symbol: '-', nationalCode: 'КГ ГИДРОКСИД КАЛИЯ', internationalCode: 'KPH', category: 'Экономические единицы' },
  { code: '861', name: 'Килограмм азота', nationalSymbol: 'кг N', symbol: '-', nationalCode: 'КГ АЗОТ', internationalCode: 'KNI', category: 'Экономические единицы' },
  { code: '863', name: 'Килограмм гидроксида натрия', nationalSymbol: 'кг NaOH', symbol: '-', nationalCode: 'КГ ГИДРОКСИД НАТРИЯ', internationalCode: 'KSH', category: 'Экономические единицы' },
  { code: '865', name: 'Килограмм пятиокиси фосфора', nationalSymbol: 'кг Р2О5', symbol: '-', nationalCode: 'КГ ПЯТИОКИСЬ ФОСФОРА', internationalCode: 'KPP', category: 'Экономические единицы' },
  { code: '867', name: 'Килограмм урана', nationalSymbol: 'кг U', symbol: '-', nationalCode: 'КГ УРАН', internationalCode: 'KUR', category: 'Экономические единицы' },
  { code: '348', name: 'Фемтосекунда', nationalSymbol: 'фс', symbol: 'ФС', nationalCode: '', internationalCode: '', category: 'Единицы времени' },
  { code: '350', name: 'Пикосекунда', nationalSymbol: 'пс', symbol: 'ПС', nationalCode: '', internationalCode: '', category: 'Единицы времени' },
  { code: '351', name: 'Наносекунда', nationalSymbol: 'нс', symbol: 'НС', nationalCode: '', internationalCode: '', category: 'Единицы времени' },
  { code: '352', name: 'Микросекунда', nationalSymbol: 'мкс', symbol: 'МКС', nationalCode: '', internationalCode: '', category: 'Единицы времени' },
  { code: '353', name: 'Миллисекунда', nationalSymbol: 'млс', symbol: 'МЛС', nationalCode: '', internationalCode: '', category: 'Единицы времени' },
  { code: '015', name: 'Нанометр', nationalSymbol: 'нм', symbol: 'НМ', nationalCode: '', internationalCode: '', category: 'Единицы длины' },
  { code: '018', name: 'Погонный метр', nationalSymbol: 'пог. м', symbol: 'ПОГ М', nationalCode: '', internationalCode: '', category: 'Единицы длины' },
  { code: '019', name: 'Тысяча погонных метров', nationalSymbol: '103 пог. м', symbol: 'ТЫС ПОГ М', nationalCode: '', internationalCode: '', category: 'Единицы длины' },
  { code: '020', name: 'Условный метр', nationalSymbol: 'усл. м', symbol: 'УСЛ М', nationalCode: '', internationalCode: '', category: 'Единицы длины' },
  { code: '048', name: 'Тысяча условных метров', nationalSymbol: '103 усл. м', symbol: 'ТЫС УСЛ М', nationalCode: '', internationalCode: '', category: 'Единицы длины' },
  { code: '049', name: 'Километр условных труб', nationalSymbol: 'км усл. труб', symbol: 'КМ УСЛ ТРУБ', nationalCode: '', internationalCode: '', category: 'Единицы длины' },
  { code: '165', name: 'Тысяча каратов метрических', nationalSymbol: '103 кар', symbol: 'ТЫС КАР', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '167', name: 'Миллион каратов метрических', nationalSymbol: '106 кар', symbol: 'МЛН КАР', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '169', name: 'Тысяча тонн', nationalSymbol: '103 т', symbol: 'ТЫС Т', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '171', name: 'Миллион тонн', nationalSymbol: '106 т', symbol: 'МЛН Т', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '172', name: 'Тонна условного топлива', nationalSymbol: 'т усл. топл', symbol: 'Т УСЛ ТОПЛ', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '175', name: 'Тысяча тонн условного топлива', nationalSymbol: '103 т усл. топл', symbol: 'ТЫС Т УСЛ ТОПЛ', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '176', name: 'Миллион тонн условного топлива', nationalSymbol: '106 т усл. топл', symbol: 'МЛН Т УСЛ ТОПЛ', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '177', name: 'Тысяча тонн единовременного хранения', nationalSymbol: '103 т единовр. хран', symbol: 'ТЫС Т ЕДИНОВР ХРАН', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '178', name: 'Тысяча тонн переработки', nationalSymbol: '103 т перераб', symbol: 'ТЫС Т ПЕРЕРАБ', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '179', name: 'Условная тонна', nationalSymbol: 'усл. т', symbol: 'УСЛ Т', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '207', name: 'Тысяча центнеров', nationalSymbol: '103 ц', symbol: 'ТЫС Ц', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '114', name: 'Тысяча кубических метров', nationalSymbol: '103 м3', symbol: 'ТЫС М3', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '115', name: 'Миллиард кубических метров', nationalSymbol: '109 м3', symbol: 'МЛРД М3', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '116', name: 'Декалитр', nationalSymbol: 'дкл', symbol: 'ДКЛ', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '119', name: 'Тысяча декалитров', nationalSymbol: '103 дкл', symbol: 'ТЫС ДКЛ', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '120', name: 'Миллион декалитров', nationalSymbol: '106 дкл', symbol: 'МЛН ДКЛ', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '121', name: 'Плотный кубический метр', nationalSymbol: 'плотн. м3', symbol: 'ПЛОТН М3', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '123', name: 'Условный кубический метр', nationalSymbol: 'усл. м3', symbol: 'УСЛ М3', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '124', name: 'Тысяча условных кубических метров', nationalSymbol: '103 усл. м3', symbol: 'ТЫС УСЛ М3', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '125', name: 'Миллион кубических метров переработки газа', nationalSymbol: '106 м3 перераб. газа', symbol: 'МЛН М3 ПЕРЕРАБ ГАЗА', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '127', name: 'Тысяча плотных кубических метров', nationalSymbol: '103 плотн. м3', symbol: 'ТЫС ПЛОТН М3', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '128', name: 'Тысяча полулитров', nationalSymbol: '103 пол. л', symbol: 'ТЫС ПОЛ Л', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '129', name: 'Миллион полулитров', nationalSymbol: '106 пол. л', symbol: 'МЛН ПОЛ Л', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '130', name: 'Тысяча литров; 1000 литров', nationalSymbol: '103 л; 1000 л', symbol: 'ТЫС Л', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '054', name: 'Тысяча квадратных дециметров', nationalSymbol: '103 дм2', symbol: 'ТЫС ДМ2', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '056', name: 'Миллион квадратных дециметров', nationalSymbol: '106 дм2', symbol: 'МЛН ДМ2', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '057', name: 'Миллион квадратных метров', nationalSymbol: '106 м2', symbol: 'МЛН М2', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '060', name: 'Тысяча гектаров', nationalSymbol: '103 га', symbol: 'ТЫС ГА', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '062', name: 'Условный квадратный метр', nationalSymbol: 'усл. м2', symbol: 'УСЛ М2', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '063', name: 'Тысяча условных квадратных метров', nationalSymbol: '103 усл. м2', symbol: 'ТЫС УСЛ М2', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '064', name: 'Миллион условных квадратных метров', nationalSymbol: '106 усл. м2', symbol: 'МЛН УСЛ М2', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '081', name: 'Квадратный метр общей площади', nationalSymbol: 'м2 общ. пл', symbol: 'М2 ОБЩ ПЛ', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '082', name: 'Тысяча квадратных метров общей площади', nationalSymbol: '103 м2 общ. пл', symbol: 'ТЫС М2 ОБЩ ПЛ', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '083', name: 'Миллион квадратных метров общей площади', nationalSymbol: '106 м2 общ. пл', symbol: 'МЛН М2. ОБЩ ПЛ', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '084', name: 'Квадратный метр жилой площади', nationalSymbol: 'м2 жил. пл', symbol: 'М2 ЖИЛ ПЛ', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '085', name: 'Тысяча квадратных метров жилой площади', nationalSymbol: '103 м2 жил. пл', symbol: 'ТЫС М2 ЖИЛ ПЛ', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '086', name: 'Миллион квадратных метров жилой площади', nationalSymbol: '106 м2 жил. пл', symbol: 'МЛН М2 ЖИЛ ПЛ', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '087', name: 'Квадратный метр учебно-лабораторных зданий', nationalSymbol: 'м2 уч. лаб. здан', symbol: 'М2 УЧ.ЛАБ ЗДАН', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '088', name: 'Тысяча квадратных метров учебно-лабораторных зданий', nationalSymbol: '103 м2 уч. лаб. здан', symbol: 'ТЫС М2 УЧ. ЛАБ ЗДАН', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '089', name: 'Миллион квадратных метров в двухмиллиметровом исчислении', nationalSymbol: '106 м2 2 мм исч', symbol: 'МЛН М2 2ММ ИСЧ', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '226', name: 'Вольт-ампер', nationalSymbol: 'В•А', symbol: 'В•А', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '231', name: 'Метр в час', nationalSymbol: 'м/ч', symbol: 'М/Ч', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '232', name: 'Килокалория', nationalSymbol: 'ккал', symbol: 'ККАЛ', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '233', name: 'Гигакалория', nationalSymbol: 'Гкал', symbol: 'ГИГАКАЛ', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '234', name: 'Тысяча гигакалорий', nationalSymbol: '103 Гкал', symbol: 'ТЫС ГИГАКАЛ', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '235', name: 'Миллион гигакалорий', nationalSymbol: '106 Гкал', symbol: 'МЛН ГИГАКАЛ', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '236', name: 'Калория в час', nationalSymbol: 'кал/ч', symbol: 'КАЛ/Ч', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '237', name: 'Килокалория в час', nationalSymbol: 'ккал/ч', symbol: 'ККАЛ/Ч', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '238', name: 'Гигакалория в час', nationalSymbol: 'Гкал/ч', symbol: 'ГИГАКАЛ/Ч', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '239', name: 'Тысяча гигакалорий в час', nationalSymbol: '103 Гкал/ч', symbol: 'ТЫС ГИГАКАЛ/Ч', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '241', name: 'Миллион ампер-часов', nationalSymbol: '106 А•ч', symbol: 'МЛН А•Ч', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '242', name: 'Миллион киловольт-ампер', nationalSymbol: '106 кВ•А', symbol: 'МЛН КВ•А', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '248', name: 'Киловольт-ампер реактивный', nationalSymbol: 'кВ•А Р', symbol: 'КВ•А Р', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '249', name: 'Миллиард киловатт-часов', nationalSymbol: '109 кВт•ч', symbol: 'МЛРД КВТ•Ч', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '250', name: 'Тысяча киловольт-ампер реактивных', nationalSymbol: '103 кВ•А Р', symbol: 'ТЫС КВ•А Р', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '251', name: 'Лошадиная сила', nationalSymbol: 'л. с', symbol: 'ЛС', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '252', name: 'Тысяча лошадиных сил', nationalSymbol: '103 л. с', symbol: 'ТЫС ЛС', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '253', name: 'Миллион лошадиных сил', nationalSymbol: '106 л. с', symbol: 'МЛН ЛС', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '254', name: 'Бит', nationalSymbol: 'бит', symbol: 'БИТ', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '255', name: 'Байт', nationalSymbol: 'байт', symbol: 'БАЙТ', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '256', name: 'Килобайт', nationalSymbol: 'кбайт', symbol: 'КБАЙТ', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '257', name: 'Мегабайт', nationalSymbol: 'Мбайт', symbol: 'МБАЙТ', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '258', name: 'Бод', nationalSymbol: 'бод', symbol: 'БОД', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '287', name: 'Генри', nationalSymbol: 'Гн', symbol: 'ГН', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '313', name: 'Тесла', nationalSymbol: 'Тл', symbol: 'ТЛ', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '317', name: 'Килограмм на квадратный сантиметр', nationalSymbol: 'кг/см2', symbol: 'КГ/СМ2', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '337', name: 'Миллиметр водяного столба', nationalSymbol: 'мм вод. ст', symbol: 'ММ ВОД СТ', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '338', name: 'Миллиметр ртутного столба', nationalSymbol: 'мм рт. ст', symbol: 'ММ РТ СТ', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '339', name: 'Сантиметр водяного столба', nationalSymbol: 'см вод. ст', symbol: 'СМ ВОД СТ', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '340', name: 'Грамм условного топлива на киловатт-час', nationalSymbol: 'г у.т./кВт•ч', symbol: 'Г У.Т./КВТ•Ч', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '341', name: 'Килограмм условного топлива на гигакалорию', nationalSymbol: 'кг у.т./Гкал', symbol: 'КГ У.Т./ГКАЛ', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '383', name: 'Рубль', nationalSymbol: 'руб', symbol: 'РУБ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '384', name: 'Тысяча рублей', nationalSymbol: '103 руб', symbol: 'ТЫС РУБ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '385', name: 'Миллион рублей', nationalSymbol: '106 руб', symbol: 'МЛН РУБ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '386', name: 'Миллиард рублей', nationalSymbol: '109 руб', symbol: 'МЛРД РУБ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '387', name: 'Триллион рублей', nationalSymbol: '1012 руб', symbol: 'ТРИЛЛ РУБ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '388', name: 'Квадрильон рублей', nationalSymbol: '1015 руб', symbol: 'КВАДР РУБ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '414', name: 'Пассажиро-километр', nationalSymbol: 'пасс. км', symbol: 'ПАСС. КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '421', name: 'Пассажирское место (пассажирских мест)', nationalSymbol: 'пасс. мест', symbol: 'ПАСС МЕСТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '423', name: 'Тысяча пассажиро-километров', nationalSymbol: '103 пасс. км', symbol: 'ТЫС ПАСС. КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '424', name: 'Миллион пассажиро-километров', nationalSymbol: '106 пасс. км', symbol: 'МЛН ПАСС.КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '426', name: 'Пар грузовых поездов в сутки', nationalSymbol: 'пар груз поезд/сут', symbol: 'Пар Груз Поезд/Сут', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '427', name: 'Пассажиропоток', nationalSymbol: 'пасс. поток', symbol: 'ПАСС. ПОТОК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '428', name: 'Кубический метр-километр', nationalSymbol: 'м3•км', symbol: 'М3•КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '430', name: 'Миллион кубических метров-километров', nationalSymbol: '106 м3 • км', symbol: 'МЛН М3 • КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '431', name: 'Взлетов-посадок в час', nationalSymbol: 'взлет. посадок/час', symbol: 'ВЗЛЕТ. ПОСАДОК/ЧАС', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '435', name: 'Миллион километров', nationalSymbol: '106 км', symbol: 'МЛН КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '449', name: 'Тонно-километр', nationalSymbol: 'т•км', symbol: 'Т•КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '450', name: 'Тысяча тонно-километров', nationalSymbol: '103 т•км', symbol: 'ТЫС Т•КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '451', name: 'Миллион тонно-километров', nationalSymbol: '106 т•км', symbol: 'МЛН Т•КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '452', name: 'Миллиард тонно-километр', nationalSymbol: '109 т•км', symbol: 'МЛРД Т•КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '479', name: 'Тысяча наборов', nationalSymbol: '103 набор', symbol: 'ТЫС НАБОР', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '508', name: 'Тысяча метров кубических в час', nationalSymbol: '103 м3/ч', symbol: 'ТЫС М3/Ч', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '509', name: 'Километр в сутки', nationalSymbol: 'км/сут', symbol: 'КМ/СУТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '510', name: 'Грамм на киловатт-час', nationalSymbol: 'г/кВт•ч', symbol: 'Г/КВТ•Ч', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '511', name: 'Килограмм на гигакалорию', nationalSymbol: 'кг/Гкал', symbol: 'КГ/ГИГАКАЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '512', name: 'Тонно-номер', nationalSymbol: 'т•ном', symbol: 'Т•НОМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '513', name: 'Автотонна', nationalSymbol: 'авто т', symbol: 'АВТО Т', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '514', name: 'Тонна тяги', nationalSymbol: 'т. тяги', symbol: 'Т ТЯГИ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '515', name: 'Дедвейт-тонна', nationalSymbol: 'дедвейт.т', symbol: 'ДЕДВЕЙТ.Т', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '516', name: 'Тонно-танид', nationalSymbol: 'т.танид', symbol: 'Т.ТАНИД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '518', name: 'Квадратных метров на человека', nationalSymbol: 'м2/чел', symbol: 'М2/ЧЕЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '521', name: 'Человек на квадратный метр', nationalSymbol: 'чел/м2', symbol: 'ЧЕЛ/М2', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '522', name: 'Человек на квадратный километр', nationalSymbol: 'чел/км2', symbol: 'ЧЕЛ/КМ2', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '534', name: 'Тонна в час', nationalSymbol: 'т/ч', symbol: 'Т/Ч', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '535', name: 'Тонна в сутки', nationalSymbol: 'т/сут', symbol: 'Т/СУТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '536', name: 'Тонна в смену', nationalSymbol: 'т/смен', symbol: 'Т/СМЕН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '537', name: 'Тысяча тонн в сезон', nationalSymbol: '103 т/сез', symbol: 'ТЫС Т/СЕЗ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '538', name: 'Тысяча тонн в год', nationalSymbol: '103 т/год', symbol: 'ТЫС Т/ГОД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '539', name: 'Человеко-час', nationalSymbol: 'чел.ч', symbol: 'ЧЕЛ.Ч', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '540', name: 'Человеко-день', nationalSymbol: 'чел.дн', symbol: 'ЧЕЛ.ДН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '541', name: 'Тысяча человеко-дней', nationalSymbol: '103 чел.дн', symbol: 'ТЫС ЧЕЛ.ДН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '542', name: 'Тысяча человеко-часов', nationalSymbol: '103 чел.ч', symbol: 'ТЫС ЧЕЛ.Ч', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '543', name: 'Тысяча условных банок в смену', nationalSymbol: '103 усл. банк/ смен', symbol: 'ТЫС УСЛ БАНК/СМЕН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '544', name: 'Миллион единиц в год', nationalSymbol: '106 ед/год', symbol: 'МЛН ЕД/ГОД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '545', name: 'Посещение в смену', nationalSymbol: 'посещ/смен', symbol: 'ПОСЕЩ/СМЕН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '546', name: 'Тысяча посещений в смену', nationalSymbol: '103 посещ/смен', symbol: 'ТЫС ПОСЕЩ/ СМЕН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '547', name: 'Пара в смену', nationalSymbol: 'пар/смен', symbol: 'ПАР/СМЕН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '548', name: 'Тысяча пар в смену', nationalSymbol: '103 пар/смен', symbol: 'ТЫС ПАР/СМЕН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '550', name: 'Миллион тонн в год', nationalSymbol: '106 т/год', symbol: 'МЛН Т/ГОД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '552', name: 'Тонна переработки в сутки', nationalSymbol: 'т перераб/сут', symbol: 'Т ПЕРЕРАБ/СУТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '553', name: 'Тысяча тонн переработки в сутки', nationalSymbol: '103 т перераб/ сут', symbol: 'ТЫС Т ПЕРЕРАБ/СУТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '554', name: 'Центнер переработки в сутки', nationalSymbol: 'ц перераб/сут', symbol: 'Ц ПЕРЕРАБ/СУТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '555', name: 'Тысяча центнеров переработки в сутки', nationalSymbol: '103 ц перераб/ сут', symbol: 'ТЫС Ц ПЕРЕРАБ/СУТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '556', name: 'Тысяча голов в год', nationalSymbol: '103 гол/год', symbol: 'ТЫС ГОЛ/ГОД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '557', name: 'Миллион голов в год', nationalSymbol: '106 гол/год', symbol: 'МЛН ГОЛ/ГОД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '558', name: 'Тысяча птицемест', nationalSymbol: '103 птицемест', symbol: 'ТЫС ПТИЦЕМЕСТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '559', name: 'Тысяча кур-несушек', nationalSymbol: '103 кур. несуш', symbol: 'ТЫС КУР. НЕСУШ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '561', name: 'Тысяча тонн пара в час', nationalSymbol: '103 т пар/ч', symbol: 'ТЫС Т ПАР/Ч', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '562', name: 'Тысяча прядильных веретен', nationalSymbol: '103 пряд. верет', symbol: 'ТЫС ПРЯД ВЕРЕТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '563', name: 'Тысяча прядильных мест', nationalSymbol: '103 пряд. мест', symbol: 'ТЫС ПРЯД МЕСТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '639', name: 'Доза', nationalSymbol: 'доз', symbol: 'ДОЗ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '640', name: 'Тысяча доз', nationalSymbol: '103 доз', symbol: 'ТЫС ДОЗ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '642', name: 'Единица', nationalSymbol: 'ед', symbol: 'ЕД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '643', name: 'Тысяча единиц', nationalSymbol: '103 ед', symbol: 'ТЫС ЕД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '644', name: 'Миллион единиц', nationalSymbol: '106 ед', symbol: 'МЛН ЕД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '661', name: 'Канал', nationalSymbol: 'канал', symbol: 'КАНАЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '673', name: 'Тысяча комплектов', nationalSymbol: '103 компл', symbol: 'ТЫС КОМПЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '698', name: 'Место', nationalSymbol: 'мест', symbol: 'МЕСТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '699', name: 'Тысяча мест', nationalSymbol: '103 мест', symbol: 'ТЫС МЕСТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '709', name: 'Тысяча номеров', nationalSymbol: '103 ном', symbol: 'ТЫС НОМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '724', name: 'Тысяча гектаров порций', nationalSymbol: '103 га порц', symbol: 'ТЫС ГА ПОРЦ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '728', name: 'Пачка', nationalSymbol: 'пач', symbol: 'ПАЧ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '729', name: 'Тысяча пачек', nationalSymbol: '103 пач', symbol: 'ТЫС ПАЧ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '744', name: 'Процент', nationalSymbol: '%', symbol: 'ПРОЦ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '746', name: 'Промилле (0,1 процента)', nationalSymbol: '‰', symbol: 'ПРОМИЛЛЕ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '747', name: 'Базисный пункт', nationalSymbol: 'б.п.', symbol: 'БП', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '751', name: 'Тысяча рулонов', nationalSymbol: '103 рул', symbol: 'ТЫС РУЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '761', name: 'Тысяча станов', nationalSymbol: '103 стан', symbol: 'ТЫС СТАН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '762', name: 'Станция', nationalSymbol: 'станц', symbol: 'СТАНЦ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '775', name: 'Тысяча тюбиков', nationalSymbol: '103 тюбик', symbol: 'ТЫС ТЮБИК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '776', name: 'Тысяча условных тубов', nationalSymbol: '103 усл.туб', symbol: 'ТЫС УСЛ ТУБ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '779', name: 'Миллион упаковок', nationalSymbol: '106 упак', symbol: 'МЛН УПАК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '782', name: 'Тысяча упаковок', nationalSymbol: '103 упак', symbol: 'ТЫС УПАК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '792', name: 'Человек', nationalSymbol: 'чел', symbol: 'ЧЕЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '793', name: 'Тысяча человек', nationalSymbol: '103 чел', symbol: 'ТЫС ЧЕЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '794', name: 'Миллион человек', nationalSymbol: '106 чел', symbol: 'МЛН ЧЕЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '808', name: 'Миллион экземпляров', nationalSymbol: '106 экз', symbol: 'МЛН ЭКЗ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '810', name: 'Ячейка', nationalSymbol: 'яч', symbol: 'ЯЧ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '812', name: 'Ящик', nationalSymbol: 'ящ', symbol: 'ЯЩ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '836', name: 'Голова', nationalSymbol: 'гол', symbol: 'ГОЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '837', name: 'Тысяча пар', nationalSymbol: '103 пар', symbol: 'ТЫС ПАР', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '838', name: 'Миллион пар', nationalSymbol: '106 пар', symbol: 'МЛН ПАР', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '839', name: 'Комплект', nationalSymbol: 'компл', symbol: 'КОМПЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '840', name: 'Секция', nationalSymbol: 'секц', symbol: 'СЕКЦ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '868', name: 'Бутылка', nationalSymbol: 'бут', symbol: 'БУТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '869', name: 'Тысяча бутылок', nationalSymbol: '103 бут', symbol: 'ТЫС БУТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '870', name: 'Ампула', nationalSymbol: 'ампул', symbol: 'АМПУЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '871', name: 'Тысяча ампул', nationalSymbol: '103 ампул', symbol: 'ТЫС АМПУЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '872', name: 'Флакон', nationalSymbol: 'флак', symbol: 'ФЛАК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '873', name: 'Тысяча флаконов', nationalSymbol: '103 флак', symbol: 'ТЫС ФЛАК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '874', name: 'Тысяча тубов', nationalSymbol: '103 туб', symbol: 'ТЫС ТУБ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '875', name: 'Тысяча коробок', nationalSymbol: '103 кор', symbol: 'ТЫС КОР', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '876', name: 'Условная единица', nationalSymbol: 'усл. ед', symbol: 'УСЛ ЕД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '877', name: 'Тысяча условных единиц', nationalSymbol: '103 усл. ед', symbol: 'ТЫС УСЛ ЕД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '878', name: 'Миллион условных единиц', nationalSymbol: '106 усл. ед', symbol: 'МЛН УСЛ ЕД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '879', name: 'Условная штука', nationalSymbol: 'усл. шт', symbol: 'УСЛ ШТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '880', name: 'Тысяча условных штук', nationalSymbol: '103 усл. шт', symbol: 'ТЫС УСЛ ШТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '881', name: 'Условная банка', nationalSymbol: 'усл. банк', symbol: 'УСЛ БАНК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '882', name: 'Тысяча условных банок', nationalSymbol: '103 усл. банк', symbol: 'ТЫС УСЛ БАНК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '883', name: 'Миллион условных банок', nationalSymbol: '106 усл. банк', symbol: 'МЛН УСЛ БАНК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '884', name: 'Условный кусок', nationalSymbol: 'усл. кус', symbol: 'УСЛ КУС', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '885', name: 'Тысяча условных кусков', nationalSymbol: '103 усл. кус', symbol: 'ТЫС УСЛ КУС', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '886', name: 'Миллион условных кусков', nationalSymbol: '106 усл. кус', symbol: 'МЛН УСЛ КУС', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '887', name: 'Условный ящик', nationalSymbol: 'усл. ящ', symbol: 'УСЛ ЯЩ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '888', name: 'Тысяча условных ящиков', nationalSymbol: '103 усл. ящ', symbol: 'ТЫС УСЛ ЯЩ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '889', name: 'Условная катушка', nationalSymbol: 'усл. кат', symbol: 'УСЛ КАТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '890', name: 'Тысяча условных катушек', nationalSymbol: '103 усл. кат', symbol: 'ТЫС УСЛ КАТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '891', name: 'Условная плитка', nationalSymbol: 'усл. плит', symbol: 'УСЛ ПЛИТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '892', name: 'Тысяча условных плиток', nationalSymbol: '103 усл. плит', symbol: 'ТЫС УСЛ ПЛИТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '893', name: 'Условный кирпич', nationalSymbol: 'усл. кирп', symbol: 'УСЛ КИРП', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '894', name: 'Тысяча условных кирпичей', nationalSymbol: '103 усл. кирп', symbol: 'ТЫС УСЛ КИРП', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '895', name: 'Миллион условных кирпичей', nationalSymbol: '106 усл. кирп', symbol: 'МЛН УСЛ КИРП', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '896', name: 'Семья', nationalSymbol: 'семей', symbol: 'СЕМЕЙ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '897', name: 'Тысяча семей', nationalSymbol: '103 семей', symbol: 'ТЫС СЕМЕЙ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '898', name: 'Миллион семей', nationalSymbol: '106 семей', symbol: 'МЛН СЕМЕЙ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '899', name: 'Домохозяйство', nationalSymbol: 'домхоз', symbol: 'ДОМХОЗ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '900', name: 'Тысяча домохозяйств', nationalSymbol: '103 домхоз', symbol: 'ТЫС ДОМХОЗ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '901', name: 'Миллион домохозяйств', nationalSymbol: '106 домхоз', symbol: 'МЛН ДОМХОЗ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '902', name: 'Ученическое место', nationalSymbol: 'учен. мест', symbol: 'УЧЕН МЕСТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '903', name: 'Тысяча ученических мест', nationalSymbol: '103 учен. мест', symbol: 'ТЫС УЧЕН МЕСТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '904', name: 'Рабочее место', nationalSymbol: 'раб. мест', symbol: 'РАБ МЕСТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '905', name: 'Тысяча рабочих мест', nationalSymbol: '103 раб. мест', symbol: 'ТЫС РАБ МЕСТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '906', name: 'Посадочное место', nationalSymbol: 'посад. мест', symbol: 'ПОСАД МЕСТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '907', name: 'Тысяча посадочных мест', nationalSymbol: '103 посад. мест', symbol: 'ТЫС ПОСАД МЕСТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '908', name: 'Номер', nationalSymbol: 'ном', symbol: 'НОМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '909', name: 'Квартира', nationalSymbol: 'кварт', symbol: 'КВАРТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '910', name: 'Тысяча квартир', nationalSymbol: '103 кварт', symbol: 'ТЫС КВАРТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '911', name: 'Койка', nationalSymbol: 'коек', symbol: 'КОЕК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '912', name: 'Тысяча коек', nationalSymbol: '103 коек', symbol: 'ТЫС КОЕК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '913', name: 'Том книжного фонда', nationalSymbol: 'том книжн. фонд', symbol: 'ТОМ КНИЖН ФОНД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '914', name: 'Тысяча томов книжного фонда', nationalSymbol: '103 том. книжн. фонд', symbol: 'ТЫС ТОМ КНИЖН ФОНД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '915', name: 'Условный ремонт', nationalSymbol: 'усл. рем', symbol: 'УСЛ РЕМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '916', name: 'Условный ремонт в год', nationalSymbol: 'усл. рем/год', symbol: 'УСЛ РЕМ/ГОД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '917', name: 'Смена', nationalSymbol: 'смен', symbol: 'СМЕН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '918', name: 'Лист авторский', nationalSymbol: 'л. авт', symbol: 'ЛИСТ АВТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '920', name: 'Лист печатный', nationalSymbol: 'л. печ', symbol: 'ЛИСТ ПЕЧ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '921', name: 'Лист учетно-издательский', nationalSymbol: 'л. уч.-изд', symbol: 'ЛИСТ УЧ.ИЗД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '922', name: 'Знак', nationalSymbol: 'знак', symbol: 'ЗНАК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '923', name: 'Слово', nationalSymbol: 'слово', symbol: 'СЛОВО', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '924', name: 'Символ', nationalSymbol: 'символ', symbol: 'СИМВОЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '925', name: 'Условная труба', nationalSymbol: 'усл. труб', symbol: 'УСЛ ТРУБ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '930', name: 'Тысяча пластин', nationalSymbol: '103 пласт', symbol: 'ТЫС ПЛАСТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '937', name: 'Миллион доз', nationalSymbol: '106 доз', symbol: 'МЛН ДОЗ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '949', name: 'Миллион листов-оттисков', nationalSymbol: '106 лист.оттиск', symbol: 'МЛН ЛИСТ.ОТТИСК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '950', name: 'Вагоно(машино)-день', nationalSymbol: 'ваг (маш).дн', symbol: 'ВАГ (МАШ).ДН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '951', name: 'Тысяча вагоно-(машино)-часов', nationalSymbol: '103 ваг (маш).ч', symbol: 'ТЫС ВАГ (МАШ).Ч', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '952', name: 'Тысяча вагоно-(машино)-километров', nationalSymbol: '103 ваг (маш).км', symbol: 'ТЫС ВАГ (МАШ).КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '953', name: 'Тысяча место-километров', nationalSymbol: '10 3мест.км', symbol: 'ТЫС МЕСТ.КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '954', name: 'Вагоно-сутки', nationalSymbol: 'ваг.сут', symbol: 'ВАГ.СУТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '955', name: 'Тысяча поездо-часов', nationalSymbol: '103 поезд.ч', symbol: 'ТЫС ПОЕЗД.Ч', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '956', name: 'Тысяча поездо-километров', nationalSymbol: '103 поезд.км', symbol: 'ТЫС ПОЕЗД.КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '957', name: 'Тысяча тонно-миль', nationalSymbol: '103 т.миль', symbol: 'ТЫС Т.МИЛЬ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '958', name: 'Тысяча пассажиро-миль', nationalSymbol: '103 пасс.миль', symbol: 'ТЫС ПАСС.МИЛЬ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '959', name: 'Автомобиле-день', nationalSymbol: 'автомоб.дн', symbol: 'АВТОМОБ.ДН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '960', name: 'Тысяча автомобиле-тонно-дней', nationalSymbol: '103 автомоб.т.дн', symbol: 'ТЫС АВТОМОБ.Т.ДН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '961', name: 'Тысяча автомобиле-часов', nationalSymbol: '103 автомоб.ч', symbol: 'ТЫС АВТОМОБ.Ч', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '962', name: 'Тысяча автомобиле-место-дней', nationalSymbol: '103 автомоб.мест. дн', symbol: 'ТЫС АВТОМОБ.МЕСТ. ДН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '963', name: 'Приведенный час', nationalSymbol: 'привед.ч', symbol: 'ПРИВЕД.Ч', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '964', name: 'Самолето-километр', nationalSymbol: 'самолет.км', symbol: 'САМОЛЕТ.КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '965', name: 'Тысяча километров', nationalSymbol: '103 км', symbol: 'ТЫС КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '966', name: 'Тысяча тоннаже-рейсов', nationalSymbol: '103 тоннаж. рейс', symbol: 'ТЫС ТОННАЖ. РЕЙС', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '967', name: 'Миллион тонно-миль', nationalSymbol: '106 т. миль', symbol: 'МЛН Т. МИЛЬ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '968', name: 'Миллион пассажиро-миль', nationalSymbol: '106 пасс. миль', symbol: 'МЛН ПАСС. МИЛЬ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '969', name: 'Миллион тоннаже-миль', nationalSymbol: '106 тоннаж. миль', symbol: 'МЛН ТОННАЖ. МИЛЬ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '970', name: 'Миллион пассажиро-место-миль', nationalSymbol: '106 пасс. мест. миль', symbol: 'МЛН ПАСС. МЕСТ. МИЛЬ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '971', name: 'Кормо-день', nationalSymbol: 'корм. дн', symbol: 'КОРМ. ДН', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '972', name: 'Центнер кормовых единиц', nationalSymbol: 'ц корм ед', symbol: 'Ц КОРМ ЕД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '973', name: 'Тысяча автомобиле-километров', nationalSymbol: '103 автомоб. км', symbol: 'ТЫС АВТОМОБ. КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '974', name: 'Тысяча тоннаже-сут', nationalSymbol: '103 тоннаж. сут', symbol: 'ТЫС ТОННАЖ. СУТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '975', name: 'Суго-сутки', nationalSymbol: 'суго. сут.', symbol: 'СУГО. СУТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '976', name: 'Штук в 20-футовом эквиваленте (ДФЭ)', nationalSymbol: 'штук в 20-футовом эквиваленте', symbol: 'ШТ В 20 ФУТ ЭКВИВ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '977', name: 'Канало-километр', nationalSymbol: 'канал. км', symbol: 'КАНАЛ. КМ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '978', name: 'Канало-концы', nationalSymbol: 'канал. конц', symbol: 'КАНАЛ. КОНЦ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '979', name: 'Тысяча экземпляров', nationalSymbol: '103 экз', symbol: 'ТЫС ЭКЗ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '980', name: 'Тысяча долларов', nationalSymbol: '103 доллар', symbol: 'ТЫС ДОЛЛАР', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '981', name: 'Тысяча тонн кормовых единиц', nationalSymbol: '103 корм ед', symbol: 'ТЫС Т КОРМ ЕД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '982', name: 'Миллион тонн кормовых единиц', nationalSymbol: '106 корм ед', symbol: 'МЛН Т КОРМ ЕД', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '983', name: 'Судо-сутки', nationalSymbol: 'суд.сут', symbol: 'СУД.СУТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '984', name: 'Центнеров с гектара', nationalSymbol: 'ц/га', symbol: 'Ц/ГА', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '985', name: 'Тысяча голов', nationalSymbol: '103 гол', symbol: 'ТЫС ГОЛ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '986', name: 'Тысяча краско-оттисков', nationalSymbol: '103 краск. оттиск', symbol: 'ТЫС КРАСК ОТТИСК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '987', name: 'Миллион краско-оттисков', nationalSymbol: '106 краск. оттиск', symbol: 'МЛН КРАСК ОТТИСК', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '988', name: 'Миллион условных плиток', nationalSymbol: '106 усл. плит', symbol: 'МЛН УСЛ ПЛИТ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '989', name: 'Человек в час', nationalSymbol: 'чел/ч', symbol: 'ЧЕЛ/Ч', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '990', name: 'Пассажиров в час', nationalSymbol: 'пасс/ч', symbol: 'ПАСС/Ч', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '991', name: 'Пассажиро-миля', nationalSymbol: 'пасс. миля', symbol: 'ПАСС МИЛЯ', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9910', name: 'Международная единица биологической активности', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9911', name: 'Тысяча международных единиц биологической активности', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9912', name: 'Миллион международных единиц биологической активности', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9913', name: 'Международная единица биологической активности на грамм', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9914', name: 'Тысяча международных единиц биологической активности на грамм', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9915', name: 'Миллион международных единиц биологической активности на грамм', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9916', name: 'Международная единица биологической активности на миллилитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9917', name: 'Тысяча международных единиц биологической активности на миллилитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9918', name: 'Миллион международных единиц биологической активности на миллилитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9920', name: 'Единица действия биологической активности', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9921', name: 'Единица биологической активности на грамм', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9922', name: 'Тысяча единиц действия биологической активности на грамм', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9923', name: 'Единица действия биологической активности на микролитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9924', name: 'Единица действия биологической активности на миллилитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9925', name: 'Тысяча единиц действия биологической активности на миллилитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9926', name: 'Миллион единиц действия биологической активности на миллилитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9927', name: 'Единица действия биологической активности в сутки', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9930', name: 'Антитоксическая единица', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9931', name: 'Тысяча антитоксических единиц', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9940', name: 'Антитрипсиновая единица', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9941', name: 'Тысяча антитрипсиновых единиц', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9950', name: 'Индекс Реактивности', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9951', name: 'Индекс Реактивности на миллилитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9960', name: 'Килобеккерель на миллилитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9961', name: 'Мегабеккерель на миллилитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9962', name: 'Мегабеккерель на метр квадратный', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9970', name: 'Калликреиновая ингибирующая единица на миллилитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9971', name: 'Тысяча калликреиновых ингибирующих единиц на миллилитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9980', name: 'Миллион колониеобразующих единиц', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9981', name: 'Миллион колониеобразующих единиц на пакет', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9982', name: 'Миллиард колониеобразующих единиц', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9983', name: 'Протеолитическая единица', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9985', name: 'Микрограмм на миллилитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9986', name: 'Микрограмм в сутки', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9987', name: 'Микрограмм в час', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9988', name: 'Микрограмм на дозу', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9990', name: 'Миллимоль на миллилитр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '9991', name: 'Миллимоль на литр', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Дозировки лекарственных препаратов' },
  { code: '2311', name: 'Грей в секунду', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2312', name: 'Грей в минуту', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2313', name: 'Грей в час', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2314', name: 'Микрогрей в секунду', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2315', name: 'Микрогрей в час', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2316', name: 'Миллигрей в час', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2351', name: 'Зиверт в час', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2352', name: 'Микрозиверт в секунду', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2353', name: 'Микрозиверт в час', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2354', name: 'Миллизиверт в час', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2355', name: 'Градус (плоского угла)', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2356', name: 'Минута (плоского угла)', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2357', name: 'Секунда (плоского угла)', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2541', name: 'Бит в секунду', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2543', name: 'Килобит в секунду', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2545', name: 'Мегабит в секунду', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2547', name: 'Гигабит в секунду', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2551', name: 'Байт в секунду', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2552', name: 'Гигабайт в секунду', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2553', name: 'Гигабайт', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2554', name: 'Терабайт', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2555', name: 'Петабайт', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2556', name: 'Эксабайт', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2557', name: 'Зеттабайт', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2558', name: 'Йоттабайт', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2561', name: 'Килобайт в секунду', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2571', name: 'Мегабайт в секунду', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '2581', name: 'Эрланг', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '3135', name: 'Децибел', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '3181', name: 'Человеко-зиверт', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '3231', name: 'Беккерель на метр кубический', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '3831', name: 'Рубль тонна', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '3841', name: 'Тысяча рублей на человека', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '5401', name: 'Дето-день', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '5423', name: 'Человек в год', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '5451', name: 'Посещение', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '5562', name: 'Тысяча гнезд', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '6421', name: 'Единиц в год', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '6422', name: 'Вызов', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '6423', name: 'Посевная единица', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '6424', name: 'Штамм', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '7923', name: 'Абонент', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '8361', name: 'Особь', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '8751', name: 'Коробка', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9061', name: 'Миллион гектаров', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9062', name: 'Миллиард гектаров', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9111', name: 'Койко-день', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9113', name: 'Пациенто-день', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9245', name: 'Запись', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9246', name: 'Документ', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9491', name: 'Лист-оттиск', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9501', name: 'Вагоно (машино)-час', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9557', name: 'Миллион голов', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9641', name: 'Летный час', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9642', name: 'Балл', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9802', name: 'Миллион долларов', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9803', name: 'Миллиард долларов', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9805', name: 'Доллар за тонну', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9822', name: 'Миллион евро', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '9823', name: 'Миллиард евро', nationalSymbol: '', symbol: '', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '017', name: 'Гектометр', nationalSymbol: 'hm', symbol: 'HMT', nationalCode: '', internationalCode: '', category: 'Единицы длины' },
  { code: '045', name: 'Миля (уставная) (1609,344 м)', nationalSymbol: 'mile', symbol: 'SMI', nationalCode: '', internationalCode: '', category: 'Единицы длины' },
  { code: '182', name: 'Нетто-регистровая тонна', nationalSymbol: '-', symbol: 'NTT', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '183', name: 'Обмерная (фрахтовая) тонна', nationalSymbol: '-', symbol: 'SHT', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '184', name: 'Водоизмещение', nationalSymbol: '-', symbol: 'DPT', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '186', name: 'Фунт СК, США (0,45359237 кг)', nationalSymbol: 'lb', symbol: 'LBR', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '187', name: 'Унция СК, США (28,349523 г)', nationalSymbol: 'oz', symbol: 'ONZ', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '188', name: 'Драхма СК (1,771745 г)', nationalSymbol: 'dr', symbol: 'DRI', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '189', name: 'Гран СК, США (64,798910 мг)', nationalSymbol: 'gn', symbol: 'GRN', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '190', name: 'Стоун СК (6,350293 кг)', nationalSymbol: 'st', symbol: 'STI', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '191', name: 'Квартер СК (12,700586 кг)', nationalSymbol: 'qtr', symbol: 'QTR', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '192', name: 'Центал СК (45,359237 кг)', nationalSymbol: '-', symbol: 'CNT', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '193', name: 'Центнер США (45,3592 кг)', nationalSymbol: 'cwt', symbol: 'CWA', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '194', name: 'Длинный центнер СК (50,802345 кг)', nationalSymbol: 'cwt (UK)', symbol: 'CWI', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '195', name: 'Короткая тонна СК, США (0,90718474 т) [2*]', nationalSymbol: 'sht', symbol: 'STN', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '196', name: 'Длинная тонна СК, США (1,0160469 т) [2*]', nationalSymbol: 'lt', symbol: 'LTN', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '197', name: 'Скрупул СК, США (1,295982 г)', nationalSymbol: 'scr', symbol: 'SCR', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '198', name: 'Пеннивейт СК, США (1,555174 г)', nationalSymbol: 'dwt', symbol: 'DWT', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '199', name: 'Драхма СК (3,887935 г)', nationalSymbol: 'drm', symbol: 'DRM', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '200', name: 'Драхма США (3,887935 г)', nationalSymbol: '-', symbol: 'DRA', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '201', name: 'Унция СК, США (31,10348 г); тройская унция', nationalSymbol: 'apoz', symbol: 'APZ', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '202', name: 'Тройский фунт США (373,242 г)', nationalSymbol: '-', symbol: 'LBT', nationalCode: '', internationalCode: '', category: 'Единицы массы' },
  { code: '135', name: 'Жидкостная унция СК (28,413 см3)', nationalSymbol: 'fl oz (UK)', symbol: 'OZI', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '136', name: 'Джилл СК (0,142065 дм3)', nationalSymbol: 'gill (UK)', symbol: 'GII', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '137', name: 'Пинта СК (0,568262 дм3)', nationalSymbol: 'pt (UK)', symbol: 'PTI', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '138', name: 'Кварта СК (1,136523 дм3)', nationalSymbol: 'qt (UK)', symbol: 'QTI', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '139', name: 'Галлон СК (4,546092 дм3)', nationalSymbol: 'gal (UK)', symbol: 'GLI', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '140', name: 'Бушель СК (36,36874 дм3)', nationalSymbol: 'bu (UK)', symbol: 'BUI', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '141', name: 'Жидкостная унция США (29,5735 см3)', nationalSymbol: 'fl oz (US)', symbol: 'OZA', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '142', name: 'Джилл США (11,8294 см3)', nationalSymbol: 'gill (US)', symbol: 'GIA', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '143', name: 'Жидкостная пинта США (0,473176 дм3)', nationalSymbol: 'liq pt (US)', symbol: 'PTL', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '144', name: 'Жидкостная кварта США (0,946353 дм3)', nationalSymbol: 'liq qt (US)', symbol: 'QTL', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '145', name: 'Жидкостный галлон США (3,78541 дм3)', nationalSymbol: 'gal (US)', symbol: 'GLL', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '146', name: 'Баррель (нефтяной) США (158,987 дм3)', nationalSymbol: 'barrel (US)', symbol: 'BLL', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '147', name: 'Сухая пинта США (0,55061 дм3)', nationalSymbol: 'dry pt (US)', symbol: 'PTD', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '148', name: 'Сухая кварта США (1,101221 дм3)', nationalSymbol: 'dry qt (US)', symbol: 'QTD', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '149', name: 'Сухой галлон США (4,404884 дм3)', nationalSymbol: 'dry gal (US)', symbol: 'GLD', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '150', name: 'Бушель США (35,2391 дм3)', nationalSymbol: 'bu (US)', symbol: 'BUA', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '151', name: 'Сухой баррель США (115,627 дм3)', nationalSymbol: 'bbl (US)', symbol: 'BLD', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '152', name: 'Стандарт', nationalSymbol: '-', symbol: 'WSD', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '153', name: 'Корд (3,63 м3)', nationalSymbol: '-', symbol: 'WCD', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '154', name: 'Тысячи бордфутов (2,36 м3)', nationalSymbol: '-', symbol: 'MBF', nationalCode: '', internationalCode: '', category: 'Единицы объема' },
  { code: '077', name: 'Акр (4840 квадратных ярдов)', nationalSymbol: 'acre', symbol: 'ACR', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '079', name: 'Квадратная миля', nationalSymbol: 'mile2', symbol: 'MIK', nationalCode: '', internationalCode: '', category: 'Единицы площади' },
  { code: '213', name: 'Эффективная мощность (245,7 ватт)', nationalSymbol: 'B.h.p.', symbol: 'BHP', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '275', name: 'Британская тепловая единица (1,055 кДж)', nationalSymbol: 'Btu', symbol: 'BTU', nationalCode: '', internationalCode: '', category: 'Технические единицы' },
  { code: '638', name: 'Гросс (144 шт.)', nationalSymbol: 'gr; 144', symbol: 'GRO', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '731', name: 'Большой гросс (12 гроссов)', nationalSymbol: '1728', symbol: 'GGR', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '738', name: 'Короткий стандарт (7200 единиц)', nationalSymbol: '-', symbol: 'SST', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '835', name: 'Галлон спирта установленной крепости', nationalSymbol: '-', symbol: 'PGL', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '851', name: 'Международная единица', nationalSymbol: '-', symbol: 'NIU', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
  { code: '853', name: 'Сто международных единиц', nationalSymbol: '-', symbol: 'HIU', nationalCode: '', internationalCode: '', category: 'Экономические единицы' },
];

/**
 * Quick lookup map by OKEI code
 */
export const OKEI_BY_CODE: ReadonlyMap<string, OkeiUnit> = new Map(
  OKEI_UNITS.map(u => [u.code, u])
);

/**
 * Quick lookup map by national symbol (e.g. "м", "кг", "шт")
 */
export const OKEI_BY_NATIONAL_SYMBOL: ReadonlyMap<string, OkeiUnit> = new Map(
  OKEI_UNITS.filter(u => u.nationalSymbol).map(u => [u.nationalSymbol, u])
);

/**
 * Quick lookup map by international symbol (e.g. "m", "kg", "pc")
 */
export const OKEI_BY_SYMBOL: ReadonlyMap<string, OkeiUnit> = new Map(
  OKEI_UNITS.filter(u => u.symbol).map(u => [u.symbol, u])
);

/**
 * Get unit by OKEI code
 */
export function getOkeiUnit(code: string): OkeiUnit | undefined {
  return OKEI_BY_CODE.get(code);
}

/**
 * Get unit by national symbol (e.g. "м", "кг", "шт", "МПа")
 */
export function getOkeiUnitBySymbol(symbol: string): OkeiUnit | undefined {
  return OKEI_BY_NATIONAL_SYMBOL.get(symbol) ?? OKEI_BY_SYMBOL.get(symbol);
}

/**
 * Most commonly used industrial/engineering OKEI codes
 */
export const OKEI_COMMON_ENGINEERING: readonly OkeiUnit[] = [
  // Length
  getOkeiUnit("003")!, // мм
  getOkeiUnit("004")!, // см
  getOkeiUnit("006")!, // м
  getOkeiUnit("008")!, // км
  getOkeiUnit("018")!, // пог. м
  // Area
  getOkeiUnit("055")!, // м²
  getOkeiUnit("061")!, // км²
  // Volume
  getOkeiUnit("111")!, // см³; мл
  getOkeiUnit("112")!, // л; дм³
  getOkeiUnit("113")!, // м³
  // Mass
  getOkeiUnit("161")!, // мг
  getOkeiUnit("163")!, // г
  getOkeiUnit("164")!, // мкг
  getOkeiUnit("166")!, // кг
  getOkeiUnit("168")!, // т
  getOkeiUnit("206")!, // ц
  // Time
  getOkeiUnit("354")!, // с
  getOkeiUnit("355")!, // мин
  getOkeiUnit("356")!, // ч
  getOkeiUnit("359")!, // сут; дн
  // Temperature
  getOkeiUnit("280")!, // °C
  getOkeiUnit("281")!, // °F
  // Pressure
  getOkeiUnit("294")!, // Па
  getOkeiUnit("297")!, // кПа
  getOkeiUnit("298")!, // МПа
  getOkeiUnit("308")!, // мб
  getOkeiUnit("309")!, // бар
  getOkeiUnit("317")!, // кг/см²
  getOkeiUnit("337")!, // мм вод. ст
  getOkeiUnit("338")!, // мм рт. ст
  // Speed
  getOkeiUnit("328")!, // м/с
  getOkeiUnit("231")!, // м/ч
  getOkeiUnit("333")!, // км/ч
  // Frequency / Rotation
  getOkeiUnit("290")!, // Гц
  getOkeiUnit("291")!, // кГц
  getOkeiUnit("292")!, // МГц
  getOkeiUnit("330")!, // об/с
  getOkeiUnit("331")!, // об/мин
  // Electrical
  getOkeiUnit("222")!, // В
  getOkeiUnit("223")!, // кВ
  getOkeiUnit("260")!, // А
  getOkeiUnit("263")!, // А•ч
  getOkeiUnit("212")!, // Вт
  getOkeiUnit("214")!, // кВт
  getOkeiUnit("215")!, // МВт
  getOkeiUnit("226")!, // В•А
  getOkeiUnit("227")!, // кВ•А
  // Energy
  getOkeiUnit("271")!, // Дж
  getOkeiUnit("273")!, // кДж
  getOkeiUnit("232")!, // ккал
  getOkeiUnit("233")!, // Гкал
  getOkeiUnit("243")!, // Вт•ч
  getOkeiUnit("245")!, // кВт•ч
  getOkeiUnit("246")!, // МВт•ч
  // Force
  getOkeiUnit("289")!, // Н
  // Count / Economic
  getOkeiUnit("796")!, // шт
  getOkeiUnit("715")!, // пар
  getOkeiUnit("744")!, // %
  getOkeiUnit("746")!, // ‰
  getOkeiUnit("638")!, // гросс
  getOkeiUnit("704")!, // набор
  getOkeiUnit("778")!, // упаковка
  getOkeiUnit("797")!, // 100 шт
  getOkeiUnit("798")!, // 1000 шт
  getOkeiUnit("799")!, // 10^6 шт
  getOkeiUnit("800")!, // 10^9 шт
];
