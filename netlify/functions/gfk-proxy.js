// Server-seitige Funktion: hält den API-Key geheim und leitet die Anfrage an Anthropic weiter.
// Erwartet als Umgebungsvariable: ANTHROPIC_API_KEY (in den Netlify-Site-Einstellungen setzen).
// Enthält einen automatischen Wiederholungsversuch bei kurzzeitiger Serverüberlastung (Anthropic
// dokumentiert 500/502/503/529 als transiente Fehler, die sich meist durch einen erneuten
// Versuch mit kurzer Pause von selbst lösen).

const TRANSIENT_STATUS_CODES = [500, 502, 503, 529];

async function callAnthropicWithRetry(system, text, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2048,
        system: system,
        messages: [{ role: 'user', content: text }]
      })
    });

    const isTransientError = TRANSIENT_STATUS_CODES.includes(response.status);
    if (isTransientError && attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)));
      continue;
    }
    return response;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { text, system } = JSON.parse(event.body);

    if (!text || !system) {
      return { statusCode: 400, body: JSON.stringify({ error: 'text und system werden benötigt' }) };
    }

    const response = await callAnthropicWithRetry(system, text);
    const data = await response.json();

    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Serverfehler beim Aufruf der Anthropic-API' })
    };
  }
};
