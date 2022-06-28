const Safra = require('../../APIs/Safra');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');

const SafraFGTS = async (cliente, pool, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    var client = await dadosCliente(cliente, "FGTS");
    if (client && client.status) {
      client = client.dados
      const safra = await new Safra();
      const loadAPI = await safra.refreshToken(log)
      if (loadAPI) {
        const getSaldo = await safra.getSaldo(client.Cpf, client.Prazo <= 5 ? 1 : 2, log)
        if (getSaldo && getSaldo.data) {
          if (getSaldo.data.periodos) {
            const parcelas = getSaldo.data.periodos.map(element => { return { dtRepasse: element.dtRepasse, valorReservado: element.valor, dataRepasse: element.dtRepasse, valorRepasse: element.valor, valorFinanciado: element.valor }})
            const tabelas = await safra.getTabelaJuros(log)
            if (tabelas && tabelas.data) {
              if (tabelas.data.find(r=> r.id == 232219)) {
                const calcularProposta = await safra.calcularProposta(tabelas.data.find(r=> r.id == 232219).id, parcelas, client.Cpf, client.Prazo <= 5 ? 1 : 2, log)
                if (calcularProposta && calcularProposta.data) {
                  if (calcularProposta.data.simulacoes && calcularProposta.data.simulacoes[0] && calcularProposta.data.simulacoes[0].valorPrincipal && calcularProposta.data.simulacoes[0].idTabelaJuros && calcularProposta.data.simulacoes[0].prazo && calcularProposta.data.simulacoes[0].valorParcela) {
                    var dados = {
                      dadosProposta: {
                        idTabelaJuros: calcularProposta.data.simulacoes[0].idTabelaJuros,
                        prazo: calcularProposta.data.simulacoes[0].prazo,
                        valorPrincipal: calcularProposta.data.simulacoes[0].valorPrincipal,
                        valorParcela: calcularProposta.data.simulacoes[0].valorParcela,
                        cpfAgenteCertificado: process.env.SAFRA_CPF,
                        tpProduto: client.Prazo <= 5 ? 1 : 2,
                        periodos: parcelas,
                      },
                      dadosPessoais: {
                        cpf: client.Cpf,
                        nomeCompleto: client.NomeCliente,
                        dataNascimento: client.Datanascimento,
                        email: client.Email,
                      },
                      contatos: [{
                        ddd: client.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(0,2),
                        telefone: client.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(2),
                        email: client.Email,
                        whatsapp: true,
                      }],
                      endereco: {
                        cep: client.Cep.replace(/\D+/g, ''),
                        logradouro: client.Endereco,
                        numero: client.EndNumero,
                        complemento: client.Complemento,
                        bairro: client.Bairro,
                        cidade: client.Cidade,
                        uf: client.UF,
                      },
                      dadosBancarios: {
                        banco: bancoTranslate(client.CodBancoCliente),
                        agencia: client.Agencia,
                        tipoConta: client.Poupanca ? 'PP' : 'CC',
                        conta: client.ContaCorrente.replace(/\D+/g, ''),
                      },
                      submeter: true
                    }
                    const gravarProposta = await safra.gravarProposta(dados, log);
                    if (gravarProposta && gravarProposta.data) {
                      if (gravarProposta.data.idProposta) {
                        const getLink = await safra.getLink(gravarProposta.data.idProposta, client.Cpf, log);
                        if (getLink && getLink.data) {
                          if (getLink.data[0] && getLink.data[0].idProposta && getLink.data[0].link) {
                            await updateContratoDB(pool, cliente.IdContrato, calcularProposta.data.simulacoes[0].valorPrincipal, cliente.ValorParcela, 'Valores do Contrato atualizados')
                            return saveDB(pool, cliente.IdContrato, 823, getLink.data[0].idProposta, getLink.data[0].link, true)
                          } else {
                            if (getLink.data.erros && getLink.data.erros[0].descricao) return saveDB(pool, cliente.IdContrato, 824, '', `[11]=> ${getLink.data.erros[0].descricao}`, false)
                            if (getLink.data.erros && getLink.data.erros.descricao) return saveDB(pool, cliente.IdContrato, 824, '', `[11]=> ${getLink.data.erros.descricao}`, false)
                            console.log(`[Safra FGTS Error(5)]=>`)
                            console.log(getLink.data)
                            return saveDB(pool, cliente.IdContrato, 824, '', '[11]=> Ocorreu algum erro ao pegar o link da proposta! Pegue MANUALMENTE no banco...', false) 
                          }
                        } else return saveDB(pool, cliente.IdContrato, 824, '', '[10]=> Ocorreu algum erro ao pegar o link da proposta! Pegue MANUALMENTE no banco...', false)
                      } else {
                        if (gravarProposta.data.erros && gravarProposta.data.erros[0].descricao) return saveDB(pool, cliente.IdContrato, 824, '', `[9]=> ${gravarProposta.data.erros[0].descricao}`, false)
                        if (gravarProposta.data.erros && gravarProposta.data.erros.descricao) return saveDB(pool, cliente.IdContrato, 824, '', `[9]=> ${gravarProposta.data.erros.descricao}`, false)
                        if (gravarProposta.data.errors && gravarProposta.data.errors['/api/v1/Propostas/Fgts'] && gravarProposta.data.errors['/api/v1/Propostas/Fgts'][0]) return saveDB(pool, cliente.IdContrato, 824, '', `[9]=> ${gravarProposta.data.errors['/api/v1/Propostas/Fgts'][0]}`, false)
                        console.log(`[Safra FGTS Error(4)]=>`)
                        console.log(gravarProposta.data)
                        return saveDB(pool, cliente.IdContrato, 824, '', '[9]=> Ocorreu algum erro ao gravar a proposta! Tente novamente mais tarde...', false) 
                      }
                    } else return saveDB(pool, cliente.IdContrato, 824, '', '[8]=> Ocorreu algum erro ao gravar a proposta! Tente novamente mais tarde...', false)
                  } else {
                    if (calcularProposta.data.erros && calcularProposta.data.erros[0].descricao) return saveDB(pool, cliente.IdContrato, 824, '', `[7]=> ${calcularProposta.data.erros[0].descricao}`, false)
                    if (calcularProposta.data.erros && calcularProposta.data.erros.descricao) return saveDB(pool, cliente.IdContrato, 824, '', `[7]=> ${calcularProposta.data.erros.descricao}`, false)
                    console.log(`[Safra FGTS Error(3)]=>`)
                    console.log(calcularProposta.data)
                    return saveDB(pool, cliente.IdContrato, 824, '', '[7]=> Ocorreu algum erro ao calcular a proposta! Tente novamente mais tarde...', false)
                  }
                } else return saveDB(pool, cliente.IdContrato, 824, '', '[6]=> Ocorreu algum erro ao calcular a proposta! Tente novamente mais tarde...', false)
              } else {
                if (tabelas.data.erros && tabelas.data.erros[0].descricao) return saveDB(pool, cliente.IdContrato, 824, '', `[5]=> ${tabelas.data.erros[0].descricao}`, false)
                if (tabelas.data.erros && tabelas.data.erros.descricao) return saveDB(pool, cliente.IdContrato, 824, '', `[5]=> ${tabelas.data.erros.descricao}`, false)
                console.log(`[Safra FGTS Error(2)]=>`)
                console.log(tabelas.data)
                return saveDB(pool, cliente.IdContrato, 824, '', '[5]=> Ocorreu algum erro ao consultar o juros da tabela! Tente novamente mais tarde...', false)
              }
            } else return saveDB(pool, cliente.IdContrato, 824, '', '[4]=> Ocorreu algum erro ao consultar o juros da tabela! Tente novamente mais tarde...', false)
          } else {
            if (getSaldo.data.erros && getSaldo.data.erros[0].descricao) return saveDB(pool, cliente.IdContrato, 824, '', `[5]=> ${getSaldo.data.erros[0].descricao}`, false)
            if (getSaldo.data.erros && getSaldo.data.erros.descricao) return saveDB(pool, cliente.IdContrato, 824, '', `[5]=> ${getSaldo.data.erros.descricao}`, false)
            console.log(`[Safra FGTS Error(1)]=>`)
            console.log(getSaldo.data)
            return saveDB(pool, cliente.IdContrato, 824, '', '[3]=> Ocorreu algum erro ao consultar o saldo do cliente! Tente novamente mais tarde...', false)
          }
        } else return saveDB(pool, cliente.IdContrato, 824, '', '[2]=> Ocorreu algum erro ao consultar o saldo do cliente! Tente novamente mais tarde...', false)
      } else return saveDB(pool, cliente.IdContrato, 824, '', '[1]=> Problema na conexão da API! Tente novamente mais tarde...', false)
    } else return saveDB(pool, cliente.IdContrato, 824, '', client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...', false)
  } catch(err) {
    console.log(`[Safra FGTS ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { SafraFGTS }