<#
.SYNOPSIS
    Efficiently compresses and Base64 encodes Secure Boot UEFI database (db/dbx) in binary format.
.DESCRIPTION
    This script retrieves Secure Boot UEFI database (db) and forbidden database (dbx) information,
    handles it as binary data, compresses it, and encodes with Base64 for maximum efficiency.
.NOTES
    Requires administrative privileges to run Get-SecureBootUefi cmdlet.
    PowerShell 5.1 or later required.
#>

# Check if running as administrator
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "This script requires administrative privileges. Please run as Administrator."
    exit 1
}

function Compress-BinaryData {
    param([byte[]]$Data)
    $output = [System.IO.MemoryStream]::new()
    $gzip = [System.IO.Compression.GZipStream]::new($output, [System.IO.Compression.CompressionMode]::Compress)
    $gzip.Write($Data, 0, $Data.Length)
    $gzip.Close()
    $output.ToArray()
}

try {
    # Get system information
    $computerSystem = Get-WmiObject -Class Win32_ComputerSystem
    $biosInfo = Get-WmiObject -Class Win32_BIOS
    $osInfo = Get-WmiObject -Class Win32_OperatingSystem
    $baseBoard = Get-WmiObject -Class Win32_BaseBoard
    
    # Convert BIOS release date from WMI format (YYYYMMDD) to readable format
    $biosDate = if ($biosInfo.ReleaseDate) {
        $dateString = $biosInfo.ReleaseDate
        [DateTime]::ParseExact($dateString.Substring(0,8), "yyyyMMdd", $null).ToString("yyyy-MM-dd")
    } else { "Unknown" }
    
    # Create system info object
    $sysInfo = @{
        manufacturer = $computerSystem.Manufacturer
        model = $computerSystem.Model
        motherboard = "$($baseBoard.Manufacturer) $($baseBoard.Product) $($baseBoard.Version)".Trim()
        biosVersion = $biosInfo.SMBIOSBIOSVersion
        biosManufacturer = $biosInfo.Manufacturer
        biosDate = $biosDate
        secureBoot = (Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\SecureBoot\State" -Name "UEFISecureBootEnabled" -ErrorAction SilentlyContinue).UEFISecureBootEnabled
        osName = $osInfo.Caption
        osVersion = $osInfo.Version
    }
    
    # Convert to JSON bytes
    $sysInfoJson = [System.Text.Encoding]::UTF8.GetBytes(($sysInfo | ConvertTo-Json -Compress))

    # Create a MemoryStream to hold all binary data
    $combinedData = [System.IO.MemoryStream]::new()
    $writer = [System.IO.BinaryWriter]::new($combinedData)
    
    # Process enable if available
    try {
        $enable = Get-SecureBootUEFI -Name SecureBoot -ErrorAction Stop
        $enableByte = $enable.Bytes
        $writer.Write($enableByte)
    } catch {
        Write-Warning "Could not retrieve enable data: $_"
        $writer.Write([BitConverter]::GetBytes(0))
    }

    # Process db if available
    try {
        $db = Get-SecureBootUefi -Name db -ErrorAction Stop
        $dbBytes = $db.Bytes
        $writer.Write([BitConverter]::GetBytes($dbBytes.Length))
        $writer.Write($dbBytes)
    } catch {
        Write-Warning "Could not retrieve db data: $_"
        $writer.Write([BitConverter]::GetBytes(0))
    }
    
    # Process dbx if available
    try {
        $dbx = Get-SecureBootUefi -Name dbx -ErrorAction Stop
        $dbxBytes = $dbx.Bytes
        $writer.Write([BitConverter]::GetBytes($dbxBytes.Length))
        $writer.Write($dbxBytes)
    } catch {
        Write-Warning "Could not retrieve dbx data: $_"
        $writer.Write([BitConverter]::GetBytes(0))
    }
    
    # Write system info JSON as third part
    $writer.Write([BitConverter]::GetBytes($sysInfoJson.Length))
    $writer.Write($sysInfoJson)
    
    $writer.Flush()
    $binaryData = $combinedData.ToArray()
    
    # Compress and encode
    $compressed = Compress-BinaryData $binaryData
    $base64Output = [Convert]::ToBase64String($compressed)
    
    # Output the result
    $base64Output
} catch {
    Write-Error "An error occurred: $_"
    exit 1
} finally {
    if ($writer) { $writer.Dispose() }
    if ($combinedData) { $combinedData.Dispose() }
}
