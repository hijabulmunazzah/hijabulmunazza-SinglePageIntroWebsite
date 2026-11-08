/**
 * Build-time script to fetch latest exchange rates from ExchangeRate-API
 * Usage: EXCHANGERATE_API_KEY=xxx node scripts/update_rates.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.EXCHANGERATE_API_KEY;
const OUTPUT_FILE = path.join(__dirname, '../data/rates.json');

if (!API_KEY) {
  console.log('No EXCHANGERATE_API_KEY provided; rates.json remains unchanged.');
  process.exit(0);
}

const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/PKR`;

https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (data.result === 'success') {
        const payload = {
          base: 'PKR',
          updated_at: new Date().toISOString().split('T')[0],
          source: 'ExchangeRate-API',
          rates: {
            PKR: 1.0,
            USD: data.conversion_rates.USD || 0.0036,
            SAR: data.conversion_rates.SAR || 0.0135,
            AED: data.conversion_rates.AED || 0.0132,
            GBP: data.conversion_rates.GBP || 0.0028,
            EUR: data.conversion_rates.EUR || 0.0033,
            CAD: data.conversion_rates.CAD || 0.0050,
            AUD: data.conversion_rates.AUD || 0.0055,
            QAR: data.conversion_rates.QAR || 0.0131,
            KWD: data.conversion_rates.KWD || 0.0011,
            OMR: data.conversion_rates.OMR || 0.00138,
            BHD: data.conversion_rates.BHD || 0.00135,
            MYR: data.conversion_rates.MYR || 0.016,
            TRY: data.conversion_rates.TRY || 0.123,
            INR: data.conversion_rates.INR || 0.303,
            BDT: data.conversion_rates.BDT || 0.435
          }
        };
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2));
        console.log('Successfully updated data/rates.json');
      } else {
        console.error('API Error:', data['error-type']);
      }
    } catch (e) {
      console.error('Failed to parse exchange rate response:', e);
    }
  });
}).on('error', (err) => {
  console.error('HTTP request failed:', err);
});
