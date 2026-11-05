export interface Source {
  source_id: number;
  url: string;
  name: string;
}

export interface Author {
  author_id: number;
  fullname: string;
  affiliation?: string;
  department?: string; // Кафедра (АПП, ФЭТ, Ядерные технологии и др.)
  is_ssti_mephi?: boolean; // Штатный сотрудник СТИ НИЯУ МИФИ
}

export interface IndexingInfo {
  in_vak: boolean;        // Перечень ВАК
  in_rsci: boolean;       // РИНЦ
  in_rsci_core: boolean;  // Ядро РИНЦ / RSCI
  in_scopus: boolean;     // Scopus / Web of Science
  in_white_list: boolean; // Белый список научных изданий
}

export interface ScientificPaper {
  paper_id: number;
  title: string;
  publication_year: number | null;
  place_of_publication: string;
  work_type: string;
  pages_count: number | null;
  page_range?: string;    // Например: "45-58"
  url: string;
  source: Source;
  parsed_at: string;
  authors: Author[];

  // Расширенные научные параметры для вузовской ERP:
  journal_name?: string;     // Название журнала или сборника
  publisher?: string;        // Издательство
  volume?: string;           // Том
  issue?: string;            // Выпуск / Номер
  doi?: string;              // DOI
  edn?: string;              // EDN (РИНЦ)
  issn_isbn?: string;        // ISSN / ISBN
  udc?: string;              // УДК
  grnti?: string;            // ГРНТИ
  abstract_text?: string;    // Аннотация статьи
  keywords?: string[];       // Ключевые слова
  citations_count?: number;  // Число цитирований
  indexing: IndexingInfo;    // Индексация в наукометрических базах
  gost_citation?: string;    // Библиографическое описание по ГОСТ Р 7.0.100-2018
  bibtex?: string;           // BibTeX запись
  affiliation_verified?: boolean; // Привязка к СТИ НИЯУ МИФИ
  verified_by_admin?: boolean;    // Подтверждено научно-исследовательской частью (НИЧ)
}

export interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  details?: string;
}

export interface NotificationMessage {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  text: string;
}

export interface ErpExportPayload {
  external_id: number;
  title: string;
  authors: { fullname: string; is_ssti: boolean; affiliation?: string }[];
  journal: string;
  year: number | null;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  edn: string;
  issn_isbn: string;
  indexing_vak: boolean;
  indexing_rsci: boolean;
  indexing_core: boolean;
  work_type: string;
  gost_citation: string;
  url: string;
}
