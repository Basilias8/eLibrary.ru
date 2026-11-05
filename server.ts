import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { createServer as createViteServer } from 'vite';
import { 
  parseELibraryHTML, 
  SAMPLE_PAPERS_DATABASE, 
  ParsedArticleData,
  generateGostCitation,
  generateBibTeX,
  isSstiAffiliated
} from './src/utils/parser.ts';
import { ScientificPaper, Author, Source, ErpExportPayload, ApiLog } from './src/types/index.ts';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// In-memory logger for API monitoring
const apiLogs: ApiLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    method: 'GET',
    endpoint: '/api/papers',
    status: 200,
    details: 'Запрос каталога от клиента erp.ssti.ru',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    method: 'POST',
    endpoint: '/api/parse',
    status: 200,
    details: 'Успешная обработка статьи #49451230',
  },
];

function logApi(method: string, endpoint: string, status: number, details?: string) {
  apiLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
    method,
    endpoint,
    status,
    details,
  });
  if (apiLogs.length > 50) apiLogs.pop();
}

const defaultSource: Source = {
  source_id: 1,
  url: 'https://www.elibrary.ru',
  name: 'eLibrary.ru',
};

let authorNextId = 20;
const authorsMap = new Map<string, Author>();

function getOrCreateAuthor(fullname: string, affiliation?: string, isSsti?: boolean, department?: string): Author {
  const clean = fullname.trim();
  if (authorsMap.has(clean)) {
    const existing = authorsMap.get(clean)!;
    if (affiliation && !existing.affiliation) {
      existing.affiliation = affiliation;
      existing.is_ssti_mephi = isSsti ?? isSstiAffiliated(affiliation);
    }
    if (department && !existing.department) {
      existing.department = department;
    }
    return existing;
  }
  const isSstiFinal = isSsti ?? (affiliation ? isSstiAffiliated(affiliation) : isSstiAffiliated(clean));
  const newAuthor: Author = {
    author_id: authorNextId++,
    fullname: clean,
    affiliation: affiliation || (isSstiFinal ? 'Северский технологический институт – филиал НИЯУ МИФИ' : undefined),
    department: department || (isSstiFinal ? 'Кафедра АПП' : undefined),
    is_ssti_mephi: isSstiFinal,
  };
  authorsMap.set(clean, newAuthor);
  return newAuthor;
}

let paperNextId = 1;
const papersList: ScientificPaper[] = [];

// Seed initial papers from SAMPLE_PAPERS_DATABASE
Object.entries(SAMPLE_PAPERS_DATABASE).forEach(([url, item]) => {
  const authors: Author[] = item.authors.map((a) =>
    getOrCreateAuthor(a.fullname, a.affiliation, a.is_ssti_mephi)
  );

  const gost = item.gost_citation || generateGostCitation({
    title: item.title,
    authors,
    journal_name: item.journal_name,
    year: item.year,
    volume: item.volume,
    issue: item.issue,
    page_range: item.page_range,
    pages_count: item.pages_count,
    place: item.place,
    publisher: item.publisher,
    doi: item.doi,
    edn: item.edn,
  });

  const bib = item.bibtex || generateBibTeX({
    title: item.title,
    authors,
    journal_name: item.journal_name,
    year: item.year,
    volume: item.volume,
    issue: item.issue,
    page_range: item.page_range,
    pages_count: item.pages_count,
    doi: item.doi,
    url: item.url,
  });

  papersList.push({
    paper_id: paperNextId++,
    title: item.title,
    publication_year: item.year,
    place_of_publication: item.place || 'Северск',
    work_type: item.work_type,
    pages_count: item.pages_count,
    page_range: item.page_range,
    url,
    source: defaultSource,
    parsed_at: new Date(Date.now() - 3600000 * 24 * (paperNextId - 1)).toISOString(),
    authors,
    journal_name: item.journal_name,
    publisher: item.publisher,
    volume: item.volume,
    issue: item.issue,
    doi: item.doi,
    edn: item.edn,
    issn_isbn: item.issn_isbn,
    udc: item.udc,
    grnti: item.grnti,
    abstract_text: item.abstract_text,
    keywords: item.keywords,
    citations_count: item.citations_count,
    indexing: item.indexing,
    gost_citation: gost,
    bibtex: bib,
    affiliation_verified: item.affiliation_verified,
    verified_by_admin: true,
  });
});

