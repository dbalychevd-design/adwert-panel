import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Tag,
  CornerUpLeft,
  CornerUpRight,
  Languages,
  MoreVertical,
  Maximize2,
  Send,
  Clock,
  CheckSquare,
  Paperclip,
  Image as ImageIcon,
  Link as LinkIcon,
  Smile,
  Sparkles,
  List,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Archive,
  Activity,
  Mail,
  SlidersHorizontal,
  Moon,
  Sun,
  BarChart3,
  Bot,
  Inbox as InboxIcon,
  Plus,
  Upload,
  Check,
  AlertCircle,
  Users,
  Target,
  Info,
  ArrowLeft,
  Play,
  Pause,
  Shield,
  Cpu,
  Zap,
  FileText,
  CheckCircle2,
  Lock,
  RotateCcw,
  Edit3,
  Sliders,
  Eye,
  EyeOff,
  ExternalLink,
  Layers,
  HelpCircle,
  MessageSquare,
  ListFilter
} from 'lucide-react';
import { QuoteNode, MailMessage, Chat, Campaign } from './types';
import { INITIAL_CHATS, INITIAL_CAMPAIGNS, MOCK_ACTIVITIES } from './data/mockData';
import { I18N } from './i18n/translations';
import { AnimatedNumber } from './components/AnimatedNumber';
import { SafeTextFormatter } from './components/SafeTextFormatter';
import { QuoteNodeItem } from './components/QuoteNodeItem';
import { AutomodeWorkspace } from './components/AutomodeWorkspace';

