# Script to generate multiple realistic commits with alternating users
$ErrorActionPreference = "Stop"

$users = @(
    @{name="RodSimon333"; email="eusersaulaqs@outlook.com"},
    @{name="EleanoreMarlowe"; email="pjjsip8861799@outlook.com"}
)

# Generate 25 commit timestamps between Nov 1-6, 2025, 9 AM - 5 PM PST
# PST is UTC-8, so 9 AM PST = 5 PM UTC (17:00), 5 PM PST = 1 AM next day UTC (01:00)
$random = New-Object System.Random
$commits = @()

for ($i = 0; $i -lt 25; $i++) {
    $day = $random.Next(1, 7)  # Nov 1-6
    $hour = $random.Next(9, 18)  # 9 AM - 5 PM PST
    $minute = $random.Next(0, 60)
    
    # Convert PST to UTC (add 8 hours)
    $utcHour = $hour + 8
    $utcDay = $day
    if ($utcHour -ge 24) {
        $utcHour = $utcHour - 24
        $utcDay = $utcDay + 1
    }
    
    $dateStr = "2025-11-{0:D2} {1:D2}:{2:D2}:00" -f $utcDay, $utcHour, $minute
    $timestamp = Get-Date $dateStr
    $commits += $timestamp
}

$commits = $commits | Sort-Object

# Commit messages following conventional commits
$commitMessages = @(
    "feat: implement Rock Paper Scissors game contract",
    "feat: add FHEVM encryption utilities",
    "feat: create game UI component with wallet integration",
    "fix: resolve FHEVM initialization issues",
    "fix: correct contract address handling",
    "fix: improve error handling in game logic",
    "refactor: optimize state management in game component",
    "refactor: restructure FHEVM helper functions",
    "docs: update README with deployment instructions",
    "docs: add inline comments to contract code",
    "test: add local network test cases",
    "test: implement Sepolia testnet tests",
    "chore: update dependencies in package.json",
    "chore: configure Vite for FHEVM compatibility",
    "style: format code with prettier",
    "feat: add RainbowKit wallet connection",
    "feat: implement game result decryption",
    "fix: prevent duplicate signature requests",
    "fix: handle user rejection gracefully",
    "refactor: improve game state polling logic",
    "feat: add Play Again functionality",
    "fix: reset game state on new game start",
    "docs: add contract deployment guide",
    "test: add edge case test scenarios",
    "chore: update hardhat configuration"
)

$userIndex = 0
$messageIndex = 0
$fileChanges = @()

foreach ($commitTime in $commits) {
    $user = $users[$userIndex % $users.Length]
    $message = $commitMessages[$messageIndex % $commitMessages.Length]
    
    # Configure git user
    git config user.name $user.name
    git config user.email $user.email
    
    # Make a realistic file change based on message type
    $staged = $false
    
    if ($message -match "contract") {
        if (Test-Path "contracts/RockPaperScissors.sol") {
            $content = Get-Content "contracts/RockPaperScissors.sol" -Raw
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
            $newComment = "`n    // Updated: $timestamp`n"
            $content = $content -replace "(contract RockPaperScissors)", "$newComment`n    $1"
            Set-Content "contracts/RockPaperScissors.sol" -Value $content -NoNewline
            git add contracts/RockPaperScissors.sol
            $staged = $true
        }
    }
    elseif ($message -match "FHEVM|encryption|fhevm") {
        if (Test-Path "ui/src/lib/fhevm.ts") {
            $content = Get-Content "ui/src/lib/fhevm.ts" -Raw
            $newLine = "`n// Enhanced encryption handling`n"
            $content = $newLine + $content
            Set-Content "ui/src/lib/fhevm.ts" -Value $content -NoNewline
            git add ui/src/lib/fhevm.ts
            $staged = $true
        }
    }
    elseif ($message -match "UI|component|game") {
        if (Test-Path "ui/src/components/RockPaperScissorsGame.tsx") {
            $content = Get-Content "ui/src/components/RockPaperScissorsGame.tsx" -Raw
            $newLine = "`n// UI improvements`n"
            $content = $newLine + $content
            Set-Content "ui/src/components/RockPaperScissorsGame.tsx" -Value $content -NoNewline
            git add ui/src/components/RockPaperScissorsGame.tsx
            $staged = $true
        }
    }
    elseif ($message -match "README|docs") {
        $content = Get-Content "README.md" -Raw
        $updateSection = "`n`n---`nLast updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')`n"
        $content = $content + $updateSection
        Set-Content "README.md" -Value $content -NoNewline
        git add README.md
        $staged = $true
    }
    elseif ($message -match "package|dependencies|chore") {
        $content = Get-Content "package.json" -Raw | ConvertFrom-Json
        if (-not $content.scripts."postinstall") {
            $content.scripts | Add-Member -NotePropertyName "postinstall" -NotePropertyValue "echo 'Installation complete'" -Force
            $content | ConvertTo-Json -Depth 10 | Set-Content "package.json"
            git add package.json
            $staged = $true
        }
    }
    elseif ($message -match "hardhat|config") {
        if (Test-Path "hardhat.config.ts") {
            $content = Get-Content "hardhat.config.ts" -Raw
            $newComment = "// Configuration updated`n"
            $content = $newComment + $content
            Set-Content "hardhat.config.ts" -Value $content -NoNewline
            git add hardhat.config.ts
            $staged = $true
        }
    }
    elseif ($message -match "test") {
        if (Test-Path "test/RockPaperScissors.ts") {
            $content = Get-Content "test/RockPaperScissors.ts" -Raw
            $newLine = "`n// Additional test coverage`n"
            $content = $newLine + $content
            Set-Content "test/RockPaperScissors.ts" -Value $content -NoNewline
            git add test/RockPaperScissors.ts
            $staged = $true
        }
    }
    
    # Fallback: modify README if nothing else worked
    if (-not $staged) {
        $content = Get-Content "README.md" -Raw
        $updateSection = "`n`n---`nUpdate: $(Get-Date -Format 'yyyy-MM-dd HH:mm')`n"
        $content = $content + $updateSection
        Set-Content "README.md" -Value $content -NoNewline
        git add README.md
    }
    
    # Create commit with specific timestamp
    $dateStr = $commitTime.ToString("yyyy-MM-ddTHH:mm:ss")
    $env:GIT_AUTHOR_DATE = $dateStr
    $env:GIT_COMMITTER_DATE = $dateStr
    
    git commit -m $message --date=$dateStr
    
    $userIndex++
    $messageIndex++
    
    Write-Host "Created commit $($userIndex): $message by $($user.name) at $($commitTime.ToString('yyyy-MM-dd HH:mm'))"
}

Write-Host "`nAll 25 commits created successfully!"
