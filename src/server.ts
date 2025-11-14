import * as crypto from 'crypto';
import * as Sentry from '@sentry/node';
import { expressErrorHandler } from '@sentry/node';
import { WebhookPayloadDTO, PostProgressUpdate, PostSummaryUpdate, toUpdate } from './app/shared/models/webhook.model';
import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { APP_ENVIRONMENT, AppEnvironment } from './app/app-environment';

Sentry.initWithoutDefaultIntegrations({
  dsn: process.env['SENTRY_DSN'],
  environment: process.env['SENTRY_ENVIRONMENT'],
  tracesSampleRate: 1.0,
  integrations: [Sentry.expressIntegration(), Sentry.httpServerIntegration()],
  release: 'sitepost@1.0.0',
});

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

  const secret = process.env['WEB_HOOK_SECRET'] || '';
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

app.get('/site/debug-sentry', (req, res) => {
  console.error('Teste de erro do Sentry no Servidor SSR!');
  throw new Error('Este é um erro de teste do Sentry no Servidor SSR!');
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
    .handle(req, {
      bootstrapOptions: {
        providers: [
          {
            provide: APP_ENVIRONMENT,
            useValue: {
              production: process.env['PRODUCTION'] === 'true',
              apiBaseUrl: process.env['API_BASE_URL'],
              apiPath: process.env['API_PATH'],
              loginPath: process.env['LOGIN_PATH'],
              apiKey: process.env['API_KEY'],
              sentryDsn: process.env['SENTRY_DSN']!,
              sentryEnvironment: process.env['SENTRY_ENVIRONMENT']!,
            } as AppEnvironment,
          },
        ],
      },
    })
    .then(async (response) => {
      if (!response) {
        next();
        return;
      }

      const clientEnv: AppEnvironment = {
        production: process.env['PRODUCTION'] === 'true',
        apiBaseUrl: process.env['API_BASE_URL'] || '',
        apiPath: process.env['API_PATH'] || '',
        loginPath: process.env['LOGIN_PATH'] || '',
        apiKey: process.env['API_KEY'] || '',
        sentryDsn: process.env['SENTRY_DSN'] || '',
        sentryEnvironment: process.env['SENTRY_ENVIRONMENT'] || '',
      };

      const html = await response.text();

      const modifiedHtml = html.replace(
        '</head>',
        `<script>window.__APP_ENV__ = ${JSON.stringify(clientEnv)}</script></head>`,
      );

      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.status(response.status);
      res.send(modifiedHtml);
    })
    .catch((err) => next(err));
});

app.use(expressErrorHandler());

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
