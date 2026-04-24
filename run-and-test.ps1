Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Voice Order Bot — Full RAG Test Runner " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$serverDir = "d:\Downloads\voice-order-bot\voice-order-bot\server"
$clientDir = "d:\Downloads\voice-order-bot\voice-order-bot\client"

# ─── Step 1: Start the backend server in a new window ───────────
Write-Host "[1/4] Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serverDir'; Write-Host 'SERVER STARTING...' -ForegroundColor Green; node server.js"

Write-Host "      Waiting 8 seconds for MongoDB to connect..." -ForegroundColor DarkGray
Start-Sleep -Seconds 8

# ─── Step 2: Run the RAG test suite ─────────────────────────────
Write-Host ""
Write-Host "[2/4] Running RAG test suite..." -ForegroundColor Yellow
Write-Host "      (This will take 30-60 seconds — calling Groq API)" -ForegroundColor DarkGray
Write-Host ""

Set-Location $serverDir
$testOutput = node test-rag-system.js 2>&1
$testOutput | ForEach-Object { Write-Host $_ }

# ─── Step 3: Quick API health check ─────────────────────────────
Write-Host ""
Write-Host "[3/4] Testing API endpoints..." -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 5
    Write-Host "  ✅ Health Check: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Health Check FAILED - Server may still be starting" -ForegroundColor Red
}

try {
    $ragBody = '{"query": "Can I cancel my order?", "language": "english"}'
    $ragResult = Invoke-RestMethod -Method POST `
        -Uri "http://localhost:5000/api/twilio/rag-query" `
        -ContentType "application/json" `
        -Body $ragBody `
        -TimeoutSec 15
    Write-Host "  ✅ RAG Query API: '$($ragResult.answer.Substring(0, [Math]::Min(70, $ragResult.answer.Length)))...'" -ForegroundColor Green
    Write-Host "     Policies used: $($ragResult.policiesUsed -join ', ')" -ForegroundColor DarkGray
} catch {
    Write-Host "  ❌ RAG Query API FAILED: $_" -ForegroundColor Red
}

try {
    $ragBody2 = '{"query": "mujhe refund chahiye", "language": "hindi"}'
    $ragResult2 = Invoke-RestMethod -Method POST `
        -Uri "http://localhost:5000/api/twilio/rag-query" `
        -ContentType "application/json" `
        -Body $ragBody2 `
        -TimeoutSec 15
    Write-Host "  ✅ RAG Hindi Query: '$($ragResult2.answer.Substring(0, [Math]::Min(70, $ragResult2.answer.Length)))...'" -ForegroundColor Green
} catch {
    Write-Host "  ❌ RAG Hindi Query FAILED: $_" -ForegroundColor Red
}

try {
    $ragBody3 = '{"query": "my product is damaged broken i want replacement", "language": "english"}'
    $ragResult3 = Invoke-RestMethod -Method POST `
        -Uri "http://localhost:5000/api/twilio/rag-query" `
        -ContentType "application/json" `
        -Body $ragBody3 `
        -TimeoutSec 15
    Write-Host "  ✅ RAG Damage Query: '$($ragResult3.answer.Substring(0, [Math]::Min(70, $ragResult3.answer.Length)))...'" -ForegroundColor Green
} catch {
    Write-Host "  ❌ RAG Damage Query FAILED: $_" -ForegroundColor Red
}

try {
    $ragBody4 = '{"query": "kab aayega mera order delivery kab hogi", "language": "hindi"}'
    $ragResult4 = Invoke-RestMethod -Method POST `
        -Uri "http://localhost:5000/api/twilio/rag-query" `
        -ContentType "application/json" `
        -Body $ragBody4 `
        -TimeoutSec 15
    Write-Host "  ✅ RAG Hinglish Delivery Query passed" -ForegroundColor Green
} catch {
    Write-Host "  ❌ RAG Hinglish Delivery FAILED: $_" -ForegroundColor Red
}

# ─── Step 4: Start frontend ──────────────────────────────────────
Write-Host ""
Write-Host "[4/4] Starting frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$clientDir'; Write-Host 'FRONTEND STARTING...' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  ALL DONE!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend:  http://localhost:5000/api/health" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  RAG API:  POST http://localhost:5000/api/twilio/rag-query" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to open the dashboard in your browser..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "http://localhost:5173"
