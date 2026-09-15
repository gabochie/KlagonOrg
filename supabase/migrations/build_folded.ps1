$ErrorActionPreference = "Stop"
$src = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914200000_fix_lessons_content_base64.sql"
$out = "C:\Users\user\Desktop\GABOCHIE CORP\KLAGON OPERATIONS\klagon.org\supabase\migrations\20260914210000_fix_lessons_content_by_folded_title.sql"

$text = [System.IO.File]::ReadAllText($src)

$re = New-Object System.Text.RegularExpressions.Regex("\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*convert_from\(decode\('([A-Za-z0-9+/=]+)'\s*,\s*'base64'\)\s*,\s*'utf8'\)\s*\)")
$ms = $re.Matches($text)
if ($ms.Count -ne 13) { throw ("EXPECTED_13_GET_" + $ms.Count) }

$fold = { param($s) $s = $s.Replace([char]0x2014, '-').Replace([char]0x2013, '-'); $s.ToLowerInvariant() }

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- Keyed by LESSON TITLE only (all 13 titles are unique),")
[void]$sb.AppendLine("-- with em/en-dash folded to '-' on BOTH sides inside SQL.")
[void]$sb.AppendLine("-- So a glyph mismatch ( - vs -- ) can never miss a row.")
[void]$sb.AppendLine("-- Bodies are base64 (no dollar signs anywhere).")
[void]$sb.AppendLine("with folded(title_key, body) as (")
[void]$sb.AppendLine("  values")
$vals = New-Object System.Collections.Generic.List[string]
foreach ($m in $ms) {
  $lesson = $m.Groups[2].Value
  $b64 = $m.Groups[3].Value
  $key = & $fold $lesson
  $esc = $key -replace "'", "''"
  $vals.Add(("    ('" + $esc + "', convert_from(decode('" + $b64 + "','base64'),'utf8'))"))
}
[void]$sb.AppendLine(($vals -join ",`r`n"))
[void]$sb.AppendLine(")")
[void]$sb.AppendLine("update public.lessons l")
[void]$sb.AppendLine("set content = f.body")
[void]$sb.AppendLine("from folded f")
[void]$sb.AppendLine("where")
[void]$sb.AppendLine("  regexp_replace(regexp_replace(lower(l.title), chr(8212), '-'), chr(8211), '-')")
[void]$sb.AppendLine("  = lowercase(regexp_replace(regexp_replace(f.title_key, chr(8212), '-'), chr(8211), '-'))")
[void]$sb.AppendLine(";")

[System.IO.File]::WriteAllText($out, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))

$ob = [System.IO.File]::ReadAllBytes($out)
$ot = [System.Text.Encoding]::UTF8.GetString($ob)
$nd = ([regex]::Matches($ot, '\$')).Count
$nq = 0
$m2 = [System.Text.RegularExpressions.Regex]::Matches($ot, "\(decode\(")
$nq = $m2.Count
Write-Output ("ROWS=" + $nq + " DOLLARS=" + $nd + " EXISTS=" + (Test-Path -LiteralPath $out))
