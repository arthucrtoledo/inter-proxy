import express from "express";
import axios from "axios";
import https from "https";

const app = express();
app.use(express.json());

const cert = process.env.INTER_CERTIFICATE;
const key = process.env.INTER_PRIVATE_KEY;

const httpsAgent = new https.Agent({
  cert,
  key
});

const clientId = process.env.INTER_CLIENT_ID;
const clientSecret = process.env.INTER_CLIENT_SECRET;

let accessToken = null;

async function getToken() {
  const response = await axios.post(
    "https://cdpj.partners.bancointer.com.br/oauth/v2/token",
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials"
    }),
    {
      httpsAgent,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  accessToken = response.data.access_token;
  return accessToken;
}

app.get("/", (req, res) => {
  res.send("Inter Proxy running");
});

app.post("/token", async (req, res) => {
  try {
    const token = await getToken();
    res.json({ access_token: token });
  } catch (err) {
    res.status(500).json(err.response?.data || err.message);
  }
});

app.get("/saldo", async (req, res) => {
  try {
    const token = await getToken();

    const response = await axios.get(
      "https://cdpj.partners.bancointer.com.br/banking/v2/saldo",
      {
        httpsAgent,
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json(err.response?.data || err.message);
  }
});

app.get("/extrato", async (req, res) => {
  try {
    const token = await getToken();

    const { dataInicio, dataFim } = req.query;

    const response = await axios.get(
      `https://cdpj.partners.bancointer.com.br/banking/v2/extrato?dataInicio=${dataInicio}&dataFim=${dataFim}`,
      {
        httpsAgent,
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json(err.response?.data || err.message);
  }
});

app.get("/boletos", async (req, res) => {
  try {
    const token = await getToken();

    const response = await axios.get(
      "https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas",
      {
        httpsAgent,
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json(err.response?.data || err.message);
  }
});

app.listen(3000, () => {
  console.log("Inter Proxy running on port 3000");
});
