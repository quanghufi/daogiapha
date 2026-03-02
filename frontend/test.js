const fs = require('fs');
const envStr = fs.readFileSync('.env', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
    }
});

fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/profiles?select=*', {
    headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
    }
})
    .then(r => r.json())
    .then(data => {
        console.log(data);
    })
    .catch(console.error);
