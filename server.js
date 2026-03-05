import express from "express";
import https from "https";
import axios from "axios";

const app = express();
app.use(express.json());

const cert = process.env.INTER_CERTIFICATE;
const key = process.env.INTER_PRIVATE_KEY;
const clientId = process.env.INTER_CLIENT_ID;
const clientSecret = process.env.INTER_CLIENT_SECRET;

const httpsAgent = new https.Agent({
  cert: cert,
  key: key,
  rejectUnauthorized: true
});

app.get("/", (req,res)=>{
  res.send("Inter Proxy running");
});

app.post("/token", async (req, res) => {
  try {
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

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: error.response?.data || error.message
    });
  }
});

app.listen(3000, () => {
  console.log("Inter Proxy running");
});
