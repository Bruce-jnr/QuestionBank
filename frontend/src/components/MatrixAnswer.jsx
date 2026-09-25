function legacyMatrix(question) {
  const groups = question.options.reduce((result, option) => {
    const group = option.group || 'Response';
    return { ...result, [group]: [...(result[group] || []), option] };
  }, {});
  const rows = Object.keys(groups).map((label, index) => ({ id: `row-${index + 1}`, label }));
  const columnLabels = [...new Set(question.options.map((option) => option.text))];
  const columns = columnLabels.map((label, index) => ({ id: `column-${index + 1}`, label }));
  const cells = Object.fromEntries(rows.flatMap((row) => columns.map((column) => {
    const option = groups[row.label]?.find((item) => item.text === column.label);
    return [`${row.id}:${column.id}`, option?.id];
  })));
  return { rows, columns, cells, mode: 'SINGLE_RESPONSE' };
}

function matrixConfiguration(question) {
  const matrix = question.content?.matrix;
  if (matrix?.rows?.length && matrix?.columns?.length) {
    return {
      mode: matrix.mode === 'MULTIPLE_RESPONSE' ? 'MULTIPLE_RESPONSE' : 'SINGLE_RESPONSE',
      rows: matrix.rows,
      columns: matrix.columns,
      cells: Object.fromEntries(matrix.rows.flatMap((row) => matrix.columns.map((column) => [
        `${row.id}:${column.id}`,
        `${row.id}:${column.id}`,
      ]))),
    };
  }
  return legacyMatrix(question);
}

export default function MatrixAnswer({ disabled, onChange, question, selected }) {
  const matrix = matrixConfiguration(question);

  function choose(row, column) {
    if (disabled) return;
    const optionId = matrix.cells[`${row.id}:${column.id}`];
    if (!optionId) return;
    const rowOptionIds = matrix.columns
      .map((item) => matrix.cells[`${row.id}:${item.id}`])
      .filter(Boolean);
    onChange((values) => {
      if (matrix.mode === 'MULTIPLE_RESPONSE') {
        return values.includes(optionId)
          ? values.filter((value) => value !== optionId)
          : [...values, optionId];
      }
      return [...values.filter((value) => !rowOptionIds.includes(value)), optionId];
    });
  }

  return (
    <div className="matrix-answer-scroll">
      <table className="matrix-answer-table">
        <thead>
          <tr>
            <th scope="col">Clinical finding or action</th>
            {matrix.columns.map((column) => <th key={column.id} scope="col">{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.label}</th>
              {matrix.columns.map((column) => {
                const optionId = matrix.cells[`${row.id}:${column.id}`];
                return (
                  <td key={column.id}>
                    <label>
                      <input
                        checked={Boolean(optionId && selected.includes(optionId))}
                        disabled={disabled || !optionId}
                        name={`matrix-${question.id}-${row.id}`}
                        onChange={() => choose(row, column)}
                        type={matrix.mode === 'MULTIPLE_RESPONSE' ? 'checkbox' : 'radio'}
                      />
                      <span className="matrix-control" aria-hidden="true" />
                      <span className="sr-only">{row.label}: {column.label}</span>
                    </label>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="matrix-answer-help">
        {matrix.mode === 'MULTIPLE_RESPONSE'
          ? 'Select all responses that apply in each row.'
          : 'Select one response in each row.'}
      </p>
    </div>
  );
}
