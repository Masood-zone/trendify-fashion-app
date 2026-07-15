export function csvResponse(
  rows: Array<Record<string, string | number | boolean | null | undefined>>,
  filename: string
) {
  const headers = rows.length ? Object.keys(rows[0]) : ["message"]
  const source = rows.length
    ? rows
    : [{ message: "No records matched the selected filters" }]
  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`
  const body = [
    headers.map(escape).join(","),
    ...source.map((row) => headers.map((key) => escape(row[key])).join(",")),
  ].join("\r\n")
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
