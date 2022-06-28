const axios = require('axios');

class BMG {
  constructor() {
    this.url = "https://api-bmg.bancobmg.com.br/consig"//SEM LOGIN - https://api-bmg.bancobmg.com.br/sandbox/consig
    this.apiToken = process.env.BMG_TOKEN
    this.url2 = "https://api.bancobmg.com.br:8443/api"//https://apisandbox.bancobmg.com.br:8443/api
    this.client = process.env.BMG_CLIENT_ID
    this.secret = process.env.BMG_CLIENT_SECRET
    this.user = process.env.BMG_USER
  }
  async timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async refreshToken(log) {
    try {
      log.situation = `[1]=> Conectando na API...`
      this.api = axios.create({ baseURL: this.url, headers: { 'app-token': `${this.apiToken}` } });
      const params = new URLSearchParams();
      params.append('client_id', this.client);
      params.append('client_secret', this.secret);
      params.append('grant_type', 'client_credentials');
      const response = await axios.post(`${this.url2}/v1/autenticacao/`, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (response.data && response.data.access_token) {
        this.token = response.data.access_token;
        this.api2 = axios.create({ baseURL: this.url2, headers: { Authorization: `Bearer ${response.data.access_token}` } });
        return true;
      } else return false;
    } catch(err) {
      if (err.response && err.response.status == 403) return this.refreshToken(log)
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        return this.refreshToken(log);
      }
      console.log(`[API BMG ERROR(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=> ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async simularProposta(data, log) {
    try {
      log.situation = `[2]=> Simulando a proposta...`
      const response = await this.api.post('/v1/simularsaqueaniversariofgts', data);
      return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.simularSaqueAniversarioFgtsResponse) return err.response
      if (err.response && err.response.data && err.response.data.simularSaqueAniversarioFgtsResponse && err.response.data.simularSaqueAniversarioFgtsResponse.error && err.response.data.simularSaqueAniversarioFgtsResponse.error.message) return err.response;
      if (err.response && err.response.data == "Gateway timeout") {
        this.timeout(5000)
        await this.refreshToken(log)
        return this.simularProposta(data, log)
      }
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularProposta(data, log)
      }
      console.log(`[API BMG ERROR(2) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async gravarProposta(data, log) {
    try {
      log.situation = `[3]=> Gravando a proposta...`
      const response = await this.api.post('/v1/gravapropostaantecipasaquefgts', data);
      return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.gravaPropostaAntecipaSaqueFgtsResponse) return err.response
      if (err.response && err.response.data && err.response.data.gravaPropostaAntecipaSaqueFgtsResponse && err.response.data.gravaPropostaAntecipaSaqueFgtsResponse.error && err.response.data.gravaPropostaAntecipaSaqueFgtsResponse.error.message) return err.response;
      if (err.response && err.response.data == "Gateway timeout") {
        this.timeout(5000)
        await this.refreshToken(log)
        return this.gravarProposta(data, log)
      }
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.gravarProposta(data, log)
      }
      console.log(`[API BMG ERROR(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async getLink(proposta, log) {
    try {
      log.situation = `[4]=> Aguardando liberação na esteira...`
      const response = await this.api2.post(`/v1/consig/propostas/formalizacoes/link-compartilhado/aceite`, { loginUsuario: this.user, nomeCorrespondente: "Concredito", numeroProposta: proposta });
      return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.error && err.response.data.error.message) return err.response;
      if (err.response && err.response.data == "Gateway timeout") {
        this.timeout(5000)
        await this.refreshToken(log)
        return this.getLink(proposta, log)
      }
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(proposta, log)
      }
      console.log(`[API BMG ERROR(4) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
}

module.exports = BMG