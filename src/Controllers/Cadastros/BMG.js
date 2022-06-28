const BMG = require('../../APIs/BMG');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, bantToString } = require('../../Utils/functions');

const BMGFGTS = async (cliente, pool, log, token) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    var client = await dadosCliente(cliente, "FGTS");
    if (client && client.status) {
      client = client.dados
      const bmg = await new BMG();
      const loadAPI = await bmg.refreshToken(log)
      if (loadAPI) {
        var simula = {
          "login":process.env.BMG_USER,
          "senha":process.env.BMG_PASSWORD,
          "cpfCliente":cliente.Cpf,
          "dataNascimento":cliente.Datanascimento,
          "entidade":'4262',
          "loja":'53541',
          "produto":9665,
          "qtdParcelas":cliente.Prazo,
          "sequencialOrgao":"",
          "servico":'135',
          "valorSolicitado":cliente.valorLiberado,
        }
        var simularProposta = await bmg.simularProposta(simula, log);
        if (simularProposta && simularProposta.data) {
          if (simularProposta.data.simularSaqueAniversarioFgtsResponse && simularProposta.data.simularSaqueAniversarioFgtsResponse.simularSaqueAniversarioFgtsReturn && simularProposta.data.simularSaqueAniversarioFgtsResponse.simularSaqueAniversarioFgtsReturn.valorLiberado) {
            var telefone = cliente.TelefoneConvenio.replace(cliente.TelefoneConvenio.slice(0,5), "").replace('-','')
            var register = {
              parameters: {
                simularSaqueAniversarioFgtsResponse: simularProposta.data.simularSaqueAniversarioFgtsResponse,
                login: process.env.BMG_USER,
                senha: process.env.BMG_PASSWORD,
                bancoOrdemPagamento: 0,
                agencia: {
                  numero: cliente.Agencia,
                  digitoVerificador: '' //VERIFICAR
                },
                banco: { numero: cliente.CodBancoCliente },
                cliente: {
                  celular1: {
                    ddd: cliente.TelefoneConvenio.substr(1, 2),
                    numero: `9${telefone.replace(telefone.slice(8,telefone.length),"")}`,
                  },
                  cpf: cliente.Cpf,
                  cidadeNascimento: cliente.Cidade,
                  dataNascimento: cliente.Datanascimento,
                  email: cliente.Email,
                  endereco: {
                    cep: cliente.Cep,
                    logradouro: cliente.Endereco,
                    numero: cliente.EndNumero,
                    bairro: cliente.Bairro,
                    cidade: cliente.Cidade,
                    uf: cliente.UF
                  },
                  estadoCivil: 'S',
                  grauInstrucao: '7',
                  identidade: {
                    numero: cliente.rg,
                    emissor: cliente.OrgaoEmissor,
                    tipo: "RG", 
                    uf: cliente.UF,
                    dataEmissao: cliente.DataCadastramento
                  },
                  nacionalidade: 'Brasileira',
                  nome: cliente.NomeCliente,
                  nomeConjuge: '',
                  nomeMae: cliente.NomeMae,
                  nomePai: cliente.NomePai,
                  pessoaPoliticamenteExposta: 'false',
                  sexo: cliente.sexo,
                  ufNascimento: cliente.UF,
                  telefone: {
                    ddd: "24",
                    numero: "38568676",
                    ramal: ''
                  }
                },
                codEnt: '4262',
                codigoEntidade: "4262-", 
                codigoFormaEnvioTermo: '21', // VERIFICAR
                codigoLoja: '53541',
                codigoServico: '135',
                conta: {
                  numero: cliente.ContaCorrente.split('-')[0],
                  digitoVerificador: cliente.ContaCorrente.split('-')[1],
                  tipoConta: '1'
                },
                cpf: cliente.Cpf,
                finalidadeCredito: cliente.CodBancoCliente == 318 ? 3 : cliente.Poupanca ? 2 : 1,
                formaCredito: cliente.CodBancoCliente == 318 ? 18 : 2,
                loginConsig: 'concreditogreg',
                senhaConsig: 'Facta@743',
                matricula: cliente.Cpf,
                produto: 9665,
                tipoDomicilioBancario: '1',
                valorRenda: 2000,
                valorSolicitado: simularProposta.data.simularSaqueAniversarioFgtsResponse.simularSaqueAniversarioFgtsReturn.valorLiberado,
                valorSolicitadoAntecipar: '0',
                token: token
              }
            }
            const gravarProposta = await bmg.gravarProposta(register, log);
            if (gravarProposta && gravarProposta.data) {
              if (gravarProposta.data.gravaPropostaAntecipaSaqueFgtsResponse && gravarProposta.data.gravaPropostaAntecipaSaqueFgtsResponse.gravaPropostaAntecipaSaqueFgtsReturn && gravarProposta.data.gravaPropostaAntecipaSaqueFgtsResponse.gravaPropostaAntecipaSaqueFgtsReturn.numeroPropostaGerada) {
                const getLink = await bmg.getLink(gravarProposta.data.gravaPropostaAntecipaSaqueFgtsResponse.gravaPropostaAntecipaSaqueFgtsReturn.numeroPropostaGerada, log);
                if (getLink && getLink.data) {
                  if (getLink.data.linkCompartilhado) {
                    await updateContratoDB(pool, cliente.IdContrato, simularProposta.data.simularSaqueAniversarioFgtsResponse.simularSaqueAniversarioFgtsReturn.valorLiberado, cliente.ValorParcela, 'Valores do Contrato atualizados')
                    return saveDB(pool, cliente.IdContrato, 9232, gravarProposta.data.gravaPropostaAntecipaSaqueFgtsResponse.gravaPropostaAntecipaSaqueFgtsReturn.numeroPropostaGerada, getLink.data.linkCompartilhado, true)
                  } else {
                    if (getLink.data.error && getLink.data.error.message) return saveDB(pool, cliente.IdContrato, 824, '', `[8]=> ${getLink.data.error.message.replace("java.lang.IllegalArgumentException:", "").replace("com.bmg.econsig.common.exception.ServiceException:", "")}`, false)
                    console.log(`[BMG FGTS Error(3)]=>`)
                    console.log(getLink.data)
                    return saveDB(pool, cliente.IdContrato, 824, '', '[8]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
                  }
                } else return saveDB(pool, cliente.IdContrato, 824, '', '[7]=> Ocorreu algum erro ao pegar o link de formalização da propsota! Pegue MANUALMENTE no banco...', false) 
              } else {
                if (gravarProposta.data.gravaPropostaAntecipaSaqueFgtsResponse && gravarProposta.data.gravaPropostaAntecipaSaqueFgtsResponse.error && gravarProposta.data.gravaPropostaAntecipaSaqueFgtsResponse.error.message) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> ${gravarProposta.data.gravaPropostaAntecipaSaqueFgtsResponse.error.message.replace("java.lang.IllegalArgumentException:", "").replace("com.bmg.econsig.common.exception.ServiceException:", "")}`, false)
                if (gravarProposta.data.gravaPropostaAntecipaSaqueFgtsResponse && gravarProposta.data.gravaPropostaAntecipaSaqueFgtsResponse.gravaPropostaAntecipaSaqueFgtsReturn && gravarProposta.data.gravaPropostaAntecipaSaqueFgtsResponse.gravaPropostaAntecipaSaqueFgtsReturn.mensagemDeErro) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> ${gravarProposta.data.gravaPropostaAntecipaSaqueFgtsResponse.gravaPropostaAntecipaSaqueFgtsReturn.mensagemDeErro}`, false)
                console.log(`[BMG FGTS Error(2)]=>`)
                console.log(gravarProposta.data)
                return saveDB(pool, cliente.IdContrato, 824, '', '[6]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
              }
            } else return saveDB(pool, cliente.IdContrato, 824, '', '[5]=> Ocorreu algum erro ao registrar a proposta do cliente! Tente novamente mais tarde...', false) 
          } else {
            if (simularProposta.data.simularSaqueAniversarioFgtsResponse && simularProposta.data.simularSaqueAniversarioFgtsResponse.error && simularProposta.data.simularSaqueAniversarioFgtsResponse.error.message) return saveDB(pool, cliente.IdContrato, 824, '', `[4]=> ${simularProposta.data.simularSaqueAniversarioFgtsResponse.error.message.replace("java.lang.IllegalArgumentException:", "").replace("com.bmg.econsig.common.exception.ServiceException:", "")}`, false)
            console.log(`[BMG FGTS Error(1)]=>`)
            console.log(simularProposta.data)
            return saveDB(pool, cliente.IdContrato, 824, '', '[4]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
          }
        } else return saveDB(pool, cliente.IdContrato, 824, '', '[3]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
      } else return saveDB(pool, cliente.IdContrato, 824, '', '[2]=> Problema na conexão da API! Tente novamente mais tarde...', false)
    } else return saveDB(pool, cliente.IdContrato, 824, '', client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...', false)
  } catch(err) {
    console.log(`[BMG FGTS ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { BMGFGTS }