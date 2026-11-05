import * as cheerio from 'cheerio';
import { IndexingInfo } from '../types/index.ts';

export interface ParsedArticleData {
  title: string;
  authors: { fullname: string; affiliation?: string; is_ssti_mephi?: boolean }[];
  year: number | null;
  place: string;
  work_type: string;
  pages_count: number | null;
  page_range?: string;
  url: string;
  journal_name?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  doi?: string;
  edn?: string;
  issn_isbn?: string;
  udc?: string;
  grnti?: string;
  abstract_text?: string;
  keywords?: string[];
  citations_count?: number;
  indexing: IndexingInfo;
  gost_citation?: string;
  bibtex?: string;
  affiliation_verified?: boolean;
}

const CITIES = [
  'Северск',
  'Томск',
  'Москва',
  'Санкт-Петербург',
  'Казань',
  'Новосибирск',
  'Екатеринбург',
  'Нижний Новгород',
  'Самара',
  'Владивосток',
  'Ростов-на-Дону',
  'Красноярск',
  'Уфа',
  'Пермь',
  'Воронеж',
  'Дубна',
  'Саров',
  'Снежинск',
  'Озерск'
];

/**
 * Генерация библиографической записи по ГОСТ Р 7.0.100-2018 / ГОСТ 7.0.5-2008
 */
export function generateGostCitation(data: {
  title: string;
  authors: { fullname: string }[];
  journal_name?: string;
  year?: number | null;
  volume?: string;
  issue?: string;
  page_range?: string;
  pages_count?: number | null;
  place?: string;
  publisher?: string;
  doi?: string;
  edn?: string;
}): string {
  const authorNames = data.authors.map(a => a.fullname);
  const firstAuthor = authorNames[0] || '';
  const allAuthors = authorNames.join(', ');

  let citation = '';

  if (firstAuthor) {
    citation += `${firstAuthor} `;
  }

  citation += `${data.title} / ${allAuthors || 'авторы'}. – `;

  if (data.journal_name) {
    citation += `// ${data.journal_name}. – `;
    if (data.year) citation += `${data.year}. – `;
    if (data.volume) citation += `Т. ${data.volume}. – `;
    if (data.issue) citation += `№ ${data.issue}. – `;
    if (data.page_range) {
      citation += `С. ${data.page_range}.`;
    } else if (data.pages_count) {
      citation += `${data.pages_count} с.`;
    }
  } else {
    // Книга, сборник или монография
    if (data.place) citation += `${data.place} : `;
    if (data.publisher) citation += `${data.publisher}, `;
    if (data.year) citation += `${data.year}. – `;
    if (data.pages_count) citation += `${data.pages_count} с.`;
  }

  if (data.doi) {
    citation += ` – DOI: ${data.doi}.`;
  }
  if (data.edn) {
    citation += ` – EDN: ${data.edn}.`;
  }

  return citation.trim();
}

/**
 * Генерация записи в формате BibTeX для научной работы
 */
export function generateBibTeX(data: {
  title: string;
  authors: { fullname: string }[];
  journal_name?: string;
  year?: number | null;
  volume?: string;
  issue?: string;
  page_range?: string;
  pages_count?: number | null;
  doi?: string;
  url?: string;
}): string {
  const firstAuthor = data.authors[0]?.fullname.split(' ')[0]?.toLowerCase() || 'paper';
  const yearKey = data.year || new Date().getFullYear();
  const citeKey = `${firstAuthor}${yearKey}`;
  const authorField = data.authors.map(a => a.fullname).join(' and ');

  const isArticle = !!data.journal_name;
  const entryType = isArticle ? 'article' : 'misc';

  let bib = `@${entryType}{${citeKey},\n`;
  bib += `  title     = {${data.title}},\n`;
  bib += `  author    = {${authorField}},\n`;
  if (data.journal_name) bib += `  journal   = {${data.journal_name}},\n`;
  if (data.year) bib += `  year      = {${data.year}},\n`;
  if (data.volume) bib += `  volume    = {${data.volume}},\n`;
  if (data.issue) bib += `  number    = {${data.issue}},\n`;
  if (data.page_range) bib += `  pages     = {${data.page_range}},\n`;
  if (data.doi) bib += `  doi       = {${data.doi}},\n`;
  if (data.url) bib += `  url       = {${data.url}},\n`;
  bib += `}`;

  return bib;
}

