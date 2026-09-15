$ErrorActionPreference = "Stop"
$src = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914200000_fix_lessons_content_base64.sql"
$out = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914210000_fix_lessons_content_by_folded_title.sql"

$text = [System.IO.File]::ReadAllText($src)
$v = $text.IndexOf("values")
if ($v -lt 0) { throw "NO_VALUES" }
$tail = $text.Substring($v)

$rowRe = New-Object System.Text.RegularExpressions.Regex("\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*convert_from\(decode\('([A-Za-z0-9+/=]+)'\s*,\s*'base64'\)\s*,\s*'utf8'\)\s*\)")
$ms = $rowRe.Matches($tail)
if ($ms.Count -ne 13) { throw ("EXPECTED_13_GOT_" + $ms.Count) }

$rows = New-Object System.Collections.Generic.List[string]
foreach ($m in $ms) {
  $lesson = $m.Groups[2].Value
  $b64 = $m.Groups[3].Value
  $folded = $lesson.ToLowerInvariant()
  $folded = $folded -replace [string][char]0x2014, "-"
  $folded = $folded -replace [string][char]0x2013, "-"
  $esc = $folded -replace "'", "''"
  $rows.Add(("  ('" + $esc + "', convert_from(decode('" + $b64 + "', 'base64'), 'utf8'))"))
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- ============================================================")
[void]$sb.AppendLine("-- Fix: lessons.content keyed by FOLDED lesson title (pure ASCII)")
[void]$sb.AppendLine("-- ============================================================")
[void]$sb.AppendLine("-- The builder folded every em/en dash (U+2014/U+2013) in the")
[void]$sb.AppendLine("-- on-disk titles down to a plain hyphen and lowercased them.")
[void]$sb.AppendLine("-- The matches on the LIVE side normalize the same way with")
[void]$sb.AppendLine("-- chr(8212)/chr(8211), and fold an existing hyphen region,")
[void]$sb.AppendLine("-- so em-dash vs hyphen can never cause a miss again.")
[void]$sb.AppendLine("-- Idempotent and safe to re-run. Bodies: base64 only, no $.")
[void]$sb.AppendLine("with folded_key(fkey, body) as (")
[void]$sb.AppendLine("  values")
[void]$sb.AppendLine(($rows -join ",`r`n"))
[void]$sb.AppendLine(")")
[void]$sb.AppendLine("update public.lessons l")
[void]$sb.AppendLine("set content = fk.body")
[void]$sb.AppendLine("from folded_key fk")
[void]$sb.AppendLine("where")
[void]$sb.AppendLine("  regexp_replace(regexp_replace(lower(l.title), chr(8212), '-'), chr(8211), '-') = fk.fkey;")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("-- proof:")
[void]$sb.AppendLine("-- select title, (content is not null) as has_content from public.lessons order by sort_order;")

[System.IO.File]::WriteAllText($out, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
$ob = [System.IO.File]::ReadAllBytes($out)
$ot = [System.Text.Encoding]::UTF8.GetString($ob)
$dollar = ([regex]::Matches($ot, '\$')).Count
$rowOut = ([regex]::Matches($ot, "\('")).Count
Write-Output ("ROWS=" + $rowOut + " DOLLARS=" + $dollar + " OUT=" + (Test-Path -LiteralPath $out))
