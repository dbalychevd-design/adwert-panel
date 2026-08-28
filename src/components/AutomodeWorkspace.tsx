import React, { useState, useEffect } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
  Shield,
  Bot,
  Mail,
  FileText,
  Sliders,
  AlertTriangle,
  Link as LinkIcon,
  HelpCircle,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { I18N } from '../i18n/translations';

export interface AutomodeState {
  // Navigation / Step
  currentStep: number; // 1: Connect, 2: Teach, 3: Boundaries, 4: Readiness Summary
  
  // Step 1: Connect
  providerType: 'openai_compatible' | 'gemini' | 'custom';
  providerName: string;
  model: string;
  apiKey: string;
  baseEndpoint: string;
  customUrl: string;
  customAuthHeader: string;
  customModelField: string;
  customTemplate: string;
  customResponsePath: string;
  selectedMailbox: string;
  mailboxAuthType: 'imap_smtp' | 'oauth';
  
  // Step 2: Teach Playbook
  replyStyle: 'concise' | 'friendly' | 'direct';
  requiredDetails: string[];
  approvedLinks: Array<{ name: string; url: string; type: string }>;
  languageHandling: 'lead_language' | 'always_english' | 'review_unfamiliar';
  customInstructions: string;
  
  // Step 3: Boundaries & Deal Controls
  scenarioActions: {
    inboundQuestion: 'draft_only' | 'review_queue' | 'auto_send';
    missingDetails: 'ask_approved' | 'draft_only' | 'review_queue';
    completeDetails: 'review_queue' | 'draft_only' | 'auto_send';
    meetingRequest: 'review_queue' | 'draft_only' | 'auto_send';
  };
  confidenceThreshold: number;
  dealControls: {
    flagCompetitorMentions: boolean;
    flagCustomPricing: boolean;
    flagAmbiguousIntent: boolean;
    maxDailyDrafts: number;
  };
  
  // Simulation / Dashboard
  testRuleScenario: 'meeting' | 'missing' | 'optout' | 'pricing';
  operatingMode: 'off' | 'drafts' | 'review';
  isConfigured: boolean;
}

export const DEFAULT_AUTOMODE_STATE: AutomodeState = {
  currentStep: 1,
  providerType: 'openai_compatible',
  providerName: 'OpenAI',
  model: 'gpt-4o',
  apiKey: '',
  baseEndpoint: 'https://api.openai.com/v1',
  customUrl: 'https://api.gateway.io/v1/chat/completions',
  customAuthHeader: 'Authorization: Bearer <token>',
  customModelField: 'model',
  customTemplate: '{ "messages": [...] }',
  customResponsePath: 'choices[0].message.content',
  selectedMailbox: 'alexey@marshall.io',
  mailboxAuthType: 'imap_smtp',
  
  replyStyle: 'concise',
  requiredDetails: ['Full name', 'Company', 'Location', 'Delivery needs'],
  approvedLinks: [
    { name: 'Meeting Calendar', url: 'cal.com/marshall/demo', type: 'Booking' },
    { name: 'Product Overview', url: 'marshall.io/overview', type: 'Deck' },
    { name: 'Benchmark Report', url: 'marshall.io/benchmarks', type: 'Whitepaper' }
  ],
  languageHandling: 'lead_language',
  customInstructions: 'Focus strictly on clarifying qualification details. Never promise custom discounts without approval.',
  
  scenarioActions: {
    inboundQuestion: 'draft_only',
    missingDetails: 'ask_approved',
    completeDetails: 'review_queue',
    meetingRequest: 'review_queue'
  },
  confidenceThreshold: 85,
  dealControls: {
    flagCompetitorMentions: true,
    flagCustomPricing: true,
    flagAmbiguousIntent: true,
    maxDailyDrafts: 50
  },
  
  testRuleScenario: 'meeting',
  operatingMode: 'review',
  isConfigured: false
};

const STORAGE_KEY = 'marshall.automode.preview.v1';

interface AutomodeWorkspaceProps {
  lang: 'en' | 'ru';
  theme: 'dark' | 'light';
  onFinishLater?: () => void;
  showToast: (message: string) => void;
}

