import fs from 'fs';
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

// Load user configuration
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

const FILES = {
  account1: { pass: 'account1_password.txt', time: 'account1_time.txt' },
  account2: { pass: 'account2_password.txt', time: 'account2_time.txt' }
};

function getPassword(acc) {
  try { return fs.readFileSync(FILES[acc].pass, 'utf-8').trim(); } catch { return ''; }
}

function setPassword(acc, pwd) {
  fs.writeFileSync(FILES[acc].pass, pwd, 'utf-8');
}

function genPassword() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `${config.passwordPrefix}${n}`;
}

// Check availability by expiry time
function isAvailable(acc) {
  try {
    const raw = fs.readFileSync(FILES[acc].time, 'utf-8').trim();
    if (!raw) return { ok: true };
    const end = new Date(raw);
    if (Date.now() >= end.getTime()) {
      fs.writeFileSync(FILES[acc].time, '', 'utf-8');
      return { ok: true };
    }
    return { ok: false, end };
  } catch {
    fs.writeFileSync(FILES[acc].time, '', 'utf-8');
    return { ok: true };
  }
}

async function send(text, customer) {
  await axios.post(config.services.router, {
    sender: config.sender,
    customer,
    message: text
  });
}

function parseDuration(title) {
  if (title.includes('3 days')) return 72;
  if (title.includes('2 days')) return 48;
  return 24;
}

// Main webhook endpoint
app.post('/webhook', async (req, res) => {
  const { details } = req.body;
  if (!details?.advert || !details?.customer) return res.status(400).end();

  const title = details.advert.title.toLowerCase();
  const acc = title.includes('account1') ? 'account1' : 'account2';

  const availability = isAvailable(acc);
  if (!availability.ok) {
    await send(`Account is busy until ${availability.end.toISOString()}`, details.customer);
    return res.json({ ok: false });
  }

  const hours = parseDuration(title);
  const end = new Date(Date.now() + hours * 60 * 60 * 1000);
  fs.writeFileSync(FILES[acc].time, end.toISOString(), 'utf-8');

  let pwd = getPassword(acc);
  if (!pwd) {
    pwd = genPassword();
    setPassword(acc, pwd);
  }

  await send(
    `Username: ${config.accounts[acc].username} | Password: ${pwd}`,
    details.customer
  );

  res.json({ ok: true });
});

app.listen(3001, () => console.log('rent service running'));