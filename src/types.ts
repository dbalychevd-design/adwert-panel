export interface QuoteNode {
  id: string;
  from: string;
  email: string;
  date: string;
  preview: string;
  body: string;
  children?: QuoteNode[];
}

export interface MailMessage {
  id: string;
  sender: 'lead' | 'outreach';
  name: string;
  to: string;
  time: string;
  subject: string;
  text: string;
}

export interface Chat {
  id: string;
  leadName: string;
  initials: string;
  email: string;
  companyTitle?: string;
  subject: string;
  date: string;
  category: 'hot' | 'warm' | 'archive' | 'all';
  unread: boolean;
  hasAttachment: boolean;
  messageCount: number;
  messages: MailMessage[];
  quotes: QuoteNode[];
  aiSuggestion?: {
    snippet: string;
    matchPercentage: number;
    draft: string;
  };
}

export interface CampaignRecipient {
  email: string;
  status: 'pending' | 'sent' | 'replied' | 'qualified' | 'booked' | 'invalid';
}

export interface Campaign {
  id: string;
  name: string;
  mailboxLabel: string;
  createdAt: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  imported: number;
  sent: number;
  replied: number; // unique repliers, not total messages
  qualified: number;
  booked: number;
  recipients: CampaignRecipient[];
}

export interface ActivityEvent {
  id: string;
  leadName: string;
  type: 'reply' | 'open' | 'click' | 'booking';
  time: string;
  description: string;
}