export default function App() {
  // Navigation State
  const [activePage, setActivePage] = useState<'inbox' | 'stats' | 'ai' | 'activity' | 'settings'>('inbox');
  const [activeNav, setActiveNav] = useState<'inbox' | 'overview' | 'campaigns' | 'automode' | 'templates' | 'rules' | 'stats' | 'settings'>('inbox');

  // Inbox & Conversation State
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string>('1');
  const [activeCategory, setActiveCategory] = useState<'all' | 'hot' | 'warm' | 'archive'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingThread, setIsLoadingThread] = useState<boolean>(false);
  const [isMobileConversation, setIsMobileConversation] = useState<boolean>(false);

  // Hidden Composer State: CLOSED by default (`null`)
  const [composerOpenChatId, setComposerOpenChatId] = useState<string | null>(null);

  // Per-chat local interaction state
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, Record<string, boolean>>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [dismissedAI, setDismissedAI] = useState<Record<string, boolean>>({});
  const [translatedChats, setTranslatedChats] = useState<Record<string, boolean>>({});
  const [isComposerMaximized, setIsComposerMaximized] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Wallpaper State (Frontend mock)
  const [conversationWallpaperUrl, setConversationWallpaperUrl] = useState<string | null>(null);
  const [conversationWallpaperOpacity, setConversationWallpaperOpacity] = useState<number>(0.08);

  // Viewport Size Tracking for Widescreen-Only Wallpaper Rendering (1366x760+)
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900
  });

  // Global theme and language
  const [lang, setLang] = useState<'en' | 'ru'>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('marshall_theme') as 'dark' | 'light') || 'dark';
  });

  // Campaigns & Analytics State
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState<boolean>(false);
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'active' | 'attention' | 'draft'>('all');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'replied' | 'qualified' | 'booked'>('all');
  const [isInsightDismissed, setIsInsightDismissed] = useState<boolean>(false);

  // New Campaign Form State
  const [newCampName, setNewCampName] = useState<string>('');
  const [newCampMailbox, setNewCampMailbox] = useState<string>('alexey@marshall.io');
  const [newCampDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newCampSendingState, setNewCampSendingState] = useState<'draft' | 'sent'>('draft');
  const [parsedImport, setParsedImport] = useState<{
    valid: string[];
    duplicates: number;
    invalid: number;
    totalLines: number;
  } | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [fileParseError, setFileParseError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const conversationFileInputRef = useRef<HTMLInputElement>(null);
  const mailsFileInputRef = useRef<HTMLInputElement>(null);

  const t = I18N[lang];

  // Mails.txt Local Parser Function
  const parseMailsText = (text: string) => {
    const lines = text.split(/\r?\n/);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seen = new Set<string>();
    const valid: string[] = [];
    let duplicates = 0;
    let invalid = 0;
    let totalLines = 0;

    for (const raw of lines) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      totalLines++;
      const normalized = trimmed.toLowerCase();
      if (emailRegex.test(normalized)) {
        if (seen.has(normalized)) {
          duplicates++;
        } else {
          seen.add(normalized);
          valid.push(normalized);
        }
      } else {
        invalid++;
      }
    }

    return { valid, duplicates, invalid, totalLines };
  };

  const handleFileProcess = (file: File) => {
    setFileParseError(null);
    if (!file.name.toLowerCase().endsWith('.txt') && file.type && !file.type.includes('text')) {
      setFileParseError('Please upload a .txt file (e.g. mails.txt)');
      return;
    }
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (typeof content === 'string') {
        const parsed = parseMailsText(content);
        setParsedImport(parsed);
        if (parsed.valid.length === 0) {
          setFileParseError(t.noValidEmails);
        }
      }
    };
    reader.onerror = () => {
      setFileParseError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleCreateCampaign = () => {
    if (!newCampName.trim() || !parsedImport || parsedImport.valid.length === 0) {
      return;
    }
    const isSent = newCampSendingState === 'sent';
    const validCount = parsedImport.valid.length;
    
    const dateObj = newCampDate ? new Date(newCampDate) : new Date();
    const formattedDate = dateObj.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const created: Campaign = {
      id: `camp-${Date.now()}`,
      name: newCampName.trim(),
      mailboxLabel: newCampMailbox,
      createdAt: formattedDate,
      status: isSent ? 'active' : 'draft',
      imported: validCount,
      sent: isSent ? validCount : 0,
      replied: 0,
      qualified: 0,
      booked: 0,
      recipients: parsedImport.valid.map((email) => ({
        email,
        status: isSent ? 'sent' : 'pending'
      }))
    };

    setCampaigns((prev) => [created, ...prev]);
    setSelectedCampaignId(created.id);
    setIsNewCampaignModalOpen(false);

    // Reset Modal Form
    setNewCampName('');
    setNewCampMailbox('alexey@marshall.io');
    setNewCampSendingState('draft');
    setParsedImport(null);
    setImportFileName(null);
    setFileParseError(null);

    showToast(t.campaignCreated);
  };

  const handleToggleCampaignStatus = (campId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campId) return c;
        if (c.status === 'active') return { ...c, status: 'paused' };
        if (c.status === 'paused') return { ...c, status: 'active' };
        if (c.status === 'draft') {
          return {
            ...c,
            status: 'active',
            sent: c.imported,
            recipients: c.recipients.map((r) => ({ ...r, status: 'sent' }))
          };
        }
        return c;
      })
    );
    showToast('Campaign status updated');
  };

  // Aggregated Campaign Metrics
  const totalSent = campaigns.reduce((acc, c) => acc + c.sent, 0);
  const totalImported = campaigns.reduce((acc, c) => acc + c.imported, 0);
  const totalReplied = campaigns.reduce((acc, c) => acc + c.replied, 0);
  const totalQualified = campaigns.reduce((acc, c) => acc + c.qualified, 0);
  const totalBooked = campaigns.reduce((acc, c) => acc + c.booked, 0);
  const aggregateReplyRateNum = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;
  const aggregateReplyRateStr = totalSent > 0 ? `${aggregateReplyRateNum.toFixed(1)}%` : '—';
  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) || null;

  // Best conversion campaign identification
  const sentCampaigns = useMemo(() => campaigns.filter((c) => c.sent > 0), [campaigns]);
  const bestPerformingCampaign = useMemo(() => {
    if (sentCampaigns.length === 0) return null;
    let best: Campaign | null = null;
    let bestRate = -1;
    for (const c of sentCampaigns) {
      const rate = c.sent > 0 ? c.replied / c.sent : 0;
      if (rate > bestRate) {
        bestRate = rate;
        best = c;
      }
    }
    return best;
  }, [sentCampaigns]);

  const bestCampaignId = useMemo(() => {
    if (sentCampaigns.length < 2) return null;
    let bestId: string | null = null;
    let bestRate = -1;
    for (const c of sentCampaigns) {
      const rate = c.replied / c.sent;
      if (rate > bestRate && c.replied > 0) {
        bestRate = rate;
        bestId = c.id;
      }
    }
    return bestId;
  }, [sentCampaigns]);

  // Attention state for Overview
  const unreadCount = useMemo(() => chats.filter((c) => c.unread).length, [chats]);
  const attentionChats = useMemo(() => chats.filter((c) => c.unread), [chats]);
  const attentionCampaigns = useMemo(() => {
    const avgRate = totalSent > 0 ? totalReplied / totalSent : 0;
    return campaigns.filter((c) => c.sent > 0 && (c.replied / c.sent) < avgRate);
  }, [campaigns, totalSent, totalReplied]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    if (campaignFilter === 'active') {
      return campaigns.filter((c) => c.status === 'active');
    }
    if (campaignFilter === 'draft') {
      return campaigns.filter((c) => c.status === 'draft');
    }
    if (campaignFilter === 'attention') {
      const avgRate = totalSent > 0 ? totalReplied / totalSent : 0;
      return campaigns.filter((c) => c.sent > 0 && (c.replied / c.sent) < avgRate);
    }
    return campaigns;
  }, [campaigns, campaignFilter, totalSent, totalReplied]);

  // Lowest transition calculation for selected campaign
  const lowestTransition = useMemo(() => {
    if (!selectedCampaign) return null;
    const stages: { from: string; to: string; ratio: number }[] = [];

    if (selectedCampaign.imported > 0 && selectedCampaign.sent > 0) {
      stages.push({
        from: t.stageImported,
        to: t.stageSent,
        ratio: (selectedCampaign.sent / selectedCampaign.imported) * 100
      });
    }
    if (selectedCampaign.sent > 0) {
      stages.push({
        from: t.stageSent,
        to: t.stageReplied,
        ratio: (selectedCampaign.replied / selectedCampaign.sent) * 100
      });
    }
    if (selectedCampaign.replied > 0) {
      stages.push({
        from: t.stageReplied,
        to: t.stageQualified,
        ratio: (selectedCampaign.qualified / selectedCampaign.replied) * 100
      });
    }
    if (selectedCampaign.qualified > 0) {
      stages.push({
        from: t.stageQualified,
        to: t.stageBooked,
        ratio: (selectedCampaign.booked / selectedCampaign.qualified) * 100
      });
    }

    if (stages.length === 0) return null;
    let lowest = stages[0];
    for (let i = 1; i < stages.length; i++) {
      if (stages[i].ratio < lowest.ratio) {
        lowest = stages[i];
      }
    }
    return lowest;
  }, [selectedCampaign, t]);

  // Filtered recipients for selected campaign
  const filteredRecipients = useMemo(() => {
    if (!selectedCampaign) return [];
    if (recipientFilter === 'replied') {
      return selectedCampaign.recipients.filter((r) => r.status === 'replied' || r.status === 'qualified' || r.status === 'booked');
    }
    if (recipientFilter === 'qualified') {
      return selectedCampaign.recipients.filter((r) => r.status === 'qualified' || r.status === 'booked');
    }
    if (recipientFilter === 'booked') {
      return selectedCampaign.recipients.filter((r) => r.status === 'booked');
    }
    return selectedCampaign.recipients;
  }, [selectedCampaign, recipientFilter]);

  // Viewport resize listener
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K -> Focus Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (activePage !== 'inbox') {
          setActivePage('inbox');
          setActiveNav('inbox');
        }
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      // Escape -> Close Dropdowns
      if (e.key === 'Escape') {
        setIsMoreMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePage]);

  // Focus textarea when composer opens
  useEffect(() => {
    if (composerOpenChatId === activeChatId) {
      const timer = setTimeout(() => {
        composerTextareaRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [composerOpenChatId, activeChatId]);

  // Close more menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreMenuOpen]);

  // Persist Theme in HTML attribute
  useEffect(() => {
    localStorage.setItem('marshall_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Active Chat Object
  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  // Chat Switching Handler
  const handleSelectChat = (chatId: string) => {
    if (chatId === activeChatId) {
      setIsMobileConversation(true);
      return;
    }

    // Mark as read immediately in state
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unread: false } : c))
    );

    setActiveChatId(chatId);
    setComposerOpenChatId(null); // Close composer when switching chats
    setIsMobileConversation(true);
    setIsMoreMenuOpen(false);

    // Short loading transition (140-180ms)
    setIsLoadingThread(true);
    setTimeout(() => {
      setIsLoadingThread(false);
    }, 160);
  };

  // Open composer for active chat
  const handleOpenComposer = () => {
    setComposerOpenChatId(activeChatId);
  };

  // Toggle Quote Node in Recursive Tree
  const handleToggleQuoteNode = (quoteId: string) => {
    setExpandedQuotes((prev) => {
      const currentChatQuotes = prev[activeChatId] || {};
      return {
        ...prev,
        [activeChatId]: {
          ...currentChatQuotes,
          [quoteId]: !currentChatQuotes[quoteId]
        }
      };
    });
  };

  // Composer Draft Change Handler
  const handleDraftChange = (value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [activeChatId]: value
    }));
  };

  // Send Reply Handler
  const handleSendReply = () => {
    const draftText = (drafts[activeChatId] || '').trim();
    if (!draftText) {
      showToast('Please type a reply before sending');
      return;
    }

    const newMessage: MailMessage = {
      id: `m-${Date.now()}`,
      sender: 'outreach',
      name: 'Alexey Marshall (You)',
      to: `${activeChat.leadName} <${activeChat.email}>`,
      time: 'Just now',
      subject: activeChat.subject,
      text: draftText
    };

    // Add previous newest message into quote tree
    const currentTopMessage = activeChat.messages[activeChat.messages.length - 1];
    const newQuoteNode: QuoteNode = {
      id: `q-sent-${Date.now()}`,
      from: currentTopMessage.name,
      email: currentTopMessage.sender === 'lead' ? activeChat.email : 'alexey@marshall.io',
      date: currentTopMessage.time,
      preview: currentTopMessage.text.substring(0, 90) + '...',
      body: currentTopMessage.text,
      children: activeChat.quotes
    };

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messageCount: c.messageCount + 1,
            messages: [newMessage],
            quotes: [newQuoteNode]
          };
        }
        return c;
      })
    );

    // Clear Draft and Close Composer
    setDrafts((prev) => ({
      ...prev,
      [activeChatId]: ''
    }));
    setComposerOpenChatId(null);

    showToast(t.replySent);
  };

  // Discard Composer
  const handleDiscardComposer = () => {
    setDrafts((prev) => ({
      ...prev,
      [activeChatId]: ''
    }));
    setComposerOpenChatId(null);
    showToast('Draft discarded');
  };

  // AI Suggestion Actions
  const handleReviewAIDraft = () => {
    if (activeChat.aiSuggestion) {
      handleDraftChange(activeChat.aiSuggestion.draft);
      setComposerOpenChatId(activeChatId);
    }
  };

  const handleDismissAIStrip = () => {
    setDismissedAI((prev) => ({
      ...prev,
      [activeChatId]: true
    }));
  };

  // Archive Chat Action
  const handleArchiveChat = () => {
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, category: 'archive' } : c))
    );
    setIsMoreMenuOpen(false);
    showToast(t.archivedChat);
  };

  // Copy Email Action
  const handleCopyEmail = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(activeChat.email);
      }
      showToast(`${t.emailCopied}: ${activeChat.email}`);
    } catch {
      showToast(`${activeChat.email}`);
    }
    setIsMoreMenuOpen(false);
  };

  // Wallpaper Upload Handler (Frontend Object URL only)
  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (conversationWallpaperUrl) {
        URL.revokeObjectURL(conversationWallpaperUrl);
      }
      const url = URL.createObjectURL(file);
      setConversationWallpaperUrl(url);
      showToast('Conversation background updated');
    }
  };

  const handleRemoveWallpaper = () => {
    if (conversationWallpaperUrl) {
      URL.revokeObjectURL(conversationWallpaperUrl);
      setConversationWallpaperUrl(null);
      showToast('Conversation background removed');
    }
  };

  // Filtered Chats
  const filteredChats = chats.filter((chat) => {
    if (activeCategory !== 'all' && chat.category !== activeCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = chat.leadName.toLowerCase().includes(q);
      const matchEmail = chat.email.toLowerCase().includes(q);
      const matchSubject = chat.subject.toLowerCase().includes(q);
      const matchCompany = (chat.companyTitle || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchSubject || matchCompany;
    }
    return true;
  });

  const activeChatQuotesMap = expandedQuotes[activeChatId] || {};
  const currentDraft = drafts[activeChatId] || '';
  const isAIVisible = activeChat.aiSuggestion && !dismissedAI[activeChatId];
  const isTranslated = !!translatedChats[activeChatId];
  const isComposerOpen = composerOpenChatId === activeChatId;

  // Active top-level message
  const topMessage = activeChat.messages[activeChat.messages.length - 1];

  // Translation text
  const displayMessageText =
    isTranslated && activeChat.id === '2'
      ? 'Здравствуйте, Алексей! Пожалуйста, пришлите подробную информацию о тарифах и кейсы для тарифа Enterprise. Сейчас мы оцениваем 3 инструмента. Свяжитесь со мной по адресу s.jenkins@apexcloud.co или забронируйте встречу на https://cal.com/apex-team.'
      : topMessage.text;

  // Widescreen wallpaper visibility condition
  const isWidescreen = viewportSize.width >= 1366 && viewportSize.height >= 760;
  const showWallpaperCard = Boolean(conversationWallpaperUrl) && isWidescreen && activePage === 'inbox';

  return (
    <div className={`desktop-shell ${isMobileConversation ? 'mobile-view-chat' : ''}`}>
      {/* Hidden Native File Input for Background Upload */}
      <input
        ref={conversationFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleWallpaperUpload}
        className="hidden"
      />

      {/* ===================================================================== */}
      {/* 1. LINEAR-INSPIRED WIDE TEXT SIDEBAR (248px)                          */}
      {/* ===================================================================== */}
      <aside className="app-sidebar">
        {/* Top Window Rhythm (Decorative Circles: Red, Amber, Green) */}
        <div className="sidebar-dots-header" aria-hidden="true">
          <span className="sidebar-dot sidebar-dot-red" />
          <span className="sidebar-dot sidebar-dot-amber" />
          <span className="sidebar-dot sidebar-dot-green" />
        </div>

        {/* Brand Row */}
        <div className="sidebar-brand-row">
          <div className="sidebar-brand-mark">M</div>
          <span className="sidebar-brand-title">MARSHALL</span>
        </div>

        {/* Compact Search Launcher */}
        <button
          type="button"
          onClick={() => {
            if (activePage !== 'inbox') {
              setActivePage('inbox');
              setActiveNav('inbox');
            }
            setTimeout(() => searchInputRef.current?.focus(), 60);
          }}
          className="sidebar-search-launcher"
          title={`${t.searchLauncher} (⌘K)`}
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>{t.searchLauncher}</span>
          </div>
          <kbd className="sidebar-kbd-hint">{t.searchHint}</kbd>
        </button>

        {/* Navigation Items in Structured Groups */}
        <div className="sidebar-scroll-area">
          {/* WORKSPACE */}
          <div className="sidebar-group">
            <div className="sidebar-group-label">{t.groupWorkspace}</div>

            <button
              type="button"
              onClick={() => {
                setActivePage('inbox');
                setActiveNav('inbox');
              }}
              className={`sidebar-nav-item ${activeNav === 'inbox' && activePage === 'inbox' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <InboxIcon className="sidebar-nav-icon" />
                <span className="truncate">{t.navInbox}</span>
              </div>
              {unreadCount > 0 && (
                <span className="sidebar-badge-count">{unreadCount}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePage('activity');
                setActiveNav('overview');
              }}
              className={`sidebar-nav-item ${activeNav === 'overview' && activePage === 'activity' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Layers className="sidebar-nav-icon" />
                <span className="truncate">{t.navOverview}</span>
              </div>
            </button>
          </div>

          {/* OPERATIONS */}
          <div className="sidebar-group">
            <div className="sidebar-group-label">{t.groupOperations}</div>

            <button
              type="button"
              onClick={() => {
                setActivePage('stats');
                setActiveNav('campaigns');
              }}
              className={`sidebar-nav-item ${activeNav === 'campaigns' && activePage === 'stats' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Target className="sidebar-nav-icon" />
                <span className="truncate">{t.navCampaigns}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePage('ai');
                setActiveNav('automode');
              }}
              className={`sidebar-nav-item ${activeNav === 'automode' && activePage === 'ai' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Bot className="sidebar-nav-icon" />
                <span className="truncate">{t.navAutomode}</span>
              </div>
            </button>
          </div>

          {/* LIBRARY */}
          <div className="sidebar-group">
            <div className="sidebar-group-label">{t.groupLibrary}</div>

            <button
              type="button"
              onClick={() => {
                setActivePage('ai');
                setActiveNav('templates');
              }}
              className={`sidebar-nav-item ${activeNav === 'templates' && activePage === 'ai' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <FileText className="sidebar-nav-icon" />
                <span className="truncate">{t.navTemplates}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePage('ai');
                setActiveNav('rules');
              }}
              className={`sidebar-nav-item ${activeNav === 'rules' && activePage === 'ai' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Sliders className="sidebar-nav-icon" />
                <span className="truncate">{t.navRules}</span>
              </div>
            </button>
          </div>

          {/* INSIGHTS */}
          <div className="sidebar-group">
            <div className="sidebar-group-label">{t.groupInsights}</div>

            <button
              type="button"
              onClick={() => {
                setActivePage('stats');
                setActiveNav('stats');
              }}
              className={`sidebar-nav-item ${activeNav === 'stats' && activePage === 'stats' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <BarChart3 className="sidebar-nav-icon" />
                <span className="truncate">{t.navStatistics}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Separated Bottom Area */}
        <div className="sidebar-footer">
          {/* Settings Nav Item */}
          <button
            type="button"
            onClick={() => {
              setActivePage('settings');
              setActiveNav('settings');
            }}
            className={`sidebar-nav-item ${activeNav === 'settings' && activePage === 'settings' ? 'active' : ''}`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <SlidersHorizontal className="sidebar-nav-icon" />
              <span className="truncate">{t.navSettings}</span>
            </div>
          </button>

          {/* Truthful Automode Status */}
          <div className="sidebar-status-indicator" title="Local preview state">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span className="truncate">{t.automodeDraftStatus}</span>
          </div>

          {/* User Row & Mode Switches */}
          <div className="sidebar-user-row">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 rounded-full bg-zinc-700 dark:bg-zinc-800 text-zinc-100 dark:text-zinc-200 flex items-center justify-center text-[10px] font-semibold select-none border border-black/10 dark:border-white/10 flex-shrink-0"
                title="Alexey Marshall (You)"
              >
                AM
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-[var(--ds-sidebar-text)] truncate">Alexey</span>
                <span className="text-[10px] text-[var(--ds-sidebar-text-muted)] truncate">{t.userProfileRole}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-mono font-bold text-[var(--ds-sidebar-text-muted)] hover:text-[var(--ds-sidebar-text)] hover:bg-[var(--ds-sidebar-item-hover)] transition-colors cursor-pointer"
                title={t.langToggle}
              >
                {lang.toUpperCase()}
              </button>

              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--ds-sidebar-text-muted)] hover:text-[var(--ds-sidebar-text)] hover:bg-[var(--ds-sidebar-item-hover)] transition-colors cursor-pointer"
                title={t.themeToggle}
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* 2. MAIN WORKSPACE WITH THIN TOP CHROME                                 */}
      {/* ===================================================================== */}
      <div className="main-workspace-shell">
        <header className="workspace-top-chrome">
          <div className="flex items-center gap-2 min-w-0">
            <span className="workspace-view-title">
              {activePage === 'inbox'
                ? t.navInbox
                : activePage === 'activity'
                ? t.navOverview
                : activePage === 'stats'
                ? activeNav === 'stats'
                  ? t.navStatistics
                  : t.navCampaigns
                : activePage === 'ai'
                ? activeNav === 'templates'
                  ? t.navTemplates
                  : activeNav === 'rules'
                  ? t.navRules
                  : t.navAutomode
                : t.navSettings}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--ds-sidebar-text-muted)]">
              {t.version}
            </span>
          </div>
        </header>

        <div className="workspace-content-body">
      {/* ===================================================================== */}
      {/* 2.1 INBOX WORKSPACE (Middle Inbox Panel + Right Conversation Panel)   */}
      {/* ===================================================================== */}
      {activePage === 'inbox' && (
        <>
          {/* ----------------------------------------------------------------- */}
          {/* 2.1 MIDDLE ROUNDED INBOX PANEL                                    */}
          {/* ----------------------------------------------------------------- */}
          <section className="inbox-panel apple-panel">
            <div className="inbox-panel-inner">
              {/* Inbox Top Bar: Title, Total, Sync & Filter Tabs */}
              <div
                className="p-3 pb-2 flex flex-col gap-2.5 border-b"
                style={{
                  backgroundColor: 'var(--mb-header)',
                  borderColor: 'var(--mb-rule)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h1 className="text-[15px] font-semibold" style={{ color: 'var(--apple-text)' }}>
                      {t.inbox}
                    </h1>
                    <span className="text-xs font-normal" style={{ color: 'var(--apple-muted)' }}>
                      {chats.length} {t.total}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('Mailbox updated')}
                    className="w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer"
                    style={{
                      backgroundColor: 'var(--ctrl-tile-bg)',
                      color: 'var(--ctrl-tile-color)',
                      border: '1px solid var(--ctrl-tile-border)'
                    }}
                    title="Refresh inbox"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                {/* Filter Tabs: All / Hot / Warm / Archive with colored dots */}
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: 'all', label: t.all, dot: '#34C759' },
                      { id: 'hot', label: t.hot, dot: '#FF9F0A' },
                      { id: 'warm', label: t.warm, dot: '#FFD60A' },
                      { id: 'archive', label: t.archive, dot: '#8E8E93' }
                    ] as const
                  ).map((tab) => {
                    const isActive = activeCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveCategory(tab.id)}
                        className="flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        style={{
                          backgroundColor: isActive ? 'var(--ctrl-tab-active-bg)' : 'var(--ctrl-tab-bg)',
                          color: isActive ? 'var(--ctrl-tab-active-text)' : 'var(--ctrl-tab-text)',
                          border: `1px solid ${isActive ? 'var(--ctrl-tab-active-border)' : 'var(--ctrl-tab-border)'}`
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-none"
                          style={{ backgroundColor: tab.dot }}
                        />
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Input with high contrast milk/white tokens */}
                <div
                  className="relative w-full rounded-md flex items-center transition-all shadow-xs"
                  style={{
                    backgroundColor: 'var(--ctrl-search-bg)',
                    border: '1px solid var(--ctrl-search-border)'
                  }}
                >
                  <Search
                    className="absolute left-2.5 pointer-events-none w-3.5 h-3.5"
                    style={{ color: 'var(--ctrl-search-icon)' }}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-8 pr-7 py-1.5 text-[13px] bg-transparent rounded-md focus:outline-none transition-all placeholder-[var(--ctrl-search-placeholder)]"
                    style={{
                      color: 'var(--ctrl-search-text)'
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Chat List Items */}
              <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--mb-sidebar)' }}>
                {filteredChats.length === 0 ? (
                  <div className="p-6 text-center text-xs" style={{ color: 'var(--mb-muted)' }}>
                    No conversations found
                  </div>
                ) : (
                  filteredChats.map((chat) => {
                    const isSelected = chat.id === activeChatId;
                    const isLeadAvatar = chat.messages[0]?.sender === 'lead';

                    return (
                      <div
                        key={chat.id}
                        onClick={() => handleSelectChat(chat.id)}
                        className={`chat-row ${chat.unread ? 'is-unread' : ''} ${isSelected ? 'is-selected' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar: circular initials */}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-none select-none ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : isLeadAvatar
                                ? 'bg-blue-500/15 text-[#007aff] dark:bg-[#2a3a4a] dark:text-[#7bb7ee]'
                                : 'bg-emerald-500/15 text-emerald-600 dark:bg-[#283828] dark:text-[#85cb6f]'
                            }`}
                          >
                            {chat.initials}
                          </div>

                          {/* Text Metadata */}
                          <div className="flex-1 min-w-0">
                            {/* Line 1: Lead name, `, you`, count (N), date */}
                            <div className="flex items-baseline justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 truncate">
                                {chat.unread && (
                                  <span
                                    className="w-2 h-2 rounded-full flex-none"
                                    style={{
                                      backgroundColor: isSelected ? '#ffffff' : 'var(--mb-unread-dot)'
                                    }}
                                  />
                                )}
                                <span
                                  className={`text-sm truncate ${
                                    isSelected
                                      ? 'font-semibold text-white'
                                      : chat.unread
                                      ? 'font-semibold text-[var(--mb-text)]'
                                      : 'font-normal opacity-90'
                                  }`}
                                >
                                  {chat.leadName}
                                  {chat.messageCount > 1 && ', you'}
                                  {` (${chat.messageCount})`}
                                </span>
                              </div>
                              <span
                                className="text-xs font-mono flex-none"
                                style={{
                                  color: isSelected ? 'rgba(255, 255, 255, 0.85)' : 'var(--mb-muted)'
                                }}
                              >
                                {chat.date}
                              </span>
                            </div>

                            {/* Line 2: Actual email subject line + paperclip if attached */}
                            <div className="flex items-center justify-between gap-1 mt-1">
                              <span
                                className={`text-[13px] truncate ${
                                  chat.unread && !isSelected ? 'font-medium' : ''
                                }`}
                                style={{
                                  color: isSelected
                                    ? 'rgba(255, 255, 255, 0.92)'
                                    : chat.unread
                                    ? 'var(--mb-text)'
                                    : 'var(--mb-muted)'
                                }}
                              >
                                {chat.subject}
                              </span>
                              {chat.hasAttachment && (
                                <Paperclip
                                  className="w-3.5 h-3.5 flex-none"
                                  style={{
                                    color: isSelected ? 'rgba(255, 255, 255, 0.85)' : 'var(--mb-muted)'
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Sync Bar */}
              <div
                className="p-2 px-3 border-t flex items-center justify-between text-[11px]"
                style={{
                  backgroundColor: 'var(--mb-bottom-bar)',
                  borderColor: 'var(--mb-rule)',
                  color: 'var(--mb-muted)'
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{t.syncLive}</span>
                </div>
                <span className="font-mono text-[10px]">{t.version}</span>
              </div>
            </div>
          </section>

          {/* ----------------------------------------------------------------- */}
          {/* 2.2 RIGHT ROUNDED CONVERSATION PANEL                              */}
          {/* ----------------------------------------------------------------- */}
          <main className="conversation-panel apple-panel">
            <div className="conversation-panel-inner">
              {/* Conversation Header Bar */}
              <div
                className="p-3 px-4 border-b flex items-center justify-between z-20 flex-none select-text"
                style={{
                  backgroundColor: 'var(--mb-header)',
                  borderColor: 'var(--mb-rule)'
                }}
              >
                {/* Left: Thread Subject + Folder Tag Icon */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                  <button
                    type="button"
                    onClick={() => setIsMobileConversation(false)}
                    className="md:hidden mr-1 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                    style={{ color: 'var(--apple-muted)' }}
                    title={t.back}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <Tag className="w-3.5 h-3.5 flex-none" style={{ color: 'var(--apple-muted)' }} />
                  <h2
                    className="text-[14px] font-semibold truncate select-text mail-subject"
                    style={{ color: 'var(--mb-text)' }}
                  >
                    {activeChat.subject}
                  </h2>
                </div>

                {/* Right: Icon-only actions + Date */}
                <div className="flex items-center gap-1 flex-none select-none">
                  {/* Header Reply Icon */}
                  <button
                    type="button"
                    onClick={handleOpenComposer}
                    title={t.reply}
                    className="mb-icon-btn"
                  >
                    <CornerUpLeft className="w-4 h-4" />
                  </button>

                  {/* Forward Icon */}
                  <button
                    type="button"
                    onClick={() => showToast('Forward composer ready')}
                    title={t.forward}
                    className="mb-icon-btn"
                  >
                    <CornerUpRight className="w-4 h-4" />
                  </button>

                  {/* Translate RU/EN Toggle Icon */}
                  <button
                    type="button"
                    onClick={() => {
                      setTranslatedChats((prev) => ({
                        ...prev,
                        [activeChatId]: !prev[activeChatId]
                      }));
                    }}
                    title={isTranslated ? t.translateEn : t.translateRu}
                    className="mb-icon-btn"
                    style={{ color: isTranslated ? 'var(--apple-accent)' : undefined }}
                  >
                    <Languages className="w-4 h-4" />
                  </button>

                  {/* More Actions Dropdown Menu */}
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                      title={t.moreActions}
                      className="mb-icon-btn"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMoreMenuOpen && (
                      <div
                        className="absolute right-0 top-8 w-52 rounded-lg shadow-xl p-1 z-40 text-xs space-y-0.5 border"
                        style={{
                          backgroundColor: 'var(--menu-bg)',
                          borderColor: 'var(--menu-border)',
                          color: 'var(--apple-text)'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            showToast('AI Summary: Client confirmed budget & requested 15-min Zoom demo');
                            setIsMoreMenuOpen(false);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-md text-left flex items-center gap-2 transition-colors cursor-pointer"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--menu-item-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#007aff] dark:text-[#2f82f6]" />
                          <span>{t.aiSummary}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActivePage('activity');
                            setIsMoreMenuOpen(false);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-md text-left flex items-center gap-2 transition-colors cursor-pointer"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--menu-item-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Activity className="w-3.5 h-3.5" style={{ color: 'var(--apple-muted)' }} />
                          <span>{t.activityFeed}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          className="w-full px-2.5 py-1.5 rounded-md text-left flex items-center gap-2 transition-colors cursor-pointer"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--menu-item-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Copy className="w-3.5 h-3.5" style={{ color: 'var(--apple-muted)' }} />
                          <span>{t.copyEmail}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            conversationFileInputRef.current?.click();
                          }}
                          className="w-full px-2.5 py-1.5 rounded-md text-left flex items-center gap-2 transition-colors cursor-pointer"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--menu-item-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <ImageIcon className="w-3.5 h-3.5" style={{ color: 'var(--apple-muted)' }} />
                          <span>{t.conversationBackground}</span>
                        </button>
                        <div className="h-[1px] my-1" style={{ backgroundColor: 'var(--mb-rule)' }}></div>
                        <button
                          type="button"
                          onClick={handleArchiveChat}
                          className="w-full px-2.5 py-1.5 rounded-md text-left hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>{t.moveToArchive}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Date on Far Right */}
                  <span
                    className="text-xs font-mono ml-2 select-text mail-date"
                    style={{ color: 'var(--mb-date)' }}
                  >
                    {activeChat.date}
                  </span>
                </div>
              </div>

              {/* Thin AI Suggestion Strip */}
              {isAIVisible && activeChat.aiSuggestion && (
                <div className="mb-ai-strip flex-none z-10">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold" style={{ color: 'var(--ai-strip-title)' }}>
                      ✦ {t.aiStripTitle}
                    </span>
                    <span className="truncate" style={{ color: 'var(--ai-strip-text)' }}>
                      {activeChat.aiSuggestion.snippet} · {activeChat.aiSuggestion.matchPercentage}% match
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-none">
                    <button
                      type="button"
                      onClick={handleReviewAIDraft}
                      className="px-2.5 py-0.5 rounded text-xs font-medium transition-all shadow-2xs"
                      style={{
                        backgroundColor: 'var(--ai-strip-btn-bg)',
                        borderColor: 'var(--ai-strip-btn-border)',
                        color: 'var(--ai-strip-text)',
                        borderWidth: 1
                      }}
                    >
                      {t.review}
                    </button>
                    <button
                      type="button"
                      onClick={handleDismissAIStrip}
                      className="p-0.5 hover:opacity-100"
                      style={{ color: 'var(--apple-muted)' }}
                      title={t.dismiss}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Main Dialogue + Wallpaper Section Area */}
              <div className="flex-1 flex overflow-hidden relative" style={{ backgroundColor: 'var(--mb-surface)' }}>
                {/* Scrollable Dialogue Lane (with Left-Aligned Reading Column) */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 mail-selectable z-10">
                  {isLoadingThread ? (
                    /* Short skeleton loading transition */
                    <div className="thread-reading-column space-y-3 py-4">
                      <div className="h-4 w-48 mb-skeleton-line"></div>
                      <div className="h-4 w-96 mb-skeleton-line"></div>
                      <div className="h-20 w-full mb-skeleton-line mt-4"></div>
                    </div>
                  ) : (
                    <div className="thread-reading-column space-y-4">
                      {/* --------------------------------------------------------- */}
                      {/* A. NEWEST FULL TOP-LEVEL MESSAGE                          */}
                      {/* --------------------------------------------------------- */}
                      <div className="space-y-2 pb-1">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Avatar */}
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-none select-none ${
                                topMessage.sender === 'lead'
                                  ? 'bg-blue-500/15 text-[#007aff] dark:bg-[#2a3a4a] dark:text-[#7bb7ee]'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:bg-[#283828] dark:text-[#85cb6f]'
                              }`}
                            >
                              {topMessage.sender === 'lead' ? activeChat.initials : 'AM'}
                            </div>

                            {/* Name & Recipient */}
                            <div className="flex items-baseline gap-2 truncate">
                              <span
                                className="font-semibold text-sm truncate font-sans select-text mail-sender"
                                style={{
                                  color: topMessage.sender === 'lead' ? 'var(--mb-lead)' : 'var(--mb-self)'
                                }}
                              >
                                {topMessage.name}
                              </span>
                              <span
                                className="text-xs font-mono truncate hidden sm:inline select-text"
                                style={{ color: 'var(--mb-muted)' }}
                              >
                                To: {topMessage.to}
                              </span>
                              {isTranslated && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20">
                                  RU
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Time & Action Button */}
                          <div className="flex items-center gap-2 flex-none">
                            <span
                              className="text-xs font-mono select-text mail-date"
                              style={{ color: 'var(--mb-date)' }}
                            >
                              {topMessage.time}
                            </span>
                            <button
                              type="button"
                              onClick={handleOpenComposer}
                              className="mb-icon-btn p-1"
                              title={t.reply}
                            >
                              <CornerUpLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Email Body */}
                        <div
                          className="mail-body text-xs md:text-[13px] leading-relaxed whitespace-pre-line select-text pl-9 font-sans"
                          style={{ color: 'var(--mb-text)' }}
                        >
                          <SafeTextFormatter text={displayMessageText} />
                        </div>
                      </div>

                      {/* --------------------------------------------------------- */}
                      {/* B. HIDDEN COMPOSER (Opens ONLY after Reply action)        */}
                      {/* --------------------------------------------------------- */}
                      <div className={`mb-composer-wrapper ${isComposerOpen ? 'open' : 'closed'}`}>
                        <div className="mb-composer-card p-3 space-y-2 select-none shadow-xs">
                          {/* Recipient line + Maximize */}
                          <div
                            className="flex items-center justify-between text-xs pb-1 border-b"
                            style={{
                              borderColor: 'var(--mb-rule)',
                              color: 'var(--apple-muted)'
                            }}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium" style={{ color: 'var(--apple-text)' }}>{t.to}</span>
                              <span className="font-mono text-[11px]" style={{ color: 'var(--mb-lead)' }}>
                                {activeChat.leadName} &lt;{activeChat.email}&gt;
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsComposerMaximized(!isComposerMaximized)}
                              title={isComposerMaximized ? 'Standard height' : 'Expand editor'}
                              className="p-1 hover:opacity-100"
                              style={{ color: 'var(--apple-muted)' }}
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Textarea */}
                          <textarea
                            ref={composerTextareaRef}
                            rows={isComposerMaximized ? 8 : 4}
                            value={currentDraft}
                            onChange={(e) => handleDraftChange(e.target.value)}
                            onKeyDown={(e) => {
                              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                e.preventDefault();
                                handleSendReply();
                              }
                            }}
                            placeholder={t.writeReply}
                            className="mb-composer-textarea"
                          />

                          {/* Dense Action Toolbar */}
                          <div className="flex items-center justify-between pt-1 text-xs">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={handleSendReply}
                                className="mb-btn-send flex items-center gap-1.5"
                              >
                                <span>{t.send}</span>
                                <Send className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => showToast('Schedule send: Tomorrow at 09:00 CET')}
                                className="mb-icon-btn"
                                title="Schedule send"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>

                              <div className="h-4 w-[1px] mx-1" style={{ backgroundColor: 'var(--mb-rule)' }}></div>

                              <button
                                type="button"
                                onClick={() => handleDraftChange(currentDraft + '\n• [ ] ')}
                                className="mb-icon-btn"
                                title="Insert checklist"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => showToast('Attach file dialog ready')}
                                className="mb-icon-btn"
                                title="Attach document"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => showToast('Insert inline image')}
                                className="mb-icon-btn"
                                title="Insert image"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDraftChange(currentDraft + ' https://cal.com/marshall/demo-15min ')}
                                className="mb-icon-btn"
                                title="Insert link"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDraftChange(currentDraft + ' 👋 ')}
                                className="mb-icon-btn"
                                title="Insert emoji"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={handleReviewAIDraft}
                                className="mb-icon-btn"
                                style={{ color: 'var(--apple-accent)' }}
                                title="AI Draft Assist"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDraftChange(currentDraft + '\n1. \n2. ')}
                                className="mb-icon-btn"
                                title="Numbered list"
                              >
                                <List className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Far Right: Discard / Close Button */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleDiscardComposer}
                                className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                                title={t.discard}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* --------------------------------------------------------- */}
                      {/* C. RECURSIVE QUOTED EMAIL TREE (12px indented rails)      */}
                      {/* --------------------------------------------------------- */}
                      {activeChat.quotes && activeChat.quotes.length > 0 && (
                        <div className="pt-2">
                          {activeChat.quotes.map((quote) => (
                            <QuoteNodeItem
                              key={quote.id}
                              quote={quote}
                              chatId={activeChatId}
                              isExpanded={!!activeChatQuotesMap[quote.id]}
                              onToggle={handleToggleQuoteNode}
                              expandedQuoteMap={activeChatQuotesMap}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Portrait Wallpaper Card (Widescreen Only, Completely Hidden by Default) */}
                {showWallpaperCard && (
                  <div className="hidden min-[1366px]:flex items-center justify-center pr-6 my-auto z-10 flex-shrink-0 select-none">
                    <div className="wallpaper-portrait-card">
                      <img
                        src={conversationWallpaperUrl!}
                        alt="Conversation Wallpaper"
                        className="wallpaper-portrait-image"
                        style={{
                          opacity: conversationWallpaperOpacity * 6.5
                        }}
                      />
                      <div className="wallpaper-portrait-overlay" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </>
      )}

      {/* ===================================================================== */}
      {/* 3. SECONDARY PAGES (Rendered inside rounded Apple Panel)              */}
      {/* ===================================================================== */}

      {/* 3.1 CAMPAIGNS & ANALYTICS WORKSPACE (CAMPAIGN PULSE) */}
      {activePage === 'stats' && (
        <section className="secondary-panel apple-panel ds-page-transition" id="campaigns-workspace-panel">
          <div className="secondary-panel-inner space-y-6">
            {/* Top Workspace Bar */}
            <div className="secondary-page-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {selectedCampaign && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCampaignId(null);
                      setRecipientFilter('all');
                    }}
                    className="secondary-button-icon ds-btn-icon ds-icon-button"
                    title={t.backToCampaigns}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="secondary-page-title ds-panel-heading">
                      {selectedCampaign ? selectedCampaign.name : t.campaignPulse}
                    </h2>
                    {selectedCampaign && (
                      <span
                        className={`secondary-badge ds-pill ds-status-pill ${
                          selectedCampaign.status === 'active'
                            ? 'secondary-badge-teal ds-pill-teal'
                            : selectedCampaign.status === 'completed'
                            ? 'secondary-badge-blue ds-pill-blue'
                            : selectedCampaign.status === 'paused'
                            ? 'secondary-badge-amber ds-pill-amber'
                            : 'secondary-badge-muted'
                        }`}
                      >
                        {selectedCampaign.status === 'active' && t.statusActive}
                        {selectedCampaign.status === 'completed' && t.statusCompleted}
                        {selectedCampaign.status === 'paused' && t.statusPaused}
                        {selectedCampaign.status === 'draft' && t.statusDraft}
                      </span>
                    )}
                  </div>
                  <p className="secondary-page-subtitle">
                    {selectedCampaign
                      ? `${selectedCampaign.mailboxLabel} · ${selectedCampaign.createdAt}`
                      : t.outboundPerformance}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedCampaign ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleCampaignStatus(selectedCampaign.id)}
                      className={`secondary-button ds-btn ${selectedCampaign.status === 'active' ? 'secondary-button-pause ds-btn-destructive' : 'ds-btn-secondary'}`}
                    >
                      {selectedCampaign.status === 'active' ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>{t.pauseCampaign}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>{t.resumeCampaign}</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCampaignId(null);
                        setRecipientFilter('all');
                      }}
                      className="secondary-button ds-btn ds-btn-secondary"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{t.allCampaigns}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => showToast(t.refreshStats)}
                      className="secondary-button ds-btn ds-btn-secondary"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t.refreshStats}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFileParseError(null);
                        setParsedImport(null);
                        setImportFileName(null);
                        setNewCampName('');
                        setIsNewCampaignModalOpen(true);
                      }}
                      className="secondary-button secondary-button-primary ds-btn ds-btn-primary"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{t.newCampaign}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* IF NO CAMPAIGN SELECTED: SHOW CONVERSION STREAM HERO + LOCAL INSIGHT + CAMPAIGN LIST */}
            {!selectedCampaign && (
              <div className="space-y-4">
                {/* 1. Conversion Stream Hero */}
                <div className="conversion-stream-hero space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Outcome Block */}
                    <div className="flex-shrink-0 space-y-1.5 min-w-[220px]">
                      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--secondary-text-secondary)' }}>
                        {t.replyConversion}
                      </div>
                      <div className="text-5xl sm:text-[52px] font-bold font-mono tracking-tight leading-none" style={{ color: 'var(--secondary-text)' }}>
                        <AnimatedNumber
                          value={aggregateReplyRateNum}
                          formatter={(v) => (totalSent > 0 ? `${v.toFixed(1)}%` : '—')}
                        />
                      </div>
                      <div className="campaign-hero-formula pt-1">
                        {totalReplied.toLocaleString()} {t.uniqueReplies.toLowerCase()} / {totalSent.toLocaleString()} {t.sent.toLowerCase()}
                      </div>
                      <div className="campaign-hero-scope">
                        {t.acrossCampaignsCount.replace('{count}', campaigns.length.toString())}
                      </div>
                    </div>

                    {/* Right: Conversion Stream Track */}
                    <div className="flex-1 max-w-2xl py-2">
                      <div className="conversion-stream-track relative">
                        <div className="conversion-stream-line-bg">
                          <div className="conversion-stream-line-fill" />
                        </div>

                        {/* Node 1: Sent */}
                        <div className="conversion-stream-node">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--secondary-text-muted)' }} />
                            <span className="text-xs font-semibold" style={{ color: 'var(--secondary-text-secondary)' }}>
                              {t.stageSent}
                            </span>
                          </div>
                          <span className="text-xl font-bold font-mono" style={{ color: 'var(--secondary-text)' }}>
                            <AnimatedNumber value={totalSent} />
                          </span>
                        </div>

                        {/* Node 2: Replies */}
                        <div className="conversion-stream-node">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--secondary-blue)' }} />
                            <span className="text-xs font-semibold" style={{ color: 'var(--secondary-text-secondary)' }}>
                              {t.repliesStage}
                            </span>
                          </div>
                          <span className="text-xl font-bold font-mono" style={{ color: 'var(--secondary-blue)' }}>
                            <AnimatedNumber value={totalReplied} />
                          </span>
                        </div>

                        {/* Node 3: Qualified */}
                        <div className="conversion-stream-node">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--secondary-teal)' }} />
                            <span className="text-xs font-semibold" style={{ color: 'var(--secondary-text-secondary)' }}>
                              {t.stageQualified}
                            </span>
                          </div>
                          <span className="text-xl font-bold font-mono" style={{ color: 'var(--secondary-teal)' }}>
                            <AnimatedNumber value={totalQualified} />
                          </span>
                        </div>

                        {/* Node 4: Demos */}
                        <div className="conversion-stream-node">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--secondary-amber)' }} />
                            <span className="text-xs font-semibold" style={{ color: 'var(--secondary-text-secondary)' }}>
                              {t.demosStage}
                            </span>
                          </div>
                          <span className="text-xl font-bold font-mono" style={{ color: 'var(--secondary-amber)' }}>
                            <AnimatedNumber value={totalBooked} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Factual Hero Footer */}
                  <div className="pt-3 flex items-center justify-between campaign-hero-outcome" style={{ borderTop: '1px solid var(--secondary-stroke)' }}>
                    <span>
                      {totalBooked} {t.demosBookedFromQualified} {totalQualified} {t.qualifiedLeads}.
                    </span>
                    <span className="campaign-hero-imported-count">
                      {totalImported.toLocaleString()} {t.imported.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* 2. Restrained Local Insight Preview Card */}
                {!isInsightDismissed && (
                  <div className="local-insight-card">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--secondary-teal)' }} />
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="local-insight-label">
                          {t.localInsightPreview}
                        </span>
                        <span className="local-insight-text">
                          {bestPerformingCampaign ? (
                            t.strongestConversionInsight
                              .replace('{name}', bestPerformingCampaign.name)
                              .replace(
                                '{rate}',
                                `${((bestPerformingCampaign.replied / bestPerformingCampaign.sent) * 100).toFixed(1)}%`
                              )
                          ) : (
                            t.noSentCampaignsInsight
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {bestPerformingCampaign && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCampaignId(bestPerformingCampaign.id);
                            setRecipientFilter('all');
                          }}
                          className="secondary-button !h-7 !px-2.5 text-xs font-semibold"
                        >
                          <span>{t.viewCampaign}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsInsightDismissed(true)}
                        className="secondary-button-icon !w-7 !h-7"
                        title={t.dismiss}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Linear / Superhuman Campaign List */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="secondary-section-title">
                        {t.allCampaigns}
                      </h3>
                      <span className="text-xs font-mono" style={{ color: 'var(--secondary-text-muted)' }}>
                        ({filteredCampaigns.length})
                      </span>
                    </div>

                    {/* Apple Segmented Controls */}
                    <div className="apple-segmented-group ds-segmented">
                      <button
                        type="button"
                        onClick={() => setCampaignFilter('all')}
                        className={`apple-segmented-btn ds-segmented-option ds-segmented-item ${campaignFilter === 'all' ? 'is-active' : ''}`}
                      >
                        {t.filterAll} ({campaigns.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCampaignFilter('active')}
                        className={`apple-segmented-btn ds-segmented-option ds-segmented-item ${campaignFilter === 'active' ? 'is-active' : ''}`}
                      >
                        {t.filterActive} ({campaigns.filter((c) => c.status === 'active').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCampaignFilter('attention')}
                        className={`apple-segmented-btn ds-segmented-option ds-segmented-item ${campaignFilter === 'attention' ? 'is-active' : ''}`}
                      >
                        {t.filterNeedsAttention} ({campaigns.filter((c) => c.sent > 0 && (c.replied / c.sent) < (totalSent > 0 ? totalReplied / totalSent : 0)).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCampaignFilter('draft')}
                        className={`apple-segmented-btn ds-segmented-option ds-segmented-item ${campaignFilter === 'draft' ? 'is-active' : ''}`}
                      >
                        {t.filterDraft} ({campaigns.filter((c) => c.status === 'draft').length})
                      </button>
                    </div>
                  </div>

                  {/* Campaign Rows List */}
                  {filteredCampaigns.length === 0 ? (
                    <div className="secondary-surface p-8 text-center space-y-2">
                      <p className="text-sm font-medium" style={{ color: 'var(--secondary-text-secondary)' }}>
                        {campaignFilter === 'attention'
                          ? t.attentionExplanation.replace('{rate}', aggregateReplyRateStr)
                          : t.noCampaignsInFilter}
                      </p>
                    </div>
                  ) : (
                    <div className="secondary-list-surface overflow-hidden divide-y" style={{ borderColor: 'var(--secondary-stroke)' }}>
                      {filteredCampaigns.map((camp) => {
                        const campReplyRate = camp.sent > 0 ? (camp.replied / camp.sent) * 100 : 0;
                        const isBest = camp.id === bestCampaignId;
                        const isSelected = selectedCampaignId === camp.id;

                        return (
                          <div
                            key={camp.id}
                            onClick={() => {
                              setSelectedCampaignId(camp.id);
                              setRecipientFilter('all');
                            }}
                            className={`campaign-list-row ${isSelected ? 'is-selected' : ''}`}
                          >
                            {/* Top row: Name, status badge, conversion and chevron */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor:
                                      camp.status === 'active'
                                        ? 'var(--secondary-teal)'
                                        : camp.status === 'completed'
                                        ? 'var(--secondary-blue)'
                                        : camp.status === 'paused'
                                        ? 'var(--secondary-amber)'
                                        : 'var(--secondary-text-muted)'
                                  }}
                                />
                                <span className="font-semibold text-sm truncate">
                                  {camp.name}
                                </span>
                                {isBest && (
                                  <span className="best-conversion-badge">
                                    {t.bestConversion}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0 text-right">
                                {camp.sent > 0 ? (
                                  <span className="text-lg sm:text-xl font-bold font-mono tracking-tight" style={{ color: isSelected ? undefined : 'var(--secondary-teal)' }}>
                                    {campReplyRate.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-xs italic text-muted-cue">
                                    {t.noSendsYet}
                                  </span>
                                )}
                                <ChevronRight className="w-4 h-4 campaign-row-chevron" />
                              </div>
                            </div>

                            {/* Middle row: Mailbox, date and sent/replies counts */}
                            <div className="flex items-center justify-between gap-2 text-xs font-mono text-muted-cue">
                              <div className="flex items-center gap-2 truncate">
                                <span>{camp.mailboxLabel}</span>
                                <span>·</span>
                                <span>{camp.createdAt}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span>{camp.sent.toLocaleString()} {t.sent.toLowerCase()}</span>
                                <span>·</span>
                                <span>{camp.replied.toLocaleString()} {t.replied.toLowerCase()}</span>
                              </div>
                            </div>

                            {/* Bottom row: Conversion Progress Strip */}
                            <div className="conversion-strip-rail">
                              {/* Sent segment */}
                              <div
                                style={{
                                  width: `${camp.imported > 0 ? Math.min(100, (camp.sent / camp.imported) * 100) : 0}%`,
                                  backgroundColor: 'var(--secondary-blue)'
                                }}
                                title={`${t.sent}: ${camp.sent}`}
                              />
                              {/* Replied segment */}
                              <div
                                style={{
                                  width: `${camp.sent > 0 ? Math.min(100, (camp.replied / camp.sent) * 100) : 0}%`,
                                  backgroundColor: 'var(--secondary-teal)'
                                }}
                                title={`${t.replied}: ${camp.replied}`}
                              />
                              {/* Qualified segment */}
                              <div
                                style={{
                                  width: `${camp.replied > 0 ? Math.min(100, (camp.qualified / camp.replied) * 100) : 0}%`,
                                  backgroundColor: 'var(--secondary-amber)'
                                }}
                                title={`${t.qualified}: ${camp.qualified}`}
                              />
                              {/* Booked segment */}
                              <div
                                style={{
                                  width: `${camp.qualified > 0 ? Math.min(100, (camp.booked / camp.qualified) * 100) : 0}%`,
                                  backgroundColor: '#10b981'
                                }}
                                title={`${t.booked}: ${camp.booked}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* IF A CAMPAIGN IS SELECTED: SHOW OUTCOME + COMPACT PIPELINE + RECIPIENTS */}
            {selectedCampaign && (
              <div className="campaign-detail-container space-y-6">
                {/* 1. Outcome & Compact Pipeline Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Outcome Module */}
                  <div className="lg:col-span-5 campaign-outcome-surface p-5 sm:p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--secondary-text-secondary)' }}>
                          {t.outcomeOverview}
                        </h3>
                        <span className="text-xs font-mono" style={{ color: 'var(--secondary-text-muted)' }}>
                          {selectedCampaign.mailboxLabel}
                        </span>
                      </div>

                      {/* Large Lead Metric */}
                      <div className="pt-2">
                        <div className="text-xs font-medium" style={{ color: 'var(--secondary-text-secondary)' }}>
                          {t.replyConversion}
                        </div>
                        <div className="text-4xl sm:text-[44px] font-bold font-mono tracking-tight leading-none mt-1" style={{ color: 'var(--secondary-teal)' }}>
                          <AnimatedNumber
                            value={selectedCampaign.sent > 0 ? (selectedCampaign.replied / selectedCampaign.sent) * 100 : 0}
                            formatter={(v) => (selectedCampaign.sent > 0 ? `${v.toFixed(1)}%` : t.noSendsYet)}
                          />
                        </div>
                        <div className="text-xs font-mono mt-2" style={{ color: 'var(--secondary-text-muted)' }}>
                          {selectedCampaign.replied} {t.uniqueRepliesSent} {selectedCampaign.sent}
                        </div>
                      </div>
                    </div>

                    {/* Inline Supporting Facts */}
                    <div className="grid grid-cols-3 gap-2 pt-4" style={{ borderTop: '1px solid var(--secondary-stroke)' }}>
                      <div className="space-y-0.5">
                        <div className="campaign-fact-label">{t.replied}</div>
                        <div className="text-xl font-bold font-mono" style={{ color: 'var(--secondary-text)' }}>
                          <AnimatedNumber value={selectedCampaign.replied} />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="campaign-fact-label">{t.qualified}</div>
                        <div className="text-xl font-bold font-mono" style={{ color: 'var(--secondary-text)' }}>
                          <AnimatedNumber value={selectedCampaign.qualified} />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="campaign-fact-label">{t.booked}</div>
                        <div className="text-xl font-bold font-mono" style={{ color: 'var(--secondary-amber)' }}>
                          <AnimatedNumber value={selectedCampaign.booked} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Compact Pipeline Narrative Module */}
                  <div className="lg:col-span-7 campaign-pipeline-surface p-5 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <h3 className="secondary-section-title flex items-center gap-2">
                        <Target className="w-4 h-4" style={{ color: 'var(--secondary-blue)' }} />
                        <span>{t.pipelineReview}</span>
                      </h3>
                      <span className="text-xs font-mono" style={{ color: 'var(--secondary-text-muted)' }}>
                        {t.formulaNote}
                      </span>
                    </div>

                    {/* Step 1: Imported */}
                    <div className="compact-pipeline-step">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--secondary-text-muted)' }} />
                        <span className="pipeline-stage-label truncate">
                          {t.stageImported}
                        </span>
                      </div>
                      <span className="pipeline-stage-value text-right">
                        {selectedCampaign.imported}
                      </span>
                      <div className="pipeline-mini-rail">
                        <div className="h-full" style={{ width: '100%', backgroundColor: 'var(--secondary-text-muted)' }} />
                      </div>
                      <span className="pipeline-stage-ratio text-right">
                        100%
                      </span>
                    </div>

                    <div className="compact-pipeline-connector" />

                    {/* Step 2: Sent */}
                    <div className="compact-pipeline-step">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--secondary-blue)' }} />
                        <span className="pipeline-stage-label truncate">
                          {t.stageSent}
                        </span>
                      </div>
                      <span className="pipeline-stage-value text-right">
                        {selectedCampaign.sent}
                      </span>
                      <div className="pipeline-mini-rail">
                        <div
                          className="h-full"
                          style={{
                            width: `${selectedCampaign.imported > 0 ? (selectedCampaign.sent / selectedCampaign.imported) * 100 : 0}%`,
                            backgroundColor: 'var(--secondary-blue)'
                          }}
                        />
                      </div>
                      <span className="pipeline-stage-ratio text-right">
                        {selectedCampaign.imported > 0 ? Math.round((selectedCampaign.sent / selectedCampaign.imported) * 100) : 0}%
                      </span>
                    </div>

                    <div className="compact-pipeline-connector" />

                    {/* Step 3: Replied */}
                    <div className="compact-pipeline-step">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--secondary-teal)' }} />
                        <span className="pipeline-stage-label truncate">
                          {t.stageReplied}
                        </span>
                      </div>
                      <span className="pipeline-stage-value text-right">
                        {selectedCampaign.replied}
                      </span>
                      <div className="pipeline-mini-rail">
                        <div
                          className="h-full"
                          style={{
                            width: `${selectedCampaign.sent > 0 ? (selectedCampaign.replied / selectedCampaign.sent) * 100 : 0}%`,
                            backgroundColor: 'var(--secondary-teal)'
                          }}
                        />
                      </div>
                      <span className="pipeline-stage-ratio text-right" style={{ color: 'var(--secondary-teal)' }}>
                        {selectedCampaign.sent > 0 ? ((selectedCampaign.replied / selectedCampaign.sent) * 100).toFixed(1) : 0}%
                      </span>
                    </div>

                    <div className="compact-pipeline-connector" />

                    {/* Step 4: Qualified */}
                    <div className="compact-pipeline-step">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--secondary-amber)' }} />
                        <span className="pipeline-stage-label truncate">
                          {t.stageQualified}
                        </span>
                      </div>
                      <span className="pipeline-stage-value text-right">
                        {selectedCampaign.qualified}
                      </span>
                      <div className="pipeline-mini-rail">
                        <div
                          className="h-full"
                          style={{
                            width: `${selectedCampaign.replied > 0 ? (selectedCampaign.qualified / selectedCampaign.replied) * 100 : 0}%`,
                            backgroundColor: 'var(--secondary-amber)'
                          }}
                        />
                      </div>
                      <span className="pipeline-stage-ratio text-right">
                        {selectedCampaign.replied > 0 ? Math.round((selectedCampaign.qualified / selectedCampaign.replied) * 100) : 0}%
                      </span>
                    </div>

                    <div className="compact-pipeline-connector" />

                    {/* Step 5: Booked */}
                    <div className="compact-pipeline-step">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#10b981' }} />
                        <span className="pipeline-stage-label truncate">
                          {t.stageBooked}
                        </span>
                      </div>
                      <span className="pipeline-stage-value text-right">
                        {selectedCampaign.booked}
                      </span>
                      <div className="pipeline-mini-rail">
                        <div
                          className="h-full"
                          style={{
                            width: `${selectedCampaign.qualified > 0 ? (selectedCampaign.booked / selectedCampaign.qualified) * 100 : 0}%`,
                            backgroundColor: '#10b981'
                          }}
                        />
                      </div>
                      <span className="pipeline-stage-ratio text-right" style={{ color: '#10b981' }}>
                        {selectedCampaign.qualified > 0 ? Math.round((selectedCampaign.booked / selectedCampaign.qualified) * 100) : 0}%
                      </span>
                    </div>

                    {/* Lowest Transition Factual Callout */}
                    {lowestTransition && (
                      <div className="lowest-transition-callout">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--secondary-amber)' }} />
                        <span>
                          <strong>{t.lowestTransition}:</strong> {lowestTransition.from} → {lowestTransition.to} ({lowestTransition.ratio.toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Recipient Segment Filter & Preview List */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" style={{ color: 'var(--secondary-text-secondary)' }} />
                      <h3 className="secondary-section-title">
                        {t.recipientPreview}
                      </h3>
                      <span className="text-xs font-mono" style={{ color: 'var(--secondary-text-muted)' }}>
                        ({filteredRecipients.length})
                      </span>
                    </div>

                    {/* Recipient Segment Filters */}
                    <div className="apple-segmented-group ds-segmented">
                      <button
                        type="button"
                        onClick={() => setRecipientFilter('all')}
                        className={`apple-segmented-btn ds-segmented-option ds-segmented-item ${recipientFilter === 'all' ? 'is-active' : ''}`}
                      >
                        {t.segmentAll} ({selectedCampaign.recipients.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientFilter('replied')}
                        className={`apple-segmented-btn ds-segmented-option ds-segmented-item ${recipientFilter === 'replied' ? 'is-active' : ''}`}
                      >
                        {t.segmentReplied} ({selectedCampaign.recipients.filter((r) => r.status === 'replied' || r.status === 'qualified' || r.status === 'booked').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientFilter('qualified')}
                        className={`apple-segmented-btn ds-segmented-option ds-segmented-item ${recipientFilter === 'qualified' ? 'is-active' : ''}`}
                      >
                        {t.segmentQualified} ({selectedCampaign.recipients.filter((r) => r.status === 'qualified' || r.status === 'booked').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientFilter('booked')}
                        className={`apple-segmented-btn ds-segmented-option ds-segmented-item ${recipientFilter === 'booked' ? 'is-active' : ''}`}
                      >
                        {t.segmentBooked} ({selectedCampaign.recipients.filter((r) => r.status === 'booked').length})
                      </button>
                    </div>
                  </div>

                  <div className="campaign-recipients-surface text-xs overflow-hidden">
                    {filteredRecipients.length === 0 ? (
                      <div className="p-6 text-center" style={{ color: 'var(--secondary-text-muted)' }}>
                        {t.noRecipientsInFilter}
                      </div>
                    ) : (
                      <div className="divide-y max-h-64 overflow-y-auto" style={{ borderColor: 'var(--secondary-stroke)' }}>
                        {filteredRecipients.map((rec, i) => (
                          <div
                            key={`rec-${i}-${rec.email}`}
                            className="recipient-list-row"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono text-xs w-5 text-right flex-shrink-0" style={{ color: 'var(--secondary-text-muted)' }}>{i + 1}.</span>
                              <span className="font-mono text-sm font-medium select-text truncate" style={{ color: 'var(--secondary-text)' }}>
                                {rec.email}
                              </span>
                            </div>
                            <span
                              className={`secondary-badge ds-pill ds-status-pill flex-shrink-0 ${
                                rec.status === 'booked'
                                  ? 'secondary-badge-blue ds-pill-blue'
                                  : rec.status === 'qualified'
                                  ? 'secondary-badge-amber ds-pill-amber'
                                  : rec.status === 'replied'
                                  ? 'secondary-badge-teal ds-pill-teal'
                                  : rec.status === 'sent'
                                  ? 'secondary-badge-blue ds-pill-blue'
                                  : 'secondary-badge-muted'
                              }`}
                            >
                              {rec.status === 'booked' && t.statusBooked}
                              {rec.status === 'qualified' && t.statusQualified}
                              {rec.status === 'replied' && t.statusReplied}
                              {rec.status === 'sent' && t.statusSent}
                              {rec.status === 'pending' && t.statusPending}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Local Mock Disclaimer Note */}
                <div className="secondary-muted-surface p-3 flex items-center gap-2.5 text-xs rounded-lg" style={{ color: 'var(--secondary-text-secondary)' }}>
                  <Info className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--secondary-text-muted)' }} />
                  <span>{t.mockDisclaimer}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3.2 AUTOMODE SETUP & LOCAL PREVIEW WORKSPACE */}
      {activePage === 'ai' && (
        <AutomodeWorkspace
          lang={lang}
          theme={theme}
          onFinishLater={() => {
            setActivePage('inbox');
            setActiveNav('inbox');
          }}
          showToast={showToast}
        />
      )}

      {/* 3.3 OVERVIEW ROUTE — ATTENTION-FIRST TRANSITIONAL VIEW */}
      {activePage === 'activity' && (
        <section className="secondary-panel apple-panel ds-page-transition">
          <div className="secondary-panel-inner space-y-6 max-w-4xl mx-auto w-full">
            <div className="secondary-page-header flex items-center justify-between">
              <div>
                <h2 className="secondary-page-title ds-panel-heading">{t.overviewTitle}</h2>
                <p className="secondary-page-subtitle">
                  {t.overviewSubtitle}
                </p>
              </div>
            </div>

            {/* Metric line: Reply conversion this week */}
            <div className="secondary-surface ds-card p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--secondary-text)]">{t.replyConversionThisWeek}</div>
                <div className="text-xs text-[var(--secondary-text-secondary)]">{t.formulaNote}</div>
              </div>
              <div className="text-xl font-mono font-bold text-[var(--secondary-blue)]">
                {aggregateReplyRateStr}
              </div>
            </div>

            {/* Needs Attention Section */}
            <div className="secondary-section">
              <h3 className="secondary-section-title">{t.needsAttention}</h3>

              {attentionChats.length === 0 && attentionCampaigns.length === 0 ? (
                <div className="secondary-surface ds-card p-6 text-center text-xs text-[var(--secondary-text-muted)]">
                  {t.noAttentionItems}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Unread Chats requiring attention */}
                  {attentionChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        handleSelectChat(chat.id);
                        setActivePage('inbox');
                        setActiveNav('inbox');
                      }}
                      className="secondary-surface ds-card p-3.5 flex items-center justify-between cursor-pointer hover:border-[var(--secondary-blue)] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-500/15 text-[#007aff] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {chat.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--secondary-text)] truncate">{chat.leadName}</span>
                            <span className="text-xs text-[var(--secondary-text-muted)] font-mono">{chat.date}</span>
                          </div>
                          <p className="text-xs text-[var(--secondary-text-secondary)] truncate mt-0.5">
                            {chat.subject}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-[var(--secondary-blue)] font-medium flex-shrink-0">
                        {t.viewThread} →
                      </span>
                    </div>
                  ))}

                  {/* Campaigns requiring attention */}
                  {attentionCampaigns.map((camp) => (
                    <div
                      key={camp.id}
                      onClick={() => {
                        setSelectedCampaignId(camp.id);
                        setActivePage('stats');
                        setActiveNav('campaigns');
                      }}
                      className="secondary-surface ds-card p-3.5 flex items-center justify-between cursor-pointer hover:border-[var(--secondary-amber)] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <Target className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--secondary-text)] truncate">{camp.name}</span>
                            <span className="secondary-badge ds-pill ds-status-pill secondary-badge-amber ds-pill-amber text-[10px]">
                              {t.filterNeedsAttention}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--secondary-text-secondary)] truncate mt-0.5">
                            {camp.replied} {t.replied} / {camp.sent} {t.sent} ({(camp.sent > 0 ? (camp.replied / camp.sent) * 100 : 0).toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-[var(--secondary-amber)] font-medium flex-shrink-0">
                        {t.viewCampaign} →
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3.4 SETTINGS PAGE (Mailboxes, Appearance & Wallpaper, Language) */}
      {activePage === 'settings' && (
        <section className="secondary-panel apple-panel ds-page-transition">
          <div className="secondary-panel-inner space-y-8">
            <div className="secondary-page-header">
              <h2 className="secondary-page-title ds-panel-heading">{t.settings}</h2>
              <p className="secondary-page-subtitle">
                Configure sender identities, desktop appearance and localization
              </p>
            </div>

            {/* 1. Mailboxes */}
            <div className="secondary-section">
              <h3 className="secondary-section-title">{t.mailboxes}</h3>
              <div className="secondary-surface ds-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(31, 157, 122, 0.12)', color: 'var(--secondary-teal)' }}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--secondary-text)' }}>alexey@marshall.io</div>
                    <div className="text-xs" style={{ color: 'var(--secondary-text-secondary)' }}>IMAP/SMTP Outreach Lane · Active</div>
                  </div>
                </div>
                <span className="secondary-badge ds-pill ds-status-pill secondary-badge-teal ds-pill-teal">
                  Connected
                </span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => showToast('Add Mailbox modal dialog (mock)')}
                  className="secondary-button ds-btn ds-btn-secondary"
                >
                  {t.addMailbox}
                </button>
              </div>
            </div>

            {/* 2. Appearance & Custom Conversation Wallpaper */}
            <div className="secondary-section pt-2" style={{ borderTop: '1px solid var(--secondary-stroke)' }}>
              <h3 className="secondary-section-title">{t.appearance}</h3>

              {/* Conversation Wallpaper Upload Section */}
              <div className="secondary-surface ds-card p-5 space-y-3">
                <div>
                  <label className="secondary-label">
                    {t.wallpaperUpload}
                  </label>
                  <p className="secondary-supporting-text text-xs mb-3">
                    {t.wallpaperNote}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleWallpaperUpload}
                      className="text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--secondary-blue)] file:text-white hover:file:opacity-90 cursor-pointer"
                    />
                    {conversationWallpaperUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveWallpaper}
                        className="secondary-button ds-btn ds-btn-destructive"
                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        {t.removeWallpaper}
                      </button>
                    )}
                  </div>
                </div>

                {/* Opacity Slider */}
                {conversationWallpaperUrl && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--secondary-text-secondary)' }}>
                      <span>{t.wallpaperOpacity}</span>
                      <span className="font-mono font-bold" style={{ color: 'var(--secondary-text)' }}>
                        {Math.round(conversationWallpaperOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.16"
                      step="0.01"
                      value={conversationWallpaperOpacity}
                      onChange={(e) => setConversationWallpaperOpacity(parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--secondary-blue)]"
                      style={{ backgroundColor: 'var(--secondary-stroke)' }}
                    />
                  </div>
                )}
              </div>

              {/* Outer Shell Theme Toggle */}
              <div className="secondary-surface ds-card p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--secondary-text)' }}>{t.themeToggle}</div>
                  <div className="text-xs" style={{ color: 'var(--secondary-text-secondary)' }}>
                    Apple Mail Light Theme vs Calm Graphite Dark Theme
                  </div>
                </div>
                <div className="apple-segmented-group ds-segmented">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`apple-segmented-btn ds-segmented-option ds-segmented-item ${theme === 'dark' ? 'is-active' : ''}`}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`apple-segmented-btn ds-segmented-option ds-segmented-item ${theme === 'light' ? 'is-active' : ''}`}
                  >
                    Light
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Language Selection */}
            <div className="secondary-section pt-2" style={{ borderTop: '1px solid var(--secondary-stroke)' }}>
              <h3 className="secondary-section-title">Language / Язык</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`secondary-button ds-btn ${lang === 'en' ? 'secondary-button-primary ds-btn-primary' : 'ds-btn-secondary'}`}
                >
                  English (EN)
                </button>
                <button
                  type="button"
                  onClick={() => setLang('ru')}
                  className={`secondary-button ds-btn ${lang === 'ru' ? 'secondary-button-primary ds-btn-primary' : 'ds-btn-secondary'}`}
                >
                  Русский (RU)
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. NEW CAMPAIGN CREATION MODAL                                        */}
      {/* ===================================================================== */}
      {isNewCampaignModalOpen && (
        <div
          className="campaign-modal-backdrop"
          onClick={() => setIsNewCampaignModalOpen(false)}
        >
          <div
            className="campaign-modal ds-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--secondary-stroke)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 122, 255, 0.12)', color: 'var(--secondary-blue)' }}>
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--secondary-text)' }}>
                    {t.newCampaign}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--secondary-text-secondary)' }}>
                    Import list & launch local outbound campaign
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCampaignModalOpen(false)}
                className="secondary-button-icon ds-btn-icon ds-icon-button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Campaign Name */}
              <div className="space-y-1.5">
                <label className="secondary-label flex items-center justify-between">
                  <span>{t.campaignName}</span>
                  <span className="text-xs font-normal" style={{ color: 'var(--secondary-text-muted)' }}>Required</span>
                </label>
                <input
                  type="text"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  placeholder={t.campaignNamePlaceholder}
                  autoFocus
                  className="secondary-input ds-input w-full"
                />
              </div>

              {/* Mailbox & Date row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mailbox */}
                <div className="space-y-1.5">
                  <label className="secondary-label">
                    {t.mailbox}
                  </label>
                  <select
                    value={newCampMailbox}
                    onChange={(e) => setNewCampMailbox(e.target.value)}
                    className="secondary-select ds-select w-full font-mono"
                  >
                    <option value="alexey@marshall.io">alexey@marshall.io</option>
                    <option value="outreach@marshall.io">outreach@marshall.io</option>
                    <option value="growth@marshall.io">growth@marshall.io</option>
                  </select>
                </div>

                {/* Sending state */}
                <div className="space-y-1.5">
                  <label className="secondary-label">
                    {t.sendingState}
                  </label>
                  <div className="apple-segmented-group ds-segmented w-full grid grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setNewCampSendingState('draft')}
                      className={`apple-segmented-btn ds-segmented-option ds-segmented-item text-center ${
                        newCampSendingState === 'draft' ? 'is-active' : ''
                      }`}
                    >
                      {t.statusDraft}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCampSendingState('sent')}
                      className={`apple-segmented-btn ds-segmented-option ds-segmented-item text-center ${
                        newCampSendingState === 'sent' ? 'is-active' : ''
                      }`}
                    >
                      {t.statusSent}
                    </button>
                  </div>
                </div>
              </div>

              {/* mails.txt File Dropzone */}
              <div className="space-y-1.5">
                <label className="secondary-label flex items-center justify-between">
                  <span>{t.uploadMailsTxt}</span>
                  <span className="text-xs font-normal" style={{ color: 'var(--secondary-text-muted)' }}>one email per line</span>
                </label>
                
                <input
                  ref={mailsFileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileProcess(file);
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileProcess(file);
                  }}
                  onClick={() => mailsFileInputRef.current?.click()}
                  className="p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2"
                  style={{
                    borderColor: isDraggingFile ? 'var(--secondary-blue)' : parsedImport ? 'var(--secondary-teal)' : 'var(--secondary-stroke-strong)',
                    backgroundColor: isDraggingFile ? 'rgba(0, 122, 255, 0.08)' : parsedImport ? 'rgba(31, 157, 122, 0.06)' : 'var(--secondary-muted-surface)'
                  }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--secondary-panel)', color: 'var(--secondary-text-secondary)' }}>
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--secondary-text)' }}>
                      {importFileName || t.dropMailsTxt}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--secondary-text-muted)' }}>
                      Plain text file with email addresses
                    </div>
                  </div>
                </div>

                {/* File Parsing Error */}
                {fileParseError && (
                  <div className="p-2.5 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#ef4444' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{fileParseError}</span>
                  </div>
                )}

                {/* Parser Statistics Chips */}
                {parsedImport && (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="secondary-badge ds-pill ds-status-pill secondary-badge-teal ds-pill-teal">
                        <Check className="w-3 h-3" />
                        <span>{t.valid}: {parsedImport.valid.length}</span>
                      </span>
                      {parsedImport.duplicates > 0 && (
                        <span className="secondary-badge ds-pill ds-status-pill secondary-badge-amber ds-pill-amber">
                          <span>{t.duplicatesRemoved}: {parsedImport.duplicates}</span>
                        </span>
                      )}
                      {parsedImport.invalid > 0 && (
                        <span className="secondary-badge ds-pill ds-status-pill secondary-badge-muted">
                          <span>{t.invalid}: {parsedImport.invalid}</span>
                        </span>
                      )}
                    </div>

                    {/* Email Preview Box */}
                    {parsedImport.valid.length > 0 && (
                      <div className="secondary-muted-surface p-3 text-xs font-mono max-h-24 overflow-y-auto space-y-0.5" style={{ color: 'var(--secondary-text)' }}>
                        {parsedImport.valid.slice(0, 8).map((email, i) => (
                          <div key={`prev-${i}`} className="truncate">
                            <span className="mr-2" style={{ color: 'var(--secondary-text-muted)' }}>{i + 1}.</span>
                            <span>{email}</span>
                          </div>
                        ))}
                        {parsedImport.valid.length > 8 && (
                          <div className="text-xs italic pt-1" style={{ color: 'var(--secondary-text-muted)' }}>
                            + {parsedImport.valid.length - 8} more recipients...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--secondary-stroke)', backgroundColor: 'var(--secondary-muted-surface)' }}>
              <button
                type="button"
                onClick={() => setIsNewCampaignModalOpen(false)}
                className="secondary-button ds-btn ds-btn-secondary"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleCreateCampaign}
                disabled={!newCampName.trim() || !parsedImport || parsedImport.valid.length === 0}
                className="secondary-button secondary-button-primary ds-btn ds-btn-primary"
                style={
                  !newCampName.trim() || !parsedImport || parsedImport.valid.length === 0
                    ? { opacity: 0.5, cursor: 'not-allowed' }
                    : {}
                }
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.createCampaign}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. FLOATING STATUS TOAST                                              */}
      {/* ===================================================================== */}
      {toastMessage && (
        <div className="secondary-toast ds-toast">
          <span className="secondary-status-dot" style={{ backgroundColor: 'var(--secondary-blue)' }}></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
