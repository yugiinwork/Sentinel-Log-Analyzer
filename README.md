# Sentinel - AI Security Log Analyzer & SIEM

Sentinel is a next-generation Security Information and Event Management (SIEM) dashboard powered by **Google Gemini 2.5 Flash**. It combines real-time network traffic monitoring with intelligent forensic analysis to detect threats, visualize attacks, and generate instant remediation playbooks.

## 🚀 Features

- **Live Operations Center**: Real-time packet sniffing and threat detection using `tcpdump` over WebSockets.
- **Forensic Lab**: Upload raw server logs (SSH, Nginx, Firewall) for AI-driven parsing and risk scoring.
- **Auto-Playbooks**: One-click generation of remediation commands (CLI), Jira tickets, and email notifications using GenAI.
- **Threat Intelligence**: Geographic mapping of attackers and severity distribution charts.
- **Data Connectors**: Manage integrations with cloud providers (Mock UI).

---

## 🛠️ Installation & Setup

### 1. Frontend Application
Install the web application dependencies and start the React dev server.

```bash
# Install dependencies
npm install

# Start the application
npm run dev
```

### 2. Live Operations Sensor (Backend)
To use the **Real-Time Network Monitor**, you must run the accompanying Node.js sensor script. This script uses `tcpdump` to capture packets from your network card and streams them to the dashboard via WebSocket.

#### Prerequisites
- **Node.js**: Installed on your system.
- **tcpdump**: Must be installed and available in your system PATH.
  - *Linux (Ubuntu/Debian)*: `sudo apt-get install tcpdump`
  - *macOS*: Usually pre-installed.
  - *Windows*: Requires WSL (Windows Subsystem for Linux) or `WinDump`.

#### Running the Sensor
Open a **new terminal window** and run the following command. **Root/Admin privileges are required** to capture network traffic.

```bash
# Install the WebSocket library (only needed once)
npm install ws

# Run the sensor with privileges
sudo node server.js
```
*Enter your system password if prompted.*

Once running, you will see:
`Sentinel Traffic Sensor running on ws://localhost:8080`

Navigate to the **Live Operations** tab in the web app, and it will automatically connect.

---

## 💡 Use Cases

### 1. Real-Time Intrusion Detection
**Scenario**: An attacker is attempting to brute-force SSH credentials or scan ports on your local server.
- **Action**: Open the **Live Operations** tab.
- **Result**: Sentinel streams the live network packets. The AI logic highlights suspicious ports (e.g., rapid traffic on port 22 or 445) as "CRITICAL" alerts in the active threat panel.
- **Response**: The operator clicks **Remediate** to generate an immediate firewall blocking command.

### 2. Forensic Log Analysis
**Scenario**: You have received a 50MB log file (`auth.log` or `access.log`) from a compromised web server after an incident.
- **Action**: Go to the **Forensics Lab**, drag and drop the log file, and enable "Privacy Mode" to mask PII.
- **Result**: Gemini parses the raw text, identifies SQL injection patterns, maps IP addresses to countries, and calculates a holistic "Risk Score" (e.g., 85/100).
- **Response**: The dashboard presents a timeline of the attack and a summary for executive reporting.

### 3. Automated Incident Response
**Scenario**: A junior SOC analyst identifies a high-severity alert but isn't sure of the correct protocol to follow.
- **Action**: The analyst clicks the **Run Playbook** button on the alert.
- **Result**: The system generates a specific, context-aware plan:
  1.  **CLI Command**: `iptables -A INPUT -s 192.168.1.5 -j DROP`
  2.  **Ticket**: A pre-filled Jira JSON object describing the incident.
  3.  **Email**: A notification template for the security team.
- **Response**: The analyst executes the validated commands, reducing mean-time-to-remediate (MTTR).

---

## 🔒 Security Note
The `server.js` script captures **real network traffic**. Ensure you are running this in a controlled environment or a network you own. Do not expose the WebSocket port (8080) to the public internet without adding authentication/encryption (WSS).