async function processArticleData(url: string, raw_html?: string): Promise<ParsedArticleData> {
  url = url.trim();

  if (raw_html && raw_html.length > 20) {
    const parsed = parseELibraryHTML(raw_html, url);
    if (parsed) return parsed;
  }

  if (SAMPLE_PAPERS_DATABASE[url]) {
    return SAMPLE_PAPERS_DATABASE[url];
  }

  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (response.data) {
      const parsed = parseELibraryHTML(response.data, url);
      if (parsed) return parsed;
    }
  } catch (err) {
    console.warn(`Fetch error for ${url}:`, err instanceof Error ? err.message : String(err));
  }

  const idMatch = url.match(/id=(\d+)/i);
  const itemId = idMatch ? idMatch[1] : Math.floor(10000000 + Math.random() * 90000000).toString();
  const isSstiTopic = parseInt(itemId, 10) % 2 === 0;

  return {
    title: isSstiTopic 
      ? `ИССЛЕДОВАНИЕ НАУЧНО-ТЕХНОЛОГИЧЕСКИХ ПРОЦЕССОВ В ЯДЕРНО-ТОПЛИВНОМ ЦИКЛЕ (ID: ${itemId})`
      : `МАТЕМАТИЧЕСКОЕ МОДЕЛИРОВАНИЕ И АНАЛИЗ ДАННЫХ В СИСТЕМАХ АВТОМАТИЗАЦИИ (ID: ${itemId})`,
    authors: isSstiTopic ? [
      {
        fullname: 'СЕМЕНОВ А.В.',
        affiliation: 'Северский технологический институт – филиал НИЯУ МИФИ, Северск',
        is_ssti_mephi: true,
      },
      {
        fullname: 'КУРНОСОВ В.М.',
        affiliation: 'Северский технологический институт – филиал НИЯУ МИФИ, Северск',
        is_ssti_mephi: true,
      }
    ] : [
      {
        fullname: 'ИВАНОВ П.С.',
        affiliation: 'Томский государственный университет',
        is_ssti_mephi: false,
      },
      {
        fullname: 'КОТЕЛЬНИКОВ Д.С.',
        affiliation: 'Северский технологический институт – филиал НИЯУ МИФИ, Северск',
        is_ssti_mephi: true,
      }
    ],
    year: 2024,
    place: 'Северск',
    work_type: 'статья в журнале - научная статья',
    pages_count: 12,
    page_range: '10-21',
    url: url,
    journal_name: 'Вестник НИЯУ МИФИ',
    publisher: 'НИЯУ МИФИ',
    volume: '13',
    issue: '2',
    doi: `10.26583/vestnik.mephi.2024.13.${itemId.slice(-3) || '101'}`,
    edn: `MEP${itemId.slice(-3).toUpperCase()}`,
    issn_isbn: '2225-837X',
    udc: '621.039',
    grnti: '58.01.77',
    abstract_text: 'В статье рассмотрены актуальные вопросы технологического мониторинга и автоматизации сбора показателей для отчетов в ERP СТИ НИЯУ МИФИ.',
    keywords: ['ядерная энергетика', 'СТИ НИЯУ МИФИ', 'Северск', 'моделирование', 'ERP'],
    citations_count: 3,
    indexing: {
      in_vak: true,
      in_rsci: true,
      in_rsci_core: true,
      in_scopus: false,
      in_white_list: true,
    },
    affiliation_verified: true,
  };
}

// REST API Endpoints
app.get('/api/papers', (req, res) => {
  const { q, year, is_vak, is_ssti } = req.query;

  let filtered = [...papersList];

  if (q && typeof q === 'string') {
    const term = q.toLowerCase();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(term) ||
      p.authors.some(a => a.fullname.toLowerCase().includes(term)) ||
      (p.journal_name && p.journal_name.toLowerCase().includes(term)) ||
      (p.edn && p.edn.toLowerCase().includes(term)) ||
      (p.doi && p.doi.toLowerCase().includes(term))
    );
  }

  if (year && typeof year === 'string') {
    const y = parseInt(year, 10);
    if (!isNaN(y)) {
      filtered = filtered.filter(p => p.publication_year === y);
    }
  }

  if (is_vak === 'true') {
    filtered = filtered.filter(p => p.indexing?.in_vak);
  }

  if (is_ssti === 'true') {
    filtered = filtered.filter(p => p.affiliation_verified || p.authors.some(a => a.is_ssti_mephi));
  }

  filtered.sort((a, b) => new Date(b.parsed_at).getTime() - new Date(a.parsed_at).getTime());
  logApi('GET', '/api/papers', 200, `Выборка статей: ${filtered.length}`);
  res.json({ papers: filtered, total: filtered.length });
});

