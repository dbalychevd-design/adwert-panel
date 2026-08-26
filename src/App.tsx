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

export default function App() {
  // Navigation State
  const [activePage, setActivePage] = useState<'inbox' | 'stats' | 'ai' | 'activity' | 'settings'>('inbox');

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

  // AI Assistant Setup Wizard & Control Dashboard State
  const [aiSetupComplete, setAiSetupComplete] = useState<boolean>(false);
  const [aiSetupStep, setAiSetupStep] = useState<number>(1);
  const [aiShowApiKey, setAiShowApiKey] = useState<boolean>(false);
  const [aiTestConnectionMessage, setAiTestConnectionMessage] = useState<string | null>(null);

  // Step 1: Provider
  const [aiProviderType, setAiProviderType] = useState<'openai_compatible' | 'gemini' | 'custom'>('openai_compatible');
  const [aiProviderName, setAiProviderName] = useState<string>('OpenAI');
  const [aiModel, setAiModel] = useState<string>('gpt-4o');
  const [aiApiKey, setAiApiKey] = useState<string>('');
  const [aiBaseEndpoint, setAiBaseEndpoint] = useState<string>('https://api.openai.com/v1');
  const [aiCustomSettingsOpen, setAiCustomSettingsOpen] = useState<boolean>(false);
  const [aiCustomUrl, setAiCustomUrl] = useState<string>('https://api.custom-proxy.io/v1/chat/completions');
  const [aiCustomAuthHeader, setAiCustomAuthHeader] = useState<string>('Authorization: Bearer <token>');
  const [aiCustomModelField, setAiCustomModelField] = useState<string>('model');
  const [aiCustomTemplate, setAiCustomTemplate] = useState<string>('{ "messages": [...] }');
  const [aiCustomResponsePath, setAiCustomResponsePath] = useState<string>('choices[0].message.content');

  // Step 2: Mailbox
  const [aiSelectedMailbox, setAiSelectedMailbox] = useState<string>('alexey@marshall.io');
  const [aiMailboxAuthType, setAiMailboxAuthType] = useState<'imap_smtp' | 'oauth'>('imap_smtp');

  // Step 3: Playbook
  const [aiReplyStyle, setAiReplyStyle] = useState<'concise' | 'friendly' | 'direct'>('concise');
  const [aiRequiredDetails, setAiRequiredDetails] = useState<string[]>([
    'Full name',
    'Company',
    'Location',
    'Delivery needs'
  ]);
  const [aiLanguageHandling, setAiLanguageHandling] = useState<'lead_language' | 'always_english' | 'review_unfamiliar'>('lead_language');
  const [aiContextPreviewOpen, setAiContextPreviewOpen] = useState<boolean>(false);

  // Step 4: Rules & Scenario Action Studio State
  const [aiSelectedScenario, setAiSelectedScenario] = useState<'inbound_question' | 'missing_details' | 'complete_details' | 'meeting_request'>('inbound_question');
  const [aiScenarioActions, setAiScenarioActions] = useState<{
    inboundQuestion: 'draft_only' | 'review_queue' | 'auto_send';
    missingDetails: 'ask_approved' | 'draft_only' | 'review_queue';
    completeDetails: 'review_queue' | 'draft_only' | 'auto_send';
    meetingRequest: 'review_queue' | 'draft_only' | 'auto_send';
  }>({
    inboundQuestion: 'draft_only',
    missingDetails: 'ask_approved',
    completeDetails: 'review_queue',
    meetingRequest: 'review_queue'
  });
  const [aiScenarioFeedback, setAiScenarioFeedback] = useState<string | null>(null);
  const [aiAutoSendNotice, setAiAutoSendNotice] = useState<string | null>(null);
  const [aiAutopilotNotice, setAiAutopilotNotice] = useState<string | null>(null);
  const [aiReviewQueueFilter, setAiReviewQueueFilter] = useState<'all' | 'pending' | 'clarification'>('all');

  // Step 5 & Dashboard: Operating Mode, Active Section & Modals
  const [aiOperatingMode, setAiOperatingMode] = useState<'off' | 'drafts' | 'review' | 'autopilot'>('review');
  const [activeAiSection, setActiveAiSection] = useState<'overview' | 'review' | 'provider' | 'mailbox' | 'playbook' | 'rules' | 'audit'>('overview');
  const [aiSelectedFlowNode, setAiSelectedFlowNode] = useState<number>(1);
  const [aiResetModalOpen, setAiResetModalOpen] = useState<boolean>(false);
  const [aiAutopilotModalOpen, setAiAutopilotModalOpen] = useState<boolean>(false);
  const [aiTestRuleScenario, setAiTestRuleScenario] = useState<'meeting' | 'missing' | 'optout'>('meeting');

  // Right-Side AI Workspace Rail State
  const [aiRightRailOpen, setAiRightRailOpen] = useState<boolean>(true);
  const [aiRightRailTab, setAiRightRailTab] = useState<'guidance' | 'templates' | 'ask'>('guidance');
  const [aiTemplateCategory, setAiTemplateCategory] = useState<'qualification' | 'meetings' | 'followup'>('qualification');
  const [aiPreviewedTemplate, setAiPreviewedTemplate] = useState<{ id: string; title: string; category: string; summary: string; body: string } | null>(null);
  const [aiSelectedAskQuestion, setAiSelectedAskQuestion] = useState<string | null>(null);

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
        if (activePage !== 'inbox') setActivePage('inbox');
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
    <div className={`app-canvas ${isMobileConversation ? 'mobile-view-chat' : ''}`}>
      {/* Hidden Native File Input for Background Upload */}
      <input
        ref={conversationFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleWallpaperUpload}
        className="hidden"
      />

      {/* ===================================================================== */}
      {/* 1. LEFT APPLE DOCK (Narrow 58px rounded panel)                        */}
      {/* ===================================================================== */}
      <nav className="apple-dock apple-panel">
        {/* Top: MARSHALL 'M' Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setActivePage('inbox')}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#007aff] to-[#005bb5] text-white flex items-center justify-center font-bold text-sm shadow-sm cursor-pointer"
            title="MARSHALL Home"
          >
            M
          </button>
          <div className="w-6 h-[1px] bg-black/10 dark:bg-white/10 my-0.5"></div>
        </div>

        {/* Center: Navigation Items */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActivePage('inbox')}
            className={`dock-item ds-icon-button ${activePage === 'inbox' ? 'active ds-nav-row-active' : ''}`}
            title={t.inbox}
          >
            <InboxIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActivePage('stats')}
            className={`dock-item ds-icon-button ${activePage === 'stats' ? 'active ds-nav-row-active' : ''}`}
            title={t.stats}
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActivePage('ai')}
            className={`dock-item ds-icon-button ${activePage === 'ai' ? 'active' : ''}`}
            title={t.aiAssistant}
          >
            <Bot className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActivePage('activity')}
            className={`dock-item ds-icon-button ${activePage === 'activity' ? 'active' : ''}`}
            title={t.activity}
          >
            <Activity className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActivePage('settings')}
            className={`dock-item ds-icon-button ${activePage === 'settings' ? 'active' : ''}`}
            title={t.settings}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom: Toggles & User Avatar */}
        <div className="flex flex-col items-center gap-2">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
            className="dock-item ds-icon-button text-[10px] font-mono font-bold"
            title={t.langToggle}
          >
            {lang.toUpperCase()}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="dock-item ds-icon-button"
            title={t.themeToggle}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Initials Avatar */}
          <div
            className="w-7 h-7 rounded-full bg-zinc-700 dark:bg-zinc-800 text-zinc-100 dark:text-zinc-200 flex items-center justify-center text-[10px] font-semibold select-none border border-black/10 dark:border-white/10"
            title="Alexey Marshall (You)"
          >
            AM
          </div>
        </div>
      </nav>

      {/* ===================================================================== */}
      {/* 2. INBOX WORKSPACE (Middle Inbox Panel + Right Conversation Panel)     */}
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

      {/* 3.2 AI ASSISTANT PAGE — 3-PANEL CONNECTED WORKSPACE */}
      {activePage === 'ai' && (
        <div className="ai-page-shell" id="ai-assistant-workspace-panel">
          {/* ================================================================= */}
          {/* PANEL TWO: AI SIDE PANEL (SETUP NAVIGATOR OR CONTROL PANEL)       */}
          {/* ================================================================= */}
          <aside className="ai-sidepanel apple-panel" aria-label={!aiSetupComplete ? "AI Setup Navigator" : "AI Control Panel"}>
            {!aiSetupComplete ? (
              /* A. AI SETUP NAVIGATOR (5 STEPS) */
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="ai-sidepanel-header">
                    <div className="ai-sidepanel-eyebrow">AI SETUP</div>
                    <h2 className="ai-sidepanel-title ds-panel-heading">Reply automation</h2>
                    <p className="ai-sidepanel-subtitle">Five steps. Nothing sends during setup.</p>
                  </div>

                  <nav className="ai-nav-list" aria-label="Setup steps">
                    {/* Step 1: Provider */}
                    <button
                      type="button"
                      onClick={() => setAiSetupStep(1)}
                      className={`ai-nav-step-row ds-nav-row ${aiSetupStep === 1 ? 'is-active ds-nav-row-active' : ''} ${aiSetupStep > 1 ? 'is-completed is-clickable' : ''}`}
                    >
                      <div className="ai-nav-step-num">
                        {aiSetupStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : '1'}
                      </div>
                      <div className="ai-nav-step-text">
                        <span className="ai-nav-step-title">Provider</span>
                        <span className="ai-nav-step-desc">
                          {aiProviderType === 'openai_compatible' ? 'OpenAI-compatible' : aiProviderType === 'gemini' ? 'Gemini API' : 'Custom API'}
                        </span>
                      </div>
                    </button>

                    {/* Step 2: Mailbox */}
                    <button
                      type="button"
                      onClick={() => {
                        if (aiSetupStep > 2) setAiSetupStep(2);
                      }}
                      className={`ai-nav-step-row ds-nav-row ${aiSetupStep === 2 ? 'is-active ds-nav-row-active' : ''} ${aiSetupStep > 2 ? 'is-completed is-clickable' : ''}`}
                    >
                      <div className="ai-nav-step-num">
                        {aiSetupStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : '2'}
                      </div>
                      <div className="ai-nav-step-text">
                        <span className="ai-nav-step-title">Mailbox</span>
                        <span className="ai-nav-step-desc">{aiSelectedMailbox}</span>
                      </div>
                    </button>

                    {/* Step 3: Playbook */}
                    <button
                      type="button"
                      onClick={() => {
                        if (aiSetupStep > 3) setAiSetupStep(3);
                      }}
                      className={`ai-nav-step-row ds-nav-row ${aiSetupStep === 3 ? 'is-active ds-nav-row-active' : ''} ${aiSetupStep > 3 ? 'is-completed is-clickable' : ''}`}
                    >
                      <div className="ai-nav-step-num">
                        {aiSetupStep > 3 ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : '3'}
                      </div>
                      <div className="ai-nav-step-text">
                        <span className="ai-nav-step-title">Playbook</span>
                        <span className="ai-nav-step-desc">
                          {aiReplyStyle === 'concise' ? 'Concise' : aiReplyStyle === 'friendly' ? 'Friendly' : 'Direct'} · Rules
                        </span>
                      </div>
                    </button>

                    {/* Step 4: Rules */}
                    <button
                      type="button"
                      onClick={() => {
                        if (aiSetupStep > 4) setAiSetupStep(4);
                      }}
                      className={`ai-nav-step-row ds-nav-row ${aiSetupStep === 4 ? 'is-active ds-nav-row-active' : ''} ${aiSetupStep > 4 ? 'is-completed is-clickable' : ''}`}
                    >
                      <div className="ai-nav-step-num">
                        {aiSetupStep > 4 ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : '4'}
                      </div>
                      <div className="ai-nav-step-text">
                        <span className="ai-nav-step-title">Rules</span>
                        <span className="ai-nav-step-desc">4 scenarios · 2 hard blocks</span>
                      </div>
                    </button>

                    {/* Step 5: Review */}
                    <button
                      type="button"
                      onClick={() => {
                        if (aiSetupStep === 5) setAiSetupStep(5);
                      }}
                      className={`ai-nav-step-row ds-nav-row ${aiSetupStep === 5 ? 'is-active ds-nav-row-active' : ''}`}
                    >
                      <div className="ai-nav-step-num">5</div>
                      <div className="ai-nav-step-text">
                        <span className="ai-nav-step-title">Review</span>
                        <span className="ai-nav-step-desc">Readiness summary</span>
                      </div>
                    </button>
                  </nav>
                </div>

                <div className="ai-sidepanel-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePage('inbox');
                      showToast('Setup progress preserved locally');
                    }}
                    className="text-xs font-medium text-[var(--secondary-text-secondary)] hover:text-[var(--secondary-text)] transition-colors text-left py-1"
                  >
                    Finish later
                  </button>
                  <div className="flex items-center gap-2 text-xs text-[var(--secondary-text-muted)] font-mono">
                    <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                    <span>Local setup preview</span>
                  </div>
                </div>
              </div>
            ) : (
              /* B. AI CONTROL PANEL (DASHBOARD MODE) */
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="ai-sidepanel-header">
                    <div className="ai-sidepanel-eyebrow">AI CONTROL</div>
                    <h2 className="ai-sidepanel-title ds-panel-heading">Reply automation</h2>
                    <div className="flex items-center justify-between mt-1">
                      <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs">
                        {aiOperatingMode === 'off' ? 'Off' : aiOperatingMode === 'drafts' ? 'Drafts' : aiOperatingMode === 'review' ? 'Review queue' : 'Autopilot'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--secondary-text-muted)] mt-1.5 font-sans">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        aiOperatingMode === 'off' ? 'bg-zinc-400' :
                        aiOperatingMode === 'drafts' ? 'bg-[var(--secondary-blue)]' :
                        aiOperatingMode === 'review' ? 'bg-indigo-500' : 'bg-amber-500'
                      }`}></span>
                      <span>
                        {aiOperatingMode === 'off' ? 'Automation paused' :
                         aiOperatingMode === 'drafts' ? 'Drafts ready' :
                         aiOperatingMode === 'review' ? 'Review queue active' : 'Background service not connected'}
                      </span>
                    </div>
                  </div>

                  <nav className="ai-nav-list" aria-label="AI Control sections">
                    {[
                      { id: 'overview', label: 'Overview', icon: Target },
                      { id: 'review', label: 'Review queue', icon: InboxIcon },
                      { id: 'provider', label: 'Provider', icon: Cpu },
                      { id: 'mailbox', label: 'Mailbox', icon: Mail },
                      { id: 'playbook', label: 'Playbook', icon: FileText },
                      { id: 'rules', label: 'Rules', icon: Shield },
                      { id: 'audit', label: 'Audit', icon: Activity },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeAiSection === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveAiSection(item.id as any);
                          }}
                          className={`ai-nav-step-row ds-nav-row is-clickable ${isSelected ? 'is-active ds-nav-row-active' : ''}`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="ai-nav-step-title">{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="ai-sidepanel-footer space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAiSetupComplete(false);
                      setAiSetupStep(1);
                    }}
                    className="secondary-button ds-btn ds-btn-secondary w-full justify-center text-xs py-2"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                    <span>Edit setup</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiResetModalOpen(true)}
                    className="w-full text-center text-xs py-1.5 text-red-500 hover:text-red-600 transition-colors font-medium cursor-pointer"
                  >
                    Reset AI setup
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* ================================================================= */}
          {/* PANEL THREE: AI WORKSPACE (WIZARD STEPS OR DASHBOARD)             */}
          {/* ================================================================= */}
          <main className="ai-workspace apple-panel ds-page-transition" aria-label="AI Workspace">
            {!aiSetupComplete ? (
              /* A. WIZARD STEP WORKSPACE */
              <div className="ai-workspace-inner">
                {/* Step Top Header with Progress */}
                <div className="ai-step-header">
                  <div className="ai-step-progress-row">
                    <span className="ai-step-badge ds-pill">Step {aiSetupStep} of 5</span>
                    <div className="ai-step-track">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div
                          key={s}
                          className={`ai-step-segment ${s <= aiSetupStep ? 'is-filled' : ''}`}
                        />
                      ))}
                    </div>
                  </div>

                  {aiSetupStep === 1 && (
                    <>
                      <h1 className="ai-step-title ds-panel-heading">Choose the AI that writes your replies</h1>
                      <p className="ai-step-subtitle">
                        Use your own provider account. MARSHALL never locks you to one model.
                      </p>
                    </>
                  )}

                  {aiSetupStep === 2 && (
                    <>
                      <h1 className="ai-step-title ds-panel-heading">Choose the mailbox AI will protect</h1>
                      <p className="ai-step-subtitle">
                        Incoming replies will be monitored here. You stay in control of every rule.
                      </p>
                    </>
                  )}

                  {aiSetupStep === 3 && (
                    <>
                      <h1 className="ai-step-title ds-panel-heading">Define what a good reply looks like</h1>
                      <p className="ai-step-subtitle">
                        Give AI approved context instead of one giant prompt.
                      </p>
                    </>
                  )}

                  {aiSetupStep === 4 && (
                    <>
                      <h1 className="ai-step-title ds-panel-heading">Tell AI when it may act</h1>
                      <p className="ai-step-subtitle">
                        Rules decide what happens next. The model never bypasses safety gates.
                      </p>
                    </>
                  )}

                  {aiSetupStep === 5 && (
                    <>
                      <h1 className="ai-step-title ds-panel-heading">Your automation is ready to review</h1>
                      <p className="ai-step-subtitle">
                        See exactly what AI can use and do before anything is ever sent.
                      </p>
                    </>
                  )}
                </div>

                {/* Step 1: Provider Content */}
                {aiSetupStep === 1 && (
                  <div className="ai-card ds-card space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* 1. OpenAI-compatible */}
                      <button
                        type="button"
                        onClick={() => {
                          setAiProviderType('openai_compatible');
                          setAiProviderName('OpenAI');
                          setAiModel('gpt-4o');
                        }}
                        className={`ai-provider-tile ${aiProviderType === 'openai_compatible' ? 'is-selected' : ''}`}
                      >
                        <div className="ai-tile-title">
                          <span>OpenAI-compatible</span>
                          {aiProviderType === 'openai_compatible' && <Check className="w-4 h-4 text-[var(--secondary-blue)]" />}
                        </div>
                        <p className="ai-tile-desc">OpenAI, DeepSeek and compatible providers</p>
                      </button>

                      {/* 2. Gemini */}
                      <button
                        type="button"
                        onClick={() => {
                          setAiProviderType('gemini');
                          setAiProviderName('Google Gemini');
                          setAiModel('gemini-1.5-pro');
                        }}
                        className={`ai-provider-tile ${aiProviderType === 'gemini' ? 'is-selected' : ''}`}
                      >
                        <div className="ai-tile-title">
                          <span>Gemini</span>
                          {aiProviderType === 'gemini' && <Check className="w-4 h-4 text-[var(--secondary-blue)]" />}
                        </div>
                        <p className="ai-tile-desc">Native Gemini API</p>
                      </button>

                      {/* 3. Custom API */}
                      <button
                        type="button"
                        onClick={() => {
                          setAiProviderType('custom');
                          setAiProviderName('Custom API Gateway');
                          setAiModel('custom-v1');
                        }}
                        className={`ai-provider-tile ${aiProviderType === 'custom' ? 'is-selected' : ''}`}
                      >
                        <div className="ai-tile-title">
                          <span>Custom API</span>
                          {aiProviderType === 'custom' && <Check className="w-4 h-4 text-[var(--secondary-blue)]" />}
                        </div>
                        <p className="ai-tile-desc">For a provider with its own request format</p>
                      </button>
                    </div>

                    {/* Form Fields for Selected Provider */}
                    <div className="space-y-4 pt-2 border-t border-[var(--secondary-stroke)]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="ai-form-group">
                          <label className="ai-label">Provider name</label>
                          <input
                            type="text"
                            value={aiProviderName}
                            onChange={(e) => setAiProviderName(e.target.value)}
                            className="ai-input ds-input"
                            placeholder="e.g. OpenAI, DeepSeek, Google"
                          />
                        </div>
                        <div className="ai-form-group">
                          <label className="ai-label">Model identifier</label>
                          <input
                            type="text"
                            value={aiModel}
                            onChange={(e) => setAiModel(e.target.value)}
                            className="ai-input ds-input"
                            placeholder="e.g. gpt-4o, gemini-1.5-pro"
                          />
                        </div>
                      </div>

                      {/* OpenAI-compatible Endpoint */}
                      {aiProviderType === 'openai_compatible' && (
                        <div className="ai-form-group">
                          <label className="ai-label">Base endpoint URL</label>
                          <input
                            type="text"
                            value={aiBaseEndpoint}
                            onChange={(e) => setAiBaseEndpoint(e.target.value)}
                            className="ai-input ds-input font-mono text-xs"
                            placeholder="https://api.openai.com/v1"
                          />
                        </div>
                      )}

                      {/* API Key Field (Masked with truthful helper) */}
                      <div className="ai-form-group">
                        <label className="ai-label">API Key</label>
                        <div className="relative">
                          <input
                            type={aiShowApiKey ? 'text' : 'password'}
                            value={aiApiKey}
                            onChange={(e) => setAiApiKey(e.target.value)}
                            className="ai-input ds-input pr-10 font-mono text-sm"
                            placeholder="sk-••••••••••••••••••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setAiShowApiKey(!aiShowApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--secondary-text-muted)] hover:text-[var(--secondary-text)]"
                            title={aiShowApiKey ? "Hide key" : "Show key"}
                          >
                            {aiShowApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="ai-sublabel">
                          Unsaved preview — secure provider connection will be added with the background service.
                        </p>
                      </div>

                      {/* Custom API Collapsed Advanced Disclosure */}
                      {aiProviderType === 'custom' && (
                        <div className="pt-2 border-t border-[var(--secondary-stroke)]">
                          <button
                            type="button"
                            onClick={() => setAiCustomSettingsOpen(!aiCustomSettingsOpen)}
                            className="flex items-center justify-between w-full py-2 text-sm font-semibold text-[var(--secondary-text)] hover:text-[var(--secondary-blue)] transition-colors"
                          >
                            <span>Custom API settings</span>
                            <ChevronRight className={`w-4 h-4 transition-transform ${aiCustomSettingsOpen ? 'rotate-90' : ''}`} />
                          </button>

                          {aiCustomSettingsOpen && (
                            <div className="space-y-3 pt-3">
                              <div className="ai-form-group">
                                <label className="ai-label">HTTPS Request URL</label>
                                <input
                                  type="text"
                                  value={aiCustomUrl}
                                  onChange={(e) => setAiCustomUrl(e.target.value)}
                                  className="ai-input ds-input font-mono text-xs"
                                  placeholder="https://api.gateway.io/v1/chat/completions"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="ai-form-group">
                                  <label className="ai-label">Auth Header Name &amp; Value</label>
                                  <input
                                    type="text"
                                    value={aiCustomAuthHeader}
                                    onChange={(e) => setAiCustomAuthHeader(e.target.value)}
                                    className="ai-input ds-input font-mono text-xs"
                                    placeholder="Authorization: Bearer <token>"
                                  />
                                </div>
                                <div className="ai-form-group">
                                  <label className="ai-label">Model Field Name</label>
                                  <input
                                    type="text"
                                    value={aiCustomModelField}
                                    onChange={(e) => setAiCustomModelField(e.target.value)}
                                    className="ai-input ds-input font-mono text-xs"
                                    placeholder="model"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="ai-form-group">
                                  <label className="ai-label">Request Template</label>
                                  <input
                                    type="text"
                                    value={aiCustomTemplate}
                                    onChange={(e) => setAiCustomTemplate(e.target.value)}
                                    className="ai-input ds-input font-mono text-xs"
                                    placeholder='{ "messages": [...] }'
                                  />
                                </div>
                                <div className="ai-form-group">
                                  <label className="ai-label">Response JSON Path</label>
                                  <input
                                    type="text"
                                    value={aiCustomResponsePath}
                                    onChange={(e) => setAiCustomResponsePath(e.target.value)}
                                    className="ai-input ds-input font-mono text-xs"
                                    placeholder="choices[0].message.content"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Test Connection Button & Honest Notice */}
                      <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setAiTestConnectionMessage('Provider testing will be available after the secure background service is connected.');
                          }}
                          className="secondary-button ds-btn ds-btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Test connection</span>
                        </button>

                        {aiTestConnectionMessage && (
                          <div className="text-xs text-[var(--secondary-amber)] bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                            {aiTestConnectionMessage}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Wizard Nav Bottom */}
                    <div className="flex items-center justify-end pt-4 border-t border-[var(--secondary-stroke)]">
                      <button
                        type="button"
                        onClick={() => setAiSetupStep(2)}
                        className="secondary-button secondary-button-primary ds-btn ds-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
                      >
                        <span>Continue to Mailbox</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Mailbox Content */}
                {aiSetupStep === 2 && (
                  <div className="ai-card ds-card space-y-6">
                    <div className="space-y-4">
                      <div className="ai-form-group">
                        <label className="ai-label">Mailbox identity</label>
                        <input
                          type="email"
                          value={aiSelectedMailbox}
                          onChange={(e) => setAiSelectedMailbox(e.target.value)}
                          className="ai-input ds-input text-sm"
                          placeholder="alexey@marshall.io"
                        />
                        <p className="ai-sublabel">The email address monitored for prospect replies.</p>
                      </div>

                      <div className="ai-form-group">
                        <label className="ai-label">Connection method</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setAiMailboxAuthType('imap_smtp')}
                            className={`ai-provider-tile ${aiMailboxAuthType === 'imap_smtp' ? 'is-selected' : ''}`}
                          >
                            <div className="ai-tile-title">
                              <span>IMAP + SMTP</span>
                              {aiMailboxAuthType === 'imap_smtp' && <Check className="w-4 h-4 text-[var(--secondary-blue)]" />}
                            </div>
                            <p className="ai-tile-desc">Standard secure mail server protocol (when available)</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAiMailboxAuthType('oauth')}
                            className={`ai-provider-tile ${aiMailboxAuthType === 'oauth' ? 'is-selected' : ''}`}
                          >
                            <div className="ai-tile-title">
                              <span>Provider OAuth</span>
                              {aiMailboxAuthType === 'oauth' && <Check className="w-4 h-4 text-[var(--secondary-blue)]" />}
                            </div>
                            <p className="ai-tile-desc">Google Workspace / Microsoft 365 (when available)</p>
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[var(--secondary-text)]">Status</span>
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-zinc text-xs">Not connected yet</span>
                        </div>
                        <p className="text-xs text-[var(--secondary-text-secondary)] leading-relaxed">
                          Credentials will be encrypted on your background server. This preview does not store them.
                        </p>
                      </div>
                    </div>

                    {/* Wizard Nav Bottom */}
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--secondary-stroke)]">
                      <button
                        type="button"
                        onClick={() => setAiSetupStep(1)}
                        className="secondary-button ds-btn ds-btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back to Provider</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiSetupStep(3)}
                        className="secondary-button secondary-button-primary ds-btn ds-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
                      >
                        <span>Continue to Playbook</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Playbook Content */}
                {aiSetupStep === 3 && (
                  <div className="ai-card ds-card space-y-6">
                    {/* 1. Reply Style */}
                    <div className="space-y-2">
                      <label className="ai-label">1. Reply style</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'concise', label: 'Concise', desc: 'Direct, minimal fluff, 2-3 sentences' },
                          { id: 'friendly', label: 'Friendly', desc: 'Warm, helpful, conversational' },
                          { id: 'direct', label: 'Direct', desc: 'Executive tone, focused strictly on next steps' },
                        ].map((style) => (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setAiReplyStyle(style.id as any)}
                            className={`ai-provider-tile ${aiReplyStyle === style.id ? 'is-selected' : ''}`}
                          >
                            <span className="font-semibold text-sm text-[var(--secondary-text)]">{style.label}</span>
                            <span className="text-xs text-[var(--secondary-text-secondary)]">{style.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Required Details */}
                    <div className="space-y-2">
                      <label className="ai-label">2. Required qualification details</label>
                      <p className="ai-sublabel">Select which fields the AI must clarify before proposing calendar booking:</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {[
                          'Full name',
                          'Company',
                          'Location',
                          'Delivery needs',
                          'Timeline',
                          'Team size',
                          'Current tool',
                          'Budget tier'
                        ].map((detail) => {
                          const isSelected = aiRequiredDetails.includes(detail);
                          return (
                            <button
                              key={detail}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setAiRequiredDetails(aiRequiredDetails.filter((d) => d !== detail));
                                } else {
                                  setAiRequiredDetails([...aiRequiredDetails, detail]);
                                }
                              }}
                              className={`ai-chip ${isSelected ? 'is-active' : ''}`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                              <span>{detail}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Approved Links */}
                    <div className="space-y-2">
                      <label className="ai-label">3. Approved links</label>
                      <p className="ai-sublabel">Only these approved URLs may be inserted into draft proposals:</p>
                      <div className="space-y-2">
                        {[
                          { name: 'Meeting Calendar', url: 'cal.com/marshall/demo', type: 'Booking' },
                          { name: 'Product Overview', url: 'marshall.io/overview', type: 'Deck' },
                          { name: 'Benchmark Report', url: 'marshall.io/benchmarks', type: 'Whitepaper' },
                        ].map((link, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)]"
                          >
                            <div className="flex items-center gap-3">
                              <LinkIcon className="w-4 h-4 text-[var(--secondary-blue)]" />
                              <span className="text-sm font-semibold text-[var(--secondary-text)]">{link.name}</span>
                              <span className="text-xs font-mono text-[var(--secondary-text-muted)]">{link.url}</span>
                            </div>
                            <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs">{link.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 4. Language Handling */}
                    <div className="space-y-2">
                      <label className="ai-label">4. Language handling</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'lead_language', label: "Use the lead's language" },
                          { id: 'always_english', label: 'Always English' },
                          { id: 'review_unfamiliar', label: 'Review unfamiliar language' },
                        ].map((langOpt) => (
                          <button
                            key={langOpt.id}
                            type="button"
                            onClick={() => setAiLanguageHandling(langOpt.id as any)}
                            className={`ai-chip justify-center ${aiLanguageHandling === langOpt.id ? 'is-active' : ''}`}
                          >
                            <span>{langOpt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 5. Expandable Context Preview */}
                    <div className="pt-2 border-t border-[var(--secondary-stroke)]">
                      <button
                        type="button"
                        onClick={() => setAiContextPreviewOpen(!aiContextPreviewOpen)}
                        className="flex items-center justify-between w-full py-2 text-sm font-semibold text-[var(--secondary-text)] hover:text-[var(--secondary-blue)] transition-colors"
                      >
                        <span>5. Context preview</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${aiContextPreviewOpen ? 'rotate-90' : ''}`} />
                      </button>

                      {aiContextPreviewOpen && (
                        <div className="p-4 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-2.5 text-xs text-[var(--secondary-text-secondary)]">
                          <p className="font-semibold text-sm text-[var(--secondary-text)] mb-2">Context packet sent to model:</p>
                          <div className="grid grid-cols-2 gap-2 font-mono">
                            <div>• Thread: Full email history</div>
                            <div>• Campaign: Active outreach lane</div>
                            <div>• Lead status: Inbound qualified</div>
                            <div>• Mailbox identity: {aiSelectedMailbox}</div>
                            <div className="col-span-2">• Approved links: 3 verified domains</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-lg bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] text-xs text-[var(--secondary-text-secondary)]">
                      AI will not invent links, terms, or details outside this playbook.
                    </div>

                    {/* Wizard Nav Bottom */}
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--secondary-stroke)]">
                      <button
                        type="button"
                        onClick={() => setAiSetupStep(2)}
                        className="secondary-button ds-btn ds-btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back to Mailbox</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiSetupStep(4)}
                        className="secondary-button secondary-button-primary ds-btn ds-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
                      >
                        <span>Continue to Rules</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Rules Content */}
                {aiSetupStep === 4 && (
                  <div className="ai-card ds-card space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="ai-card-title ds-panel-heading">Scenario action studio</h3>
                          <p className="ai-sublabel">Define what action is taken when prospect messages match these patterns:</p>
                        </div>
                        <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs">4 Scenarios</span>
                      </div>

                      {/* Scenario 1: New inbound question */}
                      <div className="ai-scenario-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="text-sm font-semibold text-[var(--secondary-text)]">New inbound question</div>
                            <div className="text-xs text-[var(--secondary-text-secondary)]">
                              Prepares a reply draft for review when prospect asks a clarifying product question.
                            </div>
                          </div>
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-zinc text-xs self-start sm:self-auto font-mono">
                            Action: {aiScenarioActions.inboundQuestion.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="ai-scenario-action-pills pt-2">
                          {[
                            { id: 'draft_only', label: 'Draft only', desc: 'Create editable draft in Inbox' },
                            { id: 'review_queue', label: 'Review queue', desc: 'Route to AI review queue' },
                            { id: 'auto_send', label: 'Auto-send allowed', desc: 'Requires background server' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                if (opt.id === 'auto_send') {
                                  setAiAutoSendNotice('Auto-send allowed is available only after the background server, verified mailbox and safety checks are connected.');
                                  return;
                                }
                                setAiScenarioActions({ ...aiScenarioActions, inboundQuestion: opt.id as any });
                              }}
                              className={`ai-scenario-pill ${aiScenarioActions.inboundQuestion === opt.id ? 'is-selected' : ''}`}
                            >
                              <span className="font-semibold text-xs">{opt.label}</span>
                              <span className="text-[11px] opacity-75">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scenario 2: Required details missing */}
                      <div className="ai-scenario-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="text-sm font-semibold text-[var(--secondary-text)]">Required details missing</div>
                            <div className="text-xs text-[var(--secondary-text-secondary)]">
                              Politely requests missing contact, timeline or delivery details before proposing demo.
                            </div>
                          </div>
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-amber text-xs self-start sm:self-auto font-mono">
                            Action: {aiScenarioActions.missingDetails.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="ai-scenario-action-pills pt-2">
                          {[
                            { id: 'ask_approved', label: 'Ask approved fields', desc: 'Politely clarify missing items' },
                            { id: 'draft_only', label: 'Draft only', desc: 'Create editable draft' },
                            { id: 'review_queue', label: 'Review queue', desc: 'Route to AI review queue' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setAiScenarioActions({ ...aiScenarioActions, missingDetails: opt.id as any });
                              }}
                              className={`ai-scenario-pill ${aiScenarioActions.missingDetails === opt.id ? 'is-selected' : ''}`}
                            >
                              <span className="font-semibold text-xs">{opt.label}</span>
                              <span className="text-[11px] opacity-75">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scenario 3: Required details complete */}
                      <div className="ai-scenario-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="text-sm font-semibold text-[var(--secondary-text)]">Required details complete</div>
                            <div className="text-xs text-[var(--secondary-text-secondary)]">
                              Routes fully qualified prospect answers to human review queue.
                            </div>
                          </div>
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs self-start sm:self-auto font-mono">
                            Action: {aiScenarioActions.completeDetails.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="ai-scenario-action-pills pt-2">
                          {[
                            { id: 'review_queue', label: 'Review queue', desc: 'Route to AI review queue' },
                            { id: 'draft_only', label: 'Draft only', desc: 'Create editable draft' },
                            { id: 'auto_send', label: 'Auto-send allowed', desc: 'Requires background server' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                if (opt.id === 'auto_send') {
                                  setAiAutoSendNotice('Auto-send allowed is available only after the background server, verified mailbox and safety checks are connected.');
                                  return;
                                }
                                setAiScenarioActions({ ...aiScenarioActions, completeDetails: opt.id as any });
                              }}
                              className={`ai-scenario-pill ${aiScenarioActions.completeDetails === opt.id ? 'is-selected' : ''}`}
                            >
                              <span className="font-semibold text-xs">{opt.label}</span>
                              <span className="text-[11px] opacity-75">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scenario 4: Meeting or demo request */}
                      <div className="ai-scenario-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="text-sm font-semibold text-[var(--secondary-text)]">Meeting or demo request</div>
                            <div className="text-xs text-[var(--secondary-text-secondary)]">
                              Prepares calendar booking draft and flags for manager confirmation.
                            </div>
                          </div>
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs self-start sm:self-auto font-mono">
                            Action: {aiScenarioActions.meetingRequest.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="ai-scenario-action-pills pt-2">
                          {[
                            { id: 'review_queue', label: 'Review queue', desc: 'Stage for human approval' },
                            { id: 'draft_only', label: 'Draft only', desc: 'Create calendar draft' },
                            { id: 'auto_send', label: 'Auto-send allowed', desc: 'Requires background server' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                if (opt.id === 'auto_send') {
                                  setAiAutoSendNotice('Auto-send allowed is available only after the background server, verified mailbox and safety checks are connected.');
                                  return;
                                }
                                setAiScenarioActions({ ...aiScenarioActions, meetingRequest: opt.id as any });
                              }}
                              className={`ai-scenario-pill ${aiScenarioActions.meetingRequest === opt.id ? 'is-selected' : ''}`}
                            >
                              <span className="font-semibold text-xs">{opt.label}</span>
                              <span className="text-[11px] opacity-75">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {aiAutoSendNotice && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--secondary-amber)] flex items-center justify-between">
                          <span>{aiAutoSendNotice}</span>
                          <button
                            type="button"
                            onClick={() => setAiAutoSendNotice(null)}
                            className="text-xs underline ml-2 cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Permanent Hard-Block Rows */}
                    <div className="space-y-3 pt-3 border-t border-[var(--secondary-stroke)]">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-500" />
                        <h3 className="ai-card-title ds-panel-heading text-amber-600 dark:text-amber-400">Hard safety blocks</h3>
                      </div>

                      <div className="ai-rule-locked-row">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[var(--secondary-text)] flex items-center gap-2">
                            <span>Opt-out or complaint</span>
                            <Lock className="w-3.5 h-3.5 text-[var(--secondary-text-muted)]" />
                          </div>
                          <div className="text-xs text-[var(--secondary-text-secondary)]">
                            Immediate stop on unsubscribe or negative requests. Never sends an automated message.
                          </div>
                        </div>
                        <span className="secondary-badge ds-pill ds-status-pill secondary-badge-red text-xs">Never reply</span>
                      </div>

                      <div className="ai-rule-locked-row">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[var(--secondary-text)] flex items-center gap-2">
                            <span>Legal, payment, security, or high-risk concern</span>
                            <Lock className="w-3.5 h-3.5 text-[var(--secondary-text-muted)]" />
                          </div>
                          <div className="text-xs text-[var(--secondary-text-secondary)]">
                            Flags compliance, invoice, or contract queries directly to human operator.
                          </div>
                        </div>
                        <span className="secondary-badge ds-pill ds-status-pill secondary-badge-amber text-xs">Needs review</span>
                      </div>

                      <p className="text-xs text-[var(--secondary-text-secondary)] italic">
                        Hard safety blocks stay active in every mode.
                      </p>
                    </div>

                    {/* Wizard Nav Bottom */}
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--secondary-stroke)]">
                      <button
                        type="button"
                        onClick={() => setAiSetupStep(3)}
                        className="secondary-button ds-btn ds-btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back to Playbook</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiSetupStep(5)}
                        className="secondary-button secondary-button-primary ds-btn ds-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
                      >
                        <span>Continue to Review</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 5: Review Content */}
                {aiSetupStep === 5 && (
                  <div className="ai-card ds-card space-y-6">
                    <div className="space-y-4">
                      <h3 className="ai-card-title ds-panel-heading">Readiness summary</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1">
                          <div className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">Provider</div>
                          <div className="text-sm font-semibold text-[var(--secondary-text)]">
                            {aiProviderType === 'openai_compatible' ? 'OpenAI-compatible' : aiProviderType === 'gemini' ? 'Gemini API' : 'Custom API'}
                          </div>
                          <div className="text-xs font-mono text-[var(--secondary-text-secondary)]">{aiModel}</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1">
                          <div className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">Mailbox</div>
                          <div className="text-sm font-semibold text-[var(--secondary-text)]">{aiSelectedMailbox}</div>
                          <div className="text-xs text-[var(--secondary-text-secondary)]">IMAP/SMTP lane</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1">
                          <div className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">Playbook</div>
                          <div className="text-sm font-semibold text-[var(--secondary-text)]">
                            {aiReplyStyle === 'concise' ? 'Concise' : aiReplyStyle === 'friendly' ? 'Friendly' : 'Direct'} · Lead's language
                          </div>
                          <div className="text-xs text-[var(--secondary-text-secondary)]">{aiRequiredDetails.length} qualification fields</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1">
                          <div className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">Rules &amp; Safety</div>
                          <div className="text-sm font-semibold text-[var(--secondary-text)]">4 scenario rules active</div>
                          <div className="text-xs text-[var(--secondary-text-secondary)]">2 locked hard blocks</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[var(--secondary-text)]">Background server status</span>
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-zinc text-xs">Not connected yet</span>
                        </div>
                        <div className="text-xs text-[var(--secondary-text-secondary)] leading-relaxed">
                          Current mode: <strong className="text-[var(--secondary-text)]">Review queue</strong>. AI can prepare and classify replies only after the secure service is connected. Autopilot remains unavailable until then.
                        </div>
                      </div>
                    </div>

                    {/* Wizard Nav Bottom */}
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--secondary-stroke)]">
                      <button
                        type="button"
                        onClick={() => setAiSetupStep(4)}
                        className="secondary-button ds-btn ds-btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back to Rules</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiSetupComplete(true);
                          showToast('AI reply automation configured in local preview');
                        }}
                        className="secondary-button secondary-button-primary ds-btn ds-btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-semibold"
                      >
                        <Bot className="w-4 h-4" />
                        <span>Open AI dashboard</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* B. DASHBOARD WORKSPACE WITH SECTION SWITCHING */
              <div className="ai-workspace-inner ai-workspace-view-enter">
                {/* Header & Apple-style Segmented Mode Control */}
                <div className="ai-step-header">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="ai-sidepanel-eyebrow">AI CONTROL · {activeAiSection.toUpperCase()}</div>
                      <h1 className="ai-step-title ds-panel-heading">
                        {activeAiSection === 'overview' && 'Automation overview'}
                        {activeAiSection === 'review' && 'Review queue'}
                        {activeAiSection === 'provider' && 'Model & provider settings'}
                        {activeAiSection === 'mailbox' && 'Mailbox & sync lane'}
                        {activeAiSection === 'playbook' && 'Playbook & context rules'}
                        {activeAiSection === 'rules' && 'Scenario action studio'}
                        {activeAiSection === 'audit' && 'Audit log & decisions'}
                      </h1>
                      <p className="ai-step-subtitle">Monitored lane: {aiSelectedMailbox}</p>
                    </div>

                    {/* Mode Control Group */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="ai-mode-control-group ds-segmented" role="group" aria-label="AI Operating Mode">
                        <button
                          type="button"
                          onClick={() => {
                            setAiOperatingMode('off');
                            showToast('AI automation mode set to Off');
                          }}
                          className={`ai-mode-btn ds-segmented-option ${aiOperatingMode === 'off' ? 'is-active is-selected' : ''}`}
                        >
                          Off
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAiOperatingMode('drafts');
                            showToast('AI automation mode set to Drafts');
                          }}
                          className={`ai-mode-btn ds-segmented-option ${aiOperatingMode === 'drafts' ? 'is-active is-selected' : ''}`}
                        >
                          Drafts
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAiOperatingMode('review');
                            showToast('AI automation mode set to Review queue');
                          }}
                          className={`ai-mode-btn ds-segmented-option ${aiOperatingMode === 'review' ? 'is-active is-selected' : ''}`}
                        >
                          Review queue
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAiAutopilotNotice('Autopilot requires a live background server, verified mailbox authentication, and active SPF/DKIM verification.');
                          }}
                          className="ai-mode-btn ds-segmented-option is-locked"
                          title="Autopilot requires background connection"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Autopilot</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mode Status Banner */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    aiOperatingMode === 'off'
                      ? 'bg-zinc-500/10 border-zinc-500/20 text-[var(--secondary-text-secondary)]'
                      : aiOperatingMode === 'drafts'
                      ? 'bg-blue-500/10 border-blue-500/20 text-[var(--secondary-blue)]'
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        aiOperatingMode === 'off' ? 'bg-zinc-400' :
                        aiOperatingMode === 'drafts' ? 'bg-[var(--secondary-blue)]' : 'bg-indigo-500'
                      }`}></span>
                      <span>
                        {aiOperatingMode === 'off' && 'Automation is paused. Inbound messages will not generate drafts.'}
                        {aiOperatingMode === 'drafts' && 'Drafts mode active: AI prepares private responses in conversation threads.'}
                        {aiOperatingMode === 'review' && 'Review queue active: AI categorizes and stages prospect replies for approval.'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono opacity-80">Local preview</span>
                  </div>

                  {aiAutopilotNotice && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--secondary-amber)] flex items-center justify-between">
                      <span>{aiAutopilotNotice}</span>
                      <button
                        type="button"
                        onClick={() => setAiAutopilotNotice(null)}
                        className="text-xs underline ml-2 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* 1. SECTION: OVERVIEW                                          */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeAiSection === 'overview' && (
                  <div className="space-y-5 ai-workspace-view-enter">
                    {/* Automation Flow Strip */}
                    <div className="ai-flow-strip ds-card">
                      <div className="flex items-center justify-between text-xs text-[var(--secondary-text-muted)]">
                        <span className="font-semibold uppercase tracking-wider">Decision Flow</span>
                        <span>Click any stage to inspect guardrails</span>
                      </div>

                      <div className="ai-flow-strip-nodes">
                        <button
                          type="button"
                          onClick={() => setAiSelectedFlowNode(1)}
                          className={`ai-flow-node ${aiSelectedFlowNode === 1 ? 'is-active' : ''}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>1. Inbound reply</span>
                        </button>

                        <span className="ai-flow-arrow">→</span>

                        <button
                          type="button"
                          onClick={() => setAiSelectedFlowNode(2)}
                          className={`ai-flow-node ${aiSelectedFlowNode === 2 ? 'is-active' : ''}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>2. Approved playbook</span>
                        </button>

                        <span className="ai-flow-arrow">→</span>

                        <button
                          type="button"
                          onClick={() => setAiSelectedFlowNode(3)}
                          className={`ai-flow-node ${aiSelectedFlowNode === 3 ? 'is-active' : ''}`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>3. Rule check</span>
                        </button>

                        <span className="ai-flow-arrow">→</span>

                        <button
                          type="button"
                          onClick={() => setAiSelectedFlowNode(4)}
                          className={`ai-flow-node ${aiSelectedFlowNode === 4 ? 'is-active' : ''}`}
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>4. Draft / Queue</span>
                        </button>
                      </div>

                      {/* Explanation Box */}
                      <div className="ai-flow-explain-box">
                        {aiSelectedFlowNode === 1 && (
                          <span>1. <strong>Inbound reply</strong>: Monitors prospect messages on <code>{aiSelectedMailbox}</code>. Extracted intent is mapped to qualification criteria.</span>
                        )}
                        {aiSelectedFlowNode === 2 && (
                          <span>2. <strong>Approved playbook</strong>: Strict grounding on verified links, tone profile ({aiReplyStyle}), and {aiRequiredDetails.length} qualification fields.</span>
                        )}
                        {aiSelectedFlowNode === 3 && (
                          <span>3. <strong>Rule check</strong>: Evaluates 4 scenario actions and 2 locked hard safety blocks before generating output.</span>
                        )}
                        {aiSelectedFlowNode === 4 && (
                          <span>4. <strong>Draft / Queue</strong>: Staged into the Review Queue for human confirmation. Autopilot sending is locked in preview.</span>
                        )}
                      </div>
                    </div>

                    {/* Automation Today Card */}
                    <div className="ai-card ds-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="ai-card-title ds-panel-heading">Automation today</h3>
                          <div className="text-2xl font-bold text-[var(--secondary-text)] mt-1">3 Queued for Review</div>
                        </div>
                        <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs">Ready for action</span>
                      </div>

                      <p className="text-sm text-[var(--secondary-text-secondary)] leading-relaxed">
                        MARSHALL has classified 3 recent prospect inquiries based on your scenario rules. Review drafts before they dispatch.
                      </p>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveAiSection('review')}
                          className="secondary-button secondary-button-primary ds-btn ds-btn-primary text-xs py-2 px-4 flex items-center gap-2"
                        >
                          <InboxIcon className="w-3.5 h-3.5" />
                          <span>Open review queue</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveAiSection('rules')}
                          className="secondary-button ds-btn ds-btn-secondary text-xs py-2 px-4"
                        >
                          <span>Adjust rules</span>
                        </button>
                      </div>
                    </div>

                    {/* Secondary Two-Column Region */}
                    <div className="ai-dash-grid">
                      {/* Safety & Rules Summary */}
                      <div className="ai-dash-card ds-card">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">
                            <Shield className="w-4 h-4 text-[var(--secondary-blue)]" />
                            <span>Safety &amp; Rules</span>
                          </div>
                          <div className="text-sm font-semibold text-[var(--secondary-text)]">
                            4 scenarios enabled · 2 hard blocks always on
                          </div>
                          <p className="text-xs text-[var(--secondary-text-secondary)] leading-relaxed">
                            Opt-outs and high-risk legal queries are permanently blocked from auto-replies.
                          </p>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => setActiveAiSection('rules')}
                            className="secondary-button ds-btn ds-btn-secondary text-xs py-1.5 px-3"
                          >
                            Scenario studio →
                          </button>
                        </div>
                      </div>

                      {/* Context Pack Summary */}
                      <div className="ai-dash-card ds-card">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">
                            <Layers className="w-4 h-4 text-[var(--secondary-blue)]" />
                            <span>Context pack</span>
                          </div>
                          <div className="text-xs text-[var(--secondary-text-secondary)] font-mono space-y-1">
                            <div>• Thread history &amp; Campaign lane</div>
                            <div>• Tone: {aiReplyStyle}</div>
                            <div>• Fields: {aiRequiredDetails.slice(0, 3).join(', ')}...</div>
                          </div>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => setActiveAiSection('playbook')}
                            className="secondary-button ds-btn ds-btn-secondary text-xs py-1.5 px-3"
                          >
                            Playbook details →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Rule Simulator */}
                    <div className="ai-card ds-card space-y-4">
                      <div>
                        <h3 className="ai-card-title ds-panel-heading">Test a rule</h3>
                        <p className="ai-sublabel">Preview how MARSHALL evaluates inbound replies in real time.</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setAiTestRuleScenario('meeting')}
                          className={`ai-test-rule-chip ${aiTestRuleScenario === 'meeting' ? 'is-active' : ''}`}
                        >
                          <span>Meeting request</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiTestRuleScenario('missing')}
                          className={`ai-test-rule-chip ${aiTestRuleScenario === 'missing' ? 'is-active' : ''}`}
                        >
                          <span>Missing details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiTestRuleScenario('optout')}
                          className={`ai-test-rule-chip ${aiTestRuleScenario === 'optout' ? 'is-active' : ''}`}
                        >
                          <span>Opt-out</span>
                        </button>
                      </div>

                      <div className="p-4 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">Resulting Action</span>
                          {aiTestRuleScenario === 'meeting' && (
                            <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs">Review queue draft</span>
                          )}
                          {aiTestRuleScenario === 'missing' && (
                            <span className="secondary-badge ds-pill ds-status-pill secondary-badge-amber text-xs">Ask approved fields</span>
                          )}
                          {aiTestRuleScenario === 'optout' && (
                            <span className="secondary-badge ds-pill ds-status-pill secondary-badge-red text-xs">Never reply (Hard block)</span>
                          )}
                        </div>

                        <p className="text-sm font-medium text-[var(--secondary-text)]">
                          {aiTestRuleScenario === 'meeting' && 'AI prepares a calendar link draft and flags for manager confirmation.'}
                          {aiTestRuleScenario === 'missing' && 'AI politely clarifies team size and delivery timeline without sending links.'}
                          {aiTestRuleScenario === 'optout' && 'Hard safety block triggered. Automation halts immediately.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* 2. SECTION: REVIEW QUEUE                                      */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeAiSection === 'review' && (
                  <div className="space-y-4 ai-workspace-view-enter">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAiReviewQueueFilter('all')}
                          className={`ai-chip ${aiReviewQueueFilter === 'all' ? 'is-active' : ''}`}
                        >
                          <span>All (3)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiReviewQueueFilter('pending')}
                          className={`ai-chip ${aiReviewQueueFilter === 'pending' ? 'is-active' : ''}`}
                        >
                          <span>Pending (2)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiReviewQueueFilter('clarification')}
                          className={`ai-chip ${aiReviewQueueFilter === 'clarification' ? 'is-active' : ''}`}
                        >
                          <span>Clarification (1)</span>
                        </button>
                      </div>
                      <span className="text-xs text-[var(--secondary-text-muted)] font-mono">
                        Mailbox: {aiSelectedMailbox}
                      </span>
                    </div>

                    {/* Review Cards */}
                    <div className="space-y-3">
                      {/* Item 1 */}
                      <div className="ai-card ds-card space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[var(--secondary-blue)] text-white flex items-center justify-center font-bold text-xs">
                              MR
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--secondary-text)]">Marcus Reed</div>
                              <div className="text-xs text-[var(--secondary-text-secondary)]">TechLead at CloudFlow · Outbound Lane 2</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs">Meeting Request</span>
                            <span className="text-xs text-[var(--secondary-text-muted)] font-mono">12m ago</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1">
                          <div className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">Prospect said:</div>
                          <p className="text-xs text-[var(--secondary-text)] italic">
                            "Looks promising. Do you have 15 minutes this Thursday afternoon to walk through the dashboard?"
                          </p>
                        </div>

                        <div className="p-3.5 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-[var(--secondary-blue)] uppercase tracking-wider">Proposed AI Draft:</div>
                            <span className="text-[11px] text-[var(--secondary-text-muted)]">Rule: Meeting or demo request</span>
                          </div>
                          <p className="text-xs text-[var(--secondary-text)] leading-relaxed">
                            "Hi Marcus, Thursday afternoon works great. Feel free to pick a time directly on our demo calendar here: <code>cal.com/marshall/demo</code>. Looking forward to showing you the system!"
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              showToast('Draft approved and dispatched to Marcus Reed');
                            }}
                            className="secondary-button secondary-button-primary ds-btn ds-btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve &amp; Send</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActivePage('inbox');
                              showToast('Opened conversation in Inbox');
                            }}
                            className="secondary-button ds-btn ds-btn-secondary text-xs py-1.5 px-3"
                          >
                            <span>Edit in Inbox</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => showToast('Draft dismissed')}
                            className="secondary-button ds-btn text-xs py-1.5 px-3 text-red-500 hover:text-red-600"
                          >
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="ai-card ds-card space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                              SL
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--secondary-text)]">Sara Lindqvist</div>
                              <div className="text-xs text-[var(--secondary-text-secondary)]">Operations at NordLogistics · Enterprise Lane</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="secondary-badge ds-pill ds-status-pill secondary-badge-amber text-xs">Missing Details</span>
                            <span className="text-xs text-[var(--secondary-text-muted)] font-mono">45m ago</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1">
                          <div className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">Prospect said:</div>
                          <p className="text-xs text-[var(--secondary-text)] italic">
                            "Can you send over pricing for a team of 40 across Europe?"
                          </p>
                        </div>

                        <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-[var(--secondary-amber)] uppercase tracking-wider">Proposed AI Draft:</div>
                            <span className="text-[11px] text-[var(--secondary-text-muted)]">Rule: Required details missing</span>
                          </div>
                          <p className="text-xs text-[var(--secondary-text)] leading-relaxed">
                            "Hi Sara, absolutely. For 40 seats in Europe, our Enterprise tier includes dedicated dispatch nodes. Could you share your expected deployment timeline so I can format the precise quote?"
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => showToast('Draft approved and dispatched to Sara Lindqvist')}
                            className="secondary-button secondary-button-primary ds-btn ds-btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve &amp; Send</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActivePage('inbox');
                              showToast('Opened conversation in Inbox');
                            }}
                            className="secondary-button ds-btn ds-btn-secondary text-xs py-1.5 px-3"
                          >
                            <span>Edit in Inbox</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* 3. SECTION: PROVIDER SETTINGS                                 */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeAiSection === 'provider' && (
                  <div className="ai-card ds-card space-y-6 ai-workspace-view-enter">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="ai-card-title ds-panel-heading">LLM Provider Configuration</h3>
                          <p className="ai-sublabel">MARSHALL connects directly to your chosen inference endpoint.</p>
                        </div>
                        <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs font-mono">{aiProviderName}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setAiProviderType('openai_compatible');
                            setAiProviderName('OpenAI');
                            setAiModel('gpt-4o');
                          }}
                          className={`ai-provider-tile ${aiProviderType === 'openai_compatible' ? 'is-selected' : ''}`}
                        >
                          <span className="font-semibold text-sm text-[var(--secondary-text)]">OpenAI-compatible</span>
                          <span className="text-xs text-[var(--secondary-text-secondary)]">gpt-4o, DeepSeek, Claude API</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAiProviderType('gemini');
                            setAiProviderName('Gemini API');
                            setAiModel('gemini-2.5-flash');
                          }}
                          className={`ai-provider-tile ${aiProviderType === 'gemini' ? 'is-selected' : ''}`}
                        >
                          <span className="font-semibold text-sm text-[var(--secondary-text)]">Gemini API</span>
                          <span className="text-xs text-[var(--secondary-text-secondary)]">Gemini 2.5 Flash / Pro</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAiProviderType('custom');
                            setAiProviderName('Custom API');
                          }}
                          className={`ai-provider-tile ${aiProviderType === 'custom' ? 'is-selected' : ''}`}
                        >
                          <span className="font-semibold text-sm text-[var(--secondary-text)]">Custom API</span>
                          <span className="text-xs text-[var(--secondary-text-secondary)]">Self-hosted vLLM or Ollama</span>
                        </button>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="ai-form-group">
                            <label className="ai-label">Model Identifier</label>
                            <input
                              type="text"
                              value={aiModel}
                              onChange={(e) => setAiModel(e.target.value)}
                              className="ai-input ds-input font-mono text-xs"
                            />
                          </div>
                          <div className="ai-form-group">
                            <label className="ai-label">Base URL</label>
                            <input
                              type="text"
                              value={aiBaseEndpoint}
                              onChange={(e) => setAiBaseEndpoint(e.target.value)}
                              className="ai-input ds-input font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div className="ai-form-group">
                          <label className="ai-label">API Key (Stored locally)</label>
                          <input
                            type="password"
                            value={aiApiKey}
                            onChange={(e) => setAiApiKey(e.target.value)}
                            placeholder="sk-••••••••••••••••"
                            className="ai-input ds-input font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setAiTestConnectionMessage('Connection check simulated successfully. Provider configuration is valid.');
                          }}
                          className="secondary-button ds-btn ds-btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Test provider connection</span>
                        </button>

                        {aiTestConnectionMessage && (
                          <div className="text-xs text-[var(--secondary-teal)] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                            {aiTestConnectionMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* 4. SECTION: MAILBOX & SYNC                                    */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeAiSection === 'mailbox' && (
                  <div className="ai-card ds-card space-y-6 ai-workspace-view-enter">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="ai-card-title ds-panel-heading">Mailbox Lane &amp; Safety Limits</h3>
                          <p className="ai-sublabel">Define which inbox receives AI attention and configure sending throttles.</p>
                        </div>
                        <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs">Active Lane</span>
                      </div>

                      <div className="ai-form-group">
                        <label className="ai-label">Primary Monitored Mailbox</label>
                        <input
                          type="email"
                          value={aiSelectedMailbox}
                          onChange={(e) => setAiSelectedMailbox(e.target.value)}
                          className="ai-input ds-input text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1">
                          <div className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">Sync Protocol</div>
                          <div className="text-sm font-semibold text-[var(--secondary-text)]">{aiMailboxAuthType === 'imap_smtp' ? 'IMAP + SMTP Lane' : 'OAuth 2.0'}</div>
                          <div className="text-xs text-[var(--secondary-text-secondary)]">Encrypted TLS port 993/587</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1">
                          <div className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">Hourly Throttle Cap</div>
                          <div className="text-sm font-semibold text-[var(--secondary-text)]">Max 25 drafts / hour</div>
                          <div className="text-xs text-[var(--secondary-text-secondary)]">Prevents mailbox quota exhaustion</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[var(--secondary-text)]">Background Sync Status</span>
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-zinc text-xs">Local Sandbox</span>
                        </div>
                        <p className="text-xs text-[var(--secondary-text-secondary)]">
                          Connect your backend service to begin polling IMAP IDLE notifications in real time.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* 5. SECTION: PLAYBOOK                                          */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeAiSection === 'playbook' && (
                  <div className="ai-card ds-card space-y-6 ai-workspace-view-enter">
                    <div className="space-y-4">
                      <div>
                        <h3 className="ai-card-title ds-panel-heading">Playbook Rules &amp; Approved Context</h3>
                        <p className="ai-sublabel">Strict boundaries ensure AI never invents links or details.</p>
                      </div>

                      {/* Reply Style */}
                      <div className="space-y-2">
                        <label className="ai-label">1. Reply Style</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { id: 'concise', label: 'Concise', desc: 'Direct, 2-3 sentences max' },
                            { id: 'friendly', label: 'Friendly', desc: 'Warm, collaborative, helpful' },
                            { id: 'direct', label: 'Direct', desc: 'Executive tone, focused on next steps' },
                          ].map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setAiReplyStyle(s.id as any)}
                              className={`ai-provider-tile ${aiReplyStyle === s.id ? 'is-selected' : ''}`}
                            >
                              <span className="font-semibold text-sm text-[var(--secondary-text)]">{s.label}</span>
                              <span className="text-xs text-[var(--secondary-text-secondary)]">{s.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Required Qualification Details */}
                      <div className="space-y-2">
                        <label className="ai-label">2. Required Qualification Details</label>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            'Full name',
                            'Company',
                            'Location',
                            'Delivery needs',
                            'Timeline',
                            'Team size',
                            'Current tool',
                            'Budget tier'
                          ].map((detail) => {
                            const isSelected = aiRequiredDetails.includes(detail);
                            return (
                              <button
                                key={detail}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setAiRequiredDetails(aiRequiredDetails.filter((d) => d !== detail));
                                  } else {
                                    setAiRequiredDetails([...aiRequiredDetails, detail]);
                                  }
                                }}
                                className={`ai-chip ${isSelected ? 'is-active' : ''}`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                <span>{detail}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Approved Links */}
                      <div className="space-y-2">
                        <label className="ai-label">3. Approved Links</label>
                        <div className="space-y-2">
                          {[
                            { name: 'Demo Booking', url: 'cal.com/marshall/demo' },
                            { name: 'Product Deck', url: 'marshall.io/overview' },
                            { name: 'Benchmark Whitepaper', url: 'marshall.io/benchmarks' },
                          ].map((l, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)]">
                              <div className="flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-[var(--secondary-blue)]" />
                                <span className="text-sm font-semibold text-[var(--secondary-text)]">{l.name}</span>
                                <span className="text-xs font-mono text-[var(--secondary-text-muted)]">{l.url}</span>
                              </div>
                              <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs">Verified</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* 6. SECTION: RULES (SCENARIO ACTION STUDIO)                    */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeAiSection === 'rules' && (
                  <div className="ai-card ds-card space-y-6 ai-workspace-view-enter">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="ai-card-title ds-panel-heading">Scenario Action Studio</h3>
                          <p className="ai-sublabel">Tactile rule mapping for incoming prospect messages.</p>
                        </div>
                        <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs">4 Active Rules</span>
                      </div>

                      {/* Scenario 1 */}
                      <div className="ai-scenario-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-[var(--secondary-text)]">New inbound question</div>
                            <div className="text-xs text-[var(--secondary-text-secondary)]">Prepares a reply draft when a prospect asks a clarifying product question.</div>
                          </div>
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-zinc text-xs font-mono">
                            Action: {aiScenarioActions.inboundQuestion.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="ai-scenario-action-pills pt-2">
                          {[
                            { id: 'draft_only', label: 'Draft only', desc: 'Create editable draft in Inbox' },
                            { id: 'review_queue', label: 'Review queue', desc: 'Route to AI review queue' },
                            { id: 'auto_send', label: 'Auto-send allowed', desc: 'Requires background server' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                if (opt.id === 'auto_send') {
                                  setAiAutoSendNotice('Auto-send allowed is available only after the background server is connected.');
                                  return;
                                }
                                setAiScenarioActions({ ...aiScenarioActions, inboundQuestion: opt.id as any });
                              }}
                              className={`ai-scenario-pill ${aiScenarioActions.inboundQuestion === opt.id ? 'is-selected' : ''}`}
                            >
                              <span className="font-semibold text-xs">{opt.label}</span>
                              <span className="text-[11px] opacity-75">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scenario 2 */}
                      <div className="ai-scenario-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-[var(--secondary-text)]">Required details missing</div>
                            <div className="text-xs text-[var(--secondary-text-secondary)]">Politely clarifies contact, timeline or delivery details before proposing demo.</div>
                          </div>
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-amber text-xs font-mono">
                            Action: {aiScenarioActions.missingDetails.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="ai-scenario-action-pills pt-2">
                          {[
                            { id: 'ask_approved', label: 'Ask approved fields', desc: 'Politely clarify missing items' },
                            { id: 'draft_only', label: 'Draft only', desc: 'Create editable draft' },
                            { id: 'review_queue', label: 'Review queue', desc: 'Route to AI review queue' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setAiScenarioActions({ ...aiScenarioActions, missingDetails: opt.id as any })}
                              className={`ai-scenario-pill ${aiScenarioActions.missingDetails === opt.id ? 'is-selected' : ''}`}
                            >
                              <span className="font-semibold text-xs">{opt.label}</span>
                              <span className="text-[11px] opacity-75">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scenario 3 */}
                      <div className="ai-scenario-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-[var(--secondary-text)]">Required details complete</div>
                            <div className="text-xs text-[var(--secondary-text-secondary)]">Routes fully qualified prospect answers to review queue.</div>
                          </div>
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs font-mono">
                            Action: {aiScenarioActions.completeDetails.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="ai-scenario-action-pills pt-2">
                          {[
                            { id: 'review_queue', label: 'Review queue', desc: 'Route to AI review queue' },
                            { id: 'draft_only', label: 'Draft only', desc: 'Create editable draft' },
                            { id: 'auto_send', label: 'Auto-send allowed', desc: 'Requires background server' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                if (opt.id === 'auto_send') {
                                  setAiAutoSendNotice('Auto-send allowed is available only after the background server is connected.');
                                  return;
                                }
                                setAiScenarioActions({ ...aiScenarioActions, completeDetails: opt.id as any });
                              }}
                              className={`ai-scenario-pill ${aiScenarioActions.completeDetails === opt.id ? 'is-selected' : ''}`}
                            >
                              <span className="font-semibold text-xs">{opt.label}</span>
                              <span className="text-[11px] opacity-75">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scenario 4 */}
                      <div className="ai-scenario-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-[var(--secondary-text)]">Meeting or demo request</div>
                            <div className="text-xs text-[var(--secondary-text-secondary)]">Prepares calendar booking draft and flags for manager confirmation.</div>
                          </div>
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs font-mono">
                            Action: {aiScenarioActions.meetingRequest.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="ai-scenario-action-pills pt-2">
                          {[
                            { id: 'review_queue', label: 'Review queue', desc: 'Stage for human approval' },
                            { id: 'draft_only', label: 'Draft only', desc: 'Create calendar draft' },
                            { id: 'auto_send', label: 'Auto-send allowed', desc: 'Requires background server' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                if (opt.id === 'auto_send') {
                                  setAiAutoSendNotice('Auto-send allowed is available only after the background server is connected.');
                                  return;
                                }
                                setAiScenarioActions({ ...aiScenarioActions, meetingRequest: opt.id as any });
                              }}
                              className={`ai-scenario-pill ${aiScenarioActions.meetingRequest === opt.id ? 'is-selected' : ''}`}
                            >
                              <span className="font-semibold text-xs">{opt.label}</span>
                              <span className="text-[11px] opacity-75">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hard Safety Blocks */}
                      <div className="space-y-3 pt-3 border-t border-[var(--secondary-stroke)]">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-amber-500" />
                          <h3 className="ai-card-title ds-panel-heading text-amber-600 dark:text-amber-400">Hard safety blocks</h3>
                        </div>

                        <div className="ai-rule-locked-row">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="text-sm font-semibold text-[var(--secondary-text)] flex items-center gap-2">
                              <span>Opt-out or complaint</span>
                              <Lock className="w-3.5 h-3.5 text-[var(--secondary-text-muted)]" />
                            </div>
                            <div className="text-xs text-[var(--secondary-text-secondary)]">Immediate stop on unsubscribe. Never replies automatically.</div>
                          </div>
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-red text-xs">Never reply</span>
                        </div>

                        <div className="ai-rule-locked-row">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="text-sm font-semibold text-[var(--secondary-text)] flex items-center gap-2">
                              <span>Legal, payment, security, or high-risk concern</span>
                              <Lock className="w-3.5 h-3.5 text-[var(--secondary-text-muted)]" />
                            </div>
                            <div className="text-xs text-[var(--secondary-text-secondary)]">Flags compliance or billing queries to human operator.</div>
                          </div>
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-amber text-xs">Needs review</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* 7. SECTION: AUDIT LOG                                         */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeAiSection === 'audit' && (
                  <div className="ai-card ds-card space-y-4 ai-workspace-view-enter">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="ai-card-title ds-panel-heading">Audit Trail &amp; Safety Records</h3>
                        <p className="ai-sublabel">Every automated categorization and draft event is permanently recorded.</p>
                      </div>
                      <span className="secondary-badge ds-pill ds-status-pill secondary-badge-zinc text-xs">3 Records</span>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { time: '14:23:10', lead: 'Marcus Reed', event: 'Draft Staged', rule: 'Meeting or demo request', status: 'Review queue' },
                        { time: '13:58:04', lead: 'Sara Lindqvist', event: 'Clarification Draft', rule: 'Required details missing', status: 'Review queue' },
                        { time: '11:15:22', lead: 'David Vance', event: 'Hard Safety Block', rule: 'Opt-out phrase detected', status: 'Stopped' },
                      ].map((rec, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[var(--secondary-text-muted)]">{rec.time}</span>
                            <span className="font-semibold text-[var(--secondary-text)]">{rec.lead}</span>
                            <span className="text-[var(--secondary-text-secondary)]">{rec.event}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[var(--secondary-text-muted)] italic">{rec.rule}</span>
                            <span className={`secondary-badge ds-pill ds-status-pill text-[11px] ${rec.status === 'Stopped' ? 'secondary-badge-red' : 'secondary-badge-blue ds-pill-blue'}`}>
                              {rec.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ================================================================= */}
          {/* RIGHT-SIDE AI WORKSPACE RAIL (GUIDANCE, TEMPLATES, ASK AI)        */}
          {/* ================================================================= */}
          {aiSetupComplete && (
            <aside className="ai-right-rail apple-panel" aria-label="AI Workspace Rail">
              <div className="space-y-4 flex-1">
                {/* Tab Group */}
                <div className="ai-rail-tab-group ds-segmented" role="tablist">
                  <button
                    type="button"
                    onClick={() => setAiRightRailTab('guidance')}
                    className={`ai-rail-tab-btn ds-segmented-option ${aiRightRailTab === 'guidance' ? 'is-active is-selected' : ''}`}
                  >
                    Guidance
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiRightRailTab('templates')}
                    className={`ai-rail-tab-btn ds-segmented-option ${aiRightRailTab === 'templates' ? 'is-active is-selected' : ''}`}
                  >
                    Templates
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiRightRailTab('ask')}
                    className={`ai-rail-tab-btn ds-segmented-option ${aiRightRailTab === 'ask' ? 'is-active is-selected' : ''}`}
                  >
                    Ask AI
                  </button>
                </div>

                {/* Tab: Guidance */}
                {aiRightRailTab === 'guidance' && (
                  <div className="space-y-3 ai-workspace-view-enter text-xs text-[var(--secondary-text-secondary)]">
                    <div className="p-3 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1.5">
                      <div className="font-semibold text-xs text-[var(--secondary-text)] flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[var(--secondary-blue)]" />
                        <span>Safety First Automation</span>
                      </div>
                      <p className="leading-relaxed">
                        In Review Queue mode, MARSHALL never sends emails without human inspection. You retain 100% control over outbound communications.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1.5">
                      <div className="font-semibold text-xs text-[var(--secondary-text)] flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Scenario Precision</span>
                      </div>
                      <p className="leading-relaxed">
                        Configure exact qualification fields in Playbook. Prospects with missing information will be gently asked to clarify before receiving calendar links.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab: Templates */}
                {aiRightRailTab === 'templates' && (
                  <div className="space-y-2.5 ai-workspace-view-enter">
                    <div className="text-[11px] font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">
                      Preset Playbooks
                    </div>

                    {[
                      {
                        title: 'SaaS Demo Booking',
                        style: 'concise',
                        fields: ['Company', 'Team size', 'Timeline'],
                        desc: 'Optimized for high-velocity software demos.'
                      },
                      {
                        title: 'Enterprise Qualification',
                        style: 'friendly',
                        fields: ['Full name', 'Company', 'Delivery needs', 'Budget tier'],
                        desc: 'Multi-criteria qualification for large deals.'
                      },
                      {
                        title: 'Consulting Discovery',
                        style: 'direct',
                        fields: ['Company', 'Timeline', 'Current tool'],
                        desc: 'Focused on next steps and advisory alignment.'
                      }
                    ].map((tpl, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-2">
                        <div>
                          <div className="font-semibold text-xs text-[var(--secondary-text)]">{tpl.title}</div>
                          <div className="text-[11px] text-[var(--secondary-text-secondary)]">{tpl.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAiReplyStyle(tpl.style as any);
                            setAiRequiredDetails(tpl.fields);
                            showToast(`Applied preset: ${tpl.title}`);
                          }}
                          className="secondary-button ds-btn ds-btn-secondary text-[11px] py-1 px-2.5 w-full justify-center"
                        >
                          Apply Preset
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab: Ask AI */}
                {aiRightRailTab === 'ask' && (
                  <div className="space-y-3 ai-workspace-view-enter text-xs">
                    <div className="p-3 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] text-[var(--secondary-text-secondary)] leading-relaxed">
                      Ask any question about playbook rules, email qualification, or safety guardrails.
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="e.g. How do hard blocks work?"
                        className="ai-input ds-input text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            showToast('Guardrail response: Hard blocks intercept sensitive phrases before any LLM prompt is constructed.');
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <div className="text-[11px] text-[var(--secondary-text-muted)] text-center">
                        Press Enter to query assistant
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--secondary-stroke)] flex items-center justify-between text-[11px] text-[var(--secondary-text-muted)] font-mono">
                <span>AI Workspace Rail</span>
                <span>Active</span>
              </div>
            </aside>
          )}

          {/* Reset Setup Confirmation Modal */}
          {aiResetModalOpen && (
            <div className="campaign-modal-backdrop" onClick={() => setAiResetModalOpen(false)}>
              <div className="campaign-modal ds-modal-sheet p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[var(--secondary-text)] ds-panel-heading">Reset AI setup?</h3>
                  <button
                    type="button"
                    onClick={() => setAiResetModalOpen(false)}
                    className="text-[var(--secondary-text-muted)] hover:text-[var(--secondary-text)] ds-icon-button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-[var(--secondary-text-secondary)] leading-relaxed">
                  Reset provider, mailbox, playbook, and local rules? Existing email history and campaigns will not be changed.
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAiResetModalOpen(false)}
                    className="secondary-button ds-btn ds-btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAiSetupComplete(false);
                      setAiSetupStep(1);
                      setAiProviderType('openai_compatible');
                      setAiProviderName('OpenAI');
                      setAiModel('gpt-4o');
                      setAiApiKey('');
                      setAiBaseEndpoint('https://api.openai.com/v1');
                      setAiSelectedMailbox('alexey@marshall.io');
                      setAiMailboxAuthType('imap_smtp');
                      setAiReplyStyle('concise');
                      setAiRequiredDetails(['Full name', 'Company', 'Location', 'Delivery needs']);
                      setAiLanguageHandling('lead_language');
                      setAiScenarioActions({
                        inboundQuestion: 'draft_only',
                        missingDetails: 'ask_approved',
                        completeDetails: 'review_queue',
                        meetingRequest: 'review_queue'
                      });
                      setAiOperatingMode('review');
                      setActiveAiSection('overview');
                      setAiResetModalOpen(false);
                      showToast('AI setup reset to defaults');
                    }}
                    className="secondary-button ds-btn ds-btn-destructive text-xs py-2 px-4 font-semibold"
                  >
                    Reset setup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3.3 ACTIVITY FEED PAGE */}
      {activePage === 'activity' && (
        <section className="secondary-panel apple-panel ds-page-transition">
          <div className="secondary-panel-inner space-y-6">
            <div className="secondary-page-header flex items-center justify-between">
              <div>
                <h2 className="secondary-page-title ds-panel-heading">{t.activityFeed}</h2>
                <p className="secondary-page-subtitle">
                  Real-time chronological events from all outbound channels
                </p>
              </div>
              <span className="text-xs font-mono" style={{ color: 'var(--secondary-text-muted)' }}>Last event: 2 mins ago</span>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-3">
              {MOCK_ACTIVITIES.map((act) => (
                <div
                  key={act.id}
                  className="secondary-surface ds-card p-4 flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-none font-bold text-xs" style={{ backgroundColor: 'rgba(0, 122, 255, 0.12)', color: 'var(--secondary-blue)' }}>
                    {act.leadName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color: 'var(--secondary-text)' }}>
                        {act.leadName}
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'var(--secondary-text-muted)' }}>{act.time}</span>
                    </div>
                    <p className="secondary-supporting-text text-sm mt-0.5">
                      {act.description}
                    </p>
                  </div>
                </div>
              ))}
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
