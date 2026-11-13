# serve.ps1 -- serve this folder over http on this machine.
#
# Why this exists: verifying anything visual on this project has meant
# push -> Netlify -> look, because the sandbox has no browser that can open
# a local file, and ES modules will not load over file:// anyway. With this
# running, the app is at http://localhost:8787/app/ on this machine, so it
# can be looked at in a real browser the moment a file changes -- no commit,
# no deploy, no wait.
#
# Serves GET and HEAD only, read-only, from this folder, bound to loopback
# so nothing outside this machine can reach it.
#
# Install with tools\install-autopush.ps1, or run directly:
#   powershell -ExecutionPolicy Bypass -File tools\serve.ps1

param([int]$Port = 8787)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = (Resolve-Path (Split-Path -Parent $PSScriptRoot)).Path

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.webp' = 'image/webp'
  '.woff2'= 'font/woff2'
  '.map'  = 'application/json; charset=utf-8'
  '.txt'  = 'text/plain; charset=utf-8'
  '.md'   = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() }
catch { Write-Host "Could not bind port $Port. Another copy may already be running." ; exit 1 }

Write-Host "The Book of Rates is at  http://localhost:$Port/app/"
Write-Host "Serving $root  (loopback only, read-only). Ctrl-C to stop."

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
  } catch { break }

  $res = $ctx.Response
  try {
    if ($ctx.Request.HttpMethod -notin @('GET','HEAD')) {
      $res.StatusCode = 405; $res.Close(); continue
    }

    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ($rel -eq '') { $rel = 'app/index.html' }

    $path = Join-Path $root ($rel -replace '/', '\')

    # A directory means its index.
    if ((Test-Path $path -PathType Container)) {
      $path = Join-Path $path 'index.html'
    }

    # Netlify serves /archive for archive.html; match that so links work.
    if (-not (Test-Path $path -PathType Leaf)) {
      if (Test-Path "$path.html" -PathType Leaf) { $path = "$path.html" }
    }

    # Never serve anything outside the folder, or the token, or .git.
    $full = $null
    try { $full = (Resolve-Path -LiteralPath $path -ErrorAction Stop).Path } catch { }
    $blocked = $full -and ($full -notlike "$root*" -or
                           $full -match '\\\.git\\' -or
                           (Split-Path $full -Leaf) -eq 'token.txt')

    if (-not $full -or $blocked) {
      $res.StatusCode = 404
      $b = [Text.Encoding]::UTF8.GetBytes('not found')
      $res.ContentType = 'text/plain; charset=utf-8'
      $res.ContentLength64 = $b.Length
      if ($ctx.Request.HttpMethod -eq 'GET') { $res.OutputStream.Write($b, 0, $b.Length) }
      $res.Close(); continue
    }

    $ext = [IO.Path]::GetExtension($full).ToLower()
    $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }

    # Always fresh. The point of this server is to see the current file.
    $res.Headers.Add('Cache-Control', 'no-store, must-revalidate')

    $bytes = [IO.File]::ReadAllBytes($full)
    $res.ContentLength64 = $bytes.Length
    if ($ctx.Request.HttpMethod -eq 'GET') { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
    $res.Close()
  }
  catch {
    try { $res.StatusCode = 500; $res.Close() } catch { }
  }
}
