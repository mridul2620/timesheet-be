// Keep-alive implementation for Render hosting
const https = require('https');
const http = require('http');

class ServerKeepAlive {
  constructor(options = {}) {
    this.url = process.env.APP_URL;
    this.interval = options.interval || 14 * 60 * 1000; // 14 minutes (just under 15)
    this.inactivityThreshold = options.inactivityThreshold || 15 * 60 * 1000; // 15 minutes
    this.isRunning = false;
    this.lastActivityTimestamp = Date.now();
    this.pingTimeout = null;
    this.requests = new Set();
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log(`Server keep-alive started. Will ping ${this.url} after ${this.inactivityThreshold / 60000} minutes of inactivity.`);
    
    // Set up request tracking middleware
    this.trackActivity();
    
    // Schedule the first check
    this.schedulePing();
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
    console.log('Server keep-alive stopped.');
  }

  trackActivity() {
    // Update the last activity timestamp whenever a request comes in
    const originalCreateServer = http.createServer;
    
    http.createServer = (...args) => {
      const server = originalCreateServer.apply(http, args);
      const originalEmit = server.emit;
      
      server.emit = (type, ...args) => {
        if (type === 'request') {
          const req = args[0];
          const res = args[1];
          
          // Generate a unique ID for this request
          const reqId = Date.now() + Math.random().toString(36).substring(2, 15);
          this.requests.add(reqId);
          
          // Update activity timestamp when request starts
          this.updateActivityTimestamp();
          
          // Track when the request ends
          res.on('finish', () => {
            this.requests.delete(reqId);
          });
        }
        return originalEmit.apply(server, [type, ...args]);
      };
      
      return server;
    };
  }

  updateActivityTimestamp() {
    this.lastActivityTimestamp = Date.now();
    
    // Reschedule the ping when there's activity
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.schedulePing();
    }
  }

  schedulePing() {
    // Calculate time until we need to check for inactivity
    const timeToNextCheck = this.interval;
    
    this.pingTimeout = setTimeout(() => {
      this.checkAndPing();
    }, timeToNextCheck);
  }

  checkAndPing() {
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - this.lastActivityTimestamp;
    
    // Only ping if there's been no activity for the threshold period
    // and there are no active requests
    if (timeSinceLastActivity >= this.inactivityThreshold && this.requests.size === 0) {
      this.pingServer();
    } else {
      // If there's been activity or there are active requests, reschedule
      this.schedulePing();
    }
  }

  pingServer() {
    console.log(`No activity detected for ${this.inactivityThreshold / 60000} minutes. Pinging server to prevent sleep...`);
    
    const protocol = this.url.startsWith('https') ? https : http;
    const req = protocol.get(this.url, (res) => {
      console.log(`Ping successful! Status code: ${res.statusCode}`);
      // Schedule the next check
      this.schedulePing();
    });
    
    req.on('error', (error) => {
      console.error(`Error pinging server: ${error.message}`);
      // Still schedule the next check even if there was an error
      this.schedulePing();
    });
    
    req.end();
  }
}

module.exports = ServerKeepAlive;
