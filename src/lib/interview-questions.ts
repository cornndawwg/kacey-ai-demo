export interface InterviewQuestion {
  id: string;
  phase: 'DISCOVERY_HR' | 'CORE_ROLE' | 'SUPPORTING_ROLES' | 'LEADERSHIP_ALIGNMENT' | 'FINAL_ROLE';
  category: string;
  question: string;
  followUp?: string;
  required: boolean;
  tag?: 'PROCESS' | 'DECISION' | 'RELATIONSHIP' | 'EXCEPTION';
  allowFileUpload?: boolean;
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // Phase 1: Discovery with HR (15-30 min)
  {
    id: 'hr-1',
    phase: 'DISCOVERY_HR',
    category: 'Company Culture',
    question: 'What are the core cultural values and leadership expectations that shape how people work in this organization?',
    required: true,
    tag: 'RELATIONSHIP'
  },
  {
    id: 'hr-2',
    phase: 'DISCOVERY_HR',
    category: 'Role Context',
    question: 'Can you describe the main role being offboarded and its primary internal/external interfaces?',
    required: true,
    tag: 'PROCESS'
  },
  {
    id: 'hr-3',
    phase: 'DISCOVERY_HR',
    category: 'Documentation',
    question: 'What documentation already exists (SOPs, wikis, dashboards) that we should be aware of?',
    required: true,
    allowFileUpload: true
  },
  {
    id: 'hr-4',
    phase: 'DISCOVERY_HR',
    category: 'Stakeholders',
    question: 'Who are the key collaborators, peers, and dependencies for this role?',
    required: true,
    tag: 'RELATIONSHIP'
  },
  {
    id: 'hr-5',
    phase: 'DISCOVERY_HR',
    category: 'Confidentiality',
    question: 'Are there any confidentiality, approval process, or data handling protocols we need to follow?',
    required: true
  },

  // Phase 2: Core Role Interview (60-90 min)
  {
    id: 'core-1',
    phase: 'CORE_ROLE',
    category: 'Role Overview',
    question: 'What are the primary responsibilities and objectives of this role? What are the key KPIs and success measures?',
    required: true,
    tag: 'PROCESS'
  },
  {
    id: 'core-2',
    phase: 'CORE_ROLE',
    category: 'Daily Operations',
    question: 'Walk me through a typical day in this role. What are the most important daily processes?',
    required: true,
    tag: 'PROCESS'
  },
  {
    id: 'core-3',
    phase: 'CORE_ROLE',
    category: 'Decision Making',
    question: 'How do you make key decisions in this role? What trade-offs matter most?',
    required: true,
    tag: 'DECISION'
  },
  {
    id: 'core-4',
    phase: 'CORE_ROLE',
    category: 'Tools & Systems',
    question: 'What systems, tools, templates, and shortcuts do you use regularly? Are there any undocumented processes?',
    required: true,
    tag: 'PROCESS',
    allowFileUpload: true
  },
  {
    id: 'core-5',
    phase: 'CORE_ROLE',
    category: 'Common Pitfalls',
    question: 'What are the most common mistakes or pitfalls someone new to this role should avoid?',
    required: true,
    tag: 'EXCEPTION'
  },
  {
    id: 'core-6',
    phase: 'CORE_ROLE',
    category: 'Relationships',
    question: 'Who do you rely on most in this role? What are the critical dependencies?',
    required: true,
    tag: 'RELATIONSHIP'
  },
  {
    id: 'core-7',
    phase: 'CORE_ROLE',
    category: 'Scenario Simulation',
    question: 'Can you walk me through a recent challenge or critical project? What did you do when [specific situation]?',
    required: true,
    tag: 'DECISION'
  },
  {
    id: 'core-8',
    phase: 'CORE_ROLE',
    category: 'Transfer Knowledge',
    question: 'If someone new took over this role tomorrow, what should they know first? What\'s the most critical information?',
    required: true,
    tag: 'PROCESS'
  },

  // Phase 3: Supporting Role Interviews (30-60 min each)
  {
    id: 'support-1',
    phase: 'SUPPORTING_ROLES',
    category: 'Dependencies',
    question: 'What do you rely on this person for? What breaks down when they\'re not available?',
    required: true,
    tag: 'RELATIONSHIP'
  },
  {
    id: 'support-2',
    phase: 'SUPPORTING_ROLES',
    category: 'Undocumented Knowledge',
    question: 'What undocumented shortcuts or nuances make things work between your teams?',
    required: true,
    tag: 'PROCESS'
  },
  {
    id: 'support-3',
    phase: 'SUPPORTING_ROLES',
    category: 'Exception Handling',
    question: 'How do you handle exceptions or unexpected issues together?',
    required: true,
    tag: 'EXCEPTION'
  },
  {
    id: 'support-4',
    phase: 'SUPPORTING_ROLES',
    category: 'Information Flow',
    question: 'What information flow is critical between your teams?',
    required: true,
    tag: 'PROCESS'
  },

  // Phase 4: Leadership Alignment (30-45 min)
  {
    id: 'leadership-1',
    phase: 'LEADERSHIP_ALIGNMENT',
    category: 'Strategic Priorities',
    question: 'Does the captured content reflect what leadership wants preserved long-term?',
    required: true,
    tag: 'DECISION'
  },
  {
    id: 'leadership-2',
    phase: 'LEADERSHIP_ALIGNMENT',
    category: 'Sensitive Information',
    question: 'Are there proprietary or sensitive insights that require redaction or special emphasis?',
    required: true
  },
  {
    id: 'leadership-3',
    phase: 'LEADERSHIP_ALIGNMENT',
    category: 'Future Changes',
    question: 'Are there upcoming changes (restructuring, new tech, shifting markets) that alter relevance?',
    required: true,
    tag: 'DECISION'
  },
  {
    id: 'leadership-4',
    phase: 'LEADERSHIP_ALIGNMENT',
    category: 'Coverage Review',
    question: 'Are there any blind spots or perspectives still missing from our capture?',
    required: true
  },

  // Phase 5: Final Role Interview (30-60 min)
  {
    id: 'final-1',
    phase: 'FINAL_ROLE',
    category: 'Clarification',
    question: 'Are there any missing or inconsistent workflows that need clarification?',
    required: true,
    tag: 'PROCESS'
  },
  {
    id: 'final-2',
    phase: 'FINAL_ROLE',
    category: 'Validation',
    question: 'Can you validate the accuracy of key decision logic and tools we\'ve documented?',
    required: true,
    tag: 'DECISION'
  },
  {
    id: 'final-3',
    phase: 'FINAL_ROLE',
    category: 'Tribal Knowledge',
    question: 'Are there any "tribal knowledge" stories or contextual anecdotes that would improve AI reasoning?',
    required: true,
    tag: 'EXCEPTION'
  },
  {
    id: 'final-4',
    phase: 'FINAL_ROLE',
    category: 'Final Alignment',
    question: 'Do you confirm alignment with leadership and peers on the captured knowledge?',
    required: true,
    tag: 'RELATIONSHIP'
  }
];

export const PHASE_INFO = {
  DISCOVERY_HR: {
    title: 'Discovery with HR',
    duration: '15-30 minutes',
    description: 'Establish organizational context, map internal relationships, and confirm confidentiality expectations.',
    color: 'blue'
  },
  CORE_ROLE: {
    title: 'Core Role Interview',
    duration: '60-90 minutes',
    description: 'Capture day-to-day operations, decision logic, and key workflows directly from the person in the role.',
    color: 'green'
  },
  SUPPORTING_ROLES: {
    title: 'Supporting Role Interviews',
    duration: '30-60 minutes each',
    description: 'Collect perspectives from peers or cross-functional partners who rely on the role.',
    color: 'yellow'
  },
  LEADERSHIP_ALIGNMENT: {
    title: 'Leadership Alignment',
    duration: '30-45 minutes',
    description: 'Validate captured material with leadership and ensure it reflects strategic priorities.',
    color: 'purple'
  },
  FINAL_ROLE: {
    title: 'Final Role Interview',
    duration: '30-60 minutes',
    description: 'Resolve gaps, confirm accuracy, and gather narrative examples to enhance AI reasoning.',
    color: 'red'
  }
};
