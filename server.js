import express from "express";
import axios from "axios";
import https from "https";

const app = express();
app.use(express.json());

/*
=====================================
CONFIGURAÇÃO CERTIFICADO INTER
=====================================
*/

const cert = process.env.INTER_CERTIFICATE;
const key = process.env.INTER_PRIVATE_KEY;

const httpsAgent = new https.Agent({
  cert: cert,
  key: key
});

/*
=====================================
CLIENT ID E SECRET
=====================================
*/

const clientId = process.env.INTER_CLIENT_ID;
const clientSecret = process.env.INTER_CLIENT_SECRET;

/*
=====================================
CACHE TOKEN
=====================================
*/

let accessToken = null;
let tokenExpiration = 0;

async function getToken() {

  if (accessToken && Date.now() < tokenExpiration) {
    return accessToken;
  }

  try {

    const response = await axios.post(
      "https://cdpj.partners.bancointer.com.br/oauth/v2/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "extrato.read boleto-cobranca.read boleto-cobranca.write pix.write pix.read"
      }),
      {
        httpsAgent,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        timeout: 10000
      }
    );

    accessToken = response.data.access_token;

    tokenExpiration =
      Date.now() + (response.data.expires_in * 1000) - 60000;

    return accessToken;

  } catch (error) {

    console.error(
      "Erro ao gerar token:",
      error.response?.data || error.message
    );

    throw error;

  }

}

/*
=====================================
HEALTH CHECK
=====================================
*/

app.get("/", (req, res) => {

  res.json({
    status: "ok",
    service: "inter-proxy",
    message: "Proxy Inter funcionando"
  });

});

/*
=====================================
SALDO
=====================================
*/

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

    console.error("Erro saldo:", error.response?.data || error.message);

    res.status(500).json(
      error.response?.data || { erro: error.message }
    );

  }

});

/*
=====================================
EXTRATO
=====================================
*/

app.get("/extrato", async (req, res) => {

  try {

    const { dataInicio, dataFim } = req.query;

    const token = await getToken();

    const response = await axios.get(
      "https://cdpj.partners.bancointer.com.br/banking/v2/extrato",
      {
        httpsAgent,
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          dataInicio,
          dataFim
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.error("Erro extrato:", error.response?.data || error.message);

    res.status(500).json(
      error.response?.data || { erro: error.message }
    );

  }

});

/*
=====================================
BOLETOS
=====================================
*/

app.get("/boletos", async (req, res) => {

  try {

    const token = await getToken();

    const dataInicial = req.query.dataInicial || "2024-01-01";
    const dataFinal = req.query.dataFinal || "2030-12-31";

    const response = await axios.get(
      "https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas",
      {
        httpsAgent,
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          dataInicial,
          dataFinal
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.error("Erro boletos:", error.response?.data || error.message);

    res.status(500).json(
      error.response?.data || { erro: error.message }
    );

  }

});

/*
=====================================
ENVIAR PIX
=====================================
*/

app.post("/pix", async (req, res) => {

  try {

    const { tipo, chave, valor, descricao } = req.body;

    const token = await getToken();

    const response = await axios.post(
      "https://cdpj.partners.bancointer.com.br/banking/v2/pix",
      {
        tipo,
        chave,
        valor,
        descricao
      },
      {
        httpsAgent,
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.error("Erro PIX:", error.response?.data || error.message);

    res.status(500).json(
      error.response?.data || { erro: error.message }
    );

  }

});

/*
=====================================
PORTA RAILWAY
=====================================
*/

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {

  console.log(`Proxy Inter rodando na porta ${PORT}`);

});
