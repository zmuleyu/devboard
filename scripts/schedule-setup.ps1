# DevBoard - Windows Task Scheduler Setup
# Run once as Administrator to register the daily sync task.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\schedule-setup.ps1
#
# To remove the task later:
#   Unregister-ScheduledTask -TaskName "DevBoard-DailySync" -Confirm:$false

$ProjectDir = "D:\projects\devboard"
$LogFile    = "$ProjectDir\logs\sync.log"

# Ensure logs directory exists
New-Item -ItemType Directory -Force -Path "$ProjectDir\logs" | Out-Null

# The command: run npm update inside the project dir, append to log
$CmdArgs = "/c `"cd /d $ProjectDir && npm run update >> $LogFile 2>&1`""

$Action = New-ScheduledTaskAction `
  -Execute "cmd.exe" `
  -Argument $CmdArgs `
  -WorkingDirectory $ProjectDir

# Daily at 09:00; StartWhenAvailable ensures it runs after wakeup if missed
$Trigger = New-ScheduledTaskTrigger -Daily -At "23:00"

$Settings = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName "DevBoard-DailySync" `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -Description "Daily DevBoard data sync: runs npm run update and pushes to GitHub" `
  -Force

Write-Host "Task registered. Verify with:" -ForegroundColor Green
Write-Host "  schtasks /query /tn `"DevBoard-DailySync`"" -ForegroundColor Cyan
Write-Host "Manual trigger:" -ForegroundColor Green
Write-Host "  schtasks /run /tn `"DevBoard-DailySync`"" -ForegroundColor Cyan
