param(
  [Parameter(Mandatory = $true)]
  [string]$Url,
  [string]$Concurrency = "10,50,100,200",
  [int]$DurationSec = 15,
  [int]$TimeoutSec = 10,
  [string]$Cookie = "",
  [string]$Label = "ps-benchmark",
  [string]$Output = ""
)

function Get-Percentile {
  param(
    [double[]]$Sorted,
    [double]$Ratio
  )

  if (-not $Sorted -or $Sorted.Length -eq 0) {
    return $null
  }

  $index = [Math]::Ceiling($Sorted.Length * $Ratio) - 1
  if ($index -lt 0) { $index = 0 }
  if ($index -ge $Sorted.Length) { $index = $Sorted.Length - 1 }
  return $Sorted[$index]
}

$concurrencyLevels = $Concurrency.Split(",") |
  ForEach-Object { $_.Trim() } |
  Where-Object { $_ -match '^\d+$' } |
  ForEach-Object { [int]$_ } |
  Where-Object { $_ -gt 0 }

if (-not $concurrencyLevels -or $concurrencyLevels.Count -eq 0) {
  throw "No valid concurrency level provided."
}

$headers = @{}
if ($Cookie -and $Cookie.Trim().Length -gt 0) {
  $headers["Cookie"] = $Cookie.Trim()
}

$results = @()

foreach ($level in $concurrencyLevels) {
  Write-Host ("Running level {0} for {1}s: {2}" -f $level, $DurationSec, $Url)

  $deadline = (Get-Date).AddSeconds($DurationSec)
  $jobs = @()

  for ($i = 0; $i -lt $level; $i++) {
    $jobs += Start-Job -ScriptBlock {
      param($RequestUrl, $EndAt, $ReqTimeoutSec, $ReqHeaders)

      $total = 0
      $success = 0
      $non2xx = 0
      $timeouts = 0
      $other = 0
      $latency = [System.Collections.Generic.List[double]]::new()

      while ((Get-Date) -lt $EndAt) {
        $total += 1
        $sw = [System.Diagnostics.Stopwatch]::StartNew()

        try {
          if ($ReqHeaders.Count -gt 0) {
            $resp = Invoke-WebRequest -Uri $RequestUrl -Headers $ReqHeaders -UseBasicParsing -TimeoutSec $ReqTimeoutSec
          }
          else {
            $resp = Invoke-WebRequest -Uri $RequestUrl -UseBasicParsing -TimeoutSec $ReqTimeoutSec
          }

          $sw.Stop()

          if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
            $success += 1
            [void]$latency.Add($sw.Elapsed.TotalMilliseconds)
          }
          else {
            $non2xx += 1
          }
        }
        catch {
          $sw.Stop()
          $msg = $_.Exception.Message
          if ($msg -match "timed out|operation has timed out|The operation has timed out") {
            $timeouts += 1
          }
          else {
            $other += 1
          }
        }
      }

      [PSCustomObject]@{
        total = $total
        success = $success
        non2xx = $non2xx
        timeouts = $timeouts
        other = $other
        latency = $latency.ToArray()
      }
    } -ArgumentList $Url, $deadline, $TimeoutSec, $headers
  }

  $jobResults = $jobs | Wait-Job | Receive-Job
  $jobs | Remove-Job -Force | Out-Null

  $totalRequests = ($jobResults | Measure-Object -Property total -Sum).Sum
  $successCount = ($jobResults | Measure-Object -Property success -Sum).Sum
  $non2xxCount = ($jobResults | Measure-Object -Property non2xx -Sum).Sum
  $timeoutCount = ($jobResults | Measure-Object -Property timeouts -Sum).Sum
  $otherErrors = ($jobResults | Measure-Object -Property other -Sum).Sum

  $latencyList = [System.Collections.Generic.List[double]]::new()
  foreach ($jr in $jobResults) {
    if ($jr.latency) {
      $latencyList.AddRange([double[]]$jr.latency)
    }
  }

  $latencyArray = $latencyList.ToArray()
  [Array]::Sort($latencyArray)

  $mean = $null
  $p50 = $null
  $p95 = $null
  $p99 = $null
  $max = $null

  if ($latencyArray.Length -gt 0) {
    $sum = 0.0
    foreach ($v in $latencyArray) { $sum += $v }
    $mean = $sum / $latencyArray.Length
    $p50 = Get-Percentile -Sorted $latencyArray -Ratio 0.50
    $p95 = Get-Percentile -Sorted $latencyArray -Ratio 0.95
    $p99 = Get-Percentile -Sorted $latencyArray -Ratio 0.99
    $max = $latencyArray[$latencyArray.Length - 1]
  }

  $errorCount = $non2xxCount + $timeoutCount + $otherErrors
  $successRate = if ($totalRequests -gt 0) { $successCount / $totalRequests } else { 0 }
  $errorRate = if ($totalRequests -gt 0) { $errorCount / $totalRequests } else { 0 }
  $timeoutRate = if ($totalRequests -gt 0) { $timeoutCount / $totalRequests } else { 0 }
  $throughputRps = if ($DurationSec -gt 0) { $totalRequests / $DurationSec } else { 0 }

  $results += [PSCustomObject]@{
    concurrency = $level
    durationSec = $DurationSec
    totalRequests = $totalRequests
    successCount = $successCount
    non2xxCount = $non2xxCount
    timeoutCount = $timeoutCount
    otherErrors = $otherErrors
    successRate = $successRate
    errorRate = $errorRate
    timeoutRate = $timeoutRate
    throughputRps = $throughputRps
    latencyMs = [PSCustomObject]@{
      mean = $mean
      p50 = $p50
      p95 = $p95
      p99 = $p99
      max = $max
    }
  }
}

$payload = [PSCustomObject]@{
  label = $Label
  url = $Url
  durationSec = $DurationSec
  timeoutSec = $TimeoutSec
  generatedAt = (Get-Date).ToString("o")
  results = $results
}

$json = $payload | ConvertTo-Json -Depth 8

if ($Output -and $Output.Trim().Length -gt 0) {
  Set-Content -Path $Output -Value $json -Encoding UTF8
}

Write-Output $json
