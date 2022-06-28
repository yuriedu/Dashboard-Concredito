const axios = require('axios');

class Mercantil {
  constructor() {
    this.url = "https://api.mercantil.com.br:8443/"//https://apihml.mercantil.com.br:8443/
    this.key = process.env.MERCANTIL_KEY
    this.secret = process.env.MERCANTIL_SECRET
  }
  async timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async refreshToken(log) {
    try {
      log.situation = `[1]=> Conectando na API...`
      const response = await axios.post(`${this.url}auth/oauth/v2/token?grant_type=client_credentials&client_id=${this.key}&client_secret=${this.secret}`);
      if (response.data && response.data.access_token) {
        this.token = response.data.access_token
        this.api = await axios.create({ baseURL: this.url, headers: { Authorization: `Bearer ${this.token}` } });
        return true;
      } else return false;
    } catch(err) {
      if (err.response && (err.response.status == 401 || err.response.status == 504)){
        await this.timeout(5000);
        await this.refreshToken(5000);
      } else if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        return this.refreshToken(log);
      }
      console.log(`[API Mercantil ERROR(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=> ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async getSaldo(cpf, log) {
    try {
      log.situation = `[2]=> Consultando saldo do cliente...`
      const response = await this.api.get(`${this.url}PropostasExternas/v1/Clientes/${cpf}/SaquesAniversario/Saldo`);
      return response;
    } catch(err) {
      if (err.response && (err.response.status == 401 || err.response.status == 504)){
        await this.refreshToken(log);
        return this.getSaldo(cpf, log);
      } else if (err.response && err.response.data && err.response.data.errors && err.response.data.errors[0] && err.response.data.errors[0].message) {
        return err.response
      } else if (err.response && err.response.data && err.response.data.errors && Object.keys(err.response.data.errors) && Object.keys(err.response.data.errors)[0]) return err.response
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getSaldo(cpf, log)
      }
      console.log(`[API Mercantil ERROR(2) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async simularProposta(data, log) {
    try {
      log.situation = `[3]=> Simulando a proposta...`
      const response = await this.api.post(`${this.url}PropostasExternas/v1/Simulacoes/Fgts`, data)
      return response;
    } catch(err) {
      if (err.response && (err.response.status == 401 || err.response.status == 504)){
        await this.refreshToken(log);
        return this.simularProposta(data, log);
      } else if (err.response && err.response.data && err.response.data.errors && err.response.data.errors[0] && err.response.data.errors[0].message) {
        return err.response
      } else if (err.response && err.response.data && err.response.data.errors && Object.keys(err.response.data.errors) && Object.keys(err.response.data.errors)[0]) return err.response
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularProposta(data, log)
      }
      console.log(`[API Mercantil ERROR(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async registerProposta(data, log) {
    try {
      log.situation = `[4]=> Registrando a proposta...`
      const response = await this.api.post(`${this.url}PropostasExternas/v1/Propostas/FGTS`, data)
      return response;
    } catch(err) {
      if (err.response && (err.response.status == 401 || err.response.status == 504)){
        await this.refreshToken(log);
        return this.registerProposta(data, log);
      } else if (err.response && err.response.data && err.response.data.errors && err.response.data.errors[0] && err.response.data.errors[0].message) {
        return err.response
      } else if (err.response && err.response.data && err.response.data.errors && Object.keys(err.response.data.errors) && Object.keys(err.response.data.errors)[0]) return err.response
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.registerProposta(data, log)
      }
      console.log(`[API Facta ERROR(4) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async getProposta(data, log) {
    try {
      log.situation = `[5]=> Aguardando liberação na esteira...`
      const response = await this.api.get(`${this.url}PropostasExternas/v1/Propostas/${data}`)
      if (response.data && !response.data.numeroOperacao) {
        await this.timeout(60000);
        await this.refreshToken(log);
        return this.getProposta(data, log)
      } else return response;
    } catch(err) {
      if (err.response && (err.response.status == 401 || err.response.status == 504)){
        await this.refreshToken(log);
        return this.getProposta(data, log);
      } else if (err.response && err.response.data && err.response.data.errors && err.response.data.errors[0] && err.response.data.errors[0].message) {
        return err.response
      } else if (err.response && err.response.data && err.response.data.errors && Object.keys(err.response.data.errors) && Object.keys(err.response.data.errors)[0]) return err.response
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getProposta(data, log)
      }
      console.log(`[API Facta ERROR(5) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return err.response;
    }
  }
  async getLink(data, log) {
    try {
      log.situation = `[6]=> Aguardando liberação do link de formalização...`
      const response = await this.api.get(`${this.url}PropostasExternas/v1/AutorizacoesDigitais/Proposta/${data}`)
      if (response.data && !response.data.linkEncurtado) {
        await this.timeout(30000);
        await this.refreshToken(log);
        return this.getLink(data, log)
      } else return response;
    } catch(err) {
      if (err.response && (err.response.status == 401 || err.response.status == 504)){
        await this.refreshToken(log);
        return this.getLink(data, log);
      } else if (err.response && err.response.data && err.response.data.errors && err.response.data.errors[0] && err.response.data.errors[0].message) {
        return err.response
      } else if (err.response && err.response.data && err.response.data.errors && Object.keys(err.response.data.errors) && Object.keys(err.response.data.errors)[0]) return err.response
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(data, log)
      }
      console.log(`[API Facta ERROR(6) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return err.response;
    }
  }
}

module.exports = Mercantil