import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { requestId, inputs } = req.body || {};
  const intent = inputs?.[0]?.intent;

  // 1. SYNC
  if (intent === 'action.devices.SYNC') {
    return res.status(200).json({
      requestId: requestId || 'sync-req',
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
          },
        ],
      },
    });
  }

  // 2. QUERY
  if (intent === 'action.devices.QUERY') {
    return res.status(200).json({
      requestId: requestId || 'query-req',
      payload: {
        devices: {
          'kombi-thermostat-main': {
            status: 'SUCCESS',
            online: true,
            thermostatMode: 'heat',
            thermostatTemperatureAmbient: 21.8,
            thermostatTemperatureSetpoint: 22.5,
          },
        },
      },
    });
  }

  // 3. EXECUTE
  if (intent === 'action.devices.EXECUTE') {
    const commands = inputs?.[0]?.payload?.commands || [];
    const successfulCommands: any[] = [];

    let targetTemp = 22.5;
    let mode = 'heat';

    for (const cmd of commands) {
      for (const execution of cmd.execution || []) {
        const { command, params } = execution;
        if (command === 'action.devices.commands.ThermostatTemperatureSetpoint') {
          targetTemp = params?.thermostatTemperatureSetpoint ?? targetTemp;
        }
        if (command === 'action.devices.commands.ThermostatSetMode') {
          mode = params?.thermostatMode ?? mode;
        }
      }

      successfulCommands.push({
        ids: cmd.devices?.map((d: any) => d.id) || ['kombi-thermostat-main'],
        status: 'SUCCESS',
        states: {
          thermostatMode: mode,
          thermostatTemperatureSetpoint: targetTemp,
        },
      });
    }

    return res.status(200).json({
      requestId: requestId || 'execute-req',
      payload: {
        commands: successfulCommands,
      },
    });
  }

  return res.status(200).json({
    requestId: requestId || 'fallback-req',
    payload: {
      errorCode: 'notSupported',
    },
  });
}
