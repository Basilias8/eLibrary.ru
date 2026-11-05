import React, { useState, useEffect } from 'react';
import { ScientificPaper, Author, ApiLog, NotificationMessage } from './types/index.ts';
import { 
  ExternalLink, 
  ArrowLeft, 
  Trash2, 
  Sparkles, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Code2,
  Copy,
  Check,
  Download,
  Search,
  GraduationCap,
  Award,
  BookOpen,
  ShieldCheck,
  Lock,
  Unlock,
  Server,
  Terminal,
  Activity,
  Edit3,
  Save,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'parser' | 'catalog' | 'erp-integration' | 'export' | 'admin'>('parser');
  const [currentView, setCurrentView] = useState<'index' | 'result'>('index');
  const [papers, setPapers] = useState<ScientificPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<ScientificPaper | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  
  // Admin state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('sherbina');
  const [adminPassword, setAdminPassword] = useState<string>('sherbina1');
  const [adminTab, setAdminTab] = useState<'papers' | 'authors' | 'server' | 'logs'>('server');
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [editingPaper, setEditingPaper] = useState<ScientificPaper | null>(null);

  // Form states
  const [urlInput, setUrlInput] = useState<string>('');
  const [batchUrlsInput, setBatchUrlsInput] = useState<string>('');
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [rawHtmlInput, setRawHtmlInput] = useState<string>('');
  const [showHtmlInput, setShowHtmlInput] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [samplePapers, setSamplePapers] = useState<any[]>([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVakOnly, setFilterVakOnly] = useState<boolean>(false);
  const [filterSstiOnly, setFilterSstiOnly] = useState<boolean>(false);
  
  // Copy state
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Result view active detail tab
  const [detailTab, setDetailTab] = useState<'info' | 'gost' | 'bibtex' | 'erp-json'>('info');

  const addMessage = (type: NotificationMessage['type'], text: string) => {
    const newMessage: NotificationMessage = {
      id: Math.random().toString(36).substring(7),
      type,
      text,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(label);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const fetchPapers = async () => {
    try {
      const res = await fetch('/api/papers');
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers || []);
      }
    } catch (err) {
      console.error('Failed to fetch papers:', err);
    }
  };

  const fetchSamples = async () => {
    try {
      const res = await fetch('/api/samples');
      if (res.ok) {
        const data = await res.json();
        setSamplePapers(data.samples || []);
      }
    } catch (err) {
      console.error('Failed to fetch samples:', err);
    }
  };

  const fetchAuthors = async () => {
    try {
      const res = await fetch('/api/authors');
      if (res.ok) {
        const data = await res.json();
        setAuthors(data.authors || []);
      }
    } catch (err) {
      console.error('Failed to fetch authors:', err);
    }
  };

  const fetchServerStatus = async () => {
    try {
      const res = await fetch('/api/admin/status');
      if (res.ok) {
        const data = await res.json();
        setServerInfo(data);
        setApiLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch server status:', err);
    }
  };

  useEffect(() => {
    fetchPapers();
    fetchSamples();
    fetchAuthors();
    fetchServerStatus();

    // Check hash for admin
    if (window.location.hash === '#admin') {
      setActiveTab('admin');
    }
  }, []);

  const handleSelectPaper = (paper: ScientificPaper) => {
    setSelectedPaper(paper);
    setCurrentView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToIndex = () => {
    setSelectedPaper(null);
    setCurrentView('index');
  };

  const handleDeletePaper = async (paperId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Вы уверены, что хотите удалить данную публикацию из реестра?')) {
      return;
    }
    try {
      const res = await fetch(`/api/papers/${paperId}`, { method: 'DELETE' });
      if (res.ok) {
        setPapers((prev) => prev.filter((p) => p.paper_id !== paperId));
        addMessage('info', 'Статья удалена из реестра');
        if (selectedPaper && selectedPaper.paper_id === paperId) {
          handleBackToIndex();
        }
      } else {
        addMessage('danger', 'Не удалось удалить статью');
      }
    } catch {
      addMessage('danger', 'Ошибка при удалении');
    }
  };

  const handleToggleVerify = async (paperId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/papers/${paperId}/verify`, { method: 'PATCH' });
      if (res.ok) {
        const data = await res.json();
        setPapers((prev) =>
          prev.map((p) => (p.paper_id === paperId ? { ...p, verified_by_admin: data.verified } : p))
        );
        if (selectedPaper && selectedPaper.paper_id === paperId) {
          setSelectedPaper((prev) => (prev ? { ...prev, verified_by_admin: data.verified } : null));
        }
        addMessage('success', data.verified ? 'Статья верифицирована НИЧ' : 'Верификация статьи снята');
      }
    } catch {
      addMessage('danger', 'Ошибка обновления статуса верификации');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAdminLoggedIn(true);
        addMessage('success', `Успешная авторизация: ${data.user.role}`);
        fetchServerStatus();
      } else {
        addMessage('danger', data.error || 'Ошибка авторизации');
      }
    } catch {
      addMessage('danger', 'Ошибка подключения к серверу авторизации');
    }
  };

  const handleUpdateAuthor = async (authorId: number, patch: Partial<Author>) => {
    try {
      const res = await fetch(`/api/authors/${authorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const data = await res.json();
        setAuthors((prev) => prev.map((a) => (a.author_id === authorId ? data.author : a)));
        addMessage('success', `Данные автора обновлены`);
      }
    } catch {
      addMessage('danger', 'Не удалось обновить автора');
    }
  };

  const handleSaveEditedPaper = async () => {
    if (!editingPaper) return;
    try {
      const res = await fetch(`/api/papers/${editingPaper.paper_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPaper),
      });
      if (res.ok) {
        const data = await res.json();
        setPapers((prev) => prev.map((p) => (p.paper_id === editingPaper.paper_id ? data.paper : p)));
        setEditingPaper(null);
        addMessage('success', 'Изменения публикации сохранены');
      }
    } catch {
      addMessage('danger', 'Ошибка сохранения изменений');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBatchMode) {
      const urls = batchUrlsInput.split('\n').map((u) => u.trim()).filter(Boolean);
      if (urls.length === 0) {
        addMessage('danger', 'Укажите хотя бы одну ссылку для пакетного парсинга');
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch('/api/parse/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls }),
        });
        const data = await res.json();
        if (res.ok) {
          addMessage('success', `Обработано публикаций: ${data.processed || 0}`);
          fetchPapers();
          setBatchUrlsInput('');
          setActiveTab('catalog');
        } else {
          addMessage('danger', data.error || 'Ошибка пакетного парсинга');
        }
      } catch (err: unknown) {
        addMessage('danger', `Ошибка: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!urlInput.trim()) {
      addMessage('danger', 'Пожалуйста, введите URL статьи на eLibrary');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput.trim(),
          raw_html: rawHtmlInput.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        addMessage('warning', data.error || '⚠️ Статья уже зарегистрирована в реестре института!');
        if (data.paper_id) {
          const existing = papers.find((p) => p.paper_id === data.paper_id);
          if (existing) {
            handleSelectPaper(existing);
          }
        }
      } else if (!res.ok) {
        addMessage('danger', data.error || '❌ Не удалось извлечь библиографические данные');
      } else {
        addMessage('success', data.message || `✅ Статья зарегистрирована: ${data.paper.title.slice(0, 50)}...`);
        setPapers((prev) => [data.paper, ...prev.filter((p) => p.paper_id !== data.paper.paper_id)]);
        setSelectedPaper(data.paper);
        setUrlInput('');
        setRawHtmlInput('');
        setShowHtmlInput(false);
        setCurrentView('result');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addMessage('danger', `❌ Ошибка соединения: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPapers = papers.filter((p) => {
    if (filterVakOnly && !p.indexing?.in_vak) return false;
    if (filterSstiOnly && !p.affiliation_verified && !p.authors.some((a) => a.is_ssti_mephi)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchAuthor = p.authors.some((a) => a.fullname.toLowerCase().includes(q));
      const matchJournal = (p.journal_name || '').toLowerCase().includes(q);
      const matchEdn = (p.edn || '').toLowerCase().includes(q);
      const matchDoi = (p.doi || '').toLowerCase().includes(q);
      return matchTitle || matchAuthor || matchJournal || matchEdn || matchDoi;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col text-[#1e293b]">
      {/* Official Top State Header */}
      <div className="bg-[#0f172a] text-[#cbd5e1] text-[11px] py-1 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1 font-medium">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold uppercase tracking-wider">
              МИНОБРНАУКИ РОССИИ
            </span>
            <span className="text-slate-600">|</span>
            <span>НАЦИОНАЛЬНЫЙ ИССЛЕДОВАТЕЛЬСКИЙ ЯДЕРНЫЙ УНИВЕРСИТЕТ «МИФИ»</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>СТИ НИЯУ МИФИ (г. Северск)</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">Сервер ВМ 100 (192.168.125.66:8110)</span>
          </div>
        </div>
      </div>

      {/* Main Institutional Header */}
      <header className="bg-[#002b49] text-white shadow-md border-b-2 border-amber-500">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-white text-[#002b49] rounded-lg p-1.5 flex items-center justify-center shadow-md shrink-0 border border-amber-400">
              <BookOpen className="w-7 h-7 text-[#002b49]" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold leading-tight">
                Северский технологический институт — филиал НИЯУ МИФИ
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight mt-0.5">
                Автоматизированная система мониторинга научных публикаций
              </h1>
              <div className="text-xs text-blue-200 mt-0.5 flex flex-wrap items-center gap-2">
                <span>АСУ «Наука» • Парсер eLibrary.ru</span>
                <span>•</span>
                <span>Интеграционный шлюз для ERP erp.ssti.ru</span>
              </div>
            </div>
          </div>

          {/* Top Control Bar / Admin Link */}
          <div className="flex items-center gap-2.5 self-end lg:self-center">
            {currentView === 'result' ? (
              <button
                onClick={handleBackToIndex}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded border border-white/20 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Вернуться к реестру</span>
              </button>
            ) : null}

            <button
              onClick={() => {
                handleBackToIndex();
                setActiveTab('admin');
              }}
              className={`text-xs px-3.5 py-1.5 rounded font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900/80 hover:bg-slate-900 text-amber-300 border-amber-500/50'
              }`}
            >
              {isAdminLoggedIn ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isAdminLoggedIn ? 'Панель администратора (Активна)' : 'Вход в панель администратора'}</span>
            </button>
          </div>
        </div>

        {/* Institutional Tabs Bar */}
        {currentView === 'index' && (
          <div className="max-w-7xl mx-auto px-4 border-t border-blue-900/80 pt-2 flex gap-1 overflow-x-auto text-xs sm:text-sm font-medium">
            <button
              onClick={() => setActiveTab('parser')}
              className={`px-4 py-2 rounded-t-md transition-all flex items-center gap-2 border-t-2 ${
                activeTab === 'parser'
                  ? 'bg-[#f1f5f9] text-[#002b49] font-bold border-amber-400 shadow-xs'
                  : 'text-blue-100 hover:bg-blue-900/50 border-transparent'
              }`}
            >
              <span>🔍 Ввод и парсинг публикации</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-t-md transition-all flex items-center gap-2 border-t-2 ${
                activeTab === 'catalog'
                  ? 'bg-[#f1f5f9] text-[#002b49] font-bold border-amber-400 shadow-xs'
                  : 'text-blue-100 hover:bg-blue-900/50 border-transparent'
              }`}
            >
              <span>📋 Реестр публикаций института ({papers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('erp-integration')}
              className={`px-4 py-2 rounded-t-md transition-all flex items-center gap-2 border-t-2 ${
                activeTab === 'erp-integration'
                  ? 'bg-[#f1f5f9] text-[#002b49] font-bold border-amber-400 shadow-xs'
                  : 'text-blue-100 hover:bg-blue-900/50 border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Шлюз ERP СТИ НИЯУ МИФИ</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-2 rounded-t-md transition-all flex items-center gap-2 border-t-2 ${
                activeTab === 'export'
                  ? 'bg-[#f1f5f9] text-[#002b49] font-bold border-amber-400 shadow-xs'
                  : 'text-blue-100 hover:bg-blue-900/50 border-transparent'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Экспорт отчетов (1С/CSV/ГОСТ)</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-t-md transition-all flex items-center gap-2 border-t-2 ${
                activeTab === 'admin'
                  ? 'bg-[#f1f5f9] text-[#002b49] font-bold border-amber-400 shadow-xs'
                  : 'text-amber-200 hover:bg-blue-900/50 border-transparent'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Администрирование и Proxmox / ВМ 100</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Body */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1">
        {/* Flash Notifications */}
        {messages.length > 0 && (
          <div className="space-y-2 mb-5">
            {messages.map((msg) => {
              const bgColors = {
                success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
                danger: 'bg-red-50 border-red-300 text-red-900',
                warning: 'bg-amber-50 border-amber-300 text-amber-900',
                info: 'bg-blue-50 border-blue-300 text-blue-900',
              };

              const icons = {
                success: <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />,
                danger: <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />,
                warning: <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />,
                info: <FileText className="w-5 h-5 shrink-0 text-blue-600" />,
              };

              return (
                <div
                  key={msg.id}
                  className={`flex items-center justify-between border rounded-md px-4 py-2.5 shadow-xs text-sm ${bgColors[msg.type]}`}
                >
                  <div className="flex items-center gap-2.5">
                    {icons[msg.type]}
                    <span className="font-medium">{msg.text}</span>
                  </div>
                  <button
                    onClick={() => removeMessage(msg.id)}
                    className="p-1 hover:opacity-75 focus:outline-none text-current cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* View Switch: Result View or Tabs */}
        {currentView === 'result' && selectedPaper ? (
          /* Official Scientific Paper Card */
          <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-[#002b49] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-amber-500">
              <div>
                <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                  Регистрационная карточка научной публикации
                </div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                  <span>№ {selectedPaper.paper_id}</span> • {selectedPaper.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedPaper.verified_by_admin ? (
                  <span className="bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded flex items-center gap-1 shadow-xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Верифицировано НИЧ</span>
                  </span>
                ) : (
                  <span className="bg-amber-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Требует верификации</span>
                  </span>
                )}
                {isAdminLoggedIn && (
                  <button
                    onClick={() => handleToggleVerify(selectedPaper.paper_id)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded border border-slate-600 cursor-pointer"
                  >
                    {selectedPaper.verified_by_admin ? 'Снять подтверждение' : 'Подтвердить НИЧ'}
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Badges Bar */}
              <div className="flex flex-wrap gap-2 items-center">
                {selectedPaper.affiliation_verified && (
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <span>Аффилиация: СТИ НИЯУ МИФИ (Северск)</span>
                  </span>
                )}
                {selectedPaper.indexing.in_vak && (
                  <span className="bg-red-100 text-red-900 border border-red-300 text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-red-700" />
                    <span>Перечень ВАК РФ</span>
                  </span>
                )}
                {selectedPaper.indexing.in_rsci_core && (
                  <span className="bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold px-2.5 py-1 rounded">
                    Ядро РИНЦ (RSCI)
                  </span>
                )}
                {selectedPaper.indexing.in_rsci && (
                  <span className="bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold px-2.5 py-1 rounded">
                    РИНЦ
                  </span>
                )}
                {selectedPaper.edn && (
                  <span className="bg-slate-100 text-slate-800 border border-slate-300 text-xs font-mono font-semibold px-2.5 py-1 rounded">
                    EDN: {selectedPaper.edn}
                  </span>
                )}
                {selectedPaper.doi && (
                  <span className="bg-slate-100 text-slate-800 border border-slate-300 text-xs font-mono px-2.5 py-1 rounded">
                    DOI: {selectedPaper.doi}
                  </span>
                )}
              </div>

              {/* Sub-tabs */}
              <div className="border-b border-slate-200 flex gap-4 text-sm font-semibold">
                <button
                  onClick={() => setDetailTab('info')}
                  className={`pb-2 transition-colors border-b-2 cursor-pointer ${
                    detailTab === 'info'
                      ? 'border-[#002b49] text-[#002b49]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Библиографические сведения
                </button>
                <button
                  onClick={() => setDetailTab('gost')}
                  className={`pb-2 transition-colors border-b-2 cursor-pointer ${
                    detailTab === 'gost'
                      ? 'border-[#002b49] text-[#002b49]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ГОСТ Р 7.0.100-2018 (Для отчета)
                </button>
                <button
                  onClick={() => setDetailTab('bibtex')}
                  className={`pb-2 transition-colors border-b-2 cursor-pointer ${
                    detailTab === 'bibtex'
                      ? 'border-[#002b49] text-[#002b49]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  BibTeX (LaTeX)
                </button>
                <button
                  onClick={() => setDetailTab('erp-json')}
                  className={`pb-2 transition-colors border-b-2 cursor-pointer ${
                    detailTab === 'erp-json'
                      ? 'border-[#002b49] text-[#002b49]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  JSON для erp.ssti.ru
                </button>
              </div>

              {detailTab === 'info' && (
                <div className="space-y-6">
                  {/* Official Table */}
                  <div className="border border-slate-300 rounded overflow-hidden text-sm">
                    <table className="w-full divide-y divide-slate-200">
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <th className="w-1/3 bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-700 border-r border-slate-200">
                            Наименование публикации:
                          </th>
                          <td className="px-4 py-2.5 text-slate-900 font-bold">
                            {selectedPaper.title}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-700 border-r border-slate-200">
                            Издание / Научный журнал:
                          </th>
                          <td className="px-4 py-2.5 text-slate-900 font-medium">
                            {selectedPaper.journal_name || 'Не указан'}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-700 border-r border-slate-200">
                            Год издания:
                          </th>
                          <td className="px-4 py-2.5 text-slate-900">
                            {selectedPaper.publication_year || 'Не указан'}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-700 border-r border-slate-200">
                            Том / Номер (выпуск):
                          </th>
                          <td className="px-4 py-2.5 text-slate-900">
                            {selectedPaper.volume ? `Том ${selectedPaper.volume}` : '—'}
                            {selectedPaper.issue ? `, № ${selectedPaper.issue}` : ''}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-700 border-r border-slate-200">
                            Диапазон страниц / Объем:
                          </th>
                          <td className="px-4 py-2.5 text-slate-900">
                            {selectedPaper.page_range ? `С. ${selectedPaper.page_range}` : ''}
                            {selectedPaper.pages_count ? ` (${selectedPaper.pages_count} с.)` : ''}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-700 border-r border-slate-200">
                            Место издания:
                          </th>
                          <td className="px-4 py-2.5 text-slate-900">
                            {selectedPaper.place_of_publication || 'Северск'}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-700 border-r border-slate-200">
                            Классификаторы УДК / ГРНТИ:
                          </th>
                          <td className="px-4 py-2.5 text-slate-900 font-mono text-xs">
                            {selectedPaper.udc ? `УДК ${selectedPaper.udc}` : 'УДК не указан'}
                            {selectedPaper.grnti ? ` • ГРНТИ ${selectedPaper.grnti}` : ''}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-700 border-r border-slate-200">
                            Ссылка на первоисточник eLibrary:
                          </th>
                          <td className="px-4 py-2.5 text-blue-700 font-mono text-xs break-all">
                            <a href={selectedPaper.url} target="_blank" rel="noreferrer" className="hover:underline">
                              {selectedPaper.url}
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Authors Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Авторский коллектив:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedPaper.authors.map((author) => (
                        <div
                          key={author.author_id}
                          className={`p-3 rounded border text-sm flex items-start justify-between gap-2 ${
                            author.is_ssti_mephi
                              ? 'bg-emerald-50/70 border-emerald-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{author.fullname}</span>
                              {author.is_ssti_mephi && (
                                <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.2 rounded font-normal">
                                  Штатный сотрудник СТИ
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                              {author.affiliation || 'Северский технологический институт'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Abstract */}
                  {selectedPaper.abstract_text && (
                    <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs">
                      <div className="font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Аннотация публикации:
                      </div>
                      <p className="text-slate-800 leading-relaxed">
                        {selectedPaper.abstract_text}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'gost' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      Библиографическая запись по национальному стандарту ГОСТ Р 7.0.100-2018:
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedPaper.gost_citation || '', 'gost-citation')}
                      className="bg-[#002b49] hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {copiedType === 'gost-citation' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === 'gost-citation' ? 'Скопировано!' : 'Скопировать для отчета'}</span>
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-300 rounded font-serif text-slate-900 leading-relaxed text-sm select-all">
                    {selectedPaper.gost_citation}
                  </div>
                </div>
              )}

              {detailTab === 'bibtex' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      Формат BibTeX для LaTeX-документов:
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedPaper.bibtex || '', 'bibtex')}
                      className="bg-[#002b49] hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {copiedType === 'bibtex' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === 'bibtex' ? 'Скопировано!' : 'Скопировать BibTeX'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-emerald-400 rounded text-xs font-mono overflow-x-auto select-all">
                    {selectedPaper.bibtex}
                  </pre>
                </div>
              )}

              {detailTab === 'erp-json' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      Спецификация JSON для передачи в модель Django ERP СТИ НИЯУ МИФИ:
                    </span>
                    <button
                      onClick={() => {
                        const payload = JSON.stringify({
                          title: selectedPaper.title,
                          authors: selectedPaper.authors.map(a => ({ fullname: a.fullname, is_ssti: a.is_ssti_mephi })),
                          journal: selectedPaper.journal_name,
                          year: selectedPaper.publication_year,
                          volume: selectedPaper.volume,
                          issue: selectedPaper.issue,
                          pages: selectedPaper.page_range,
                          doi: selectedPaper.doi,
                          edn: selectedPaper.edn,
                          is_vak: selectedPaper.indexing.in_vak,
                          is_rsci: selectedPaper.indexing.in_rsci,
                          is_rsci_core: selectedPaper.indexing.in_rsci_core,
                          gost_citation: selectedPaper.gost_citation,
                          url: selectedPaper.url,
                        }, null, 2);
                        copyToClipboard(payload, 'erp-json-single');
                      }}
                      className="bg-[#002b49] hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {copiedType === 'erp-json-single' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === 'erp-json-single' ? 'Скопировано!' : 'Скопировать JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-amber-300 rounded text-xs font-mono overflow-x-auto select-all">
                    {JSON.stringify({
                      title: selectedPaper.title,
                      authors: selectedPaper.authors.map(a => ({ fullname: a.fullname, is_ssti: a.is_ssti_mephi })),
                      journal: selectedPaper.journal_name,
                      year: selectedPaper.publication_year,
                      volume: selectedPaper.volume,
                      issue: selectedPaper.issue,
                      pages: selectedPaper.page_range,
                      doi: selectedPaper.doi,
                      edn: selectedPaper.edn,
                      is_vak: selectedPaper.indexing.in_vak,
                      is_rsci: selectedPaper.indexing.in_rsci,
                      is_rsci_core: selectedPaper.indexing.in_rsci_core,
                      gost_citation: selectedPaper.gost_citation,
                      url: selectedPaper.url,
                    }, null, 2)}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
                <a
                  href={selectedPaper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Открыть страницу eLibrary.ru</span>
                </a>
                <button
                  onClick={handleBackToIndex}
                  className="bg-slate-700 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Вернуться к реестру</span>
                </button>
                {isAdminLoggedIn && (
                  <button
                    onClick={() => handleDeletePaper(selectedPaper.paper_id)}
                    className="ml-auto text-red-600 hover:text-red-800 hover:bg-red-50 text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer border border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить из реестра</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Normal Tabbed Views */
          <div>
            {/* TAB: Parser */}
            {activeTab === 'parser' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-300 rounded-lg shadow-xs overflow-hidden">
                  <div className="bg-[#002b49] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-amber-500">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <span>🔍</span> Автоматизированный парсинг публикации eLibrary.ru
                      </h3>
                      <p className="text-xs text-blue-200 mt-0.5">
                        Извлечение метаданных, проверка индексации ВАК/РИНЦ, ГОСТ Р 7.0.100-2018 и аффилиации СТИ НИЯУ МИФИ
                      </p>
                    </div>
                    <div className="flex items-center bg-slate-900/60 rounded p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsBatchMode(false)}
                        className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                          !isBatchMode ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-300'
                        }`}
                      >
                        Одиночная ссылка
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsBatchMode(true)}
                        className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                          isBatchMode ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-300'
                        }`}
                      >
                        Пакетный список
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {!isBatchMode ? (
                        <div>
                          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                            URL-адрес публикации на портале eLibrary.ru:
                          </label>
                          <input
                            type="url"
                            required
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://www.elibrary.ru/item.asp?id=49451230"
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-700 focus:border-blue-700 outline-none font-mono"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Вставьте прямую ссылку на статью (например: <code className="bg-slate-100 text-blue-800 px-1 py-0.5 rounded">https://www.elibrary.ru/item.asp?id=...</code>)
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                            Список ссылок (по одной ссылке на строке):
                          </label>
                          <textarea
                            rows={4}
                            required
                            value={batchUrlsInput}
                            onChange={(e) => setBatchUrlsInput(e.target.value)}
                            placeholder="https://www.elibrary.ru/item.asp?id=49451230&#10;https://www.elibrary.ru/item.asp?id=47328911"
                            className="w-full p-3 border border-slate-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-700 outline-none"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Пакетная загрузка до 10 публикаций одновременно для заполнения отчета кафедры
                          </p>
                        </div>
                      )}

                      {/* Quick Sample Selector */}
                      {!isBatchMode && samplePapers.length > 0 && (
                        <div className="pt-1">
                          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Примеры публикаций кафедр СТИ НИЯУ МИФИ и атомной отрасли:</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {samplePapers.map((sample, idx) => (
                              <button
                                key={sample.url}
                                type="button"
                                onClick={() => setUrlInput(sample.url)}
                                className="text-xs bg-slate-50 hover:bg-blue-50/80 text-slate-800 p-2.5 rounded border border-slate-200 transition-colors text-left flex items-start gap-2 group cursor-pointer"
                              >
                                <span className="w-5 h-5 rounded bg-blue-100 text-blue-900 inline-flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900 group-hover:text-blue-800 transition-colors truncate">
                                    {sample.title}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                    <span>{sample.year} г.</span>
                                    {sample.is_ssti && (
                                      <span className="text-emerald-800 font-semibold bg-emerald-100 px-1 rounded text-[10px]">
                                        СТИ НИЯУ МИФИ
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Manual HTML Toggle */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowHtmlInput(!showHtmlInput)}
                          className="text-xs text-blue-800 hover:text-blue-900 flex items-center gap-1.5 font-medium cursor-pointer"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>
                            {showHtmlInput
                              ? 'Скрыть ручной ввод HTML разметки'
                              : 'Ручной ввод HTML кода страницы (при блокировке или капче eLibrary «Тест Тьюринга»)'}
                          </span>
                        </button>
                        {showHtmlInput && (
                          <div className="mt-2">
                            <textarea
                              rows={4}
                              value={rawHtmlInput}
                              onChange={(e) => setRawHtmlInput(e.target.value)}
                              placeholder="Вставьте исходный код страницы статьи (Ctrl+U в браузере)..."
                              className="w-full p-2.5 border border-slate-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-700 outline-none"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#002b49] hover:bg-slate-900 text-white font-semibold py-2.5 px-4 rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 text-sm border-b-2 border-amber-500"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Извлечение и валидация наукометрических данных...</span>
                          </>
                        ) : (
                          <>
                            <span>🚀</span>
                            <span>{isBatchMode ? 'Запустить пакетный парсинг списка' : 'Спарсить и зарегистрировать статью'}</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Institutional Info Badges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-800">
                  <div className="bg-white p-4 rounded border border-slate-300 shadow-2xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>СТИ НИЯУ МИФИ и СХК</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Автоматическая проверка принадлежности авторов к институту и профильным предприятиям Росатома.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded border border-slate-300 shadow-2xs">
                    <div className="flex items-center gap-2 text-red-800 font-bold text-sm mb-1">
                      <Award className="w-4 h-4" />
                      <span>Перечень ВАК и Ядро РИНЦ</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Верификация издания для эффективных контрактов преподавателей и отчетов по НИР.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded border border-slate-300 shadow-2xs">
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-1">
                      <FileText className="w-4 h-4" />
                      <span>ГОСТ Р 7.0.100-2018</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Формирование библиографических ссылок по государственному стандарту без ручного оформления.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Catalog */}
            {activeTab === 'catalog' && (
              <div className="bg-white border border-slate-300 rounded-lg shadow-xs overflow-hidden">
                <div className="bg-[#002b49] text-white px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-amber-500">
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <span>📋</span> Реестр научных публикаций СТИ НИЯУ МИФИ
                    </h3>
                    <p className="text-xs text-blue-200">
                      Всего записей: {filteredPapers.length} из {papers.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilterSstiOnly(!filterSstiOnly)}
                      className={`text-xs px-2.5 py-1 rounded font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        filterSstiOnly
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-600'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Только СТИ НИЯУ МИФИ</span>
                    </button>
                    <button
                      onClick={() => setFilterVakOnly(!filterVakOnly)}
                      className={`text-xs px-2.5 py-1 rounded font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        filterVakOnly
                          ? 'bg-red-600 text-white border-red-500'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-600'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Только ВАК</span>
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-slate-200 bg-slate-50">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск по названию статьи, автору, журналу, EDN или DOI..."
                      className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded text-xs sm:text-sm bg-white outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-200">
                  {filteredPapers.length > 0 ? (
                    filteredPapers.map((paper) => (
                      <div
                        key={paper.paper_id}
                        onClick={() => handleSelectPaper(paper)}
                        className="p-4 hover:bg-blue-50/60 cursor-pointer transition-colors flex items-start justify-between gap-4 group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            {paper.affiliation_verified && (
                              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-1.5 py-0.5 rounded">
                                СТИ НИЯУ МИФИ
                              </span>
                            )}
                            {paper.indexing.in_vak && (
                              <span className="bg-red-100 text-red-900 border border-red-300 font-bold px-1.5 py-0.5 rounded">
                                ВАК
                              </span>
                            )}
                            {paper.indexing.in_rsci_core && (
                              <span className="bg-purple-100 text-purple-900 border border-purple-300 font-bold px-1.5 py-0.5 rounded">
                                Ядро РИНЦ
                              </span>
                            )}
                            {paper.edn && (
                              <span className="bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded border border-slate-300">
                                EDN: {paper.edn}
                              </span>
                            )}
                            {paper.verified_by_admin && (
                              <span className="bg-blue-100 text-blue-900 font-medium px-1.5 py-0.5 rounded">
                                ✓ НИЧ
                              </span>
                            )}
                          </div>

                          <h4 className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-2 text-sm leading-snug">
                            {paper.title}
                          </h4>

                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-medium text-slate-800">
                              {paper.authors.map((a) => a.fullname).join(', ')}
                            </span>
                            <span>•</span>
                            <span className="italic">{paper.journal_name || paper.work_type}</span>
                            <span>•</span>
                            <span>{paper.publication_year || '—'} г.</span>
                            {paper.citations_count !== undefined && (
                              <>
                                <span>•</span>
                                <span className="text-blue-800 font-medium">
                                  Цитирований: {paper.citations_count}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {isAdminLoggedIn && (
                          <button
                            onClick={(e) => handleDeletePaper(paper.paper_id, e)}
                            className="text-slate-400 hover:text-red-700 p-1.5 transition-colors rounded hover:bg-red-50 cursor-pointer"
                            title="Удалить публикацию"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      Записи не найдены
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: ERP Integration */}
            {activeTab === 'erp-integration' && (
              <div className="bg-white border border-slate-300 rounded-lg shadow-xs p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-[#002b49] font-bold text-lg mb-1">
                    <ShieldCheck className="w-6 h-6 text-blue-700" />
                    <h3>Интеграция с порталом https://erp.ssti.ru/</h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    Регламент взаимодействия с информационной системой СТИ НИЯУ МИФИ для автоматического зачисления публикаций в рейтинг кафедр.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-300 rounded p-4 text-xs space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                    <span>🏛️</span> Архитектурные требования:
                  </div>
                  <p className="text-slate-700">
                    Портал <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold">erp.ssti.ru</code> построен на фреймворке Django. На форме ввода публикаций преподавателя добавляется кнопка «Заполнить по eLibrary», которая через AJAX вызывает данный сервис.
                  </p>
                </div>

                {/* API Specification */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900">
                    REST API эндпоинт для запросов из ERP:
                  </h4>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded text-xs font-mono space-y-2 overflow-x-auto">
                    <div className="text-emerald-400">POST http://192.168.125.66:8110/api/parse</div>
                    <div className="text-slate-400">Content-Type: application/json</div>
                    <div className="text-amber-300">
                      {`{\n  "url": "https://www.elibrary.ru/item.asp?id=49451230"\n}`}
                    </div>
                  </div>
                </div>

                {/* Python Client */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase">
                      Python-модуль для разработчиков erp.ssti.ru (ssti_erp_client.py):
                    </span>
                    <button
                      onClick={() => {
                        const code = `import requests

class SstiErpParserClient:
    def __init__(self, parser_api_url="http://192.168.125.66:8110"):
        self.api_url = parser_api_url.rstrip('/')

    def parse_url(self, elibrary_url: str):
        response = requests.post(
            f"{self.api_url}/api/parse",
            json={"url": elibrary_url},
            timeout=15
        )
        response.raise_for_status()
        return response.json().get("paper", {})`;
                        copyToClipboard(code, 'erp-py-client');
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded border border-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedType === 'erp-py-client' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Скопировать код</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-200 p-3.5 rounded text-xs font-mono overflow-x-auto leading-relaxed">
{`import requests

class SstiErpParserClient:
    def __init__(self, parser_api_url="http://192.168.125.66:8110"):
        self.api_url = parser_api_url.rstrip('/')

    def parse_url(self, elibrary_url: str):
        response = requests.post(
            f"{self.api_url}/api/parse",
            json={"url": elibrary_url},
            timeout=15
        )
        response.raise_for_status()
        return response.json().get("paper", {})`}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB: Export */}
            {activeTab === 'export' && (
              <div className="bg-white border border-slate-300 rounded-lg shadow-xs p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Download className="w-5 h-5 text-blue-800" />
                    <span>Выгрузка отчетных документов кафедр</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Экспорт массива публикаций в форматы университетского документооборота и 1С.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* CSV Export */}
                  <div className="border border-slate-300 rounded p-4 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <div className="w-9 h-9 rounded bg-emerald-700 text-white flex items-center justify-center font-bold text-xs mb-2">
                        1C
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">Таблица CSV для 1С / Excel</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Разделитель «;», кодировка UTF-8 с сигнатурой BOM. Подходит для импорта в 1С:Университет.
                      </p>
                    </div>
                    <a
                      href="/api/export/csv"
                      download="publications_ssti_1c.csv"
                      className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Скачать CSV для 1С</span>
                    </a>
                  </div>

                  {/* JSON Export */}
                  <div className="border border-slate-300 rounded p-4 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <div className="w-9 h-9 rounded bg-blue-800 text-white flex items-center justify-center font-bold text-xs mb-2">
                        JSON
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">JSON для erp.ssti.ru</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Структурированный пакет для интеграционного шлюза и автоматической загрузки через API.
                      </p>
                    </div>
                    <a
                      href="/api/export/erp-json"
                      download="erp_ssti_publications.json"
                      className="mt-4 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Скачать JSON для ERP</span>
                    </a>
                  </div>

                  {/* GOST Report */}
                  <div className="border border-slate-300 rounded p-4 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <div className="w-9 h-9 rounded bg-[#002b49] text-white flex items-center justify-center font-bold text-xs mb-2">
                        ГОСТ
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">Список трудов (ГОСТ)</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Форматированный нумерованный список по ГОСТ Р 7.0.100-2018 для вставки в годовой отчет кафедры.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const fullGost = papers
                          .map((p, idx) => `${idx + 1}. ${p.gost_citation || p.title}`)
                          .join('\n\n');
                        copyToClipboard(fullGost, 'all-gost');
                      }}
                      className="mt-4 bg-[#002b49] hover:bg-slate-900 text-white text-xs font-semibold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      {copiedType === 'all-gost' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === 'all-gost' ? 'Скопировано!' : 'Скопировать весь список'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ADMIN (АДМИНИСТРИРОВАНИЕ) */}
            {activeTab === 'admin' && (
              <div className="space-y-6">
                {!isAdminLoggedIn ? (
                  /* Admin Login Card */
                  <div className="max-w-md mx-auto bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-[#002b49] text-white p-5 border-b-2 border-amber-500 text-center">
                      <div className="w-12 h-12 bg-slate-900/80 rounded-full flex items-center justify-center mx-auto mb-2 text-amber-400 border border-amber-500/50">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold">Панель администратора АСУ «Наука»</h3>
                      <p className="text-xs text-blue-200 mt-1">
                        Северский технологический институт НИЯУ МИФИ
                      </p>
                    </div>

                    <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Имя пользователя:
                        </label>
                        <input
                          type="text"
                          required
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          placeholder="sherbina"
                          className="w-full px-3.5 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-700 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Пароль:
                        </label>
                        <input
                          type="password"
                          required
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-700 outline-none"
                        />
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600 flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                        <div>
                          <span>Учетные данные соответствуют параметрам виртуализации института (Proxmox VE / ВМ 100):</span>
                          <div className="font-mono mt-1 text-slate-800 font-semibold">
                            Логин: sherbina | Пароль: sherbina1
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#002b49] hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded text-sm transition-colors shadow-xs cursor-pointer border-b-2 border-amber-500"
                      >
                        Войти в систему администрирования
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Admin Logged-In Console */
                  <div className="bg-white border border-slate-300 rounded-lg shadow-xs overflow-hidden">
                    <div className="bg-[#002b49] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-amber-500">
                      <div>
                        <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                          Административный центр управления
                        </div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          <span>Администратор: {adminUsername} (НИЧ СТИ НИЯУ МИФИ)</span>
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          setIsAdminLoggedIn(false);
                          addMessage('info', 'Вы вышли из панели администратора');
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded border border-slate-600 cursor-pointer"
                      >
                        Завершить сеанс
                      </button>
                    </div>

                    {/* Admin Navigation */}
                    <div className="bg-slate-100 border-b border-slate-300 px-6 py-2 flex gap-2 overflow-x-auto text-xs font-semibold">
                      <button
                        onClick={() => setAdminTab('server')}
                        className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                          adminTab === 'server'
                            ? 'bg-[#002b49] text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        <Server className="w-3.5 h-3.5" />
                        <span>Серверная инфраструктура (Proxmox / ВМ 100)</span>
                      </button>
                      <button
                        onClick={() => setAdminTab('papers')}
                        className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                          adminTab === 'papers'
                            ? 'bg-[#002b49] text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Управление публикациями ({papers.length})</span>
                      </button>
                      <button
                        onClick={() => setAdminTab('authors')}
                        className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                          adminTab === 'authors'
                            ? 'bg-[#002b49] text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Кафедры и авторы ({authors.length})</span>
                      </button>
                      <button
                        onClick={() => setAdminTab('logs')}
                        className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                          adminTab === 'logs'
                            ? 'bg-[#002b49] text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Журнал обращений API ({apiLogs.length})</span>
                      </button>
                    </div>

                    <div className="p-6">
                      {/* ADMIN TAB: Server Infrastructure */}
                      {adminTab === 'server' && (
                        <div className="space-y-6">
                          <div className="border border-slate-300 rounded p-4 bg-slate-50">
                            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-3">
                              <Terminal className="w-4 h-4 text-blue-800" />
                              <span>Параметры окружения и виртуализации института</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              <div className="bg-white p-3 rounded border border-slate-200 space-y-1.5">
                                <div className="text-slate-500 font-sans font-bold">Среда виртуализации Proxmox VE:</div>
                                <div className="text-blue-900 font-bold">https://192.168.125.66:8006/</div>
                                <div className="text-slate-600 font-sans">
                                  Авторизация: <span className="font-mono font-bold text-slate-900">sherbina</span> (Proxmox VE auth server)
                                </div>
                              </div>

                              <div className="bg-white p-3 rounded border border-slate-200 space-y-1.5">
                                <div className="text-slate-500 font-sans font-bold">Виртуальная машина:</div>
                                <div className="text-emerald-800 font-bold">{serverInfo?.vm_os || 'ВМ 100 (Ubuntu Server)'}</div>
                                <div className="text-slate-600 font-sans">
                                  Консоль: Proxmox Web Console или SPICE (Virt Viewer .vv)
                                </div>
                              </div>

                              <div className="bg-white p-3 rounded border border-slate-200 space-y-1.5">
                                <div className="text-slate-500 font-sans font-bold">SSH подключение к ВМ:</div>
                                <div className="text-slate-900 font-bold bg-slate-100 p-1 rounded">
                                  ssh -p 22110 sherbina@192.168.125.66
                                </div>
                                <div className="text-slate-600 font-sans">
                                  Порт SSH: 22110 | Пользователь: sherbina
                                </div>
                              </div>

                              <div className="bg-white p-3 rounded border border-slate-200 space-y-1.5">
                                <div className="text-slate-500 font-sans font-bold">Публичный API-адрес для других сервисов:</div>
                                <div className="text-blue-900 font-bold bg-slate-100 p-1 rounded">
                                  http://192.168.125.66:8110
                                </div>
                                <div className="text-slate-600 font-sans">
                                  Внешний порт: 8110 (проброшен на внутренний порт приложения 3000)
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* OpenVPN Section */}
                          <div className="border border-blue-200 rounded p-4 bg-blue-50/70 text-xs text-slate-800 space-y-2">
                            <h4 className="font-bold text-blue-950 flex items-center gap-1.5 text-sm">
                              <span>🔒</span> Настройка подключения OpenVPN к сети СТИ НИЯУ МИФИ:
                            </h4>
                            <ol className="list-decimal list-inside space-y-1 text-slate-700">
                              <li>Установите клиент <strong>OpenVPN</strong> на рабочий компьютер.</li>
                              <li>Поместите файл конфигурации <strong>*.ovpn</strong> в каталог установки: <code className="bg-white px-1 py-0.5 rounded border border-blue-300">C:\Program Files\OpenVPN\config</code>.</li>
                              <li>Запустите OpenVPN GUI (появится значок монитора в системном трее Windows).</li>
                              <li>Нажмите правой кнопкой мыши по значку и выберите <strong>«Подключить»</strong> для связи с институтской сетью 192.168.125.0/24.</li>
                            </ol>
                          </div>

                          {/* Deployment Systemd script */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 uppercase">
                                Systemd сервис для автозапуска на ВМ 100 (/etc/systemd/system/elibrary.service):
                              </span>
                              <button
                                onClick={() => {
                                  const unit = `[Unit]
Description=eLibrary Scientific Parser for ERP SSTI
After=network.target

[Service]
Type=simple
User=sherbina
WorkingDirectory=/home/sherbina/elibrary-web
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target`;
                                  copyToClipboard(unit, 'systemd-unit');
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded border border-slate-300 flex items-center gap-1 cursor-pointer"
                              >
                                {copiedType === 'systemd-unit' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>Скопировать service</span>
                              </button>
                            </div>
                            <pre className="bg-slate-900 text-emerald-400 p-4 rounded text-xs font-mono overflow-x-auto leading-relaxed">
{`[Unit]
Description=eLibrary Scientific Parser for ERP SSTI
After=network.target

[Service]
Type=simple
User=sherbina
WorkingDirectory=/home/sherbina/elibrary-web
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target`}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* ADMIN TAB: Papers Management */}
                      {adminTab === 'papers' && (
                        <div className="space-y-4">
                          {editingPaper ? (
                            /* Paper Edit Modal/Card */
                            <div className="border border-blue-400 rounded p-4 bg-blue-50/40 space-y-3">
                              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-blue-800" />
                                <span>Редактирование статьи #{editingPaper.paper_id}</span>
                              </h4>
                              <div className="space-y-3 text-xs">
                                <div>
                                  <label className="font-bold block mb-1">Название:</label>
                                  <input
                                    type="text"
                                    value={editingPaper.title}
                                    onChange={(e) => setEditingPaper({ ...editingPaper, title: e.target.value })}
                                    className="w-full p-2 border border-slate-300 rounded bg-white text-sm"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="font-bold block mb-1">Журнал / Сборник:</label>
                                    <input
                                      type="text"
                                      value={editingPaper.journal_name || ''}
                                      onChange={(e) => setEditingPaper({ ...editingPaper, journal_name: e.target.value })}
                                      className="w-full p-2 border border-slate-300 rounded bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-bold block mb-1">Год издания:</label>
                                    <input
                                      type="number"
                                      value={editingPaper.publication_year || ''}
                                      onChange={(e) => setEditingPaper({ ...editingPaper, publication_year: parseInt(e.target.value, 10) || null })}
                                      className="w-full p-2 border border-slate-300 rounded bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-bold block mb-1">Страницы:</label>
                                    <input
                                      type="text"
                                      value={editingPaper.page_range || ''}
                                      onChange={(e) => setEditingPaper({ ...editingPaper, page_range: e.target.value })}
                                      className="w-full p-2 border border-slate-300 rounded bg-white"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="font-bold block mb-1">DOI:</label>
                                    <input
                                      type="text"
                                      value={editingPaper.doi || ''}
                                      onChange={(e) => setEditingPaper({ ...editingPaper, doi: e.target.value })}
                                      className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-bold block mb-1">EDN:</label>
                                    <input
                                      type="text"
                                      value={editingPaper.edn || ''}
                                      onChange={(e) => setEditingPaper({ ...editingPaper, edn: e.target.value })}
                                      className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-4 pt-1">
                                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                                    <input
                                      type="checkbox"
                                      checked={editingPaper.indexing?.in_vak || false}
                                      onChange={(e) => setEditingPaper({
                                        ...editingPaper,
                                        indexing: { ...editingPaper.indexing, in_vak: e.target.checked }
                                      })}
                                      className="rounded text-blue-600"
                                    />
                                    <span>Входит в Перечень ВАК</span>
                                  </label>
                                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                                    <input
                                      type="checkbox"
                                      checked={editingPaper.affiliation_verified || false}
                                      onChange={(e) => setEditingPaper({
                                        ...editingPaper,
                                        affiliation_verified: e.target.checked
                                      })}
                                      className="rounded text-emerald-600"
                                    />
                                    <span>Аффилиация СТИ НИЯУ МИФИ</span>
                                  </label>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={handleSaveEditedPaper}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-3 rounded flex items-center gap-1 cursor-pointer"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Сохранить изменения</span>
                                  </button>
                                  <button
                                    onClick={() => setEditingPaper(null)}
                                    className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold py-1.5 px-3 rounded cursor-pointer"
                                  >
                                    Отмена
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <div className="border border-slate-300 rounded overflow-hidden text-xs">
                            <table className="w-full divide-y divide-slate-200">
                              <thead className="bg-slate-100 font-bold text-slate-700">
                                <tr>
                                  <th className="px-3 py-2 text-left">ID</th>
                                  <th className="px-3 py-2 text-left">Название статьи</th>
                                  <th className="px-3 py-2 text-left">Год</th>
                                  <th className="px-3 py-2 text-left">ВАК / РИНЦ</th>
                                  <th className="px-3 py-2 text-left">Статус НИЧ</th>
                                  <th className="px-3 py-2 text-right">Действия</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {papers.map((p) => (
                                  <tr key={p.paper_id} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 font-mono font-bold">#{p.paper_id}</td>
                                    <td className="px-3 py-2 max-w-[280px] truncate font-medium text-slate-900">
                                      {p.title}
                                    </td>
                                    <td className="px-3 py-2">{p.publication_year || '—'}</td>
                                    <td className="px-3 py-2">
                                      {p.indexing?.in_vak ? (
                                        <span className="text-red-700 font-bold">ВАК</span>
                                      ) : (
                                        <span className="text-slate-500">РИНЦ</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2">
                                      {p.verified_by_admin ? (
                                        <span className="text-emerald-700 font-bold">✓ Подтверждено</span>
                                      ) : (
                                        <span className="text-amber-700">Ожидает</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right space-x-2">
                                      <button
                                        onClick={() => setEditingPaper(p)}
                                        className="text-blue-700 hover:underline font-bold cursor-pointer"
                                      >
                                        Правка
                                      </button>
                                      <button
                                        onClick={() => handleToggleVerify(p.paper_id)}
                                        className="text-slate-700 hover:underline cursor-pointer"
                                      >
                                        {p.verified_by_admin ? 'Снять' : 'Одобрить'}
                                      </button>
                                      <button
                                        onClick={() => handleDeletePaper(p.paper_id)}
                                        className="text-red-600 hover:underline cursor-pointer"
                                      >
                                        Удалить
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* ADMIN TAB: Authors & Departments */}
                      {adminTab === 'authors' && (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-600">
                            Реестр научных работников и кафедр СТИ НИЯУ МИФИ для сопоставления с авторами статей:
                          </p>
                          <div className="border border-slate-300 rounded overflow-hidden text-xs">
                            <table className="w-full divide-y divide-slate-200">
                              <thead className="bg-slate-100 font-bold text-slate-700">
                                <tr>
                                  <th className="px-3 py-2 text-left">ФИО Автора</th>
                                  <th className="px-3 py-2 text-left">Кафедра / Подразделение</th>
                                  <th className="px-3 py-2 text-left">Статус СТИ НИЯУ МИФИ</th>
                                  <th className="px-3 py-2 text-right">Действия</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {authors.map((author) => (
                                  <tr key={author.author_id} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 font-bold text-slate-900">{author.fullname}</td>
                                    <td className="px-3 py-2 text-slate-700">
                                      {author.department || (author.is_ssti_mephi ? 'Кафедра АПП' : 'Внешняя организация')}
                                    </td>
                                    <td className="px-3 py-2">
                                      {author.is_ssti_mephi ? (
                                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                                          Штатный сотрудник
                                        </span>
                                      ) : (
                                        <span className="text-slate-500">Внешний автор</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <button
                                        onClick={() => handleUpdateAuthor(author.author_id, { is_ssti_mephi: !author.is_ssti_mephi })}
                                        className="text-blue-700 hover:underline font-bold cursor-pointer"
                                      >
                                        {author.is_ssti_mephi ? 'Сделать внешним' : 'Привязать к СТИ'}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* ADMIN TAB: API Logs */}
                      {adminTab === 'logs' && (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-600">
                            Журнал обращений к REST API со стороны ERP erp.ssti.ru и внешних клиентов:
                          </p>
                          <div className="bg-slate-900 text-slate-100 p-4 rounded text-xs font-mono space-y-2 max-h-96 overflow-y-auto">
                            {apiLogs.map((log) => (
                              <div key={log.id} className="border-b border-slate-800 pb-1.5 flex items-start gap-2">
                                <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`font-bold ${log.method === 'POST' ? 'text-amber-400' : 'text-blue-400'}`}>
                                  {log.method}
                                </span>
                                <span className="text-emerald-400">{log.endpoint}</span>
                                <span className="text-slate-400">[{log.status}]</span>
                                <span className="text-slate-300 ml-auto">{log.details || ''}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Official Academic Footer */}
      <footer className="mt-auto py-5 bg-[#002b49] text-[#cbd5e1] border-t-2 border-amber-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-white uppercase tracking-wider">
              Северский технологический институт — филиал НИЯУ МИФИ
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Научно-исследовательская часть (НИЧ) • г. Северск, Томская область, Россия
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <a href="https://erp.ssti.ru/" target="_blank" rel="noreferrer" className="text-amber-300 hover:underline">
              Портал ERP: erp.ssti.ru
            </a>
            <span>•</span>
            <a href="https://192.168.125.66:8006/" target="_blank" rel="noreferrer" className="text-blue-300 hover:underline">
              Proxmox VE (192.168.125.66:8006)
            </a>
            <span>•</span>
            <button
              onClick={() => {
                handleBackToIndex();
                setActiveTab('admin');
              }}
              className="text-amber-400 hover:underline cursor-pointer font-bold"
            >
              🔒 Вход в админку
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
