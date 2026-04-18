#!/usr/bin/env bash
set -euo pipefail

ssh shtab 'bash -s' << 'EOF'
set -euo pipefail
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git

# Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER

# fail2ban
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban

mkdir -p ~/shtab-tasks
EOF

echo "Bootstrap done. IMPORTANT: log out and back in on the server for docker group to take effect, or reboot."
