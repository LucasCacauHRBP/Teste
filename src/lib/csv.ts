/** Gera uma célula CSV segura (RFC 4180: aspas duplicadas, envolve em aspas
 * quando contém vírgula, aspas ou quebra de linha). */
function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function rowsToCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(escapeCsvCell).join(',')]
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(','))
  }
  // BOM para o Excel reconhecer UTF-8 corretamente ao abrir o CSV.
  return '\uFEFF' + lines.join('\r\n')
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
