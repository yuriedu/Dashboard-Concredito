const Mercantil = require('../../APIs/Mercantil');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate } = require('../../Utils/functions');

const MercantilFGTS = async (cliente, pool, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    var client = await dadosCliente(cliente, "FGTS");
    if (client && client.status) {
      client = client.dados
      const mercantil = await new Mercantil();
      const loadAPI = await mercantil.refreshToken(log)
      if (loadAPI) {
        if (cliente.Agencia == 3880) return saveDB(pool, cliente.IdContrato, 824, '', '[2]=> Mercantil não aceita Caixa TEM...', false)
        const getSaldo = await mercantil.getSaldo(client.Cpf, log);
        if (getSaldo && getSaldo.data) {
          if (getSaldo.data.parcelas) {
            const correspondente = {
              usuarioDigitador:process.env.MERCANTIL_USUARIO,
              cpfAgenteCertificado:parseInt(process.env.MERCANTIL_CPF.replace(/\D+/g, '')),
              ufAtuacao: "RS"
              // "usuarioDigitador": process.env.MERCANTIL_USUARIO.TEST,
              // "cpfAgenteCertificado": parseInt(process.env.MERCANTIL_CPF_TEST.replace(/\D+/g, '')),
              // "ufAtuacao": "MG"
            }
            const simula = {
              cpf: parseInt(client.Cpf.replace(/\D+/g, '')),
              parcelas: [],
              correspondente
            }
            await getSaldo.data.parcelas.forEach((element,index)=>{
              if (element.valor < 9) return;
              return simula.parcelas[simula.parcelas.length] = { dataVencimento: element.dataRepasse, valor: element.valor }
            })
            const simularProposta = await mercantil.simularProposta(simula, log);
            if (simularProposta && simularProposta.data) {
              if (simularProposta.data.id && simularProposta.data.valorEmprestimo) {
                const clientData = {
                  contatos: {
                    dddCelular: parseInt(client.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(0,2)),
                    dddTeletoneResidencial: parseInt(client.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(0,2)),
                    email: client.Email,
                    numeroCelular: parseInt(client.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(2)),
                    numeroTeletoneResidencial: parseInt(client.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(2)),
                  },
                  cpf: parseInt(client.Cpf.replace(/\D+/g, '')),
                  documentoIdentificacao: {
                    dataEmissao: "2010-01-01T01:49:46.458Z",
                    numero: client.rg,
                    numeroSerie: "",
                    orgaoEmissor: "SSP",
                    tipoDocumento: "RG",
                    ufOrgaoEmissor: client.UF
                  },
                  enderecoResidencial: {
                    cep: parseInt(client.Cep.replace(/\D+/g, '')),
                    complemento: client.Complemento,
                    numero: client.EndNumero.replace(/\D+/g, '')
                  },
                  valorRenda: 5000
                };
                const liberacao = {
                  tipoContaBancaria: cliente.Poupanca ? 2 : 1, // 1 Corrente - 2 Poupança
                  banco: parseInt(bancoTranslate(client.CodBancoCliente)),
                  numeroConta: client.ContaCorrente.replace(/\D+/g, '').slice(0,-1),
                  agencia: parseInt(client.Agencia),
                  contaDigito: parseInt(client.ContaCorrente.replace(/\D+/g, '').slice(-1)),
                };
                const dados = {
                  cliente: clientData,
                  liberacao,
                  correspondente,
                  parcelas: simula.parcelas,
                  simulacaoId: simularProposta.data.id
                }
                const registerProposta = await mercantil.registerProposta(dados, log);
                if (registerProposta && registerProposta.data) {
                  if (registerProposta.data.id) {
                    const getProposta = await mercantil.getProposta(registerProposta.data.id, log);
                    if (getProposta && getProposta.data) {
                      if (getProposta.data.id && getProposta.data.numeroOperacao) {
                        const getLink = await mercantil.getLink(getProposta.data.id, log);
                        if (getLink && getLink.data) {
                          if (getLink.data.linkEncurtado) {
                            await updateContratoDB(pool, cliente.IdContrato, simularProposta.data.valorEmprestimo, cliente.ValorParcela, 'Valores do Contrato atualizados')
                            return saveDB(pool, cliente.IdContrato, 9232, getProposta.data.numeroOperacao, getLink.data.linkEncurtado, true)
                          } else {
                            if (getLink.data.errors && getLink.data.errors[0] && getLink.data.errors[0].message) return saveDB(pool, cliente.IdContrato, 824, '', `[12]=> ${getLink.data.errors[0].message}`, false)
                            if (getLink.data.errors && Object.keys(getLink.data.errors) && Object.keys(getLink.data.errors)[0]) return saveDB(pool, cliente.IdContrato, 824, '', `[8]=> ${Object.keys(getLink.data.errors)[0]}! Verifique e tente novamente...`, false)
                            console.log(`[Mercantil FGTS Error(5)]=>`)
                            console.log(getLink.data)
                            return saveDB(pool, cliente.IdContrato, 824, '', '[12]=> Ocorreu algum erro ao pegar o link da proposta! Verifique MANUALMENTE no Banco...', false)
                          }
                        } return saveDB(pool, cliente.IdContrato, 824, '', '[11]=> Ocorreu algum erro ao pegar o link da proposta! Verifique MANUALMENTE no Banco...', false)
                      } else {
                        if (getProposta.data.errors && getProposta.data.errors[0] && getProposta.data.errors[0].message) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${getProposta.data.errors[0].message}`, false)
                        if (getProposta.data.errors && Object.keys(getProposta.data.errors) && Object.keys(getProposta.data.errors)[0]) return saveDB(pool, cliente.IdContrato, 824, '', `[8]=> ${Object.keys(getProposta.data.errors)[0]}! Verifique e tente novamente...`, false)
                        console.log(`[Mercantil FGTS Error(4)]=>`)
                        console.log(getProposta.data)
                        return saveDB(pool, cliente.IdContrato, 824, '', '[10]=> Ocorreu algum erro ao pegar a proposta na esteira! Verifique MANUALMENTE no Banco...', false)
                      }
                    } return saveDB(pool, cliente.IdContrato, 824, '', '[9]=> Ocorreu algum erro ao pegar a proposta na esteira! Verifique MANUALMENTE no Banco...', false)
                  } else {
                    if (registerProposta.data.errors && registerProposta.data.errors[0] && registerProposta.data.errors[0].message) return saveDB(pool, cliente.IdContrato, 824, '', `[8]=> ${registerProposta.data.errors[0].message}`, false)
                    if (registerProposta.data.errors && Object.keys(registerProposta.data.errors) && Object.keys(registerProposta.data.errors)[0]) return saveDB(pool, cliente.IdContrato, 824, '', `[8]=> ${Object.keys(registerProposta.data.errors)[0]}! Verifique e tente novamente...`, false)
                    console.log(`[Mercantil FGTS Error(3)]=>`)
                    console.log(registerProposta.data)
                    return saveDB(pool, cliente.IdContrato, 824, '', '[8]=> Ocorreu algum erro ao registrar a proposta do cliente! Tente novamente mais tarde...', false)
                  }
                } return saveDB(pool, cliente.IdContrato, 824, '', '[7]=> Ocorreu algum erro ao registrar a proposta do cliente! Tente novamente mais tarde...', false)
              } else {
                if (simularProposta.data.errors && simularProposta.data.errors[0] && simularProposta.data.errors[0].message) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> ${simularProposta.data.errors[0].message}`, false)
                if (simularProposta.data.errors && Object.keys(simularProposta.data.errors) && Object.keys(simularProposta.data.errors)[0]) return saveDB(pool, cliente.IdContrato, 824, '', `[8]=> ${Object.keys(simularProposta.data.errors)[0]}! Verifique e tente novamente...`, false)
                console.log(`[Mercantil FGTS Error(2)]=>`)
                console.log(simularProposta.data)
                return saveDB(pool, cliente.IdContrato, 824, '', '[6]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
              }
            } else return saveDB(pool, cliente.IdContrato, 824, '', '[5]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
          } else {
            if (getSaldo.data.errors && getSaldo.data.errors[0] && getSaldo.data.errors[0].message) return saveDB(pool, cliente.IdContrato, 824, '', `[4]=> ${getSaldo.data.errors[0].message}`, false)
            if (getSaldo.data.errors && Object.keys(getSaldo.data.errors) && Object.keys(getSaldo.data.errors)[0]) return saveDB(pool, cliente.IdContrato, 824, '', `[8]=> ${Object.keys(getSaldo.data.errors)[0]}! Verifique e tente novamente...`, false)
            console.log(`[Mercantil FGTS Error(1)]=>`)
            console.log(getSaldo.data)
            return saveDB(pool, cliente.IdContrato, 824, '', '[4]=> Ocorreu algum erro ao consultar o saldo do cliente! Tente novamente mais tarde...', false)
          }
        } else return saveDB(pool, cliente.IdContrato, 824, '', '[3]=> Ocorreu algum erro ao consultar o saldo do cliente! Tente novamente mais tarde...', false)
      } else return saveDB(pool, cliente.IdContrato, 824, '', '[1]=> Problema na conexão da API! Tente novamente mais tarde...', false)
    } else return saveDB(pool, cliente.IdContrato, 824, '', client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...', false)
  } catch(err) {
    console.log(`[Mercantil FGTS ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { MercantilFGTS }