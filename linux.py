#!/usr/bin/env python3
import sys
import struct
import base64
import gzip
import json
import os

def write_binary_uint32_le(value):
    """Write a 32-bit unsigned integer in little-endian format."""
    return struct.pack("<I", value)

def read_efivar(guid, name):
    """Read EFI variable data directly from efivars."""
    try:
        with open(f"/sys/firmware/efi/efivars/{name}-{guid}", "rb") as f:
            return f.read()[4:]
    except:
        return None

def get_secureboot_status():
    """Check if Secure Boot is enabled (returns 0 or 1)."""
    # First check if system is UEFI
    if not os.path.exists("/sys/firmware/efi"):
        return 0

    # SecureBoot GUID
    guid = "8be4df61-93ca-11d2-aa0d-00e098032b8c"
    data = read_efivar(guid, "SecureBoot")
    
    if data is not None and len(data) >= 1:
        return data[0]
    return 0

def get_efivar_data(name):
    """Read EFI variable data directly from efivars."""
    # Skip if not UEFI system
    if not os.path.exists("/sys/firmware/efi"):
        return None

    # Microsoft GUID for db and dbx
    ms_guid = "d719b2cb-3d3a-4596-a3bc-dad00e67656f"
    return read_efivar(ms_guid, name)

def read_sys_file(path, default="Unknown"):
    """Read content from sysfs file."""
    try:
        with open(path, 'r') as f:
            content = f.read().strip()
            return content if content else default
    except:
        return default

def get_os_info():
    """Get detailed OS information from system files."""
    os_name = "Unknown"
    os_version = "Unknown"
    
    # Try reading from os-release first
    try:
        with open('/etc/os-release', 'r') as f:
            os_info = dict(line.strip().split('=', 1) for line in f if '=' in line)
            
        # Get the pretty name which includes distribution name
        os_name = os_info.get('PRETTY_NAME', '').strip('"')
        os_version = os_info.get('VERSION_ID', '').strip('"')
    except:
        # If os-release didn't work, try reading from /proc/version
        try:
            with open('/proc/version', 'r') as f:
                version_info = f.read().strip()
                os_name = version_info.split('(')[0].strip()
                os_version = version_info.split('version')[1].split()[0].strip()
        except:
            pass
    
    return {
        "osName": os_name,
        "osVersion": os_version
    }

def get_system_info():
    """Get system information using user-accessible system files."""
    # System manufacturer and model from sysfs
    sys_vendor = read_sys_file("/sys/class/dmi/id/sys_vendor")
    product_name = read_sys_file("/sys/class/dmi/id/product_name")
    product_version = read_sys_file("/sys/class/dmi/id/product_version")
    
    # Motherboard information
    board_vendor = read_sys_file("/sys/class/dmi/id/board_vendor")
    board_name = read_sys_file("/sys/class/dmi/id/board_name")
    board_version = read_sys_file("/sys/class/dmi/id/board_version")
    
    # BIOS information
    bios_vendor = read_sys_file("/sys/class/dmi/id/bios_vendor")
    bios_version = read_sys_file("/sys/class/dmi/id/bios_version")
    bios_date = read_sys_file("/sys/class/dmi/id/bios_date")
    
    # Get OS information
    os_info = get_os_info()

    # Check if system is UEFI
    is_uefi = os.path.exists("/sys/firmware/efi")
    
    # Get UEFI Secure Boot status only if UEFI system
    secure_boot = get_secureboot_status() if is_uefi else 0

    return {
        "manufacturer": sys_vendor,
        "model": f"{product_name} {product_version}".strip(),
        "motherboard": f"{board_vendor} {board_name} {board_version}".strip(),
        "biosVersion": bios_version,
        "biosManufacturer": bios_vendor,
        "biosDate": bios_date,
        "secureBoot": secure_boot,
        "osName": os_info["osName"],
        "osVersion": os_info["osVersion"],
        "isUefi": is_uefi
    }

def main():
    output = bytearray()

    # 1. Secure Boot status (1 byte: 0 or 1)
    secureboot_status = get_secureboot_status()
    output.append(secureboot_status)

    # 2. Write db (PK/KEK/db) data (4-byte length + raw data)
    db_data = get_efivar_data("db")
    if db_data:
        output.extend(write_binary_uint32_le(len(db_data)))
        output.extend(db_data)
    else:
        output.extend(write_binary_uint32_le(0))

    # 3. Write dbx (forbidden signatures) data (4-byte length + raw data)
    dbx_data = get_efivar_data("dbx")
    if dbx_data:
        output.extend(write_binary_uint32_le(len(dbx_data)))
        output.extend(dbx_data)
    else:
        output.extend(write_binary_uint32_le(0))

    # 4. Write system information
    sys_info = get_system_info()
    sys_info_json = json.dumps(sys_info, ensure_ascii=False).encode('utf-8')
    output.extend(write_binary_uint32_le(len(sys_info_json)))
    output.extend(sys_info_json)

    result = base64.b64encode(gzip.compress(output))
    # Write final binary output to stdout (or a file)
    sys.stdout.buffer.write(result)

if __name__ == "__main__":
    main()