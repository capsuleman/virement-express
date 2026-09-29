import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';

const PORT = 4000;

createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/sepa') {
    res.writeHead(404).end();
    return;
  }
  req.resume();
  req.on('end', () => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        res.writeHead(503, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'partner unavailable' }));
        return;
      }
      res.writeHead(201, { 'content-type': 'application/json' }).end(JSON.stringify({ id: `ptr_${randomUUID()}` }));
    }, 200 + Math.random() * 1300);
  });
}).listen(PORT, () => console.log(`Faux partenaire bancaire sur http://localhost:${PORT}`));
