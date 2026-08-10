# PowerShell script to resize logo-icon.png natively on Windows using .NET System.Drawing
Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\Sammir Contreras\Desktop\Card\public\icons\logo-icon.png"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source logo file not found at: $srcPath"
    exit 1
}

Write-Host "Converting logo-icon.png to standard sizes..."

# Function to resize and save image
function Resize-Image {
    param(
        [string]$sourcePath,
        [string]$destPath,
        [int]$width,
        [int]$height
    )
    $srcImg = [System.Drawing.Image]::FromFile($sourcePath)
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # High-quality rendering settings
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.DrawImage($srcImg, 0, 0, $width, $height)
    
    # Ensure parent directory exists
    $parentDir = [System.IO.Path]::GetDirectoryName($destPath)
    if (-not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Force -Path $parentDir | Out-Null
    }
    
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Dispose resources
    $g.Dispose()
    $bmp.Dispose()
    $srcImg.Dispose()
    
    Write-Host "Generated: $destPath ($width`x$height)"
}

# 1. Generate Extension icons
Resize-Image -sourcePath $srcPath -destPath "c:\Users\Sammir Contreras\Desktop\Card\public\icons\icon16.png" -width 16 -height 16
Resize-Image -sourcePath $srcPath -destPath "c:\Users\Sammir Contreras\Desktop\Card\public\icons\icon48.png" -width 48 -height 48
Resize-Image -sourcePath $srcPath -destPath "c:\Users\Sammir Contreras\Desktop\Card\public\icons\icon128.png" -width 128 -height 128

# 2. Generate Electron window icon (256x256 png)
Resize-Image -sourcePath $srcPath -destPath "c:\Users\Sammir Contreras\Desktop\Card\public\icon.png" -width 256 -height 256

# 3. Copy to dist/icons for Extension build compatibility
Resize-Image -sourcePath $srcPath -destPath "c:\Users\Sammir Contreras\Desktop\Card\dist\icons\icon16.png" -width 16 -height 16
Resize-Image -sourcePath $srcPath -destPath "c:\Users\Sammir Contreras\Desktop\Card\dist\icons\icon48.png" -width 48 -height 48
Resize-Image -sourcePath $srcPath -destPath "c:\Users\Sammir Contreras\Desktop\Card\dist\icons\icon128.png" -width 128 -height 128

# 4. Generate Windows .ico file for executable desktop icon
Write-Host "Generating Windows .ico icon..."
$icoPath = "c:\Users\Sammir Contreras\Desktop\Card\public\icon.ico"
$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)
$bmp16 = New-Object System.Drawing.Bitmap($srcImg, 16, 16)
$bmp32 = New-Object System.Drawing.Bitmap($srcImg, 32, 32)
$bmp48 = New-Object System.Drawing.Bitmap($srcImg, 48, 48)
$bmp256 = New-Object System.Drawing.Bitmap($srcImg, 256, 256)

# Create an icon object using .NET structure
# We can save it as an icon using native handles
$hIcon = $bmp256.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$stream = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close()
$icon.Dispose()
$srcImg.Dispose()

Write-Host "Generated Windows .ico Icon successfully: $icoPath"