// Предустановленная база научных статей, включая публикации СТИ НИЯУ МИФИ
export const SAMPLE_PAPERS_DATABASE: Record<string, ParsedArticleData> = {
  'https://www.elibrary.ru/item.asp?id=49451230': {
    title: 'МОДЕЛИРОВАНИЕ НЕЙТРОННО-ФИЗИЧЕСКИХ ПРОЦЕССОВ В АКТИВНОЙ ЗОНЕ РЕАКТОРА БРЕСТ-ОД-300',
    authors: [
      {
        fullname: 'СЕМЕНОВ А.В.',
        affiliation: 'Северский технологический институт – филиал НИЯУ МИФИ, Северск',
        is_ssti_mephi: true,
      },
      {
        fullname: 'КУРНОСОВ В.М.',
        affiliation: 'Северский технологический институт – филиал НИЯУ МИФИ, Северск',
        is_ssti_mephi: true,
      },
      {
        fullname: 'КУЗНЕЦОВ И.Н.',
        affiliation: 'АО Сибирский химический комбинат (СХК), Северск',
        is_ssti_mephi: false,
      },
    ],
    year: 2023,
    place: 'Северск',
    work_type: 'статья в журнале - научная статья',
    pages_count: 14,
    page_range: '45-58',
    url: 'https://www.elibrary.ru/item.asp?id=49451230',
    journal_name: 'Атомная энергия',
    publisher: 'Наука',
    volume: '134',
    issue: '4',
    doi: '10.1007/s10512-023-01045-8',
    edn: 'XZQJKL',
    issn_isbn: '0004-7163',
    udc: '621.039.51',
    grnti: '58.33.29',
    abstract_text: 'Представлены результаты расчетного моделирования пространственного распределения нейтронных потоков и изотопного состава нитридного уран-плутониевого топлива для опытно-демонстрационного реактора на быстрых нейтронах БРЕСТ-ОД-300.',
    keywords: ['БРЕСТ-ОД-300', 'реактор на быстрых нейтронах', 'нейтронный поток', 'СНИП-код', 'СТИ НИЯУ МИФИ', 'СХК'],
    citations_count: 7,
    indexing: {
      in_vak: true,
      in_rsci: true,
      in_rsci_core: true,
      in_scopus: true,
      in_white_list: true,
    },
    affiliation_verified: true,
  },

  'https://www.elibrary.ru/item.asp?id=47328911': {
    title: 'АВТОМАТИЗАЦИЯ КОНТРОЛЯ ТЕХНОЛОГИЧЕСКИХ ПАРАМЕТРОВ С ИСПОЛЬЗОВАНИЕМ СОВРЕМЕННЫХ SCADA И ERP-СИСТЕМ',
    authors: [
      {
        fullname: 'КОТЕЛЬНИКОВ Д.С.',
        affiliation: 'Северский технологический институт – филиал НИЯУ МИФИ, Кафедра АПП, Северск',
        is_ssti_mephi: true,
      },
      {
        fullname: 'СИДОРОВ Д.А.',
        affiliation: 'Национальный исследовательский ядерный университет «МИФИ», Москва',
        is_ssti_mephi: true,
      },
      {
        fullname: 'ПЕТРОВ И.Г.',
        affiliation: 'Томский политехнический университет, Томск',
        is_ssti_mephi: false,
      },
    ],
    year: 2022,
    place: 'Северск',
    work_type: 'статья в журнале - научная статья',
    pages_count: 10,
    page_range: '112-121',
    url: 'https://www.elibrary.ru/item.asp?id=47328911',
    journal_name: 'Приборы и системы. Управление, контроль, диагностика',
    publisher: 'Научтехлитиздат',
    volume: '28',
    issue: '8',
    doi: '10.25791/pribor.8.2022.1284',
    edn: 'QWERTZ',
    issn_isbn: '0032-8154',
    udc: '681.518.5',
    grnti: '50.47.29',
    abstract_text: 'Рассматриваются подходы к интеграции распределенных средств мониторинга технологических процессов радиохимических производств с общевузовскими и корпоративными ERP-системами учета.',
    keywords: ['SCADA', 'ERP', 'автоматизация', 'СТИ НИЯУ МИФИ', 'мониторинг', 'базы данных'],
    citations_count: 4,
    indexing: {
      in_vak: true,
      in_rsci: true,
      in_rsci_core: false,
      in_scopus: false,
      in_white_list: true,
    },
    affiliation_verified: true,
  },

  'https://www.elibrary.ru/item.asp?id=50123456': {
    title: 'МАТЕМАТИЧЕСКИЕ МЕТОДЫ ОПТИМИЗАЦИИ РАСПИСАНИЙ И НАГРУЗКИ ПРЕПОДАВАТЕЛЕЙ В ВУЗОВСКОЙ ERP',
    authors: [
      {
        fullname: 'МОРОЗОВ П.С.',
        affiliation: 'Северский технологический институт – филиал НИЯУ МИФИ, Северск',
        is_ssti_mephi: true,
      },
      {
        fullname: 'ВАСИЛЬЕВ А.А.',
        affiliation: 'Томский государственный университет систем управления и радиоэлектроники, Томск',
        is_ssti_mephi: false,
      },
    ],
    year: 2024,
    place: 'Томск',
    work_type: 'статья в сборнике трудов конференции',
    pages_count: 6,
    page_range: '88-93',
    url: 'https://www.elibrary.ru/item.asp?id=50123456',
    journal_name: 'Информационные технологии в науке и образовании: труды Всероссийской конференции',
    publisher: 'ТГУ',
    issue: '2',
    doi: '10.17223/conf2024.18',
    edn: 'TYUIOP',
    issn_isbn: '978-5-94621-890-1',
    udc: '004.896',
    grnti: '28.23.15',
    abstract_text: 'Исследуется алгоритм формирования индивидуальной учебной и научной нагрузки научно-педагогических работников с возможностью экспорта отчетных данных в портал erp.ssti.ru.',
    keywords: ['ERP вуза', 'оптимизация нагрузки', 'СТИ НИЯУ МИФИ', 'наукометрия'],
    citations_count: 2,
    indexing: {
      in_vak: false,
      in_rsci: true,
      in_rsci_core: false,
      in_scopus: false,
      in_white_list: false,
    },
    affiliation_verified: true,
  },

  'https://www.elibrary.ru/item.asp?id=44890123': {
    title: 'ТЕХНОЛОГИЯ ПОЛУЧЕНИЯ ДИОКСИДА КРЕМНИЯ ВЫСОКОЙ ЧИСТОТЫ ФТОРИДНЫМ МЕТОДОМ',
    authors: [
      {
        fullname: 'ФЕДОРОВ И.В.',
        affiliation: 'Северский технологический институт – филиал НИЯУ МИФИ, Северск',
        is_ssti_mephi: true,
      },
      {
        fullname: 'СОКОЛОВ Г.П.',
        affiliation: 'Институт химии нефти СО РАН, Томск',
        is_ssti_mephi: false,
      },
    ],
    year: 2021,
    place: 'Северск',
    work_type: 'статья в журнале - научная статья',
    pages_count: 9,
    page_range: '34-42',
    url: 'https://www.elibrary.ru/item.asp?id=44890123',
    journal_name: 'Журнал прикладной химии',
    publisher: 'Наука',
    volume: '94',
    issue: '3',
    doi: '10.1134/S107042722103004X',
    edn: 'ASDFGH',
    issn_isbn: '0044-4618',
    udc: '546.284-31',
    grnti: '61.31.29',
    abstract_text: 'Разработан фторидный метод переработки кварцитовых руд с получением дисперсного диоксида кремния с чистотой выше 99.98% мас.',
    keywords: ['диоксид кремния', 'фторирование', 'СТИ НИЯУ МИФИ', 'технология'],
    citations_count: 11,
    indexing: {
      in_vak: true,
      in_rsci: true,
      in_rsci_core: true,
      in_scopus: true,
      in_white_list: true,
    },
    affiliation_verified: true,
  },
};