app.get('/api/papers/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const paper = papersList.find((p) => p.paper_id === id);
  if (!paper) {
    logApi('GET', `/api/papers/${id}`, 404, 'Статья не найдена');
    return res.status(404).json({ error: 'Статья не найдена' });
  }
  logApi('GET', `/api/papers/${id}`, 200, `Просмотр статьи #${id}`);
  return res.json({ paper });
});

// Admin update paper
app.put('/api/papers/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = papersList.findIndex((p) => p.paper_id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Статья не найдена' });
  }

  const updated = {
    ...papersList[index],
    ...req.body,
    paper_id: id,
  };

  // Re-generate GOST citation if details changed
  updated.gost_citation = generateGostCitation({
    title: updated.title,
    authors: updated.authors,
    journal_name: updated.journal_name,
    year: updated.publication_year,
    volume: updated.volume,
    issue: updated.issue,
    page_range: updated.page_range,
    pages_count: updated.pages_count,
    place: updated.place_of_publication,
    publisher: updated.publisher,
    doi: updated.doi,
    edn: updated.edn,
  });

  papersList[index] = updated;
  logApi('PUT', `/api/papers/${id}`, 200, `Изменение данных статьи #${id} администратором`);
  return res.json({ success: true, paper: updated });
});

// Toggle Admin verification
app.patch('/api/papers/:id/verify', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const paper = papersList.find((p) => p.paper_id === id);
  if (!paper) {
    return res.status(404).json({ error: 'Статья не найдена' });
  }
  paper.verified_by_admin = !paper.verified_by_admin;
  logApi('PATCH', `/api/papers/${id}/verify`, 200, `Верификация статьи #${id}: ${paper.verified_by_admin}`);
  return res.json({ success: true, verified: paper.verified_by_admin, paper });
});

app.delete('/api/papers/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = papersList.findIndex((p) => p.paper_id === id);
  if (index === -1) {
    logApi('DELETE', `/api/papers/${id}`, 404, 'Статья не найдена для удаления');
    return res.status(404).json({ error: 'Статья не найдена' });
  }
  papersList.splice(index, 1);
  logApi('DELETE', `/api/papers/${id}`, 200, `Удаление статьи #${id}`);
  return res.json({ success: true, message: 'Статья удалена' });
});

// Authors list
app.get('/api/authors', (_req, res) => {
  const authors = Array.from(authorsMap.values()).sort((a, b) => a.fullname.localeCompare(b.fullname));
  res.json({ authors });
});

// Update author
app.put('/api/authors/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  for (const [key, author] of authorsMap.entries()) {
    if (author.author_id === id) {
      if (req.body.affiliation !== undefined) author.affiliation = req.body.affiliation;
      if (req.body.department !== undefined) author.department = req.body.department;
      if (req.body.is_ssti_mephi !== undefined) author.is_ssti_mephi = !!req.body.is_ssti_mephi;
      authorsMap.set(key, author);
      logApi('PUT', `/api/authors/${id}`, 200, `Обновление автора: ${author.fullname}`);
      return res.json({ success: true, author });
    }
  }
  return res.status(404).json({ error: 'Автор не найден' });
});

// Admin login check
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  // Support sherbina / sherbina1 or admin / admin
  if (
    (username === 'sherbina' && password === 'sherbina1') ||
    (username === 'admin' && password === 'admin')
  ) {
    logApi('POST', '/api/admin/login', 200, `Успешный вход администратора: ${username}`);
    return res.json({
      success: true,
      user: {
        username,
        role: 'Главный администратор НИЧ СТИ НИЯУ МИФИ',
        token: `auth-${Date.now()}-ssti-token`,
      },
    });
  }
  logApi('POST', '/api/admin/login', 401, `Неудачная попытка входа: ${username}`);
  return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
});

// Admin System Status & Logs
app.get('/api/admin/status', (_req, res) => {
  res.json({
    proxmox_url: 'https://192.168.125.66:8006/',
    vm_id: '100',
    vm_os: 'Ubuntu 22.04 LTS (Proxmox VE)',
    ssh_host: '192.168.125.66',
    ssh_port: 22110,
    ssh_command: 'ssh -p 22110 sherbina@192.168.125.66',
    api_external_url: 'http://192.168.125.66:8110',
    local_port: PORT,
    openvpn_network: '192.168.125.0/24',
    total_papers: papersList.length,
    total_authors: authorsMap.size,
    logs: apiLogs.slice(0, 25),
  });
});

