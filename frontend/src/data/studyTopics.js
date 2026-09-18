export const studyTopics = [
  ['Management of Care', 'Prioritization, delegation, advocacy, collaboration, and continuity of care.', 20, 'MANAGEMENT_OF_CARE'],
  ['Pharmacological and Parenteral Therapies', 'Medication administration, expected effects, adverse effects, and parenteral therapy.', 15, 'PHARMACOLOGICAL_AND_PARENTERAL_THERAPIES'],
  ['Physiological Adaptation', 'Care for acute, chronic, life-threatening, and complex health conditions.', 14, 'PHYSIOLOGICAL_ADAPTATION'],
  ['Reduction of Risk Potential', 'Recognizing complications and reducing risks related to treatments and procedures.', 12, 'REDUCTION_OF_RISK_POTENTIAL'],
  ['Safety and Infection Control', 'Protecting clients and healthcare personnel from health and environmental hazards.', 12, 'SAFETY_AND_INFECTION_CONTROL'],
  ['Health Promotion and Maintenance', 'Growth, development, prevention, screening, and healthy lifestyle choices.', 9, 'HEALTH_PROMOTION_AND_MAINTENANCE'],
  ['Psychosocial Integrity', 'Mental health, coping, therapeutic communication, and emotional support.', 9, 'PSYCHOSOCIAL_INTEGRITY'],
  ['Basic Care and Comfort', 'Mobility, nutrition, elimination, personal care, rest, and non-pharmacological comfort.', 9, 'BASIC_CARE_AND_COMFORT'],
]

export function topicKey(topicName) {
  return studyTopics.find(([title]) => title === topicName)?.[3] || null
}
