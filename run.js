const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
env.split('\n').forEach(l => {
  if(l && !l.startsWith('#')) {
    const [k, ...v] = l.split('=');
    if(k && v) process.env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});
require('child_process').execSync('npx tsx testdb.js', {stdio: 'inherit'});
