export default function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Google exchanges authorization code for access token
  return res.status(200).json({
    token_type: 'bearer',
    access_token: 'kombi-access-token-' + Date.now(),
    refresh_token: 'kombi-refresh-token-' + Date.now(),
    expires_in: 315360000, // 10 years
  });
}
