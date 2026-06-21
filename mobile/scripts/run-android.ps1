# LeeTrack Android dev helper — sets SDK paths and starts Expo on emulator
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:JAVA_HOME = "C:\Program Files\Java\jdk-25"
$env:SKIP_JDK_VERSION_CHECK = "true"
$env:Path = "$sdk\platform-tools;$sdk\emulator;$sdk\cmdline-tools\latest\bin;$env:Path"

$avdName = "LeeTrack_Pixel5"
$running = & adb devices 2>$null | Select-String "emulator-" -Quiet

if (-not $running) {
  Write-Host "Starting Android emulator ($avdName)..."
  Start-Process -FilePath "$sdk\emulator\emulator.exe" -ArgumentList "-avd", $avdName -WindowStyle Normal

  Write-Host "Waiting for emulator to boot..."
  & adb wait-for-device | Out-Null
  $deadline = (Get-Date).AddMinutes(3)
  do {
    Start-Sleep -Seconds 2
    $booted = & adb shell getprop sys.boot_completed 2>$null
  } while ($booted -ne "1" -and (Get-Date) -lt $deadline)
}

Write-Host "Launching Expo..."
Set-Location (Split-Path $PSScriptRoot -Parent)
npm run android