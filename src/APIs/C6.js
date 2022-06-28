const axios = require('axios');
const qs = require('qs');

class C6 {
  constructor() {
    this.url = "https://marketplace-proposal-service-api-p.c6bank.info"//SEM LOGIN - https://marketplace-proposal-service-api-h.c6bank.info
    this.user = process.env.C6_USER
    this.auth = process.env.C6_AUTH
  }
  async timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async refreshToken(log) {
    try {
      log.situation = `[1]=> Conectando na API...`
      const response = await axios.post(`${this.url}/auth/token`, qs.stringify({ "username": this.user, "password": this.auth }), { header: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (response.data && response.data.access_token) {
        this.token = response.data.access_token;
        this.api = await axios.create({ baseURL: this.url, headers: { Authorization: `${this.token}` } });
        return true;
      } else return false;
    } catch(err) {
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        return this.refreshToken(log);
      }
      console.log(`[API C6 ERROR(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=> ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async simularProposta(data, log) {
    try {
      log.situation = `[2]=> Simulando a proposta...`
      const response = await this.api.post(`/marketplace/proposal/fgts/simulation`, data);
      if (response && response.data && response.data.details && response.data.details[0] && (response.data.details[0].includes('Não foi possivel realizar comunicação com a CEF') || response.data.details[0].includes('Limite da conta excedido'))) return this.simularProposta(data, log)
      return response
    } catch(err) {
      if (err.response && err.response.data && err.response.data.details && err.response.data.details[0] && (err.response.data.details[0].includes('Não foi possivel realizar comunicação com a CEF') || err.response.data.details[0].includes('Limite da conta excedido'))) return this.simularProposta(data, log)
      if (err.response && err.response.status == 401) {
        await this.refreshToken(log)
        return this.simularProposta(data, log)
      }
      if (err.response && err.response.data && (err.response.data.message || (err.response.data.details && err.response.data.details[0]))) return err.response;
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularProposta(data, log)
      }
      console.log(`[API C6 ERROR(2) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err);
      return false;
    }
  }
  async registerProposta(data, log) {
    try {
      log.situation = `[3]=> Registrando a proposta...`
      const response = await this.api.post(`/marketplace/proposal/fgts`, data);
      if (response && response.data && response.data.details && response.data.details[0] && (response.data.details[0].includes('Não foi possivel realizar comunicação com a CEF') || response.data.details[0].includes('Limite da conta excedido'))) return this.registerProposta(data, log)
      return response
    } catch(err) {
      if (err.response && err.response.data && err.response.data.details && err.response.data.details[0] && (err.response.data.details[0].includes('Não foi possivel realizar comunicação com a CEF') || err.response.data.details[0].includes('Limite da conta excedido'))) return this.registerProposta(data, log)
      if (err.response && err.response.status == 401) {
        await this.refreshToken(log)
        return this.registerProposta(data, log)
      }
      if (err.response && err.response.data && (err.response.data.message || (err.response.data.details && err.response.data.details[0]))) return err.response;
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.registerProposta(data, log)
      }
      console.log(`[API C6 ERROR(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err);
      return false;
    }
  }
  async getLink(proposta, log, tentativa) {
    try {
      if (!tentativa) tentativa = 0
      if (tentativa >= 10) return { data: { message: `Proposta não cadastrada, provavelmente ela foi reprovada pelo banco! Verifique manualmente no banco para saber o motivo...` } }
      log.situation = `[4]=> Pegando o link da proposta...`
      const response = await this.api.get(`/marketplace/proposal/formalization-url?proposalNumber=${proposta}`);
      if (response.data && response.data.message && (response.data.message.includes('The formalization link') && response.data.message.includes('not found'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(proposta, log, tentativa+1)
      } else if (response && response.data && response.data.details && response.data.details[0] && (response.data.details[0].includes('Não foi possivel realizar comunicação com a CEF') || response.data.details[0].includes('Limite da conta excedido'))) {
        return this.getLink(proposta, log)
      } else if (response && response.status == 404) {
        return this.getLink(proposta, log)
      } else if (!response.data || !response.data.url) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(proposta, log, tentativa+1)
      }
      return response
    } catch(err) {
      if (err.response && err.response.data && err.response.data.message && (err.response.data.message.includes('formalization link') && err.response.data.message.includes('not found'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(proposta, log, tentativa+1)
      }
      if (err.response && err.response.data && err.response.data.details && err.response.data.details[0] && (err.response.data.details[0].includes('Não foi possivel realizar comunicação com a CEF') || err.response.data.details[0].includes('Limite da conta excedido'))) return this.getLink(proposta, log)
      if (err.response && err.response.status == 404) return this.getLink(proposta, log)
      if (err.response && err.response.status == 401) {
        await this.refreshToken(log)
        return this.getLink(proposta, log)
      }
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(proposta, log)
      }
      if (err.response && err.response.data && (err.response.data.message || (err.response.data.details && err.response.data.details[0]))) return err.response;
      console.log(`[API C6 ERROR(4) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err);
      return false;
    }
  }
}

module.exports = C6