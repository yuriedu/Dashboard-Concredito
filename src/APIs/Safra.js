const axios = require('axios');

class Safra {
  constructor() {
    this.url = "https://api.safrafinanceira.com.br/apl-api-correspondente/api/v1"//SEM LOGIN - https://api-h.safrafinanceira.com.br/apl-api-correspondente/api/v1
    this.user = process.env.SAFRA_USER
    this.pass = process.env.SAFRA_PASSWORD
  }
  async timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async refreshToken(log) {
    try {
      log.situation = `[1]=> Conectando na API...`
      const response = await axios.post(`${this.url}/Token`, { "username": this.user, "password": this.pass });
      if (response.data && response.data.token) {
        this.token = response.data.token
        this.api = await axios.create({ baseURL: this.url, headers: { Authorization: `Bearer ${this.token}` } });
        return true;
      } else return false;
    } catch(err) {
      if (err.response && (err.response.status == 403 || err.response.status == 500 || err.response.status == 401 || err.response.status == 429 || err.response.status == 404)) {
        await this.timeout(60000);
        return this.refreshToken(log)
      } else if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        return this.refreshToken(log);
      }
      console.log(`[API Safra ERROR(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=> ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async getSaldo(cpf, produto, log) {
    try {
      log.situation = `[2]=> Consultando saldo do cliente...`
      const response = await this.api.get(`/Fgts?idCliente=${cpf}&tpProduto=${produto}`);
      if (response.status == 401 || response.status == 429 || response.status == 404) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getSaldo(cpf, produto, log)
      } else if (response.data && response.data.erros && response.data.erros[0] && response.data.erros[0].descricao && (response.data.erros[0].descricao.includes('Tente novamente mais tarde') || response.data.erros[0].descricao.includes('Time out de Recebimento'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getSaldo(cpf, produto, log)
      } else return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.errors) return err.response
      if (err.response && (err.response.status == 401 || err.response.status == 429 || err.response.status == 404)) {
        await this.timeout(60000);
        await this.refreshToken(log)
        return this.getSaldo(cpf, produto, log)
      } else if (err.code && err.code == 'ETIMEDOUT') {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getSaldo(cpf, produto, log)
      }
      console.log(`[API Safra ERROR(2) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async getTabelaJuros(log) {
    try {
      log.situation = `[3]=> Consultando juros da tabela...`
      const response = await this.api.get(`/TabelaJuros/FGTS`);
      if (response.status == 401 || response.status == 429 || response.status == 404) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getTabelaJuros(log)
      } else if (response.data && response.data.erros && response.data.erros[0] && response.data.erros[0].descricao && (response.data.erros[0].descricao.includes('Tente novamente mais tarde') || response.data.erros[0].descricao.includes('Time out de Recebimento'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getTabelaJuros(log)
      } else return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.errors) return err.response
      if (err.response && (err.response.status == 401 || err.response.status == 429 || err.response.status == 404)) {
        await this.timeout(60000);
        await this.refreshToken(log)
        return this.getSaldo(cpf, produto, log)
      } else if (err.code && err.code == 'ETIMEDOUT') {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getTabelaJuros(log)
      }
      console.log(`[API Safra ERROR(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async calcularProposta(idTabelaJuros, periodos, idCliente, tpProduto, log){
    try {
      log.situation = `[4]=> Calculando a proposta...`
      const response = await this.api.post(`/Calculo/FGTS`,{ idTabelaJuros, idCliente, tpProduto, periodos }); 
      if (response.status == 401 || response.status == 429 || response.status == 404) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.calcularProposta(tabela, parcelas, cpf, produto, log)
      } else if (response.data && response.data.erros && response.data.erros[0] && response.data.erros[0].descricao && (response.data.erros[0].descricao.includes('Tente novamente mais tarde') || response.data.erros[0].descricao.includes('Time out de Recebimento'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.calcularProposta(tabela, parcelas, cpf, produto, log)
      } else return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.errors) return err.response
      if (err.response && (err.response.status == 401 || err.response.status == 429 || err.response.status == 404)) {
        await this.timeout(60000);
        await this.refreshToken(log)
        return this.calcularProposta(tabela, parcelas, cpf, produto, log)
      } else if (err.code && err.code == 'ETIMEDOUT') {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.calcularProposta(tabela, parcelas, cpf, produto, log)
      }
      console.log(`[API Safra ERROR(4) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async gravarProposta(data,log) {
    try {
      log.situation = `[5]=> Calculando a proposta...`
      const response = await this.api.post(`/Propostas/Fgts`,data);
      if (response.status == 401 || response.status == 429 || response.status == 404) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.gravarProposta(data,log)
      } else if (response.data && response.data.erros && response.data.erros[0] && response.data.erros[0].descricao && (response.data.erros[0].descricao.includes('Tente novamente mais tarde') || response.data.erros[0].descricao.includes('Time out de Recebimento'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.gravarProposta(data,log)
      } else return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.errors) return err.response
      if (err.response && (err.response.status == 401 || err.response.status == 429 || err.response.status == 404)) {
        await this.timeout(60000);
        await this.refreshToken(log)
        return this.gravarProposta(data,log)
      } else if (err.code && err.code == 'ETIMEDOUT') {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.gravarProposta(data,log)
      }
      console.log(`[API Safra ERROR(5) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async getLink(idProposta, cpf, log) {
    try {
      log.situation = `[6]=> Aguardando liberação na esteira...`
      const response = await this.api.get(`/Propostas/ObterLinkFormalizacao?idProposta=${idProposta}&idCliente=${cpf}&idConvenio=50057`);
      if (response.status == 401 || response.status == 429 || response.status == 404) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(idProposta, cpf, log)
      } else if (response.data && response.data.erros && response.data.erros[0] && response.data.erros[0].descricao && (response.data.erros[0].descricao.includes('Tente novamente mais tarde') || response.data.erros[0].descricao.includes('Time out de Recebimento'))) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(idProposta, cpf, log)
      } else if (!response.data || !response.data[0] || !response.data[0].idProposta) {
        await this.timeout(60000);
        await this.refreshToken(log)
        return this.getLink(idProposta, cpf, log)
      }else return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.errors) return err.response
      if (err.response && (err.response.status == 401 || err.response.status == 429 || err.response.status == 404)) {
        await this.timeout(60000);
        await this.refreshToken(log)
        return this.getLink(idProposta, cpf, log)
      } else if (err.code && err.code == 'ETIMEDOUT') {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getLink(idProposta, cpf, log)
      }
      console.log(`[API Safra ERROR(6) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
}

module.exports = Safra