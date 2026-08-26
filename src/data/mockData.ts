import { Chat, Campaign, ActivityEvent } from '../types';

export const INITIAL_CHATS: Chat[] = [
  {
    id: '1',
    leadName: 'Felix Vance',
    initials: 'FV',
    email: 'felix.vance@innovatech.io',
    companyTitle: 'CTO, InnovaTech Solutions GmbH',
    subject: 'Re: booking a spot - Marshall August',
    date: '14:32',
    category: 'hot',
    unread: false,
    hasAttachment: false,
    messageCount: 4,
    messages: [
      {
        id: 'm1-4',
        sender: 'lead',
        name: 'Felix Vance',
        to: 'Alexey Marshall <alexey@marshall.io>',
        time: 'Today, 14:32',
        subject: 'Re: booking a spot - Marshall August',
        text: 'Отлично, условия подходят. Давайте согласуем 15-минутный звонок в Zoom на завтра после 15:00 CET, чтобы посмотреть демо и передать контакты юриста для договора. Пришлите ссылку на https://cal.com/marshall/demo-15min.\n\nЖду подтверждения!'
      }
    ],
    quotes: [
      {
        id: 'q1-1',
        from: 'Alexey Marshall (You)',
        email: 'alexey@marshall.io',
        date: 'Today, 11:20 AM',
        preview: 'Алексей, спасибо за оперативный ответ! Пакет на 12 мест обойдется в $3,800/мес...',
        body: 'Алексей, спасибо за оперативный ответ! Пакет на 12 мест обойдется в $3,800/мес. Инвойсы в EUR с европейским Reverse Charge выставляем без проблем.\n\nГотовы провести демонстрацию в удобное для вас время.',
        children: [
          {
            id: 'q1-2',
            from: 'Felix Vance',
            email: 'felix.vance@innovatech.io',
            date: '22 Aug, 4:45 PM',
            preview: 'Добрый день, Alexey. Да, тема актуальна. Подскажите, сколько стоит лицензия на 12 SDR?...',
            body: 'Добрый день, Alexey. Да, тема актуальна. Подскажите, сколько стоит лицензия на 12 SDR? Бюджет в районе $4,500/мес. Сможем платить по счету в EUR?',
            children: [
              {
                id: 'q1-3',
                from: 'Alexey Marshall (You)',
                email: 'alexey@marshall.io',
                date: '22 Aug, 10:14 AM',
                preview: 'Здравствуйте, Алексей! Заметил, что InnovaTech активно масштабирует отдел B2B-продаж...',
                body: 'Здравствуйте, Алексей! Заметил, что InnovaTech активно масштабирует отдел B2B-продаж. Мы в MARSHALL разработали легковесную CRM для автоматизации outreach. Будет интересно посмотреть 3-минутный кейс?\n\nС уважением,\nАлексей',
                children: []
              }
            ]
          }
        ]
      }
    ],
    aiSuggestion: {
      snippet: 'Забронировал Zoom на завтра в 15:30 CET, высылаю ссылку...',
      matchPercentage: 94,
      draft: 'Здравствуйте, Феликс!\n\nОтлично! Забронировал для нас слот на завтра в 15:30 CET. Ссылка на Zoom: https://cal.com/marshall/demo-15min\n\nТакже подготовил проект типового соглашения об обработке данных (DPA). До встречи на звонке!\n\nС уважением,\nАлексей Маршалл'
    }
  },
  {
    id: '2',
    leadName: 'Sarah Jenkins',
    initials: 'SJ',
    email: 's.jenkins@apexcloud.co',
    companyTitle: 'Head of Growth, ApexCloud UK',
    subject: 'Re: ApexCloud outbound conversion',
    date: '12:15',
    category: 'hot',
    unread: true,
    hasAttachment: true,
    messageCount: 2,
    messages: [
      {
        id: 'm2-2',
        sender: 'lead',
        name: 'Sarah Jenkins',
        to: 'Alexey Marshall <alexey@marshall.io>',
        time: 'Today, 12:15',
        subject: 'Re: ApexCloud outbound conversion',
        text: 'Hi Alexey, please send over pricing details and case studies for the Enterprise tier. We are evaluating 3 tools right now. Reach me at s.jenkins@apexcloud.co or book directly via https://cal.com/apex-team.'
      }
    ],
    quotes: [
      {
        id: 'q2-1',
        from: 'Alexey Marshall (You)',
        email: 'alexey@marshall.io',
        date: '21 Aug, 9:00 AM',
        preview: 'Hi Sarah, are you open to reviewing how we increased reply rates by 3.8x for B2B cloud providers?...',
        body: 'Hi Sarah, are you open to reviewing how we increased reply rates by 3.8x for B2B cloud providers?\n\nBest,\nAlexey',
        children: []
      }
    ],
    aiSuggestion: {
      snippet: 'Sent Enterprise deck with 3.8x ROI benchmark...',
      matchPercentage: 88,
      draft: 'Hi Sarah,\n\nThanks for reaching out! Attached is our Enterprise tier overview and benchmark metrics showing 3.8x reply rate growth. I will also grab a slot on https://cal.com/apex-team for Thursday.\n\nBest regards,\nAlexey'
    }
  },
  {
    id: '3',
    leadName: 'Дмитрий Козлов',
    initials: 'ДК',
    email: 'd.kozlov@fintechcorp.ru',
    companyTitle: 'VP Sales, FinTech Corp',
    subject: 'Re: Cold Outreach Pipeline for FinTech',
    date: 'Yesterday',
    category: 'warm',
    unread: false,
    hasAttachment: false,
    messageCount: 2,
    messages: [
      {
        id: 'm3-2',
        sender: 'lead',
        name: 'Дмитрий Козлов',
        to: 'Alexey Marshall <alexey@marshall.io>',
        time: 'Yesterday, 18:20',
        subject: 'Re: Cold Outreach Pipeline for FinTech',
        text: 'Готовы назначить звонок на четверг в 16:00. Пришлите приглашение в Google Meet на d.kozlov@fintechcorp.ru.'
      }
    ],
    quotes: [
      {
        id: 'q3-1',
        from: 'Alexey Marshall (You)',
        email: 'alexey@marshall.io',
        date: '20 Aug, 2:00 PM',
        preview: 'Дмитрий, добрый день! Заметили ваш рост в Финтех-секторе. Поможем поднять Open Rate до 65%+...',
        body: 'Дмитрий, добрый день! Заметили ваш рост в Финтех-секторе. Поможем поднять Open Rate до 65%+.\n\nС уважением,\nАлексей',
        children: []
      }
    ],
    aiSuggestion: {
      snippet: 'Приглашение в Google Meet на четверг 16:00 сформировано...',
      matchPercentage: 91,
      draft: 'Дмитрий, добрый день!\n\nКалендарное приглашение в Google Meet на четверг в 16:00 отправлено на d.kozlov@fintechcorp.ru.\n\nДо встречи!'
    }
  },
  {
    id: '4',
    leadName: 'Marcus Vance',
    initials: 'MV',
    email: 'm.vance@fintech-hub.io',
    companyTitle: 'Lead Architect, FinTech Hub',
    subject: 'Re: API integration inquiry',
    date: '20 Aug',
    category: 'warm',
    unread: true,
    hasAttachment: false,
    messageCount: 1,
    messages: [
      {
        id: 'm4-1',
        sender: 'lead',
        name: 'Marcus Vance',
        to: 'Alexey Marshall <alexey@marshall.io>',
        time: '20 Aug, 16:10',
        subject: 'Re: API integration inquiry',
        text: 'We are looking into integrating MARSHALL directly via Webhooks into our custom internal portal. Does your platform support real-time outbound analytics streaming?'
      }
    ],
    quotes: [],
    aiSuggestion: {
      snippet: 'Confirmed webhook & streaming REST endpoints...',
      matchPercentage: 85,
      draft: 'Hi Marcus,\n\nYes, MARSHALL exposes full REST API and real-time webhook events for email sent, opened, clicked and replied.\n\nCheck out the docs here: https://marshall.io/docs/webhooks.\n\nBest,\nAlexey'
    }
  },
  {
    id: '5',
    leadName: 'Elena Rostova',
    initials: 'ER',
    email: 'elena.rostova@nordictech.se',
    companyTitle: 'COO, NordicTech Group',
    subject: 'Archived: Nordic Pilot Agreement',
    date: '18 Aug',
    category: 'archive',
    unread: false,
    hasAttachment: true,
    messageCount: 3,
    messages: [
      {
        id: 'm5-3',
        sender: 'lead',
        name: 'Elena Rostova',
        to: 'Alexey Marshall <alexey@marshall.io>',
        time: '18 Aug, 11:30',
        subject: 'Archived: Nordic Pilot Agreement',
        text: 'Thank you Alexey. The pilot agreement is signed. We will revisit the production expansion in Q4.'
      }
    ],
    quotes: [
      {
        id: 'q5-1',
        from: 'Alexey Marshall (You)',
        email: 'alexey@marshall.io',
        date: '17 Aug, 15:00',
        preview: 'Elena, great to have NordicTech on board for the 30-day pilot...',
        body: 'Elena, great to have NordicTech on board for the 30-day pilot. Let us know if you need any technical setup assistance.',
        children: []
      }
    ]
  }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    name: 'DACH SaaS CTOs — Q3 Outreach',
    mailboxLabel: 'alexey@marshall.io',
    createdAt: '20 Aug 2026',
    status: 'active',
    imported: 480,
    sent: 480,
    replied: 68,
    qualified: 24,
    booked: 9,
    recipients: [
      { email: 'felix.vance@innovatech.io', status: 'booked' },
      { email: 'stefan.weber@berlinscale.de', status: 'qualified' },
      { email: 'j.mueller@cloudwerk.ch', status: 'replied' },
      { email: 'lukas.bauer@fintechvienna.at', status: 'replied' },
      { email: 'klaus.schmidt@b2bmunich.de', status: 'sent' },
      { email: 'anna.hoffman@saaszurich.ch', status: 'sent' },
      { email: 'markus.lang@devopsfrankfurt.de', status: 'sent' },
      { email: 'elena.rostova@techhamburg.de', status: 'sent' }
    ]
  },
  {
    id: 'c2',
    name: 'UK Cloud & DevOps Scaleups',
    mailboxLabel: 'outreach@marshall.io',
    createdAt: '14 Aug 2026',
    status: 'completed',
    imported: 320,
    sent: 320,
    replied: 41,
    qualified: 16,
    booked: 6,
    recipients: [
      { email: 's.jenkins@apexcloud.co', status: 'booked' },
      { email: 'd.morrison@cloudops.london', status: 'qualified' },
      { email: 'liam.taylor@devopsuk.io', status: 'replied' },
      { email: 'rachel.adams@scaleupbristol.co.uk', status: 'sent' },
      { email: 'gareth.evans@manchestertech.io', status: 'sent' }
    ]
  },
  {
    id: 'c3',
    name: 'US FinTech Founders — Seed & Series A',
    mailboxLabel: 'alexey@marshall.io',
    createdAt: '24 Aug 2026',
    status: 'draft',
    imported: 150,
    sent: 0,
    replied: 0,
    qualified: 0,
    booked: 0,
    recipients: [
      { email: 'marcus.vance@nyfintech.com', status: 'pending' },
      { email: 'chloe.chen@sfcapital.io', status: 'pending' },
      { email: 'david.kim@bostonpay.co', status: 'pending' },
      { email: 'elizabeth.warren@austinvc.org', status: 'pending' },
      { email: 'arjun.patel@miamitech.fund', status: 'pending' }
    ]
  }
];

export const MOCK_ACTIVITIES: ActivityEvent[] = [
  { id: 'a1', leadName: 'Felix Vance', type: 'booking', time: '14:32', description: 'Requested 15-min Zoom demo & legal DPA' },
  { id: 'a2', leadName: 'Sarah Jenkins', type: 'reply', time: '12:15', description: 'Requested Enterprise tier deck & pricing' },
  { id: 'a3', leadName: 'Дмитрий Козлов', type: 'open', time: '10:45', description: 'Opened outbound email #2 (3 times)' },
  { id: 'a4', leadName: 'Marcus Vance', type: 'reply', time: 'Yesterday', description: 'Inquired about REST API & webhooks' }
];