export function AutomodeWorkspace({
  lang,
  theme,
  onFinishLater,
  showToast
}: AutomodeWorkspaceProps) {
  const t = I18N[lang] || I18N.en;

  // Initialize from LocalStorage
  const [state, setState] = useState<AutomodeState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_AUTOMODE_STATE, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_AUTOMODE_STATE;
  });

  // Transient local UI state
  const [showApiKey, setShowApiKey] = useState(false);
  const [testConnectionNotice, setTestConnectionNotice] = useState<string | null>(null);
  const [autopilotLockedNotice, setAutopilotLockedNotice] = useState<string | null>(null);
  const [customSettingsOpen, setCustomSettingsOpen] = useState(false);
  const [contextPreviewOpen, setContextPreviewOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  
  // Custom link modal/form
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState('Booking');
  const [showAddLink, setShowAddLink] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  const updateState = (updates: Partial<AutomodeState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleReset = () => {
    setState(DEFAULT_AUTOMODE_STATE);
    setResetModalOpen(false);
    showToast(t.automodeResetSuccess || 'Automode setup reset to defaults');
  };

  const handleAddLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;
    updateState({
      approvedLinks: [
        ...state.approvedLinks,
        { name: newLinkName.trim(), url: newLinkUrl.trim(), type: newLinkType }
      ]
    });
    setNewLinkName('');
    setNewLinkUrl('');
    setShowAddLink(false);
    showToast(t.linkAdded || 'Approved link added');
  };

  const handleRemoveLink = (index: number) => {
    const updated = [...state.approvedLinks];
    updated.splice(index, 1);
    updateState({ approvedLinks: updated });
    showToast(t.linkRemoved || 'Approved link removed');
  };

  const handleTestConnection = () => {
    setTestConnectionNotice(
      t.automodeTestNotice ||
        'Provider testing will be available after the secure background service is connected.'
    );
  };

  const handleAutoSendClick = () => {
    setAutopilotLockedNotice(
      t.automodeAutopilotNotice ||
        'Auto-send allowed is available only after background server, verified mailbox, and safety checks are connected.'
    );
  };

  return (
    <div className="ai-page-shell" id="automode-workspace-root">
      {/* ===================================================================== */}
      {/* 1. LEFT NAVIGATION PANEL (STEPS OR QUICK JUMP)                         */}
      {/* ===================================================================== */}
      <aside className="ai-sidepanel apple-panel" aria-label="Automode Setup Navigator">
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-3">
            <div className="ai-sidepanel-header">
              <div className="ai-sidepanel-eyebrow">{t.automodeSetupEyebrow || 'AUTOMODE SETUP'}</div>
              <h2 className="ai-sidepanel-title ds-panel-heading">{t.automodeTitle || 'Reply automation'}</h2>
              <p className="ai-sidepanel-subtitle">{t.automodeSubtitle || 'Truthful local preview. Nothing sends during setup.'}</p>
            </div>

            {/* Operating Mode Status Banner */}
            <div className="ai-sidepanel-status-block">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">{t.operatingModeLabel || 'Mode'}</span>
                <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-[11px]">
                  {state.operatingMode === 'off' ? (t.modeOff || 'Off') : state.operatingMode === 'drafts' ? (t.modeDrafts || 'Drafts') : (t.modeReview || 'Review queue')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--secondary-text-secondary)] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"></span>
                <span className="truncate">{state.selectedMailbox}</span>
              </div>
            </div>

            {/* Navigation Step Rows */}
            <nav className="ai-nav-list" aria-label="Setup stages">
              {/* Step 1: Connect */}
              <button
                type="button"
                onClick={() => updateState({ currentStep: 1 })}
                className={`ai-nav-step-row ds-nav-row is-clickable ${state.currentStep === 1 ? 'is-active ds-nav-row-active' : ''} ${state.currentStep > 1 ? 'is-completed' : ''}`}
              >
                <div className="ai-nav-step-num">
                  {state.currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : '1'}
                </div>
                <div className="ai-nav-step-text">
                  <span className="ai-nav-step-title">{t.stepConnectTitle || '1. Connect'}</span>
                  <span className="ai-nav-step-desc">
                    {state.providerType === 'openai_compatible'
                      ? 'OpenAI / Compatible'
                      : state.providerType === 'gemini'
                      ? 'Gemini API'
                      : 'Custom Gateway'}
                  </span>
                </div>
              </button>

              {/* Step 2: Teach Playbook */}
              <button
                type="button"
                onClick={() => updateState({ currentStep: 2 })}
                className={`ai-nav-step-row ds-nav-row is-clickable ${state.currentStep === 2 ? 'is-active ds-nav-row-active' : ''} ${state.currentStep > 2 ? 'is-completed' : ''}`}
              >
                <div className="ai-nav-step-num">
                  {state.currentStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : '2'}
                </div>
                <div className="ai-nav-step-text">
                  <span className="ai-nav-step-title">{t.stepTeachTitle || '2. Teach Playbook'}</span>
                  <span className="ai-nav-step-desc">
                    {state.replyStyle === 'concise'
                      ? 'Concise'
                      : state.replyStyle === 'friendly'
                      ? 'Friendly'
                      : 'Direct'} · {state.requiredDetails.length} fields
                  </span>
                </div>
              </button>

              {/* Step 3: Boundaries & Deal Controls */}
              <button
                type="button"
                onClick={() => updateState({ currentStep: 3 })}
                className={`ai-nav-step-row ds-nav-row is-clickable ${state.currentStep === 3 ? 'is-active ds-nav-row-active' : ''} ${state.currentStep > 3 ? 'is-completed' : ''}`}
              >
                <div className="ai-nav-step-num">
                  {state.currentStep > 3 ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : '3'}
                </div>
                <div className="ai-nav-step-text">
                  <span className="ai-nav-step-title">{t.stepBoundariesTitle || '3. Boundaries'}</span>
                  <span className="ai-nav-step-desc">4 scenarios · 2 hard blocks</span>
                </div>
              </button>

              {/* Step 4: Summary & Readiness */}
              <button
                type="button"
                onClick={() => updateState({ currentStep: 4 })}
                className={`ai-nav-step-row ds-nav-row is-clickable ${state.currentStep === 4 ? 'is-active ds-nav-row-active' : ''}`}
              >
                <div className="ai-nav-step-num">4</div>
                <div className="ai-nav-step-text">
                  <span className="ai-nav-step-title">{t.stepReadinessTitle || '4. Readiness'}</span>
                  <span className="ai-nav-step-desc">{t.stepReadinessSubtitle || 'Simulation & Review'}</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Sidepanel Footer */}
          <div className="ai-sidepanel-footer space-y-2">
            <button
              type="button"
              onClick={() => {
                if (onFinishLater) {
                  onFinishLater();
                }
                showToast(t.setupPreserved || 'Setup progress preserved locally');
              }}
              className="text-xs font-medium text-[var(--secondary-text-secondary)] hover:text-[var(--secondary-text)] transition-colors text-left py-1"
            >
              ← {t.finishLater || 'Finish later'}
            </button>

            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="text-xs font-medium text-rose-500 hover:text-rose-400 transition-colors text-left flex items-center gap-1.5 cursor-pointer pt-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetAiSetup || 'Reset setup to defaults'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* 2. MAIN CENTER WORKSPACE (WIZARD STEPS)                               */}
      {/* ===================================================================== */}
      <main className="ai-workspace apple-panel ds-page-transition" aria-label="Automode Workspace Content">
        <div className="ai-workspace-inner ai-workspace-view-enter">
          {/* Header & Progress Indicator */}
          <div className="ai-step-header">
            <div className="ai-step-progress-row">
              <span className="ai-step-badge ds-pill">
                {t.stepBadgeLabel || 'Stage'} {state.currentStep} {t.ofFour || 'of 4'}
              </span>
              <div className="ai-step-track">
                {[1, 2, 3, 4].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateState({ currentStep: s })}
                    className={`ai-step-segment ${s <= state.currentStep ? 'is-filled' : ''} cursor-pointer hover:opacity-80`}
                    title={`Go to Stage ${s}`}
                  />
                ))}
              </div>
            </div>

            {state.currentStep === 1 && (
              <>
                <h1 className="ai-step-title ds-panel-heading">{t.stage1Title || 'Connect model & mailbox'}</h1>
                <p className="ai-step-subtitle">
                  {t.stage1Subtitle || 'Select your LLM inference provider and the outreach lane that MARSHALL will monitor.'}
                </p>
              </>
            )}

            {state.currentStep === 2 && (
              <>
                <h1 className="ai-step-title ds-panel-heading">{t.stage2Title || 'Teach your reply playbook'}</h1>
                <p className="ai-step-subtitle">
                  {t.stage2Subtitle || 'Define tone, required qualification fields, approved links, and language handling.'}
                </p>
              </>
            )}

            {state.currentStep === 3 && (
              <>
                <h1 className="ai-step-title ds-panel-heading">{t.stage3Title || 'Boundaries & deal controls'}</h1>
                <p className="ai-step-subtitle">
                  {t.stage3Subtitle || 'Configure scenario routing, hard safety blocks, and risk thresholds.'}
                </p>
              </>
            )}

            {state.currentStep === 4 && (
              <>
                <h1 className="ai-step-title ds-panel-heading">{t.stage4Title || 'Readiness summary & simulation'}</h1>
                <p className="ai-step-subtitle">
                  {t.stage4Subtitle || 'Inspect your grounded setup and test rule triggers in real time.'}
                </p>
              </>
            )}
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STAGE 1: CONNECT                                              */}
          {/* ───────────────────────────────────────────────────────────── */}
          {state.currentStep === 1 && (
            <div className="space-y-6">
              {/* Provider Selection Tile Grid */}
              <div className="ai-card ds-card space-y-5">
                <div className="space-y-1">
                  <h3 className="ai-card-title ds-panel-heading">{t.selectProviderHeading || '1. AI Provider & Model'}</h3>
                  <p className="ai-sublabel">{t.selectProviderDesc || 'Use your existing account or private endpoint. You are never locked into one provider.'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* OpenAI-Compatible */}
                  <button
                    type="button"
                    onClick={() =>
                      updateState({
                        providerType: 'openai_compatible',
                        providerName: 'OpenAI',
                        model: 'gpt-4o',
                        baseEndpoint: 'https://api.openai.com/v1'
                      })
                    }
                    className={`ai-provider-tile ${state.providerType === 'openai_compatible' ? 'is-selected' : ''}`}
                  >
                    <div className="ai-tile-title">
                      <span>OpenAI-compatible</span>
                      {state.providerType === 'openai_compatible' && <Check className="w-4 h-4 text-[var(--secondary-blue)]" />}
                    </div>
                    <p className="ai-tile-desc">OpenAI (GPT-4o), DeepSeek-V3, Groq, or Together</p>
                  </button>

                  {/* Gemini API */}
                  <button
                    type="button"
                    onClick={() =>
                      updateState({
                        providerType: 'gemini',
                        providerName: 'Google Gemini',
                        model: 'gemini-1.5-pro',
                        baseEndpoint: 'https://generativelanguage.googleapis.com'
                      })
                    }
                    className={`ai-provider-tile ${state.providerType === 'gemini' ? 'is-selected' : ''}`}
                  >
                    <div className="ai-tile-title">
                      <span>Google Gemini</span>
                      {state.providerType === 'gemini' && <Check className="w-4 h-4 text-[var(--secondary-blue)]" />}
                    </div>
                    <p className="ai-tile-desc">Gemini 1.5 Pro, Flash, or 2.0 Flash</p>
                  </button>

                  {/* Custom API */}
                  <button
                    type="button"
                    onClick={() =>
                      updateState({
                        providerType: 'custom',
                        providerName: 'Custom API Gateway',
                        model: 'custom-v1'
                      })
                    }
                    className={`ai-provider-tile ${state.providerType === 'custom' ? 'is-selected' : ''}`}
                  >
                    <div className="ai-tile-title">
                      <span>Custom Gateway</span>
                      {state.providerType === 'custom' && <Check className="w-4 h-4 text-[var(--secondary-blue)]" />}
                    </div>
                    <p className="ai-tile-desc">Internal enterprise proxy or self-hosted server</p>
                  </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-4 pt-3 border-t border-[var(--secondary-stroke)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="ai-form-group">
                      <label className="ai-label">{t.providerNameLabel || 'Provider name'}</label>
                      <input
                        type="text"
                        value={state.providerName}
                        onChange={(e) => updateState({ providerName: e.target.value })}
                        className="ai-input ds-input"
                        placeholder="e.g. OpenAI, DeepSeek, Google"
                      />
                    </div>

                    <div className="ai-form-group">
                      <label className="ai-label">{t.modelIdLabel || 'Model identifier'}</label>
                      <input
                        type="text"
                        value={state.model}
                        onChange={(e) => updateState({ model: e.target.value })}
                        className="ai-input ds-input font-mono text-sm"
                        placeholder="e.g. gpt-4o, gemini-1.5-pro, deepseek-chat"
                      />
                    </div>
                  </div>

                  {/* Base endpoint */}
                  {state.providerType === 'openai_compatible' && (
                    <div className="ai-form-group">
                      <label className="ai-label">{t.baseEndpointLabel || 'Base endpoint URL'}</label>
                      <input
                        type="text"
                        value={state.baseEndpoint}
                        onChange={(e) => updateState({ baseEndpoint: e.target.value })}
                        className="ai-input ds-input font-mono text-xs"
                        placeholder="https://api.openai.com/v1"
                      />
                    </div>
                  )}

                  {/* API Key field (masked preview) */}
                  <div className="ai-form-group">
                    <label className="ai-label">{t.apiKeyLabel || 'API Key'}</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={state.apiKey}
                        onChange={(e) => updateState({ apiKey: e.target.value })}
                        className="ai-input ds-input pr-10 font-mono text-sm"
                        placeholder="sk-••••••••••••••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--secondary-text-muted)] hover:text-[var(--secondary-text)] cursor-pointer"
                        title={showApiKey ? 'Hide key' : 'Show key'}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="ai-sublabel text-[11.5px] text-[var(--secondary-text-muted)] flex items-center gap-1.5 mt-1">
                      <Info className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{t.apiKeyDisclaimer || 'Unsaved preview — secure provider connection will be added with the background service.'}</span>
                    </p>
                  </div>

                  {/* Custom API Accordion */}
                  {state.providerType === 'custom' && (
                    <div className="pt-2 border-t border-[var(--secondary-stroke)]">
                      <button
                        type="button"
                        onClick={() => setCustomSettingsOpen(!customSettingsOpen)}
                        className="flex items-center justify-between w-full py-2 text-sm font-semibold text-[var(--secondary-text)] hover:text-[var(--secondary-blue)] transition-colors cursor-pointer"
                      >
                        <span>{t.customApiAdvanced || 'Advanced Custom API settings'}</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${customSettingsOpen ? 'rotate-90' : ''}`} />
                      </button>

                      {customSettingsOpen && (
                        <div className="space-y-3 pt-3">
                          <div className="ai-form-group">
                            <label className="ai-label">HTTPS Request URL</label>
                            <input
                              type="text"
                              value={state.customUrl}
                              onChange={(e) => updateState({ customUrl: e.target.value })}
                              className="ai-input ds-input font-mono text-xs"
                              placeholder="https://api.gateway.io/v1/chat/completions"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="ai-form-group">
                              <label className="ai-label">Auth Header Name &amp; Value</label>
                              <input
                                type="text"
                                value={state.customAuthHeader}
                                onChange={(e) => updateState({ customAuthHeader: e.target.value })}
                                className="ai-input ds-input font-mono text-xs"
                                placeholder="Authorization: Bearer <token>"
                              />
                            </div>
                            <div className="ai-form-group">
                              <label className="ai-label">Model Field Name</label>
                              <input
                                type="text"
                                value={state.customModelField}
                                onChange={(e) => updateState({ customModelField: e.target.value })}
                                className="ai-input ds-input font-mono text-xs"
                                placeholder="model"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Test Connection Action */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      className="secondary-button ds-btn ds-btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t.testConnectionBtn || 'Test connection'}</span>
                    </button>

                    {testConnectionNotice && (
                      <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{testConnectionNotice}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mailbox Selection Card */}
              <div className="ai-card ds-card space-y-4">
                <div className="space-y-1">
                  <h3 className="ai-card-title ds-panel-heading">{t.mailboxHeading || '2. Monitored Mailbox Lane'}</h3>
                  <p className="ai-sublabel">{t.mailboxDesc || 'Inbound prospect messages on this account will be evaluated by your playbook.'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="ai-form-group">
                    <label className="ai-label">{t.mailboxAddressLabel || 'Monitored address'}</label>
                    <select
                      value={state.selectedMailbox}
                      onChange={(e) => updateState({ selectedMailbox: e.target.value })}
                      className="ai-input ds-input font-mono text-sm"
                    >
                      <option value="alexey@marshall.io">alexey@marshall.io (Primary)</option>
                      <option value="outreach@marshall.io">outreach@marshall.io</option>
                      <option value="growth@marshall.io">growth@marshall.io</option>
                    </select>
                  </div>

                  <div className="ai-form-group">
                    <label className="ai-label">{t.connectionMethodLabel || 'Sync Protocol'}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateState({ mailboxAuthType: 'imap_smtp' })}
                        className={`ai-chip justify-center text-xs ${state.mailboxAuthType === 'imap_smtp' ? 'is-active' : ''}`}
                      >
                        <span>IMAP / SMTP</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateState({ mailboxAuthType: 'oauth' })}
                        className={`ai-chip justify-center text-xs ${state.mailboxAuthType === 'oauth' ? 'is-active' : ''}`}
                      >
                        <span>OAuth (Google/MS)</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1.5 text-xs text-[var(--secondary-text-secondary)]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--secondary-text)]">{t.syncLaneStatus || 'Sync status'}</span>
                    <span className="secondary-badge ds-pill ds-status-pill secondary-badge-zinc text-[10px]">
                      {t.localPreviewBadge || 'Local preview'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {t.syncDisclaimer ||
                      'Mail credentials will be securely encrypted on your background server. This local preview operates on your current inbox data without connecting live SMTP.'}
                  </p>
                </div>
              </div>

              {/* Wizard Nav Bottom */}
              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => updateState({ currentStep: 2 })}
                  className="secondary-button secondary-button-primary ds-btn ds-btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-semibold"
                >
                  <span>{t.continueToTeach || 'Continue to Teach Playbook'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STAGE 2: TEACH PLAYBOOK                                       */}
          {/* ───────────────────────────────────────────────────────────── */}
          {state.currentStep === 2 && (
            <div className="space-y-6">
              <div className="ai-card ds-card space-y-6">
                {/* 1. Reply Style */}
                <div className="space-y-2">
                  <label className="ai-label">{t.replyStyleLabel || '1. Reply tone & length profile'}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'concise',
                        label: t.toneConciseTitle || 'Concise',
                        desc: t.toneConciseDesc || 'Direct, minimal fluff, 2-3 sentences max'
                      },
                      {
                        id: 'friendly',
                        label: t.toneFriendlyTitle || 'Friendly',
                        desc: t.toneFriendlyDesc || 'Warm, consultative, conversational cadence'
                      },
                      {
                        id: 'direct',
                        label: t.toneDirectTitle || 'Executive Direct',
                        desc: t.toneDirectDesc || 'Focused strictly on agenda & next steps'
                      }
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => updateState({ replyStyle: style.id as any })}
                        className={`ai-provider-tile ${state.replyStyle === style.id ? 'is-selected' : ''}`}
                      >
                        <span className="font-semibold text-sm text-[var(--secondary-text)]">{style.label}</span>
                        <span className="text-xs text-[var(--secondary-text-secondary)]">{style.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Required Qualification Details */}
                <div className="space-y-2 pt-2 border-t border-[var(--secondary-stroke)]">
                  <div className="flex items-center justify-between">
                    <label className="ai-label">{t.qualDetailsLabel || '2. Required qualification criteria'}</label>
                    <span className="text-xs font-mono text-[var(--secondary-text-muted)]">
                      {state.requiredDetails.length} {t.fieldsSelected || 'selected'}
                    </span>
                  </div>
                  <p className="ai-sublabel">
                    {t.qualDetailsDesc ||
                      'The model must verify these details before offering a calendar booking or final pricing proposal:'}
                  </p>

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
                      const isSelected = state.requiredDetails.includes(detail);
                      return (
                        <button
                          key={detail}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              updateState({
                                requiredDetails: state.requiredDetails.filter((d) => d !== detail)
                              });
                            } else {
                              updateState({
                                requiredDetails: [...state.requiredDetails, detail]
                              });
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
                <div className="space-y-3 pt-2 border-t border-[var(--secondary-stroke)]">
                  <div className="flex items-center justify-between">
                    <label className="ai-label">{t.approvedLinksLabel || '3. Approved links & domains'}</label>
                    <button
                      type="button"
                      onClick={() => setShowAddLink(!showAddLink)}
                      className="secondary-button ds-btn ds-btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.addLinkBtn || 'Add link'}</span>
                    </button>
                  </div>
                  <p className="ai-sublabel">
                    {t.approvedLinksDesc ||
                      'Strict link grounding: MARSHALL will never invent or include arbitrary URLs outside this verified set.'}
                  </p>

                  {/* Add Link Sub-Form */}
                  {showAddLink && (
                    <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={newLinkName}
                          onChange={(e) => setNewLinkName(e.target.value)}
                          placeholder="Link Name (e.g. Sales Deck)"
                          className="ai-input ds-input text-xs"
                        />
                        <input
                          type="text"
                          value={newLinkUrl}
                          onChange={(e) => setNewLinkUrl(e.target.value)}
                          placeholder="URL (e.g. marshall.io/deck)"
                          className="ai-input ds-input text-xs font-mono"
                        />
                        <select
                          value={newLinkType}
                          onChange={(e) => setNewLinkType(e.target.value)}
                          className="ai-input ds-select text-xs"
                        >
                          <option value="Booking">Booking</option>
                          <option value="Deck">Deck</option>
                          <option value="Whitepaper">Whitepaper</option>
                          <option value="Docs">Docs</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddLink(false)}
                          className="secondary-button ds-btn ds-btn-secondary text-xs py-1 px-3"
                        >
                          {t.cancel || 'Cancel'}
                        </button>
                        <button
                          type="button"
                          onClick={handleAddLink}
                          disabled={!newLinkName.trim() || !newLinkUrl.trim()}
                          className="secondary-button secondary-button-primary ds-btn ds-btn-primary text-xs py-1 px-3"
                        >
                          {t.saveLink || 'Save link'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Links List */}
                  <div className="space-y-2">
                    {state.approvedLinks.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <LinkIcon className="w-4 h-4 text-[var(--secondary-blue)] flex-shrink-0" />
                          <span className="font-semibold text-[var(--secondary-text)] truncate">{link.name}</span>
                          <span className="font-mono text-[var(--secondary-text-muted)] truncate">{link.url}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-[10px]">
                            {link.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(idx)}
                            className="text-[var(--secondary-text-muted)] hover:text-rose-500 transition-colors p-1"
                            title="Remove link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Language Handling */}
                <div className="space-y-2 pt-2 border-t border-[var(--secondary-stroke)]">
                  <label className="ai-label">{t.langHandlingLabel || '4. Multilingual response strategy'}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'lead_language', label: t.langLead || "Use the lead's language" },
                      { id: 'always_english', label: t.langEnglish || 'Always English' },
                      { id: 'review_unfamiliar', label: t.langReview || 'Flag unfamiliar languages' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateState({ languageHandling: opt.id as any })}
                        className={`ai-chip justify-center text-xs ${state.languageHandling === opt.id ? 'is-active' : ''}`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Custom Operator Directives */}
                <div className="space-y-2 pt-2 border-t border-[var(--secondary-stroke)]">
                  <label className="ai-label">{t.customDirectivesLabel || '5. Custom guardrails & instructions'}</label>
                  <textarea
                    rows={2}
                    value={state.customInstructions}
                    onChange={(e) => updateState({ customInstructions: e.target.value })}
                    placeholder="e.g. Always emphasize our 14-day SLA. Do not offer discounts under 50 seats."
                    className="ai-input ds-input h-auto py-2 text-xs font-sans resize-none"
                  />
                </div>

                {/* 6. Expandable Grounded Context Packet Preview */}
                <div className="pt-2 border-t border-[var(--secondary-stroke)]">
                  <button
                    type="button"
                    onClick={() => setContextPreviewOpen(!contextPreviewOpen)}
                    className="flex items-center justify-between w-full py-2 text-xs font-semibold text-[var(--secondary-text)] hover:text-[var(--secondary-blue)] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--secondary-blue)]" />
                      <span>{t.contextPreviewLabel || 'Inspect grounded prompt packet'}</span>
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${contextPreviewOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {contextPreviewOpen && (
                    <div className="p-4 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-2 text-xs text-[var(--secondary-text-secondary)] font-mono">
                      <div className="font-semibold text-sm text-[var(--secondary-text)] mb-1 font-sans">
                        {t.contextPacketTitle || 'Model grounding packet structure:'}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px]">
                        <div>• Thread context: Verified inbound email body &amp; quote history</div>
                        <div>• Outreach lane: {state.selectedMailbox}</div>
                        <div>• Target style: {state.replyStyle}</div>
                        <div>• Language policy: {state.languageHandling}</div>
                        <div>• Required fields: {state.requiredDetails.join(', ')}</div>
                        <div>• Verified links: {state.approvedLinks.map((l) => l.url).join(', ')}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Wizard Nav Bottom */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => updateState({ currentStep: 1 })}
                  className="secondary-button ds-btn ds-btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t.backToConnect || 'Back to Connect'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateState({ currentStep: 3 })}
                  className="secondary-button secondary-button-primary ds-btn ds-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
                >
                  <span>{t.continueToBoundaries || 'Continue to Boundaries'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STAGE 3: BOUNDARIES & DEAL CONTROLS                           */}
          {/* ───────────────────────────────────────────────────────────── */}
          {state.currentStep === 3 && (
            <div className="space-y-6">
              {/* Scenario Actions Studio */}
              <div className="ai-card ds-card space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="ai-card-title ds-panel-heading">{t.scenarioStudioHeading || '1. Scenario Action Routing'}</h3>
                    <p className="ai-sublabel">
                      {t.scenarioStudioDesc || 'Assign how inbound messages are handled when intent matches these patterns:'}
                    </p>
                  </div>
                  <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs">
                    4 Scenarios
                  </span>
                </div>

                {/* Scenario 1: Inbound clarifying question */}
                <div className="p-4 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="text-sm font-semibold text-[var(--secondary-text)]">{t.scen1Title || 'New inbound product question'}</div>
                      <div className="text-xs text-[var(--secondary-text-secondary)]">
                        {t.scen1Desc || 'Prospect asks about pricing tier, timeline, or feature availability.'}
                      </div>
                    </div>
                    <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-[11px] font-mono self-start sm:self-auto">
                      {state.scenarioActions.inboundQuestion.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'draft_only', label: 'Draft only', desc: 'Create editable draft in Inbox' },
                      { id: 'review_queue', label: 'Review queue', desc: 'Stage for human approval' },
                      { id: 'auto_send', label: 'Auto-send (Locked)', desc: 'Requires background server' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (opt.id === 'auto_send') {
                            handleAutoSendClick();
                            return;
                          }
                          updateState({
                            scenarioActions: {
                              ...state.scenarioActions,
                              inboundQuestion: opt.id as any
                            }
                          });
                        }}
                        className={`ai-scenario-pill ${state.scenarioActions.inboundQuestion === opt.id ? 'is-active' : ''} ${opt.id === 'auto_send' ? 'opacity-70' : ''}`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{opt.label}</div>
                          <div className="text-[10.5px] opacity-75 font-normal">{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scenario 2: Required details missing */}
                <div className="p-4 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="text-sm font-semibold text-[var(--secondary-text)]">{t.scen2Title || 'Required qualification details missing'}</div>
                      <div className="text-xs text-[var(--secondary-text-secondary)]">
                        {t.scen2Desc || 'Prospect is interested but has not stated team size, budget, or timeline.'}
                      </div>
                    </div>
                    <span className="secondary-badge ds-pill ds-status-pill secondary-badge-amber text-[11px] font-mono self-start sm:self-auto">
                      {state.scenarioActions.missingDetails.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'ask_approved', label: 'Ask approved fields', desc: 'Politely clarify missing items' },
                      { id: 'draft_only', label: 'Draft only', desc: 'Create editable draft in Inbox' },
                      { id: 'review_queue', label: 'Review queue', desc: 'Stage for human approval' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          updateState({
                            scenarioActions: {
                              ...state.scenarioActions,
                              missingDetails: opt.id as any
                            }
                          })
                        }
                        className={`ai-scenario-pill ${state.scenarioActions.missingDetails === opt.id ? 'is-active' : ''}`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{opt.label}</div>
                          <div className="text-[10.5px] opacity-75 font-normal">{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scenario 3: Required details complete */}
                <div className="p-4 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="text-sm font-semibold text-[var(--secondary-text)]">{t.scen3Title || 'Required qualification details complete'}</div>
                      <div className="text-xs text-[var(--secondary-text-secondary)]">
                        {t.scen3Desc || 'Prospect provided all mandatory criteria; ready for next stage.'}
                      </div>
                    </div>
                    <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-[11px] font-mono self-start sm:self-auto">
                      {state.scenarioActions.completeDetails.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'review_queue', label: 'Review queue', desc: 'Stage for human approval' },
                      { id: 'draft_only', label: 'Draft only', desc: 'Create editable draft in Inbox' },
                      { id: 'auto_send', label: 'Auto-send (Locked)', desc: 'Requires background server' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (opt.id === 'auto_send') {
                            handleAutoSendClick();
                            return;
                          }
                          updateState({
                            scenarioActions: {
                              ...state.scenarioActions,
                              completeDetails: opt.id as any
                            }
                          });
                        }}
                        className={`ai-scenario-pill ${state.scenarioActions.completeDetails === opt.id ? 'is-active' : ''} ${opt.id === 'auto_send' ? 'opacity-70' : ''}`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{opt.label}</div>
                          <div className="text-[10.5px] opacity-75 font-normal">{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scenario 4: Meeting or demo request */}
                <div className="p-4 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="text-sm font-semibold text-[var(--secondary-text)]">{t.scen4Title || 'Direct meeting or demo request'}</div>
                      <div className="text-xs text-[var(--secondary-text-secondary)]">
                        {t.scen4Desc || 'Prospect asks to schedule a call or see live demonstration.'}
                      </div>
                    </div>
                    <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-[11px] font-mono self-start sm:self-auto">
                      {state.scenarioActions.meetingRequest.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'review_queue', label: 'Review queue', desc: 'Stage for human confirmation' },
                      { id: 'draft_only', label: 'Draft only', desc: 'Create calendar draft in Inbox' },
                      { id: 'auto_send', label: 'Auto-send (Locked)', desc: 'Requires background server' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (opt.id === 'auto_send') {
                            handleAutoSendClick();
                            return;
                          }
                          updateState({
                            scenarioActions: {
                              ...state.scenarioActions,
                              meetingRequest: opt.id as any
                            }
                          });
                        }}
                        className={`ai-scenario-pill ${state.scenarioActions.meetingRequest === opt.id ? 'is-active' : ''} ${opt.id === 'auto_send' ? 'opacity-70' : ''}`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{opt.label}</div>
                          <div className="text-[10.5px] opacity-75 font-normal">{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {autopilotLockedNotice && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{autopilotLockedNotice}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAutopilotLockedNotice(null)}
                      className="text-xs underline ml-2 cursor-pointer hover:opacity-80"
                    >
                      {t.dismiss || 'Dismiss'}
                    </button>
                  </div>
                )}
              </div>

              {/* Locked Permanent Hard Safety Blocks */}
              <div className="ai-hard-blocks-box">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-500" />
                  <h3 className="ai-card-title ds-panel-heading text-rose-500 dark:text-rose-400">
                    {t.hardSafetyHeading || 'Permanent Hard Safety Blocks'}
                  </h3>
                </div>

                <div className="ai-rule-locked-row">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--secondary-text)] flex items-center gap-2">
                      <span>{t.blockOptoutTitle || 'Opt-out or unsubscribe request'}</span>
                      <Lock className="w-3.5 h-3.5 text-[var(--secondary-text-muted)]" />
                    </div>
                    <div className="text-xs text-[var(--secondary-text-secondary)]">
                      {t.blockOptoutDesc || 'Immediate stop on unsubscribe or negative requests. Never sends an automated message.'}
                    </div>
                  </div>
                  <span className="secondary-badge ds-pill ds-status-pill secondary-badge-red text-xs flex-shrink-0">
                    {t.neverReplyBadge || 'Never reply (Hard block)'}
                  </span>
                </div>

                <div className="ai-rule-locked-row">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--secondary-text)] flex items-center gap-2">
                      <span>{t.blockRiskTitle || 'Legal, invoice, payment, or security concern'}</span>
                      <Lock className="w-3.5 h-3.5 text-[var(--secondary-text-muted)]" />
                    </div>
                    <div className="text-xs text-[var(--secondary-text-secondary)]">
                      {t.blockRiskDesc || 'Directly escalates high-risk compliance or billing questions to human operator.'}
                    </div>
                  </div>
                  <span className="secondary-badge ds-pill ds-status-pill secondary-badge-amber text-xs flex-shrink-0">
                    {t.needsReviewBadge || 'Needs human review'}
                  </span>
                </div>

                <p className="text-xs text-[var(--secondary-text-muted)] italic">
                  {t.hardBlocksNote || 'Hard safety blocks are permanently enforced across all operating modes and cannot be disabled.'}
                </p>
              </div>

              {/* Deal Controls & Safeguards */}
              <div className="ai-card ds-card space-y-4">
                <div className="space-y-1">
                  <h3 className="ai-card-title ds-panel-heading">{t.dealControlsHeading || '2. Deal Controls & Confidence Gate'}</h3>
                  <p className="ai-sublabel">
                    {t.dealControlsDesc || 'Fine-tune risk triggers and human escalation flags for edge cases.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Confidence Slider */}
                  <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--secondary-text)]">{t.confidenceGateLabel || 'Minimum confidence threshold'}</span>
                      <span className="font-mono font-bold text-[var(--secondary-blue)]">{state.confidenceThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="98"
                      step="1"
                      value={state.confidenceThreshold}
                      onChange={(e) => updateState({ confidenceThreshold: parseInt(e.target.value, 10) })}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--secondary-blue)]"
                    />
                    <p className="text-[11px] text-[var(--secondary-text-muted)]">
                      {t.confidenceNote || 'Drafts below this threshold are flagged for manual review before sending.'}
                    </p>
                  </div>

                  {/* Daily Guard Limit */}
                  <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--secondary-text)]">{t.dailyLimitLabel || 'Daily auto-draft quota'}</span>
                      <span className="font-mono font-bold text-[var(--secondary-text)]">{state.dealControls.maxDailyDrafts} drafts/day</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="10"
                      value={state.dealControls.maxDailyDrafts}
                      onChange={(e) =>
                        updateState({
                          dealControls: { ...state.dealControls, maxDailyDrafts: parseInt(e.target.value, 10) }
                        })
                      }
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--secondary-blue)]"
                    />
                    <p className="text-[11px] text-[var(--secondary-text-muted)]">
                      {t.dailyLimitNote || 'Prevents runaway generation during unexpected inbound spikes.'}
                    </p>
                  </div>
                </div>

                {/* Boolean Switches */}
                <div className="space-y-2 pt-2 border-t border-[var(--secondary-stroke)]">
                  {[
                    {
                      key: 'flagCompetitorMentions',
                      title: t.flagCompetitorTitle || 'Flag competitor mentions',
                      desc: t.flagCompetitorDesc || 'Automatically escalates messages naming competing platforms.'
                    },
                    {
                      key: 'flagCustomPricing',
                      title: t.flagPricingTitle || 'Flag custom pricing requests',
                      desc: t.flagPricingDesc || 'Prevents AI from negotiating enterprise or discount requests.'
                    },
                    {
                      key: 'flagAmbiguousIntent',
                      title: t.flagAmbiguousTitle || 'Flag ambiguous intent',
                      desc: t.flagAmbiguousDesc || 'Routes multi-topic inquiries directly to manager review.'
                    }
                  ].map((flag) => {
                    const active = (state.dealControls as any)[flag.key];
                    return (
                      <div
                        key={flag.key}
                        onClick={() =>
                          updateState({
                            dealControls: {
                              ...state.dealControls,
                              [flag.key]: !active
                            }
                          })
                        }
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] cursor-pointer hover:border-[var(--secondary-stroke-strong)] transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[var(--secondary-text)]">{flag.title}</div>
                          <div className="text-[11px] text-[var(--secondary-text-secondary)]">{flag.desc}</div>
                        </div>
                        <div
                          className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                            active ? 'bg-[var(--secondary-blue)]' : 'bg-[var(--secondary-stroke-strong)]'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              active ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wizard Nav Bottom */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => updateState({ currentStep: 2 })}
                  className="secondary-button ds-btn ds-btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t.backToTeach || 'Back to Playbook'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateState({ currentStep: 4 })}
                  className="secondary-button secondary-button-primary ds-btn ds-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
                >
                  <span>{t.continueToSummary || 'Continue to Readiness'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STAGE 4: READINESS SUMMARY & SIMULATION                       */}
          {/* ───────────────────────────────────────────────────────────── */}
          {state.currentStep === 4 && (
            <div className="space-y-6">
              {/* Readiness Overview Cards */}
              <div className="ai-card ds-card space-y-5">
                <div className="space-y-1">
                  <h3 className="ai-card-title ds-panel-heading">{t.readinessHeading || 'Automation Readiness Profile'}</h3>
                  <p className="ai-sublabel">{t.readinessDesc || 'Truthful review of all active guardrails before automation runs.'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1">
                    <div className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">
                      {t.cardProvider || 'Inference Model'}
                    </div>
                    <div className="text-sm font-semibold text-[var(--secondary-text)]">{state.providerName}</div>
                    <div className="text-xs font-mono text-[var(--secondary-text-secondary)]">{state.model}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1">
                    <div className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">
                      {t.cardMailbox || 'Monitored Mailbox'}
                    </div>
                    <div className="text-sm font-semibold text-[var(--secondary-text)]">{state.selectedMailbox}</div>
                    <div className="text-xs text-[var(--secondary-text-secondary)]">IMAP/SMTP Lane · Local Preview</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1">
                    <div className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">
                      {t.cardPlaybook || 'Playbook Grounding'}
                    </div>
                    <div className="text-sm font-semibold text-[var(--secondary-text)]">
                      {state.replyStyle === 'concise' ? 'Concise' : state.replyStyle === 'friendly' ? 'Friendly' : 'Direct'} · Lead's Language
                    </div>
                    <div className="text-xs text-[var(--secondary-text-secondary)]">
                      {state.requiredDetails.length} qualification fields · {state.approvedLinks.length} verified links
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-1">
                    <div className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">
                      {t.cardRules || 'Rules & Safety'}
                    </div>
                    <div className="text-sm font-semibold text-[var(--secondary-text)]">4 scenario rules active</div>
                    <div className="text-xs text-[var(--secondary-text-secondary)]">
                      2 locked hard blocks · {state.confidenceThreshold}% threshold
                    </div>
                  </div>
                </div>

                {/* Operating Mode Switcher */}
                <div className="p-4 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[var(--secondary-text)]">{t.selectOperatingMode || 'Automode Operating State'}</div>
                      <div className="text-xs text-[var(--secondary-text-secondary)]">
                        {state.operatingMode === 'off'
                          ? 'Automation is paused. Inbound messages will not generate drafts.'
                          : state.operatingMode === 'drafts'
                          ? 'Drafts mode active: AI prepares private responses in conversation threads.'
                          : 'Review queue active: AI categorizes and stages prospect replies for approval.'}
                      </div>
                    </div>

                    <div className="ai-mode-control-group ds-segmented self-start sm:self-auto" role="group">
                      <button
                        type="button"
                        onClick={() => {
                          updateState({ operatingMode: 'off' });
                          showToast('Automode paused (Off)');
                        }}
                        className={`ai-mode-btn ds-segmented-option ${state.operatingMode === 'off' ? 'is-active' : ''}`}
                      >
                        Off
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateState({ operatingMode: 'drafts' });
                          showToast('Automode set to Drafts');
                        }}
                        className={`ai-mode-btn ds-segmented-option ${state.operatingMode === 'drafts' ? 'is-active' : ''}`}
                      >
                        Drafts
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateState({ operatingMode: 'review' });
                          showToast('Automode set to Review Queue');
                        }}
                        className={`ai-mode-btn ds-segmented-option ${state.operatingMode === 'review' ? 'is-active' : ''}`}
                      >
                        Review queue
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleAutoSendClick();
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
              </div>

              {/* Interactive Rule Simulator */}
              <div className="ai-card ds-card space-y-4">
                <div>
                  <h3 className="ai-card-title ds-panel-heading">{t.ruleSimulatorHeading || 'Test a scenario trigger'}</h3>
                  <p className="ai-sublabel">{t.ruleSimulatorDesc || 'Preview how MARSHALL evaluates inbound messages in real time based on your rules.'}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'meeting', label: 'Meeting request' },
                    { id: 'missing', label: 'Missing qualification fields' },
                    { id: 'optout', label: 'Opt-out / Complaint' },
                    { id: 'pricing', label: 'Custom pricing inquiry' }
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => updateState({ testRuleScenario: chip.id as any })}
                      className={`ai-chip ${state.testRuleScenario === chip.id ? 'is-active' : ''}`}
                    >
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>

                {/* Simulation Breakdown Output */}
                <div className="p-4 rounded-xl bg-[var(--secondary-muted-surface)] border border-[var(--secondary-stroke)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--secondary-text-muted)] uppercase tracking-wider">
                      {t.simResultAction || 'Evaluated Action'}
                    </span>
                    {state.testRuleScenario === 'meeting' && (
                      <span className="secondary-badge ds-pill ds-status-pill secondary-badge-blue ds-pill-blue text-xs">
                        Review queue draft
                      </span>
                    )}
                    {state.testRuleScenario === 'missing' && (
                      <span className="secondary-badge ds-pill ds-status-pill secondary-badge-amber text-xs">
                        Ask approved criteria
                      </span>
                    )}
                    {state.testRuleScenario === 'optout' && (
                      <span className="secondary-badge ds-pill ds-status-pill secondary-badge-red text-xs">
                        Never reply (Hard block)
                      </span>
                    )}
                    {state.testRuleScenario === 'pricing' && (
                      <span className="secondary-badge ds-pill ds-status-pill secondary-badge-amber text-xs">
                        Deal control flag (Escalate)
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-[var(--secondary-text)]">
                    {state.testRuleScenario === 'meeting' &&
                      'AI prepares a calendar booking draft using approved links (cal.com/marshall/demo) and stages for human confirmation.'}
                    {state.testRuleScenario === 'missing' &&
                      'AI politely requests team size and delivery timeline without offering booking links prematurely.'}
                    {state.testRuleScenario === 'optout' &&
                      'Hard safety block triggered: Unsubscribe/stop intent recognized. Automation halted immediately.'}
                    {state.testRuleScenario === 'pricing' &&
                      'Deal safeguard triggered: Non-standard discount request detected. Flagged for operator review.'}
                  </p>
                </div>
              </div>

              {/* Wizard Nav Bottom */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => updateState({ currentStep: 3 })}
                  className="secondary-button ds-btn ds-btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t.backToBoundaries || 'Back to Boundaries'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateState({ isConfigured: true });
                    showToast(t.setupCompleteToast || 'Automode configured in local preview');
                    if (onFinishLater) {
                      onFinishLater();
                    }
                  }}
                  className="secondary-button secondary-button-primary ds-btn ds-btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.saveAndReturn || 'Save & open Inbox'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ===================================================================== */}
      {/* 3. RESET CONFIRMATION MODAL                                           */}
      {/* ===================================================================== */}
      {resetModalOpen && (
        <div className="campaign-modal-backdrop" onClick={() => setResetModalOpen(false)}>
          <div className="campaign-modal ds-modal-sheet p-6 space-y-4 max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--secondary-text)]">
                  {t.resetModalTitle || 'Reset Automode setup?'}
                </h3>
                <p className="text-xs text-[var(--secondary-text-secondary)]">
                  {t.resetModalDesc || 'This will clear all local preview settings and restore default rules.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="secondary-button ds-btn ds-btn-secondary text-xs py-2 px-4"
              >
                {t.cancel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="secondary-button ds-btn ds-btn-destructive text-xs py-2 px-4 font-semibold"
              >
                {t.confirmReset || 'Reset setup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
