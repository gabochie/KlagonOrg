$ErrorActionPreference = "Stop"
$src = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914200000_fix_lessons_content_base64.sql"
$out = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914210000_fix_lessons_content_title_norm.sql"

$text = [System.IO.File]::ReadAllText($src)
$v = $text.IndexOf("values")
if ($v -lt 0) { throw "NO_VALUES" }
$tail = $text.Substring($v)
$rowRe = New-Object System.Text.RegularExpressions.Regex("\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*convert_from\(decode\('([A-Za-z0-9+/=]+)'\s*,\s*'base64'\)\s*,\s*'utf8'\)\s*\)")
$ms = $rowRe.Matches($tail)
if ($ms.Count -ne 13) { throw ("EXPECTED_13_ROWS_NONORM_GOT_" + $ms.Count) }
$cs = New-Object System.Collections.Generic.List[string]
foreach ($m in $ms) {
  $course = $m.Groups[1].Value
  $lesson = $m.Groups[2].Value
  $b64 = $m.Groups[3].Value
  $cs.Add(($course -join ""))
}
Write-Output ("NONORM_ROWS=" + $ms.Count)
foreach($m in $ms){
  $lesson = $m.Groups[2].Value
  $b64 = $m.Groups[3].Value
  $esc = $lesson -replace "'", "''"
  Write-Output ("LE=" + $lesson.Substring(0,[Math]::Min(30,$lesson.Length)) + "  LA=" + $esc.Length)
}
