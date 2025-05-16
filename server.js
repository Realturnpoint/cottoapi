const express = require('express');
const axios = require('axios');
const { parse } = require('csv-parse/sync');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/zendingen', async (req, res) => {
  try {
    // Stap 1: Inloggen
    const login = await axios.post(process.env.LOGIN_URL, new URLSearchParams({
      GebruikersNaam: process.env.USERNAME,
      Wachtwoord: process.env.PASSWORD
    }), { withCredentials: true });

    const cookies = login.headers['set-cookie'];

    // Stap 2: Haal CSV op
    const csvRes = await axios.get(process.env.CSV_URL, {
      headers: {
        Cookie: cookies.join('; ')
      }
    });

    // Stap 3: Parse CSV
    const records = parse(csvRes.data, {
      columns: true,
      skip_empty_lines: true
    });

    const perMaand = {};
    let totaal = 0;

    for (const row of records) {
      const datumStr = row['Afleveren']; // of 'Datum' als andere naam
      const datum = new Date(datumStr);
      if (!isNaN(datum)) {
        const maand = datum.toLocaleString('nl-NL', { month: 'long' });
        perMaand[maand] = (perMaand[maand] || 0) + 1;
        totaal++;
      }
    }

    res.json({
      totaal_zendingen: totaal,
      zendingen_per_maand: perMaand
    });
  } catch (err) {
    console.error('Fout:', err.message);
    res.status(500).json({ error: 'Fout bij ophalen of verwerken CSV' });
  }
});

app.listen(PORT, () => console.log(`✅ Server draait op poort ${PORT}`));
