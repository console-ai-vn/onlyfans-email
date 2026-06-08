# One-time CLI setup: CF_API_TOKEN secret + EMAIL list + wrangler vars + R2 domain config.
# Requires API token with Account > Zero Trust > Edit (or Secure Web Gateway > Edit).
param(
	[string]$Token = $env:CF_API_TOKEN,
	[string]$AccountId = "a23f698a1f594da1a6fb657c5bea74a8",
	[string]$ListName = "VSBG Box OTP Allowlist",
	[switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Invoke-CfApi {
	param([string]$Method, [string]$Path, [object]$Body)
	$headers = @{
		Authorization = "Bearer $Token"
		"Content-Type" = "application/json"
	}
	$params = @{
		Uri = "https://api.cloudflare.com/client/v4$Path"
		Method = $Method
		Headers = $headers
	}
	if ($null -ne $Body) {
		$params.Body = ($Body | ConvertTo-Json -Depth 8)
	}
	$response = Invoke-RestMethod @params
	if (-not $response.success) {
		$message = ($response.errors | ForEach-Object { $_.message }) -join "; "
		throw $message
	}
	return $response.result
}

if (-not $Token) {
	Write-Host ""
	Write-Host "Chua co CF_API_TOKEN."
	Write-Host "1) Mo: https://dash.cloudflare.com/profile/api-tokens"
	Write-Host "   Template: Edit Cloudflare Zero Trust (Account: $AccountId)"
	Write-Host "2) Chay lai:"
	Write-Host '   $env:CF_API_TOKEN = "cfut_..."'
	Write-Host "   .\scripts\setup-signup-otp-automation.ps1"
	Write-Host ""
	Start-Process "https://dash.cloudflare.com/profile/api-tokens"
	exit 1
}

Write-Host "Verify token..."
$verify = Invoke-CfApi -Method GET -Path "/user/tokens/verify"
Write-Host "Token active: $($verify.status)"

Write-Host "List EMAIL gateway lists..."
$lists = Invoke-CfApi -Method GET -Path "/accounts/$AccountId/gateway/lists?type=EMAIL"
$list = $lists | Where-Object { $_.name -eq $ListName } | Select-Object -First 1
if (-not $list) {
	Write-Host "Create list: $ListName"
	$list = Invoke-CfApi -Method POST -Path "/accounts/$AccountId/gateway/lists" -Body @{
		name = $ListName
		type = "EMAIL"
		description = "Auto-append on VSBG Box signup approve"
	}
}
$listId = $list.id
Write-Host "List ID: $listId"

$seedEmails = @(
	"ceo@bdsmetro.com",
	"admin@vsbg.vn",
	"test@vsbg.vn",
	"thaihieu@vsbg.vn"
)
foreach ($email in $seedEmails) {
	try {
		Invoke-CfApi -Method PATCH -Path "/accounts/$AccountId/gateway/lists/$listId" -Body @{
			append = @(@{ value = $email.ToLower(); description = "VSBG seed" })
		} | Out-Null
		Write-Host "Seeded: $email"
	} catch {
		if ($_.Exception.Message -notmatch "duplicate|already exists") {
			Write-Host "Seed skip $email : $($_.Exception.Message)"
		}
	}
}

Write-Host "Set worker secret CF_API_TOKEN..."
Write-Output $Token | wrangler secret put CF_API_TOKEN

$configPath = Join-Path $ProjectRoot "wrangler.jsonc"
$configText = Get-Content $configPath -Raw
if ($configText -notmatch '"CF_ACCOUNT_ID"') {
	$configText = $configText -replace '("ACCESS_EMAIL_ADDRESSES":\s*\[[^\]]+\])', "`$1,`n`t`t`"CF_ACCOUNT_ID`": `"$AccountId`",`n`t`t`"ACCESS_OTP_LIST_ID`": `"$listId`""
} else {
	$configText = $configText -replace '"CF_ACCOUNT_ID":\s*"[^"]*"', "`"CF_ACCOUNT_ID`": `"$AccountId`""
	$configText = $configText -replace '"ACCESS_OTP_LIST_ID":\s*"[^"]*"', "`"ACCESS_OTP_LIST_ID`": `"$listId`""
}
Set-Content -Path $configPath -Value $configText -NoNewline

Write-Host "Update R2 domains/config.json..."
$domainConfig = @{
	domains = @("vsbg.vn")
	emailAddresses = @("admin@vsbg.vn", "test@vsbg.vn", "thaihieu@vsbg.vn")
	accessEmailAddresses = @("ceo@bdsmetro.com")
	cfAccountId = $AccountId
	accessOtpListId = $listId
}
$tmp = Join-Path $ProjectRoot "tmp-domain-config.json"
$domainConfig | ConvertTo-Json -Depth 4 | Set-Content $tmp
wrangler r2 object put vsbg-box/domains/config.json --remote --file $tmp | Out-Null
Remove-Item $tmp -Force

if (-not $SkipDeploy) {
	Write-Host "Deploy worker..."
	pnpm deploy
}

Write-Host ""
Write-Host "Done."
Write-Host "Account: $AccountId"
Write-Host "List:    $listId ($ListName)"
Write-Host ""
Write-Host "Neu Access policy chua dung list nay, them 1 lan trong Zero Trust:"
Write-Host "  Access > Applications > box.vsbg.vn > Policy > Include > Emails in list > $ListName"
Write-Host "Hard refresh /admin/signups - badge phai la Full auto."