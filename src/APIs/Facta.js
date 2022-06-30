const axios = require('axios');
const FormData = require('form-data');

class Facta {
  constructor() {
    this.url = "https://webservice.facta.com.br"//SEM LOGIN - https://webservice-homol.facta.com.br
    this.credentials = process.env.FACTA_CREDENTIAL
    this.certificado = process.env.FACTA_CERTIFICADO
  }
  async timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async refreshToken(log) {
    try {
      log.situation = `[1]=> Conectando na API...`
      const response = await axios.get(`${this.url}/gera-token`, { headers: { Authorization: `Basic ${Buffer.from(this.credentials, 'utf-8').toString('base64')}` } });
      if (response.data && response.data.token) {
        this.token = response.data.token
        this.api = await axios.create({ baseURL: this.url, headers: { Authorization: `Bearer ${this.token}` } });
        return true;
      } else return false;
    } catch(err) {
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        return this.refreshToken(log);
      }
      if (err.response && err.response.data && err.response.data['<b>Fatal error</b>']) return false;
      console.log(`[API Facta ERROR(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=> ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async getSaldo(cpf, log) {
    try {
      log.situation = `[2]=> Consultando saldo do cliente...`
      const response = await this.api.get('/fgts/saldo', { params: { cpf: cpf } });
      if (response.data.msg && response.data.msg.includes('Tente novamente em alguns minutos')) {
        await this.refreshToken(log);
        return this.getSaldo(cpf, log)
      } else return response;
    } catch(err) {
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getSaldo(cpf, log)
      }
      if (err.response && err.response.data && err.response.data['<b>Fatal error</b>']) return false;
      console.log(`[API Facta ERROR(2) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async calcularSaldo(cpf, parcelas, tabela, taxa, log) {
    try {
      log.situation = `[3]=> Calculando saldo do cliente...`
      const response = await this.api.post('fgts/calculo', { cpf, parcelas, tabela, taxa });
      if (response.data.msg && response.data.msg.includes('Tente novamente em alguns minutos')) {
        await this.refreshToken(log);
        return this.calcularSaldo(cpf, parcelas, tabela , taxa, log)
      } else return response;
    } catch(err) {
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.calcularSaldo(cpf, parcelas, tabela, taxa, log)
      }
      if (err.response && err.response.data && err.response.data['<b>Fatal error</b>']) return false;
      console.log(`[API Facta ERROR(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async getCidadesByCidade(nomeCidade, estado, log) {
    try {
      log.situation = `[4]=> Procurando cidade do cliente no Banco...`
      const response = await this.api.get(`/proposta-combos/cidade?estado=${estado}&nome_cidade=${nomeCidade}`);
      if (response.data.msg && response.data.msg.includes('Tente novamente em alguns minutos')) {
        await this.refreshToken(log);
        return this.getCidadesByCidade(cidade, estado, log)
      }
      const cidade = response.data.cidade;
      if (!cidade) return { data: { msg: "Cidade do cliente não encontrada na Facta! Verifique e tente novamente..." } }
      if (cidade && Object.keys(cidade).length > 1) {
        let city;
        Object.keys(cidade).map(k => { if (cidade[k].nome == nomeCidade) city = { [k]: cidade[k] } });
        return city;
      } else return cidade;
    } catch(err) {
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.getCidadesByCidade(nomeCidade, estado, log)
      }
      if (err.response && err.response.data && err.response.data['<b>Fatal error</b>']) return false;
      if (err.response && err.response.data && String(err.response.data) && String(err.response.data).logEntryId) return false;
      console.log(`[API Facta ERROR(4) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async simularProposta(cpf, simulacao_fgts, data_nascimento, log) {
    try {
      log.situation = `[5]=> Simulando a proposta...`
      const form = new FormData();
      form.append('cpf', cpf);
      form.append('simulacao_fgts', simulacao_fgts);
      form.append('data_nascimento', data_nascimento);
      form.append('produto', 'D');
      form.append('tipo_operacao', '13');
      form.append('averbador', '20095');
      form.append('convenio', '3');
      form.append('login_certificado', this.certificado);
      const response = await this.api.post('/proposta/etapa1-simulador', form, { headers: form.getHeaders() });
      if (response.data.msg && response.data.msg.includes('Tente novamente em alguns minutos')) {
        await this.refreshToken(log);
        return this.simularProposta(cpf, simulacao_fgts, data_nascimento, log)
      } else return response;
    } catch(err) {
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularProposta(cpf, simulacao_fgts, data_nascimento, log)
      }
      if (err.response && err.response.data && err.response.data['<b>Fatal error</b>']) return false;
      console.log(`[API Facta ERROR(5) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async registerProposta(id_simulador, clientData, log) {
    try {
      log.situation = `[6]=> Registrando a proposta...`
      const form = new FormData();
      for (let i = 0; i < Object.entries({ id_simulador, ...clientData }).length; i += 1) { form.append(Object.entries({ id_simulador, ...clientData })[i][0], Object.entries({ id_simulador, ...clientData })[i][1]) }
      const response = await this.api.post('/proposta/etapa2-dados-pessoais', form, { headers: form.getHeaders() });
      if (response.data.msg && response.data.msg.includes('Tente novamente em alguns minutos')) {
        await this.refreshToken(log);
        return this.registerProposta(id_simulador, clientData, log)
      } else return response;
    } catch(err) {
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.registerProposta(id_simulador, clientData, log)
      }
      if (err.response && err.response.data && err.response.data['<b>Fatal error</b>']) return false;
      console.log(`[API Facta ERROR(6) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async requestProposta(id_simulador, codigo_cliente, log, tentativa) {
    try {
      log.situation = `[7]=> Finalizando a proposta...`
      if (!tentativa) tentativa = 0
      if (tentativa >= 11) return { data: { msg: `Proposta não cadastrada, provavelmente ela foi reprovada pelo banco! Verifique manualmente no banco para saber o motivo...` } }
      const form = new FormData();
      form.append('id_simulador', id_simulador);
      form.append('codigo_cliente', codigo_cliente);
      const response = await this.api.post('/proposta/etapa3-proposta-cadastro', form, { headers: form.getHeaders() });
      if (response.data.msg && response.data.msg.includes('Tente novamente em alguns minutos')) {
        await this.refreshToken(log);
        return this.requestProposta(id_simulador, codigo_cliente, log)
      } else if (!response.data.url_formalizacao || !response.data.codigo) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.requestProposta(id_simulador, codigo_cliente, log, tentativa+1)
      } else return response;
    } catch(err) {
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.requestProposta(id_simulador, codigo_cliente, log)
      }
      if (err.response && err.response.data && err.response.data['<b>Fatal error</b>']) return false;
      console.log(`[API Facta ERROR(7) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
}

module.exports = Facta