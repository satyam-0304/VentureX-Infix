import { LearningSession } from '../types';

export const DEFAULT_SESSIONS: LearningSession[] = [
  {
    id: 'session-default-01',
    code: 'LX',
    title: 'New Learning Session',
    courseName: 'Online Lecture',
    topic: 'Lecture',
    lessonTitle: 'Enter a YouTube URL to start',
    lessonNumber: 'Session 01',
    videoUrl: '',
    posterUrl: '',
    durationSeconds: 0,
    savedPlaybackPosition: 0,
    instructor: 'AI Tutor',
    rating: 5.0,
    reviewCount: 0,
    objectives: [
      'Paste any YouTube lecture URL to auto-generate chapters, notes, and quiz checkpoints.'
    ],
    vocabulary: [],
    tasks: [],
    notes: [],
    bookmarks: [],
    transcript: [],
    chapters: [],
    discussions: [],
    chatHistory: [
      {
        id: 'chat-init',
        sender: 'ai',
        text: 'Welcome to Lurnix! Paste any YouTube educational video URL to begin studying with synchronized interactive chapters, quizzes, and grounded AI tutor support.',
        timestamp: 'Just now'
      }
    ],
    updatedAt: Date.now()
<<<<<<< HEAD
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
=======
>>>>>>> e8ff837b4b984d55f5209175e0c251f584f30cf6
  }
];
