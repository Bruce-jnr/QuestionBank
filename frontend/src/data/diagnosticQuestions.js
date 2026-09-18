export const diagnosticQuestions = [
  {
    id: 1,
    category: 'Management of Care',
    prompt:
      'Which client should the nurse assess first after receiving shift report?',
    options: [
      'A client requesting pain medication for chronic back pain',
      'A client one day after thyroid surgery who has new stridor',
      'A client waiting for discharge instructions',
      'A client with a scheduled dressing change',
    ],
    answer: 1,
    rationale:
      'New stridor can signal an airway obstruction. Airway concerns take priority over stable or scheduled needs.',
  },
  {
    id: 2,
    category: 'Pharmacological and Parenteral Therapies',
    prompt:
      'Which action is appropriate when administering potassium chloride intravenously?',
    options: [
      'Give it by rapid IV push for a low potassium level',
      'Mix it with any medication already infusing',
      'Dilute it and administer it using a controlled infusion',
      'Administer it without checking kidney function',
    ],
    answer: 2,
    rationale:
      'IV potassium must be diluted and delivered at a controlled rate. It should never be administered by IV push.',
  },
  {
    id: 3,
    category: 'Physiological Adaptation',
    prompt:
      'Which finding in a client with hyperkalemia requires the most immediate action?',
    options: [
      'Mild nausea',
      'Muscle fatigue',
      'Peaked T waves on the cardiac monitor',
      'Occasional abdominal cramping',
    ],
    answer: 2,
    rationale:
      'Peaked T waves indicate cardiac involvement and a risk of life-threatening dysrhythmias, requiring immediate intervention.',
  },
  {
    id: 4,
    category: 'Reduction of Risk Potential',
    prompt:
      'Which finding after a femoral cardiac catheterization should the nurse report immediately?',
    options: [
      'A small bruise at the insertion site',
      'The client asks for water',
      'The affected foot is cool with a weak pedal pulse',
      'The client reports mild tenderness at the site',
    ],
    answer: 2,
    rationale:
      'A cool extremity and weak distal pulse may indicate impaired arterial circulation and require immediate evaluation.',
  },
  {
    id: 5,
    category: 'Safety and Infection Control',
    prompt:
      'Which action is most important after caring for a client with Clostridioides difficile infection?',
    options: [
      'Clean the hands with soap and water',
      'Use only alcohol-based hand sanitizer',
      'Wear an N95 respirator when leaving the room',
      'Place all supplies in the hallway',
    ],
    answer: 0,
    rationale:
      'Soap and water physically remove C. difficile spores. Alcohol-based sanitizer alone is not effective against the spores.',
  },
  {
    id: 6,
    category: 'Health Promotion and Maintenance',
    prompt: 'Which nursing action is an example of primary prevention?',
    options: [
      'Teaching a client how to manage a new colostomy',
      'Providing rehabilitation after a stroke',
      'Administering a scheduled vaccine',
      'Screening an adult for hypertension',
    ],
    answer: 2,
    rationale:
      'Primary prevention aims to prevent disease before it occurs. Vaccination is a primary prevention activity.',
  },
  {
    id: 7,
    category: 'Psychosocial Integrity',
    prompt:
      'A client says, “I am afraid my surgery will go badly.” Which response by the nurse is therapeutic?',
    options: [
      'You should not worry; this surgery is routine.',
      'Tell me more about what is worrying you.',
      'Everything will be fine once the surgery is over.',
      'Why do you think something will go wrong?',
    ],
    answer: 1,
    rationale:
      'An open-ended response encourages the client to express concerns without giving false reassurance or sounding judgmental.',
  },
  {
    id: 8,
    category: 'Basic Care and Comfort',
    prompt:
      'Which intervention best reduces pressure-injury risk for an immobile client?',
    options: [
      'Massage reddened bony areas each shift',
      'Keep the head of the bed elevated at all times',
      'Reposition the client regularly and offload the heels',
      'Use a ring-shaped cushion under the sacrum',
    ],
    answer: 2,
    rationale:
      'Regular repositioning and heel offloading reduce prolonged pressure. Reddened areas should not be massaged.',
  },
];