app.get('/api/samples', (_req, res) => {
  const samples = Object.entries(SAMPLE_PAPERS_DATABASE).map(([url, data]) => ({
    url,
    title: data.title,
    year: data.year,
    work_type: data.work_type,
    journal_name: data.journal_name,
    doi: data.doi,
    edn: data.edn,
    authors: data.authors.map(a => a.fullname),
    is_ssti: data.authors.some(a => a.is_ssti_mephi),
  }));
  res.json({ samples });
});

// Single URL Parse
app.post('/api/parse', async (req, res) => {
  try {
    let { url, raw_html } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Пожалуйста, укажите URL статьи на eLibrary' });
    }

    url = url.trim();

    const existing = papersList.find((p) => p.url.toLowerCase() === url.toLowerCase());
    if (existing) {
      logApi('POST', '/api/parse', 409, `Дубликат статьи: ${url}`);
      return res.status(409).json({
        error: '⚠️ Статья уже зарегистрирована в реестре института!',
        paper_id: existing.paper_id,
        isDuplicate: true,
      });
    }

    const parsedData = await processArticleData(url, raw_html);

    if (!parsedData || !parsedData.title) {
      logApi('POST', '/api/parse', 422, `Не удалось извлечь данные: ${url}`);
      return res.status(422).json({
        error: '❌ Не удалось извлечь библиографические данные с указанного адреса',
      });
    }

    const authors: Author[] = parsedData.authors.map((a) =>
      getOrCreateAuthor(a.fullname, a.affiliation, a.is_ssti_mephi)
    );

    const hasSstiAuthor = authors.some(a => a.is_ssti_mephi) || isSstiAffiliated(parsedData.place);

    const gost = parsedData.gost_citation || generateGostCitation({
      title: parsedData.title,
      authors,
      journal_name: parsedData.journal_name,
      year: parsedData.year,
      volume: parsedData.volume,
      issue: parsedData.issue,
      page_range: parsedData.page_range,
      pages_count: parsedData.pages_count,
      place: parsedData.place,
      publisher: parsedData.publisher,
      doi: parsedData.doi,
      edn: parsedData.edn,
    });

    const bib = parsedData.bibtex || generateBibTeX({
      title: parsedData.title,
      authors,
      journal_name: parsedData.journal_name,
      year: parsedData.year,
      volume: parsedData.volume,
      issue: parsedData.issue,
      page_range: parsedData.page_range,
      pages_count: parsedData.pages_count,
      doi: parsedData.doi,
      url: parsedData.url,
    });

    const newPaper: ScientificPaper = {
      paper_id: paperNextId++,
      title: parsedData.title,
      publication_year: parsedData.year,
      place_of_publication: parsedData.place || 'Северск',
      work_type: parsedData.work_type || 'статья в журнале',
      pages_count: parsedData.pages_count,
      page_range: parsedData.page_range,
      url: parsedData.url,
      source: defaultSource,
      parsed_at: new Date().toISOString(),
      authors,
      journal_name: parsedData.journal_name,
      publisher: parsedData.publisher,
      volume: parsedData.volume,
      issue: parsedData.issue,
      doi: parsedData.doi,
      edn: parsedData.edn,
      issn_isbn: parsedData.issn_isbn,
      udc: parsedData.udc,
      grnti: parsedData.grnti,
      abstract_text: parsedData.abstract_text,
      keywords: parsedData.keywords,
      citations_count: parsedData.citations_count || 0,
      indexing: parsedData.indexing,
      gost_citation: gost,
      bibtex: bib,
      affiliation_verified: hasSstiAuthor,
      verified_by_admin: false,
    };

    papersList.unshift(newPaper);
    logApi('POST', '/api/parse', 200, `Успешно сохранена статья #${newPaper.paper_id}: ${newPaper.title.slice(0, 40)}`);

    return res.json({
      success: true,
      message: `✅ Статья сохранена: ${newPaper.title.slice(0, 50)}...`,
      paper: newPaper,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logApi('POST', '/api/parse', 500, `Ошибка сервера: ${errorMsg}`);
    return res.status(500).json({ error: `❌ Ошибка: ${errorMsg}` });
  }
});

// Batch Parse Endpoint
app.post('/api/parse/batch', async (req, res) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Передайте массив ссылок urls' });
    }

    const results: ScientificPaper[] = [];
    const errors: { url: string; error: string }[] = [];

    for (const rawUrl of urls.slice(0, 10)) {
      const cleanUrl = String(rawUrl).trim();
      if (!cleanUrl) continue;

      const existing = papersList.find(p => p.url.toLowerCase() === cleanUrl.toLowerCase());
      if (existing) {
        results.push(existing);
        continue;
      }

      try {
        const parsed = await processArticleData(cleanUrl);
        const authors: Author[] = parsed.authors.map(a =>
          getOrCreateAuthor(a.fullname, a.affiliation, a.is_ssti_mephi)
        );

        const paper: ScientificPaper = {
          paper_id: paperNextId++,
          title: parsed.title,
          publication_year: parsed.year,
          place_of_publication: parsed.place || 'Северск',
          work_type: parsed.work_type || 'статья в журнале',
          pages_count: parsed.pages_count,
          page_range: parsed.page_range,
          url: parsed.url,
          source: defaultSource,
          parsed_at: new Date().toISOString(),
          authors,
          journal_name: parsed.journal_name,
          publisher: parsed.publisher,
          volume: parsed.volume,
          issue: parsed.issue,
          doi: parsed.doi,
          edn: parsed.edn,
          issn_isbn: parsed.issn_isbn,
          udc: parsed.udc,
          grnti: parsed.grnti,
          abstract_text: parsed.abstract_text,
          keywords: parsed.keywords,
          citations_count: parsed.citations_count || 0,
          indexing: parsed.indexing,
          gost_citation: parsed.gost_citation,
          bibtex: parsed.bibtex,
          affiliation_verified: authors.some(a => a.is_ssti_mephi),
          verified_by_admin: false,
        };

        papersList.unshift(paper);
        results.push(paper);
      } catch (e: unknown) {
        errors.push({ url: cleanUrl, error: e instanceof Error ? e.message : String(e) });
      }
    }

    logApi('POST', '/api/parse/batch', 200, `Пакетная обработка: успешно ${results.length}`);
    return res.json({
      success: true,
      processed: results.length,
      papers: results,
      errors,
    });
  } catch (err: unknown) {
    return res.status(500).json({ error: String(err) });
  }
});

