const { spawn } = require('child_process');
const WebSocket = require('ws');
const os = require('os');

const wss = new WebSocket.Server({ port: 8080 });

console.log('Sentinel Traffic Sensor running on ws://localhost:8080');
console.log('-------------------------------------------------------');
console.log('REQUIREMENTS:');
console.log('1. "tcpdump" must be installed and in your PATH.');
console.log('2. This script must be run with sudo/admin privileges to capture packets.');
console.log('-------------------------------------------------------');

wss.on('connection', (ws) => {
  console.log('Dashboard connected. Starting packet capture...');
  
  ws.send(JSON.stringify({
    message: '[SYSTEM] Connected to Sentinel Sensor. Initializing Packet Capture Engine...',
    timestamp: new Date().toISOString()
  }));

  // Arguments for tcpdump:
  // -l : buffered output (line by line)
  // -n : no dns resolution (faster)
  // -q : quiet output (less verbose)
  // -t : don't print timestamp (we add our own ISO)
  // ip : filter for ipv4 traffic
  const args = ['-l', '-n', '-q', '-t', 'ip'];
  
  // On Linux, 'any' interface is useful. On Mac/Windows, default usually picks the active NIC.
  if (os.platform() === 'linux') {
      args.unshift('any');
      args.unshift('-i');
  }

  // Spawn the packet sniffer
  const tcpdump = spawn('tcpdump', args);

  tcpdump.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (!line.trim()) return;
      
      // Basic Heuristics to assign severity to real traffic
      let severity = 'INFO';
      let category = 'NETWORK';
      
      // Check for sensitive ports or protocols
      if (line.includes('.22 ') || line.includes('.2222 ')) { 
          severity = 'WARN';
          category = 'SSH_ACTIVITY';
      } else if (line.includes('.3389 ')) {
          severity = 'WARN';
          category = 'RDP_ACTIVITY';
      } else if (line.includes('.445 ') || line.includes('.139 ')) {
          severity = 'HIGH';
          category = 'SMB_ACTIVITY'; // Potential lateral movement
      } else if (line.includes('ICMP')) {
          category = 'ICMP_PING';
      }

      // Format: [TIMESTAMP] [SEVERITY] CATEGORY: raw_packet_data
      const payload = `[${new Date().toISOString()}] [${severity}] ${category}: ${line.trim()}`;
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  });

  tcpdump.stderr.on('data', (data) => {
    // Ignore status messages from stderr, log errors
    const msg = data.toString();
    if (!msg.includes('listening on') && !msg.includes('captured')) {
       // console.error(`[Sensor Error] ${msg.trim()}`);
    }
  });

  tcpdump.on('error', (err) => {
    console.error('Failed to start tcpdump:', err);
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(`[${new Date().toISOString()}] [CRITICAL] SYSTEM: Failed to spawn tcpdump. Is it installed? Error: ${err.message}`);
    }
  });

  tcpdump.on('close', (code) => {
    if (code !== 0 && code !== null) {
        console.log(`tcpdump exited with code ${code}`);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(`[${new Date().toISOString()}] [ERROR] SYSTEM: Packet capture stopped (Code ${code}). Ensure you are running "node server.js" with sudo/admin.`);
        }
    }
  });

  ws.on('close', () => {
    console.log('Dashboard disconnected. Stopping capture.');
    tcpdump.kill();
  });
});