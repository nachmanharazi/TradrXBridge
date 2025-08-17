#!/bin/bash
set -e

# ===== הגדרות Windows 11 Pro =====
VMID=110
VMNAME="win11-pro"
CPUS=4
RAM_MB=8192
DISK_GB=80
BRIDGE="vmbr0"

# URLs מעודכנים לWindows 11 Pro
WIN11_PRO_URL="https://software-static.download.prss.microsoft.com/dbazure/Win11_24H2_English_x64.iso"
VIRTIO_URL="https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/stable-virtio/virtio-win.iso"

echo "🚀 מתחיל התקנה אוטומטית של Windows 11 Pro"

# ===== בדיקת מקום =====
echo "🔍 בודק מקום פנוי..."
SPACE=$(df --output=avail /var/lib/vz | tail -1)
if [ "$SPACE" -lt 12000000 ]; then
  echo "⚠ מנקה מקום..."
  rm -f /var/lib/vz/template/iso/win*.iso || true
  rm -f /var/lib/vz/template/iso/virtio*.iso || true
fi

mkdir -p /var/lib/vz/template/iso

# ===== הורדת קבצים =====
echo "⬇ מוריד Windows 11 Pro ISO..."
wget -c --progress=bar:force --timeout=30 --tries=3 \
  -O /var/lib/vz/template/iso/win11-pro.iso "$WIN11_PRO_URL"

echo "⬇ מוריד VirtIO drivers..."
wget -c --progress=bar:force --timeout=30 --tries=3 \
  -O /var/lib/vz/template/iso/virtio-win.iso "$VIRTIO_URL"

# ===== התקנת חבילות נדרשות =====
echo "🛠 מתקין חבילות נדרשות..."
apt-get update -qq
apt-get install -y swtpm ovmf

# ===== מחיקת VM קיים =====
if qm status "$VMID" >/dev/null 2>&1; then
  echo "🗑 מוחק VM קיים..."
  qm stop "$VMID" || true
  qm destroy "$VMID" || true
fi

# ===== יצירת VM מותאם לWindows 11 Pro =====
echo "💻 יוצר VM עם הגדרות מותאמות..."
qm create "$VMID" \
  --name "$VMNAME" \
  --machine q35 \
  --cores "$CPUS" \
  --memory "$RAM_MB" \
  --ostype win11 \
  --scsihw virtio-scsi-single \
  --agent 1,fstrim_cloned_disks=1

# ===== הגדרות UEFI ו-TPM =====
qm set "$VMID" --bios ovmf
qm set "$VMID" --efidisk0 local-lvm:0,efitype=4m,pre-enrolled-keys=1
qm set "$VMID" --tpmstate0 local-lvm:1,version=v2.0

# ===== הגדרת דיסק =====
qm set "$VMID" --scsi0 local-lvm:"$DISK_GB",ssd=1,discard=on,iothread=1

# ===== הגדרת רשת =====
qm set "$VMID" --net0 virtio,bridge="$BRIDGE",firewall=1

# ===== הגדרת ISO files =====
qm set "$VMID" --ide2 local:iso/win11-pro.iso,media=cdrom
qm set "$VMID" --ide3 local:iso/virtio-win.iso,media=cdrom

# ===== הגדרות אתחול ותצוגה =====
qm set "$VMID" --boot order=ide2
qm set "$VMID" --vga qxl
qm set "$VMID" --tablet 1
qm set "$VMID" --usb3 1

# ===== הגדרות ביצועים =====
qm set "$VMID" --cpu host
qm set "$VMID" --numa 1

echo "🚀 מפעיל VM..."
qm start "$VMID"

echo "✅ Windows 11 Pro VM מוכן!"
echo "📋 פרטי VM:"
echo "   ID: $VMID"
echo "   שם: $VMNAME"
echo "   CPU: $CPUS cores"
echo "   RAM: ${RAM_MB}MB"
echo "   דיסק: ${DISK_GB}GB"
echo ""
echo "🖥 פתח Console ב-Proxmox להתקנת Windows 11 Pro"
echo "💡 בהתקנה:"
echo "   1. בחר 'Custom installation'"
echo "   2. לחץ 'Load driver' → virtio-win.iso → vioscsi/w11/amd64"
echo "   3. בחר Windows 11 Pro בעת בחירת גרסה"