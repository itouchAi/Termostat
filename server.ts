import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory thermostat state (kept in sync with Firebase if reachable)
let thermostatState = {
  ambientTemp: 21.8,
  targetTemp: 22.0,
  mode: 'heat' as 'heat' | 'eco' | 'off',
  isOnline: true,
  isHeating: false,
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS for Google Home and local access
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // ─────────────────────────────────────────────────────────────
  // DIGITAL ASSET LINKS (Android TWA / APK Address Bar Removal)
  // ─────────────────────────────────────────────────────────────
  app.get('/.well-known/assetlinks.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const localPath = path.resolve(__dirname, 'public/.well-known/assetlinks.json');
    const distPath = path.resolve(__dirname, 'dist/.well-known/assetlinks.json');
    if (fs.existsSync(localPath)) {
      res.sendFile(localPath);
    } else if (fs.existsSync(distPath)) {
      res.sendFile(distPath);
    } else {
      res.status(404).json({ error: 'assetlinks.json not found' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 1. OAUTH AUTHORIZATION ENDPOINT (GET /auth)
  // When user clicks "[test] Kombi Termostatı" in Google Home app,
  // Google opens this page on the user's phone.
  // ─────────────────────────────────────────────────────────────
  app.get(['/auth', '/api/auth'], (req: Request, res: Response) => {
    const redirectUri = (req.query.redirect_uri as string) || '';
    const state = (req.query.state as string) || '';
    const clientId = (req.query.client_id as string) || '';

    // If no redirect_uri provided, display status
    if (!redirectUri) {
      res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Kombi3D OAuth Auth</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .box { text-align: center; background: #1e293b; padding: 2rem; border-radius: 1.5rem; max-width: 400px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5); }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>🔥 Kombi3D Auth Servisi Aktif</h2>
            <p>Bu adres Google Home Account Linking için hazırdır.</p>
          </div>
        </body>
        </html>
      `);
      return;
    }

    // Build the approved callback target
    const targetUrl = new URL(redirectUri);
    targetUrl.searchParams.set('code', 'kombi-auth-code-' + Date.now());
    if (state) {
      targetUrl.searchParams.set('state', state);
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Google Home ile Eşleştir - Kombi3D</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 1.25rem;
          }
          .card {
            background: rgba(30, 41, 59, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(16px);
            border-radius: 1.75rem;
            padding: 2rem 1.5rem;
            max-width: 380px;
            width: 100%;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
          }
          .icon-badge {
            width: 68px;
            height: 68px;
            margin: 0 auto 1.25rem;
            border-radius: 1.25rem;
            background: linear-gradient(135deg, #3b82f6, #f59e0b, #10b981);
            padding: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .icon-inner {
            background: #0f172a;
            width: 100%;
            height: 100%;
            border-radius: 1.15rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
          }
          h1 {
            font-size: 1.35rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            color: #ffffff;
          }
          .subtitle {
            font-size: 0.85rem;
            color: #94a3b8;
            line-height: 1.45;
            margin-bottom: 1.5rem;
          }
          .device-badge {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 1rem;
            padding: 0.85rem;
            margin-bottom: 1.75rem;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .device-info h4 {
            font-size: 0.875rem;
            font-weight: 700;
            color: #60a5fa;
          }
          .device-info p {
            font-size: 0.75rem;
            color: #cbd5e1;
            margin-top: 0.15rem;
          }
          .btn-primary {
            display: block;
            width: 100%;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 0.95rem;
            border-radius: 1rem;
            font-size: 0.95rem;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
            border: none;
            box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);
            transition: all 0.2s;
          }
          .btn-primary:active {
            transform: scale(0.98);
          }
          .note {
            font-size: 0.72rem;
            color: #64748b;
            margin-top: 1rem;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-badge">
            <div class="icon-inner">🏠</div>
          </div>
          <h1>Google Home ile Bağla</h1>
          <p class="subtitle">
            Google Asistan ve Google Home uygulamasının <strong>Kombi Termostatınızı</strong> yönetmesine izin vermek üzeresiniz.
          </p>

          <div class="device-badge">
            <span style="font-size: 1.5rem;">🔥</span>
            <div class="device-info">
              <h4>Kombi Termostatı</h4>
              <p>Oturma Odası • Canlı Sıcaklık & Hedef Kontrolü</p>
            </div>
          </div>

          <a href="${targetUrl.toString()}" class="btn-primary" id="confirmBtn">
            ✓ Bağlantıyı Onayla ve Eşleştir
          </a>

          <p class="note">
            Onayladığınızda Google Home uygulaması kombiyi otomatik algılayacaktır.
          </p>
        </div>

        <script>
          // Automatic 1-second auto-redirect convenience if desired, or tap the button:
          // setTimeout(() => { document.getElementById('confirmBtn').click(); }, 1200);
        </script>
      </body>
      </html>
    `);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. OAUTH TOKEN ENDPOINT (POST /token)
  // Google's servers exchange authorization code for access token.
  // ─────────────────────────────────────────────────────────────
  app.post(['/token', '/api/token'], (req: Request, res: Response) => {
    res.json({
      token_type: 'bearer',
      access_token: 'kombi-access-token-' + Date.now(),
      refresh_token: 'kombi-refresh-token-' + Date.now(),
      expires_in: 315360000, // 10 years valid for personal home project
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. GOOGLE SMART HOME FULFILLMENT ENDPOINT (POST /smarthome)
  // Handles SYNC, QUERY, and EXECUTE commands from Google Assistant
  // ─────────────────────────────────────────────────────────────
  app.post(['/smarthome', '/api/smarthome'], (req: Request, res: Response) => {
    const { requestId, inputs } = req.body || {};
    const intent = inputs?.[0]?.intent;

    console.log(`[Google Smart Home] Received intent: ${intent}`);

    // A) SYNC: Inform Google about our Thermostat device
    if (intent === 'action.devices.SYNC') {
      res.json({
        requestId: requestId || 'req-sync',
        payload: {
          agentUserId: 'kombi-owner-aytac',
          devices: [
            {
              id: 'kombi-thermostat-main',
              type: 'action.devices.types.THERMOSTAT',
              traits: ['action.devices.traits.TemperatureSetting'],
              name: {
                defaultNames: ['Kombi Termostatı'],
                name: 'Kombi Termostatı',
                nicknames: ['Kombi', 'Termostat', 'Oda Termostatı'],
              },
              willReportState: false,
              roomHint: 'Oturma Odası',
              attributes: {
                availableThermostatModes: ['heat', 'eco', 'off'],
                thermostatTemperatureUnit: 'C',
                thermostatTemperatureRange: {
                  minThresholdCelsius: 10,
                  maxThresholdCelsius: 32,
                },
                bufferRangeCelsius: 0.5,
              },
              deviceInfo: {
                manufacturer: 'Kombi3D',
                model: 'Smart-Relay-ESP32',
                hwVersion: '1.0',
                swVersion: '2.0',
              },
            },
          ],
        },
      });
      return;
    }

    // B) QUERY: Google asks for live temperature & status
    if (intent === 'action.devices.QUERY') {
      res.json({
        requestId: requestId || 'req-query',
        payload: {
          devices: {
            'kombi-thermostat-main': {
              status: 'SUCCESS',
              online: thermostatState.isOnline,
              thermostatMode: thermostatState.mode,
              thermostatTemperatureAmbient: thermostatState.ambientTemp,
              thermostatTemperatureSetpoint: thermostatState.targetTemp,
            },
          },
        },
      });
      return;
    }

    // C) EXECUTE: Google gives a command (e.g. set temp to 23°C or turn on eco)
    if (intent === 'action.devices.EXECUTE') {
      const commands = inputs?.[0]?.payload?.commands || [];
      const successfulCommands: any[] = [];

      for (const cmd of commands) {
        for (const execution of cmd.execution || []) {
          const { command, params } = execution;

          if (command === 'action.devices.commands.ThermostatTemperatureSetpoint') {
            if (typeof params?.thermostatTemperatureSetpoint === 'number') {
              thermostatState.targetTemp = params.thermostatTemperatureSetpoint;
              console.log(`[Google Smart Home] Set target temp to: ${thermostatState.targetTemp}°C`);
            }
          }

          if (command === 'action.devices.commands.ThermostatSetMode') {
            if (params?.thermostatMode) {
              thermostatState.mode = params.thermostatMode;
              console.log(`[Google Smart Home] Set mode to: ${thermostatState.mode}`);
            }
          }
        }

        successfulCommands.push({
          ids: cmd.devices?.map((d: any) => d.id) || ['kombi-thermostat-main'],
          status: 'SUCCESS',
          states: {
            thermostatMode: thermostatState.mode,
            thermostatTemperatureSetpoint: thermostatState.targetTemp,
            thermostatTemperatureAmbient: thermostatState.ambientTemp,
          },
        });
      }

      res.json({
        requestId: requestId || 'req-execute',
        payload: {
          commands: successfulCommands,
        },
      });
      return;
    }

    // Fallback for unknown intents
    res.json({
      requestId: requestId || 'req-fallback',
      payload: {
        errorCode: 'notSupported',
      },
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. FRONTEND SERVING (Vite in Dev, Dist in Prod)
  // ─────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist'), { dotfiles: 'allow' }));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Kombi3D Full-Stack Server running on port ${PORT}`);
    console.log(`   - Auth URL:        http://0.0.0.0:${PORT}/auth`);
    console.log(`   - Token URL:       http://0.0.0.0:${PORT}/token`);
    console.log(`   - Fulfillment URL: http://0.0.0.0:${PORT}/smarthome`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