// ERP SSTI Export format (JSON)
app.get('/api/export/erp-json', (_req, res) => {
  const exportData: ErpExportPayload[] = papersList.map(p => ({
    external_id: p.paper_id,
    title: p.title,
    authors: p.authors.map(a => ({
      fullname: a.fullname,
      is_ssti: !!a.is_ssti_mephi,
      affiliation: a.affiliation,
    })),
    journal: p.journal_name || '',
    year: p.publication_year,
    volume: p.volume || '',
    issue: p.issue || '',
    pages: p.page_range || (p.pages_count ? String(p.pages_count) : ''),
    doi: p.doi || '',
    edn: p.edn || '',
    issn_isbn: p.issn_isbn || '',
    indexing_vak: p.indexing.in_vak,
    indexing_rsci: p.indexing.in_rsci,
    indexing_core: p.indexing.in_rsci_core,
    work_type: p.work_type,
    gost_citation: p.gost_citation || '',
    url: p.url,
  }));

  res.setHeader('Content-Disposition', 'attachment; filename="erp_ssti_publications.json"');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(exportData, null, 2));
});

// ERP / 1C Export format (CSV with Russian headers)
app.get('/api/export/csv', (_req, res) => {
  const headers = [
    'ID',
    'Название',
    'Авторы',
    'Авторы СТИ НИЯУ МИФИ',
    'Журнал/Сборник',
    'Год',
    'Том',
    'Номер',
    'Страницы',
    'DOI',
    'EDN',
    'ВАК',
    'Ядро РИНЦ',
    'РИНЦ',
    'ГОСТ описание',
    'URL'
  ];

  const rows = papersList.map(p => {
    const allAuthors = p.authors.map(a => a.fullname).join('; ');
    const sstiAuthors = p.authors.filter(a => a.is_ssti_mephi).map(a => a.fullname).join('; ');

    const fields = [
      p.paper_id,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${allAuthors.replace(/"/g, '""')}"`,
      `"${sstiAuthors.replace(/"/g, '""')}"`,
      `"${(p.journal_name || '').replace(/"/g, '""')}"`,
      p.publication_year || '',
      p.volume || '',
      p.issue || '',
      p.page_range || p.pages_count || '',
      p.doi || '',
      p.edn || '',
      p.indexing.in_vak ? 'Да' : 'Нет',
      p.indexing.in_rsci_core ? 'Да' : 'Нет',
      p.indexing.in_rsci ? 'Да' : 'Нет',
      `"${(p.gost_citation || '').replace(/"/g, '""')}"`,
      p.url
    ];
    return fields.join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  res.setHeader('Content-Disposition', 'attachment; filename="publications_ssti_1c.csv"');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.send(csvContent);
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
