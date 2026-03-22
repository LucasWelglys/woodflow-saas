const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'webhook.dev.ebookverso.com',
  port: 443,
  path: '/api/v1/workflows',
  method: 'GET',
  headers: {
    'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZjU4YzZiMi02MTA0LTRjZTQtYjA2NS04NTgwNjVlNDJhMmUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0MDk0NjIxfQ.mKYMadta8HpKUMzUxv5LtROWta1waauZYK8CYkBuEpI',
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      let out = "";
      if (data && data.data) {
        data.data.forEach(wf => {
          let triggerType = 'Manual/None';
          if (wf.nodes && wf.nodes.length > 0) {
            const triggers = wf.nodes.filter(n => n.type.toLowerCase().includes('trigger') || n.type.toLowerCase().includes('webhook'));
            if (triggers.length > 0) {
              triggerType = triggers.map(t => t.type.replace('n8n-nodes-base.', '')).join(', ');
            }
          }
          out += `- Flow: ${wf.name} | Active: ${wf.active} | Trigger: ${triggerType}\n`;
        });
        fs.writeFileSync('d:/meus projetos antigravity/woodflow-saas/tmp_workflows_out.txt', out);
      }
    } catch (e) {
      console.error('JSON Error');
    }
  });
});

req.end();
