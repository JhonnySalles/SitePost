import * as crypto from 'crypto';
import { environment } from './environments/environment';
import { WebhookPayloadDTO, PostProgressUpdate, PostSummaryUpdate, toUpdate } from './app/shared/models/webhook.model';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Middleware do webhook
let wss: WebSocketServer;

const verifyWebhookSignature = (req: any, res: any, next: any) => {
  const signature = req.headers['x-webhook-signature'] as string;

  // prettier-ignore
  if (!signature)
    return res.status(401).send('Assinatura de segurança não fornecida.');

  const secret = environment.webhookSecret;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(req.body);
  const calculatedSignature = 'sha256=' + hmac.digest('hex');

  // prettier-ignore
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature)))
    return res.status(401).send('Assinatura inválida.');

  return next();
};

app.use('/site/webhook/status', express.raw({ type: 'application/json' }));

app.post('/site/webhook/status', verifyWebhookSignature, (req, res) => {
  let payload: WebhookPayloadDTO;

  try {
    payload = JSON.parse(req.body.toString());
  } catch (e) {
    return res.status(400).send('Payload JSON mal formatado.');
  }

  console.log('Webhook recebido e VERIFICADO:', payload);

  const update: PostProgressUpdate | PostSummaryUpdate = toUpdate(payload);
  broadcastToClients(update);

  return res.status(200).send({ message: 'Webhook recebido' });
});

function broadcastToClients(message: PostProgressUpdate | PostSummaryUpdate) {
  if (!wss) {
    console.warn('Servidor WebSocket não inicializado. Ignorando broadcast.');
    return;
  }

  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
}

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  const server = app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });

  wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
      console.log('Cliente WebSocket conectado.');
    });
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
