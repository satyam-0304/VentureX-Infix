import { LearningSession } from '../types';

export const DEFAULT_SESSIONS: LearningSession[] = [
  {
    id: 'session-pl-04',
    code: 'PL',
    title: 'Polymers & Macromolecules',
    courseName: 'Engineering Chemistry',
    topic: 'Polymers',
    lessonTitle: 'Watch your lesson',
    lessonNumber: 'Video Lesson 04',
    videoUrl: 'https://www.youtube.com/watch?v=k38j3pG6KXY',
    posterUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFJVrl_Xru8fqMdzEDJE3EM4k3zpBMz4H5jwdEUzAMkO_rAC5yMGdX2NzMez72-Jg7cPgpw9xqw_87neaSAffbiBGuQ7ThDq2hxFAtAtxv-X-wQ_lt7OPTTkCL2BCX_jp_dJ-gCCHITACIos7DQW04R3G3Za5OGCARJNEgNmPhNrwYKPoENfT2kTyZoONS1h7ShPiIUNucMPDaZc0OagyDNRtsgSfeW5n6RJd6sfyXudWfHe0q5Ju8',
    durationSeconds: 1110, // 18m 30s
    savedPlaybackPosition: 402, // 06:42
    instructor: 'Professor Vance',
    rating: 4.9,
    reviewCount: 142,
    objectives: [
      'Monomer polymerization mechanics',
      'Thermoplastic vs Thermosetting',
      'Synthetic biomaterial applications'
    ],
    vocabulary: [
      { term: 'Monomer' },
      { term: 'Polymerization' },
      { term: 'Elastomer' },
      { term: 'Cross-linking' }
    ],
    tasks: [
      {
        id: 'task-1',
        stepNumber: 1,
        title: 'Understanding Check',
        subtitle: 'Knowledge Retrieval Checkpoint',
        timestampTarget: 60,
        status: 'active',
        type: 'mcq',
        question: 'What is the primary characteristic of polymers?',
        options: [
          { id: 'opt-a', label: 'They consist of repeating monomer units.', isCorrect: true },
          { id: 'opt-b', label: 'They are always strictly metallic.', isCorrect: false },
          { id: 'opt-c', label: 'They contain only one single atom.', isCorrect: false },
          { id: 'opt-d', label: 'They cannot form continuous chains.', isCorrect: false }
        ],
        explanation: 'Polymers are large macromolecules formed by covalently linking many small, repeating structural units called monomers.',
        selectedOptionId: 'opt-a',
        answeredCorrectly: true
      },
      {
        id: 'task-2',
        stepNumber: 2,
        title: 'Quick Quiz: Synthetic vs Natural',
        subtitle: '2 min',
        timestampTarget: 120,
        status: 'active',
        type: 'mcq',
        question: 'Which of these is a naturally occurring biopolymer?',
        options: [
          { id: 'opt-2a', label: 'Cellulose / Starch', isCorrect: true },
          { id: 'opt-2b', label: 'Nylon-6,6', isCorrect: false },
          { id: 'opt-2c', label: 'PTFE (Teflon)', isCorrect: false },
          { id: 'opt-2d', label: 'Polyethylene terephthalate', isCorrect: false }
        ],
        explanation: 'Cellulose and starch are polysaccharides synthesized naturally by plant cells as primary structural and energy-storage polymers.',
        selectedOptionId: undefined,
        answeredCorrectly: false
      },
      {
        id: 'task-3',
        stepNumber: 3,
        title: 'Concept Explanation: Cross-linking',
        subtitle: '09:15',
        timestampTarget: 180,
        status: 'locked',
        type: 'concept',
        contentDescription: 'Observe how sulfur bridges link polyisoprene strands during vulcanization to increase tensile durability.'
      },
      {
        id: 'task-4',
        stepNumber: 4,
        title: 'Real-world Application Challenge',
        subtitle: 'Locked',
        timestampTarget: 240,
        status: 'locked',
        type: 'challenge',
        contentDescription: 'Synthesize biomimetic hydrogels for drug delivery stents with targeted dissolution triggers.'
      },
      {
        id: 'task-5',
        stepNumber: 5,
        title: 'Lesson Revision & Summary',
        subtitle: 'Locked',
        timestampTarget: 300,
        status: 'locked',
        type: 'revision',
        contentDescription: 'Comprehensive end-of-module assessment covering addition and condensation mechanisms.'
      }
    ],
    notes: [
      { id: 'note-1', timestamp: 74, formattedTime: '01:14', text: 'Monomers bond via condensation or addition mechanisms.', createdAt: Date.now() - 3600000 },
      { id: 'note-2', timestamp: 220, formattedTime: '03:40', text: 'Cross-linking drastically restricts sliding of polymer chains.', createdAt: Date.now() - 1800000 },
      { id: 'note-3', timestamp: 322, formattedTime: '05:22', text: 'Thermosetting plastics cannot be remelted once cured.', createdAt: Date.now() - 900000 }
    ],
    bookmarks: [
      { id: 'bm-1', timestamp: 60, formattedTime: '01:00', title: 'Task 1: Monomer chains' },
      { id: 'bm-2', timestamp: 120, formattedTime: '02:00', title: 'Task 2: Natural vs synthetic' },
      { id: 'bm-3', timestamp: 180, formattedTime: '03:00', title: 'Task 3: Cross-linking & Vulcanization' }
    ],
    transcript: [
      { id: 'tr-1', timestamp: 10, formattedTime: '00:10', text: 'Welcome everyone to Engineering Chemistry. Today we delve into polymers and macromolecular structures.' },
      { id: 'tr-2', timestamp: 60, formattedTime: '01:00', text: 'Notice how polymers are created by long chains of small repeating subunits named monomers.' },
      { id: 'tr-3', timestamp: 120, formattedTime: '02:00', text: "Let's distinguish between naturally occurring polymers like cellulose versus synthetics like nylon." },
      { id: 'tr-4', timestamp: 180, formattedTime: '03:00', text: 'Cross-linking chemically binds polymer chains into 3D structural networks, altering elasticity.' },
      { id: 'tr-5', timestamp: 240, formattedTime: '04:00', text: 'In modern aerospace and biomedical engineering, high-performance thermoplastics replace heavy metals.' },
      { id: 'tr-6', timestamp: 300, formattedTime: '05:00', text: 'Addition polymerization proceeds via free-radical or ionic catalysts without byproduct condensation molecules.' }
    ],
    chapters: [
      {
        id: 1,
        title: 'Introduction & Classification by Source',
        start_sec: 0,
        end_sec: 240,
        summary: 'Definition of macromolecules and classification into natural, semi-synthetic, and synthetic polymers.'
      },
      {
        id: 2,
        title: 'Addition Polymerization Mechanics',
        start_sec: 240,
        end_sec: 540,
        summary: 'Chain-growth polymerization through initiator radicals, propagation, and termination.'
      },
      {
        id: 3,
        title: 'Condensation & Cross-linking',
        start_sec: 540,
        end_sec: 840,
        summary: 'Step-growth polycondensation mechanisms, Nylon 6,6 synthesis, and vulcanization.'
      },
      {
        id: 4,
        title: 'Biomaterials & Modern Applications',
        start_sec: 840,
        end_sec: 1110,
        summary: 'Smart polymers, viscoelastic properties, and engineering materials.'
      }
    ],
    discussions: [
      {
        id: 'disc-1',
        authorName: 'Marcus Chen',
        timeAgo: '14m ago',
        content: 'Does cross-linking always make a polymer brittle, or can it remain flexible?',
        upvotes: 6,
        hasUpvoted: false
      },
      {
        id: 'disc-2',
        authorName: 'Aisha Patel',
        timeAgo: '2h ago',
        content: 'Vulcanization of rubber is such a neat real-world example of sulfur cross-links!',
        upvotes: 11,
        hasUpvoted: false
      }
    ],
    chatHistory: [
      {
        id: 'chat-0',
        sender: 'ai',
        text: "Hello Simona! I'm here alongside your Polymers lecture. Ask me anything about monomers, elastomer mechanics, or quiz help!",
        timestamp: 'Just now'
      }
    ],
    updatedAt: Date.now()
  },
  {
    id: 'session-ch-01',
    code: 'CH',
    title: 'Chemistry Foundations',
    courseName: 'General Chemistry',
    topic: 'Foundations',
    lessonTitle: 'Atomic Models and Orbital Theory',
    lessonNumber: 'Video Lesson 01',
    videoUrl: 'https://www.youtube.com/watch?v=aircAruvnKk',
    posterUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 960,
    savedPlaybackPosition: 120,
    instructor: 'Dr. Evelyn Reed',
    rating: 4.8,
    reviewCount: 98,
    objectives: [
      'Bohr vs Quantum mechanical model',
      'Electron configuration rules (Aufbau, Pauli, Hund)',
      'Periodic trends in ionization energy'
    ],
    vocabulary: [
      { term: 'Orbital' },
      { term: 'Electronegativity' },
      { term: 'Quantum Numbers' },
      { term: 'Valence Electrons' }
    ],
    tasks: [
      {
        id: 'task-ch-1',
        stepNumber: 1,
        title: 'Orbital Check',
        subtitle: 'Aufbau Principle',
        timestampTarget: 45,
        status: 'active',
        type: 'mcq',
        question: 'Which subshell fills first according to the Aufbau principle?',
        options: [
          { id: 'opt-ch-1a', label: '4s fills before 3d', isCorrect: true },
          { id: 'opt-ch-1b', label: '3d fills before 4s', isCorrect: false },
          { id: 'opt-ch-1c', label: '4p fills before 3s', isCorrect: false },
          { id: 'opt-ch-1d', label: '5s fills before 3p', isCorrect: false }
        ],
        explanation: 'Due to lower energy state and electron penetration, the 4s orbital fills immediately before the 3d orbitals.',
        selectedOptionId: 'opt-ch-1a',
        answeredCorrectly: true
      }
    ],
    notes: [
      { id: 'note-ch-1', timestamp: 60, formattedTime: '01:00', text: 'Remember Hunds rule: electrons occupy degenerate orbitals singly first.', createdAt: Date.now() - 7200000 }
    ],
    bookmarks: [
      { id: 'bm-ch-1', timestamp: 45, formattedTime: '00:45', title: 'Aufbau ordering rule' }
    ],
    transcript: [
      { id: 'tr-ch-1', timestamp: 0, formattedTime: '00:00', text: 'Welcome to Chemistry Foundations. Today we demystify electron configurations.' },
      { id: 'tr-ch-2', timestamp: 45, formattedTime: '00:45', text: 'Watch how orbitals fill in order of increasing energy levels.' }
    ],
    discussions: [
      { id: 'disc-ch-1', authorName: 'Liam Torres', timeAgo: '1d ago', content: 'Why do Chromium and Copper violate the standard Aufbau rule?', upvotes: 9, hasUpvoted: false }
    ],
    chatHistory: [
      { id: 'chat-ch-0', sender: 'ai', text: 'Welcome to Chemistry Foundations! Ask me anything regarding electron configurations or periodic trends.', timestamp: '1d ago' }
    ],
    updatedAt: Date.now() - 86400000
  },
  {
    id: 'session-oc-02',
    code: 'OC',
    title: 'Organic Chemistry',
    courseName: 'Organic Reaction Mechanisms',
    topic: 'Reaction Kinetics',
    lessonTitle: 'SN1 vs SN2 Nucleophilic Substitution',
    lessonNumber: 'Video Lesson 02',
    videoUrl: 'https://www.youtube.com/watch?v=bHTqg7nQ2iE',
    posterUrl: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 1240,
    savedPlaybackPosition: 210,
    instructor: 'Professor Vance',
    rating: 5.0,
    reviewCount: 210,
    objectives: [
      'Steric hindrance in carbocation intermediates',
      'Inversion of stereocenters in SN2',
      'Protic vs Aprotic solvent selection'
    ],
    vocabulary: [
      { term: 'Nucleophile' },
      { term: 'Carbocation' },
      { term: 'Steric Hindrance' },
      { term: 'Walden Inversion' }
    ],
    tasks: [
      {
        id: 'task-oc-1',
        stepNumber: 1,
        title: 'Mechanism Identifier',
        subtitle: 'Substrate classification',
        timestampTarget: 90,
        status: 'active',
        type: 'mcq',
        question: 'Which substrate strongly favors the SN2 substitution pathway?',
        options: [
          { id: 'opt-oc-1a', label: 'Primary (1°) alkyl halide with unhindered back-attack', isCorrect: true },
          { id: 'opt-oc-1b', label: 'Tertiary (3°) alkyl halide with heavy crowding', isCorrect: false },
          { id: 'opt-oc-1c', label: 'Resonance-stabilized carbocation', isCorrect: false },
          { id: 'opt-oc-1d', label: 'Aromatic phenyl halide', isCorrect: false }
        ],
        explanation: 'Primary alkyl halides possess minimal steric hindrance, facilitating backside attack in a concerted single-step bimolecular mechanism.',
        selectedOptionId: 'opt-oc-1a',
        answeredCorrectly: true
      }
    ],
    notes: [
      { id: 'note-oc-1', timestamp: 120, formattedTime: '02:00', text: 'Polar aprotic solvents (like DMSO or acetone) accelerate SN2 reactions.', createdAt: Date.now() - 14400000 }
    ],
    bookmarks: [],
    transcript: [
      { id: 'tr-oc-1', timestamp: 0, formattedTime: '00:00', text: 'Today we explore the kinetic differences between unimolecular and bimolecular nucleophilic substitution.' }
    ],
    discussions: [],
    chatHistory: [],
    updatedAt: Date.now() - 172800000
  },
  {
    id: 'session-py-03',
    code: 'PY',
    title: 'Physics & Kinetics',
    courseName: 'Classical Mechanics',
    topic: 'Kinetics',
    lessonTitle: 'Rotational Dynamics and Angular Momentum',
    lessonNumber: 'Video Lesson 03',
    videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
    posterUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 1080,
    savedPlaybackPosition: 0,
    instructor: 'Dr. Sarah Jenkins',
    rating: 4.9,
    reviewCount: 77,
    objectives: [
      'Moment of inertia calculation for symmetric bodies',
      'Conservation of angular momentum in isolated systems',
      'Torque and rotational work-energy theorem'
    ],
    vocabulary: [
      { term: 'Moment of Inertia' },
      { term: 'Angular Momentum' },
      { term: 'Torque' },
      { term: 'Precession' }
    ],
    tasks: [],
    notes: [],
    bookmarks: [],
    transcript: [],
    discussions: [],
    chatHistory: [],
    updatedAt: Date.now() - 259200000
  },
  {
    id: 'session-bc-05',
    code: 'BC',
    title: 'Biochemistry',
    courseName: 'Molecular Cell Biology',
    topic: 'Enzymes',
    lessonTitle: 'Michaelis-Menten Enzyme Kinetics',
    lessonNumber: 'Video Lesson 05',
    videoUrl: 'https://www.youtube.com/watch?v=k38j3pG6KXY',
    posterUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 900,
    savedPlaybackPosition: 0,
    instructor: 'Dr. Alistair Thorne',
    rating: 4.7,
    reviewCount: 65,
    objectives: [
      'Km definition and physiological affinity',
      'Vmax and catalytic turnover kcat',
      'Lineweaver-Burk double reciprocal plots'
    ],
    vocabulary: [
      { term: 'Substrate Affinity' },
      { term: 'Vmax' },
      { term: 'Allosteric Regulation' }
    ],
    tasks: [],
    notes: [],
    bookmarks: [],
    transcript: [],
    discussions: [],
    chatHistory: [],
    updatedAt: Date.now() - 345600000
  },
  {
    id: 'session-en-06',
    code: 'EN',
    title: 'Materials Engineering',
    courseName: 'Solid State Materials',
    topic: 'Crystalline Solids',
    lessonTitle: 'Stress-Strain Curves and Elastic Moduli',
    lessonNumber: 'Video Lesson 06',
    videoUrl: 'https://www.youtube.com/watch?v=bHTqg7nQ2iE',
    posterUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 1320,
    savedPlaybackPosition: 0,
    instructor: 'Professor Marcus Vance',
    rating: 4.9,
    reviewCount: 180,
    objectives: [
      'Youngs modulus, shear modulus, and Poissons ratio',
      'Plastic deformation and dislocation slip',
      'Fracture toughness in brittle vs ductile alloys'
    ],
    vocabulary: [
      { term: 'Youngs Modulus' },
      { term: 'Yield Strength' },
      { term: 'Dislocation Slip' }
    ],
    tasks: [],
    notes: [],
    bookmarks: [],
    transcript: [],
    discussions: [],
    chatHistory: [],
    updatedAt: Date.now() - 432000000
  }
];

