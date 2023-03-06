// 年月日
export function formatDate (d, format) {
  const t = d ? new Date(d) : new Date()
  // var t = d ? new Date(d) : new Date()
  const year = t.getFullYear()
  let month = t.getMonth() + 1
  if (month < 10) { month = '0' + month }
  let date = t.getDate()
  if (date < 10) { date = '0' + date }
  return year + format + month + format + date
}
