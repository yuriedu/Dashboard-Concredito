const axios = require('axios');

class Banrisul {
  constructor() {
    this.url = "https://tecbemlabs.com.br"//https://homologa.tecbemlabs.com.br
    this.user = process.env.BANRISUL_USER//USER NÃO MUDA
    this.pass = process.env.BANRISUL_PASS
  }
  async timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async refreshToken(log) {
    try {
      log.situation = `[1]=> Conectando na API...`
      const response = await axios.post(`${this.url}/auth/Autenticacao/Autenticar`, {usuario: this.user, senha: this.pass } ,{ header: { 'Content-Type': 'application/json' } });
      if (response.data && response.data.retorno && response.data.retorno.jwtToken) {
        this.token = response.data.retorno.jwtToken
        this.api = await axios.create({ baseURL: this.url, headers: { Authorization: `Bearer ${this.token}` } });
        return true;
      } else return false;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.erros && err.response.data.erros[0] && err.response.data.erros[0].mensagem) return err.response
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        return this.refreshToken(log);
      }
      console.log(`[API Banrisul ERROR(1) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}]=> ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async ListarBancos(banco, log) {
    log.situation = `[2]=> Procurando bancos do Banrisul...`
    try {
      const response = await this.api.get(`consignado/Consignado/Proposta/ListarBancos`);
      if (response.data && response.data.retorno && response.data.retorno.findIndex(r=>r.codigo == banco) >= 0 && response.data.retorno[response.data.retorno.findIndex(r=>r.codigo == banco)].cnpj) return response.data.retorno[response.data.retorno.findIndex(r=>r.codigo == banco)].cnpj
      return false;
    } catch (err) {
      if (err.response && err.response.data && err.response.data.erros && err.response.data.erros[0] && err.response.data.erros[0].mensagem) return err.response
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.ListarBancos(banco, log)
      }
      console.log(`[API Banrisul ERROR (2)] => Erro ao Listar os Bancos: ${err}`)
      console.log(err.response ? err.response.data : err)
    }
  }
  async simularPropostaPortabilidade(data, log) {
    try {
      log.situation = `[3]=> Simulando a proposta...`
      const response = await this.api.post(`/consignado/Consignado/Simulacao/V2/SimularPropostaPortabilidade`, data);
      if (response && response.data && response.data.retorno && response.data.retorno.viabilidadeEspecial && response.data.retorno.viabilidadeEspecial.mensagem && response.data.retorno.viabilidadeEspecial.mensagem.includes('juros estar abaixo das tabelas vigentes')) {
        data.saldoDevedor = data.saldoDevedor / 1.02
        return this.simularPropostaPortabilidade(data, log)
      } else if (response && response.data && response.data.retorno && response.data.retorno.viabilidadeEspecial && response.data.retorno.viabilidadeEspecial.mensagem && response.data.retorno.viabilidadeEspecial.mensagem.includes(' juros estar acima da permitida pela conveniada')) {
        data.saldoDevedor = data.saldoDevedor * 1.02
        return this.simularPropostaPortabilidade(data, log)
      } else if (response && response.data && response.data.retorno && response.data.retorno.viabilidadeEspecial && response.data.retorno.viabilidadeEspecial.mensagem && response.data.retorno.viabilidadeEspecial.mensagem.includes('Parcela mínima portável')) {
        data.saldoDevedor = data.saldoDevedor / 1.02
        return this.simularPropostaPortabilidade(data, log)
      }
      return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.erros && err.response.data.erros[0] && err.response.data.erros[0].mensagem) return err.response
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.simularPropostaPortabilidade(data, log)
      }
      console.log(`[API Banrisul ERROR(3) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
  async gravarPropostaPortabilidade(data, log) {
    try {
      log.situation = `[4]=> Gravando a proposta...`
      const response = await this.api.post(`/consignado/Consignado/Proposta/GravarPropostaPortabilidade`, data);
      return response;
    } catch(err) {
      if (err.response && err.response.data && err.response.data.erros && err.response.data.erros[0] && err.response.data.erros[0].mensagem) return err.response
      if (err.code && (err.code == 'ETIMEDOUT')) {
        await this.timeout(5000)
        await this.refreshToken(log);
        return this.gravarPropostaPortabilidade(data, log)
      }
      console.log(`[API Banrisul ERROR(4) - ${log.af ? 'AF: '+log.af : 'CPF: '+log.cpf}] => ${err}`)
      console.log(err.response ? err.response.data : err);
      return false;
    }
  }
}

module.exports = Banrisul