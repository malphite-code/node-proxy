console.warn = function() {}
// console.error = function() {}

const EventEmitter = require('events');
const puppeteer = require('puppeteer-core');

class Puppeteer extends EventEmitter {
  constructor({ url, interval, launch }) {
    super();
    this.inited = false;
    this.dead = false;
    this.browser = null;
    this.page = null;
    this.url = url;
    this.interval = interval;
    this.launch = launch || {};
  }

  async getBrowser() {
    if (this.browser) {
      return this.browser;
    }
    const options = Object.assign(
      {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--ignore-certificate-errors',
          '--ignore-certificate-errors-spki-list',
          '--disable-dev-shm-usage',
          '--disable-infobars',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-background-networking',
          '--disable-web-security',
          '--disable-gpu',
        ],
        ignoreHTTPSErrors: true
      },
      this.launch
    );
    this.browser = await puppeteer.launch(options);
    return this.browser;
  }

  async getPage() {
    if (this.page) {
      return this.page;
    }

    const browser = await this.getBrowser();

    this.page = await browser.newPage();

    return this.page;
  }

  async init() {
    if (this.dead) {
      throw new Error('Terminal has been killed');
    }

    if (this.inited) {
      return this.page;
    }

    const page = await this.getPage();

    const url = this.url;

    await page.goto(url, { waitUntil: 'load', timeout: 0 });

    this.inited = true;

    return this.page;
  }

  async updateStats() {
    return new Promise((resolve, reject) => {resolve()}).then(() => {
      this.intervalId = setInterval(() => {
        this.page
        .evaluate(() => {
          try {
            return window.getMiner();
          } catch (error) {
            return null;
          }
        })
        .then((payload) => {
          if (payload) {
            this.emit('update', payload);
          }
        });
      }, this.interval = 3000);
    });
  }

  async start() {
    await this.init();
    await this.updateStats();
  }

  async stop() {
    await this.init();

    clearInterval(this.intervalId);

    await this.page.close();

    this.page = null;

    return true;
  }
}

module.exports = function getPuppeteer(options = {}) {
  return new Puppeteer(options);
};