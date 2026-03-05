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
let tokenExpiration = 0;

async function getToken() {

  if (accessToken && Date.now() < tokenExpiration) {
    return accessToken;
  }

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

  tokenExpiration = Date.now() + (response.data.expires_in * 1000);

  return accessToken;
}

app.get("/token", async (req, res) => {

  try {

    const token = await getToken();

    res.json({ token });

  } catch (error) {

    console.error(error.response?.data || error.message);

    res.status(500).json(error.response?.data || error.message);
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

  } catch (error) {

    console.error(error.response?.data || error.message);

    res.status(500).json(error.response?.data || error.message);
  }

});


app.get("/extrato", async (req, res) => {

  try {

    const { dataInicio, dataFim } = req.query;

    const token = await getToken();

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

  } catch (error) {

    console.error(error.response?.data || error.message);

    res.status(500).json(error.response?.data || error.message);
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

  } catch (error) {

    console.error(error.response?.data || error.message);

    res.status(500).json(error.response?.data || error.message);
  }

});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(`Proxy Inter rodando na porta ${PORT}`);

});