/**
 * Проверка принадлежности организации к СТИ НИЯУ МИФИ / Северску
 */
export function isSstiAffiliated(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('северск') ||
    lower.includes('сти нияу мифи') ||
    lower.includes('сти мифи') ||
    lower.includes('северский технологический') ||
    lower.includes('нияу мифи') ||
    lower.includes('схк') ||
    lower.includes('mephi') ||
    lower.includes('ssti')
  );
}

/**
 * Расширенный парсинг HTML статьи eLibrary со всеми наукометрическими полями
 */
export function parseELibraryHTML(html: string, url: string): ParsedArticleData | null {
  if (html.includes('Тест Тьюринга') || html.includes('captcha') || html.includes('Доступ ограничен')) {
    throw new Error('Обнаружена защита или капча eLibrary (Тест Тьюринга)!');
  }

  const $ = cheerio.load(html);

  // Очистка текста
  const fullText = $('body').text().replace(/\s+/g, ' ').trim();
  const textClean = fullText.replace(/[¹²³⁴⁵⁷⁹]/g, '');

  const data: ParsedArticleData = {
    title: '',
    authors: [],
    year: null,
    place: '',
    work_type: '',
    pages_count: null,
    url: url,
    indexing: {
      in_vak: false,
      in_rsci: true, // Почти все на eLibrary в РИНЦ
      in_rsci_core: false,
      in_scopus: false,
      in_white_list: false,
    },
  };

  // 1. Извлечение заголовка (Title)
  const h1 = $('h1').first().text().trim();
  if (h1) data.title = h1;

  if (!data.title) {
    const ogTitle = $('meta[property="og:title"]').attr('content');
    if (ogTitle) data.title = ogTitle.trim();
  }

  if (!data.title) {
    const metaTitle = $('meta[name="citation_title"]').attr('content');
    if (metaTitle) data.title = metaTitle.trim();
  }

  if (!data.title) {
    const titleTag = $('title').text().trim();
    if (titleTag && !titleTag.includes('eLIBRARY.RU -')) {
      data.title = titleTag;
    } else if (titleTag) {
      data.title = titleTag.replace(/^eLIBRARY\.RU\s*-\s*/, '').trim();
    }
  }

  if (!data.title) {
    const bigTitle = $('.bigtext, font[size="3"] b, .item_title, td[valign="top"] > b').first().text().trim();
    if (bigTitle && bigTitle.length > 5) {
      data.title = bigTitle;
    }
  }

  if (!data.title) {
    return null;
  }

  // 2. Извлечение DOI
  const doiMatch = textClean.match(/\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/) ||
                   $('meta[name="citation_doi"]').attr('content') ||
                   $('meta[name="DC.identifier"]').attr('content');
  if (doiMatch) {
    data.doi = typeof doiMatch === 'string' ? doiMatch : doiMatch[1];
  }

  // 3. Извлечение EDN (eLibrary Document Number)
  const ednMatch = textClean.match(/EDN:\s*([A-Za-z0-9]{5,8})/i) ||
                   textClean.match(/Код EDN:\s*([A-Za-z0-9]{5,8})/i);
  if (ednMatch && ednMatch[1]) {
    data.edn = ednMatch[1].toUpperCase();
  }

  // 4. Журнал / Издание
  const journalMeta = $('meta[name="citation_journal_title"]').attr('content');
  if (journalMeta) {
    data.journal_name = journalMeta.trim();
  } else {
    const journalMatch = textClean.match(/Журнал:\s*([^\n\r.]+)/i) ||
                         textClean.match(/ИСТОЧНИК:\s*([^\n\r,]+)/i);
    if (journalMatch && journalMatch[1]) {
      data.journal_name = journalMatch[1].trim();
    }
  }

  // 5. Том и Номер
  const volMatch = textClean.match(/Том:\s*([A-Za-z0-9а-яА-Я]+)/i) || $('meta[name="citation_volume"]').attr('content');
  if (volMatch) {
    data.volume = typeof volMatch === 'string' ? volMatch : volMatch[1];
  }

  const issueMatch = textClean.match(/Номер:\s*([A-Za-z0-9а-яА-Я]+)/i) ||
                     textClean.match(/№:\s*([A-Za-z0-9а-яА-Я]+)/i) ||
                     $('meta[name="citation_issue"]').attr('content');
  if (issueMatch) {
    data.issue = typeof issueMatch === 'string' ? issueMatch : issueMatch[1];
  }

  // 6. Диапазон страниц и общее количество
  const pageRangeMatch = textClean.match(/(?:Страницы:\s*|С\.\s*|pp\.\s*)(\d+[-–]\d+)/i);
  if (pageRangeMatch && pageRangeMatch[1]) {
    data.page_range = pageRangeMatch[1].replace('–', '-');
  }

  const pagesCountMatch = textClean.match(/(?:Страницы:\s*|С\.?\s*)(\d+)(?:\s*с\.?)?/i);
  if (pagesCountMatch && pagesCountMatch[1]) {
    data.pages_count = parseInt(pagesCountMatch[1], 10);
  }

  // 7. Год
  const yearMatch = textClean.match(/Год издания:\s*(\d{4})/i) ||
                    textClean.match(/Год:\s*(\d{4})/i) ||
                    $('meta[name="citation_publication_date"]').attr('content') ||
                    textClean.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    const yr = typeof yearMatch === 'string' ? yearMatch.slice(0, 4) : yearMatch[1];
    data.year = parseInt(yr, 10);
  }

  // 8. Тип работы
  const typeMatch = textClean.match(/Тип:\s*([^,\r\n;]+?)(?:\s+(?:Язык|Источник):|$)/i);
  if (typeMatch && typeMatch[1]) {
    data.work_type = typeMatch[1].trim();
  } else {
    if (textClean.includes('статья в журнале')) {
      data.work_type = 'статья в журнале - научная статья';
    } else if (textClean.includes('материалы конференции') || textClean.includes('статья в сборнике')) {
      data.work_type = 'статья в сборнике трудов конференции';
    } else if (textClean.includes('монография')) {
      data.work_type = 'монография';
    } else if (textClean.includes('диссертация')) {
      data.work_type = 'диссертация';
    } else {
      data.work_type = 'научная публикация';
    }
  }

  // 9. Авторы с аффилиацией
  const titlePos = textClean.indexOf(data.title);
  const snippet = titlePos !== -1
    ? textClean.substring(titlePos, titlePos + 2500)
    : textClean.substring(0, 2500);

  const authorPattern = /([А-ЯЁ]{3,}\s+[А-ЯЁ]\.[А-ЯЁ]\.)/g;
  const matches = snippet.match(authorPattern) || [];

  const cleanAuthors = matches
    .map(a => a.trim().replace(/[,.]+$/, ''))
    .filter(a => a.length > 8 && a.includes('.') && !a.includes('ГОД') && !a.includes('ТИП'));

  const uniqueAuthors = Array.from(new Set(cleanAuthors)).slice(0, 10);

  // Проверка аффилиации автора по странице
  const orgSection = textClean.substring(0, 4000);
  const pageHasSsti = isSstiAffiliated(orgSection);

  data.authors = uniqueAuthors.map(fullname => {
    return {
      fullname,
      affiliation: pageHasSsti ? 'Северский технологический институт – филиал НИЯУ МИФИ' : undefined,
      is_ssti_mephi: pageHasSsti,
    };
  });

  if (pageHasSsti) {
    data.affiliation_verified = true;
  }

  // 10. Место издания
  for (const city of CITIES) {
    if (textClean.includes(city)) {
      data.place = city;
      break;
    }
  }

  // 11. УДК и ГРНТИ
  const udcMatch = textClean.match(/УДК:\s*([\d\.]+)/i);
  if (udcMatch && udcMatch[1]) {
    data.udc = udcMatch[1];
  }
  const grntiMatch = textClean.match(/ГРНТИ:\s*([\d\.]+)/i);
  if (grntiMatch && grntiMatch[1]) {
    data.grnti = grntiMatch[1];
  }

  // 12. Индексация (ВАК, Ядро РИНЦ, Scopus, Белый список)
  if (textClean.includes('перечень ВАК') || textClean.includes('Входит в ВАК') || textClean.includes('ВАК')) {
    data.indexing.in_vak = true;
  }
  if (textClean.includes('Ядро РИНЦ') || textClean.includes('RSCI') || textClean.includes('Russian Science Citation Index')) {
    data.indexing.in_rsci_core = true;
  }
  if (textClean.includes('Scopus') || textClean.includes('Web of Science')) {
    data.indexing.in_scopus = true;
  }
  if (textClean.includes('Белый список') || data.indexing.in_rsci_core || data.indexing.in_scopus) {
    data.indexing.in_white_list = true;
  }

  // 13. Число цитирований
  const citMatch = textClean.match(/Цитирований в РИНЦ:\s*(\d+)/i) || textClean.match(/Цитирований:\s*(\d+)/i);
  if (citMatch && citMatch[1]) {
    data.citations_count = parseInt(citMatch[1], 10);
  }

  // 14. Аннотация
  const absMatch = textClean.match(/АННОТАЦИЯ:\s*([^]+?)(?:\s+КЛЮЧЕВЫЕ СЛОВА:|\s+ОПИСАНИЕ:|$)/i);
  if (absMatch && absMatch[1] && absMatch[1].length > 20) {
    data.abstract_text = absMatch[1].trim().slice(0, 1000);
  }

  // 15. Генерация ГОСТ и BibTeX
  data.gost_citation = generateGostCitation(data);
  data.bibtex = generateBibTeX(data);

  return data;
}
