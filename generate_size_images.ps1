Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$root = Get-Location
$outputRoot = Join-Path $root 'assets\size-variants'

$sizes = @(
  [pscustomobject]@{ Name = 'XS'; ScaleX = 0.90; ScaleY = 0.98; Overlay = [System.Drawing.Color]::FromArgb(52, 109, 179, 255); Caption='Petite fit preview' },
  [pscustomobject]@{ Name = 'S';  ScaleX = 0.95; ScaleY = 0.99; Overlay = [System.Drawing.Color]::FromArgb(40, 94, 162, 245); Caption='Slim fit preview' },
  [pscustomobject]@{ Name = 'M';  ScaleX = 1.00; ScaleY = 1.00; Overlay = [System.Drawing.Color]::FromArgb(18, 105, 120, 145); Caption='Regular fit preview' },
  [pscustomobject]@{ Name = 'L';  ScaleX = 1.05; ScaleY = 1.00; Overlay = [System.Drawing.Color]::FromArgb(34, 222, 140, 72); Caption='Comfort fit preview' },
  [pscustomobject]@{ Name = 'XL'; ScaleX = 1.10; ScaleY = 1.01; Overlay = [System.Drawing.Color]::FromArgb(44, 232, 124, 76); Caption='Relaxed fit preview' },
  [pscustomobject]@{ Name = 'XXL';ScaleX = 1.15; ScaleY = 1.02; Overlay = [System.Drawing.Color]::FromArgb(56, 242, 110, 88); Caption='Extended fit preview' }
)

if (-not (Test-Path $outputRoot)) {
  New-Item -ItemType Directory -Path $outputRoot | Out-Null
}

$categories = @('blazers','pants','shirts','skirts','vests')
$generated = 0

$fontFamily = [System.Drawing.FontFamily]::new('Segoe UI')
$sizeFont = [System.Drawing.Font]::new($fontFamily, 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$captionFont = [System.Drawing.Font]::new($fontFamily, 11, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

foreach ($category in $categories) {
  $sourceDir = Join-Path $root $category
  if (-not (Test-Path $sourceDir)) { continue }

  $categoryOut = Join-Path $outputRoot $category
  if (-not (Test-Path $categoryOut)) {
    New-Item -ItemType Directory -Path $categoryOut | Out-Null
  }

  $files = Get-ChildItem -Path $sourceDir -Filter '*.png' | Sort-Object {
    $tmp = 0
    if ([int]::TryParse($_.BaseName, [ref]$tmp)) { $tmp } else { [int]::MaxValue }
  }, BaseName

  foreach ($file in $files) {
    $srcImg = [System.Drawing.Image]::FromFile($file.FullName)
    try {
      foreach ($cfg in $sizes) {
        $w = [int]$srcImg.Width
        $h = [int]$srcImg.Height

        $canvas = [System.Drawing.Bitmap]::new($w, $h)
        $gfx = [System.Drawing.Graphics]::FromImage($canvas)
        try {
          $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
          $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
          $gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

          $rectAll = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
          $bgBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
            $rectAll,
            [System.Drawing.Color]::FromArgb(255, 17, 24, 38),
            [System.Drawing.Color]::FromArgb(255, 10, 16, 28),
            135.0
          )
          try {
            $gfx.FillRectangle($bgBrush, $rectAll)
          }
          finally {
            $bgBrush.Dispose()
          }

          $drawW = [int][math]::Round($w * [double]$cfg.ScaleX)
          $drawH = [int][math]::Round($h * [double]$cfg.ScaleY)
          $x = [int][math]::Round(($w - $drawW) / 2)
          $y = [int][math]::Round(($h - $drawH) / 2)

          $shadowX = [int]($x + 8)
          $shadowY = [int]($y + 8)
          $shadowRect = [System.Drawing.Rectangle]::new($shadowX, $shadowY, $drawW, $drawH)
          $shadowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(65, 3, 6, 10))
          try {
            $gfx.FillRectangle($shadowBrush, $shadowRect)
          }
          finally {
            $shadowBrush.Dispose()
          }

          $destRect = [System.Drawing.Rectangle]::new($x, $y, $drawW, $drawH)
          $gfx.DrawImage($srcImg, $destRect)

          $overlayBrush = [System.Drawing.SolidBrush]::new($cfg.Overlay)
          try {
            $gfx.FillRectangle($overlayBrush, $rectAll)
          }
          finally {
            $overlayBrush.Dispose()
          }

          $ribbonBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(210, 19, 27, 42))
          try {
            $gfx.FillRectangle($ribbonBrush, [System.Drawing.Rectangle]::new(0, 0, $w, 38))
          }
          finally {
            $ribbonBrush.Dispose()
          }

          $sizeTextBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(245, 242, 249, 255))
          try {
            $gfx.DrawString("Size $($cfg.Name)", $sizeFont, $sizeTextBrush, 10, 7)
          }
          finally {
            $sizeTextBrush.Dispose()
          }

          $captionBg = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(160, 13, 19, 31))
          try {
            $gfx.FillRectangle($captionBg, [System.Drawing.Rectangle]::new(0, $h - 28, $w, 28))
          }
          finally {
            $captionBg.Dispose()
          }

          $captionBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(225, 220, 230, 245))
          try {
            $gfx.DrawString($cfg.Caption, $captionFont, $captionBrush, 10, $h - 22)
          }
          finally {
            $captionBrush.Dispose()
          }

          $outName = "{0}-{1}.png" -f $file.BaseName, $cfg.Name
          $outPath = Join-Path $categoryOut $outName
          $canvas.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
          $generated++
        }
        finally {
          $gfx.Dispose()
          $canvas.Dispose()
        }
      }
    }
    finally {
      $srcImg.Dispose()
    }
  }
}

$sizeFont.Dispose()
$captionFont.Dispose()
$fontFamily.Dispose()

Write-Output "Generated $generated size-variant images in $outputRoot"
