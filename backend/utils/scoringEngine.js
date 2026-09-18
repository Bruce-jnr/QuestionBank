function uniqueValues(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(String))];
}

function calculateScore(scoringMethod, selectedValues, correctValues) {
  const selected = uniqueValues(selectedValues);
  const correct = uniqueValues(correctValues);
  const correctSet = new Set(correct);
  const selectedSet = new Set(selected);
  const exactMatch = selected.length === correct.length
    && selected.every((value) => correctSet.has(value));

  if (scoringMethod === 'PLUS_MINUS') {
    const correctSelections = selected.filter((value) => correctSet.has(value)).length;
    const incorrectSelections = selected.filter((value) => !correctSet.has(value)).length;
    const pointsPossible = Math.max(correct.length, 1);
    const pointsEarned = Math.max(0, Math.min(pointsPossible, correctSelections - incorrectSelections));
    return { isCorrect: exactMatch, pointsEarned, pointsPossible };
  }

  if (scoringMethod === 'RATIONALE') {
    const pointsPossible = Math.max(correct.length, 1);
    const pointsEarned = correct.reduce(
      (total, value) => total + (selectedSet.has(value) ? 1 : 0),
      0,
    );
    return { isCorrect: exactMatch, pointsEarned, pointsPossible };
  }

  return {
    isCorrect: exactMatch,
    pointsEarned: exactMatch ? 1 : 0,
    pointsPossible: 1,
  };
}

module.exports = { calculateScore };
