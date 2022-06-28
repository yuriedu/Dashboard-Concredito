const Pan = require('../../APIs/Pan');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, bantToString } = require('../../Utils/functions');

const PanFGTS = async (cliente, pool, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    var client = await dadosCliente(cliente, "FGTS");
    if (client && client.status) {
      client = client.dados
      const pan = await new Pan();
      const loadAPI = await pan.refreshToken(log)
      if (loadAPI) {
        const data = {
          cpf_cliente: client.Cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
          codigo_promotora: process.env.PAN_PROMOTER_CODE,
          valor_solicitado: client.Valor
        };
        const simularProposta = await pan.simularProposta(data, log);
        if (simularProposta && simularProposta.data) {
          if (simularProposta.data[0] && simularProposta.data[0].condicoes_credito) {
            const tabela = simularProposta.data[0].condicoes_credito.find(element => element.codigo_tabela_financiamento == '900001')
            if (parseFloat(tabela.valor_cliente) - client.Valor > client.Valor*0.05) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Valor simulado é mais de 5% menor que o proposto ao cliente! Altere o valor e tente novamente... Valor da simulação: ${calcularSaldo.data.valor_liquido}`, false)
            if (bancoTranslate(client.CodBancoCliente) == 104) return execSQL(pool, cliente, cliente.IdContrato, 824, '', `[7]=> A API da Pan não aceita Caixa Economica Federal! Faça MANUALMENTE...`)
            const clienteDados = {
              cpf_cliente: data.cpf_cliente,
              telefones: [{
                tipo: "FONE_FISICO",
                ddd: client.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(0,2),
                numero: client.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(2),
                ramal: null
              }],
              enderecos: [{
                tipo: "FISICO",
                logradouro: client.Endereco,
                numero: client.EndNumero,
                complemento: client.Complemento,
                bairro: client.Bairro,
                cidade: client.Cidade,
                uf: client.UF,
                cep: client.Cep
              }],
              dados_bancarios: {
                numero_agencia: client.Agencia,
                numero_banco: bancoTranslate(client.CodBancoCliente),
                numero_conta: client.ContaCorrente.replace(/\D+/g, '').slice(0,-1),
                codigo_meio_liberacao: bancoTranslate(client.CodBancoCliente) === 623 ? "024" : "020",
                digito_conta: client.ContaCorrente.replace(/\D+/g, '').slice(-1),
                tipo_conta: client.Poupanca ? 'CONTA_POUPANCA_INDIVIDUAL' : "CONTA_CORRENTE_INDIVIDUAL"
              },
              data_nascimento: client.Datanascimento.split('T')[0].split('-').reverse().join('-'),
              estado_civil: "OUTROS",
              nacionalidade: "BRASILEIRA",
              nome: client.NomeCliente,
              numero_documento: client.rg,
              data_emissao_documento: "01-01-2010",
              uf_emissao_documento: client.UF,
              nome_mae: client.NomeMae,
              pessoa_politicamente_exposta: false,
              renda_valor: 1212
            }
            clienteDados.dados_bancarios.numero_banco = clienteDados.dados_bancarios.numero_banco.length == 1 ? `00${clienteDados.dados_bancarios.numero_banco}` : clienteDados.dados_bancarios.numero_banco == 2 ? `0${clienteDados.dados_bancarios.numero_banco}` : clienteDados.dados_bancarios.numero_banco
            const cond_cred = [{condicao_credito: tabela}]
            const allData = {
              cliente: clienteDados,
              codigo_digitador: process.env.PAN_CODIGO_DIGITADOR,
              codigo_filial: process.env.PAN_CODIGO_FILIAL,
              codigo_supervisor: process.env.PAN_CODIGO_SUPERVISOR,
              codigo_promotora: process.env.PAN_PROMOTER_CODE,
              cpf_usuario_certificado: process.env.PAN_CODIGO_CPF,
              operacoes_credito: cond_cred,
              NumeroExterno: "",
            }
            const registerProposta = await pan.registerProposta(allData, log);
            if (registerProposta && registerProposta.data) {
              if (registerProposta.data[0] && registerProposta.data[0].numero_proposta) {
                const getLink = await pan.getLink(client.Cpf, registerProposta.data[0].numero_proposta, log);
                if (getLink && getLink.data) {
                  if (getLink.data.linkCliente) {
                    await updateContratoDB(pool, cliente.IdContrato, tabela.valor_cliente, cliente.ValorParcela, 'Valores do Contrato atualizados')
                    return saveDB(pool, cliente.IdContrato, 9232, registerProposta.data[0].numero_proposta, getLink.data.linkCliente, true)
                  } else {
                    if (getLink.data.detalhes) return saveDB(pool, cliente.IdContrato, 824, '', `[13]=> ${getLink.data.detalhes[0] ? getLink.data.detalhes[0] : getLink.data.detalhes}`, false)
                    console.log(`[Pan FGTS Error(3)]=>`)
                    console.log(getLink.data)
                    return saveDB(pool, cliente.IdContrato, 824, '', '[12]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
                  }
                } else return saveDB(pool, cliente.IdContrato, 824, '', '[11]=> Ocorreu algum erro ao pegar o link de formalização! Pegue MANUALMENTE no banco...', false)
              } else {
                if (registerProposta.data.detalhes) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${registerProposta.data.detalhes[0] ? registerProposta.data.detalhes[0] : registerProposta.data.detalhes}`, false)
                console.log(`[Pan FGTS Error(2)]=>`)
                console.log(registerProposta.data)
                return saveDB(pool, cliente.IdContrato, 824, '', '[9]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
              }
            } else return saveDB(pool, cliente.IdContrato, 824, '', '[8]=> Ocorreu algum erro ao registrar a proposta do cliente! Tente novamente mais tarde...', false)
          } else {
            if (simularProposta.data.detalhes) return saveDB(pool, cliente.IdContrato, 824, '', `[5]=> ${simularProposta.data.detalhes[0] ? simularProposta.data.detalhes[0] : simularProposta.data.detalhes}`, false)
            console.log(`[Pan FGTS Error(1)]=>`)
            console.log(simularProposta.data)
            return saveDB(pool, cliente.IdContrato, 824, '', '[4]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
          }
        } else return saveDB(pool, cliente.IdContrato, 824, '', '[3]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
      } else return saveDB(pool, cliente.IdContrato, 824, '', '[2]=> Problema na conexão da API! Tente novamente mais tarde...', false)
    } else return saveDB(pool, cliente.IdContrato, 824, '', client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...', false)
  } catch(err) {
    console.log(`[Pan FGTS ERROR] => ${err}`)
    console.log(err)
  }
}

const PanINSS = async (cliente, pool, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    var client = await dadosCliente(cliente, "INSS");
    if (client && client.status) {
      client = client.dados
      const pan = await new Pan();
      const loadAPI = await pan.refreshToken(log)
      if (loadAPI) {
        const clienteData = {
          cpf: client.Cpf,
          matricula_preferencial: client.Maatricula,
          matricula_complementar: client.Maatricula,
          data_nascimento: client.Datanascimento.toISOString().split('T')[0].split('-').reverse().join('-'),
          renda_mensal: 5000
        }
        var data = {
          cliente: clienteData,
          codigo_filial: process.env.PAN_CODIGO_FILIAL,
          codigo_supervisor: process.env.PAN_CODIGO_SUPERVISOR,
          codigo_promotora: process.env.PAN_PROMOTER_CODE,
          codigo_digitador: process.env.PAN_CODIGO_DIGITADOR,
          codigo_convenio: "007000",
          valor: client.ValorParcela,
          metodo: "PARCELA",
          prazo: client.Prazo,
          incluir_seguro: false,
          tipo_operacao: "MARGEM_LIVRE"
        }
        const simularProposta = await pan.simularPropostaINSS(data, log);
        if (simularProposta && simularProposta.data) {
          if (simularProposta.data[0] && simularProposta.data[0].condicoes_credito && simularProposta.data[0].prazos_permitidos) {
            if(!simularProposta.data[0].prazos_permitidos.includes(client.Prazo)) return saveDB(pool, cliente.IdContrato, 824, '', `[6]=> Prazo do contrato não se encontra disponivel para o cliente. Prazos disponiveis: ${simularProposta.data[0].prazos_permitidos}`, false)
            var tabela = simularProposta.data[0].condicoes_credito.find(element => element.codigo_tabela_financiamento === "701434")
            if (client.Especie == 32 || client.Especie == 92) {
              tabela = simularProposta.data[0].condicoes_credito.find(element => element.codigo_tabela_financiamento === "703195")
            } else if (client.Especie == 88) tabela = simularProposta.data[0].condicoes_credito.find(element => element.codigo_tabela_financiamento === "703627")


            if (parseFloat(tabela.valor_cliente) - client.Valor > client.Valor*0.05) return saveDB(pool, cliente.IdContrato, 824, '', `[8]=> Valor simulado é mais de 5% menor que o proposto ao cliente! Altere o valor e tente novamente... Valor da simulação: ${calcularSaldo.data.valor_liquido}`, false)
            if (bancoTranslate(client.CodBancoCliente) == 104) return saveDB(pool, cliente.IdContrato, 824, '', `[9]=> A API da Pan não aceita Caixa Economica Federal! Faça MANUALMENTE`, false)
            const dsdos_bancarios = [{
              codigo_operacao:  client.Poupanca ? '013' : '001',
              numero_agencia: client.Agencia,
              numero_banco: bancoTranslate(client.CodBancoCliente),
              numero_conta: client.ContaCorrente.replace(/\D+/g, '').slice(0,-1),
              digito_conta: client.ContaCorrente.replace(/\D+/g, '').slice(-1),
              tipo_conta: client.Poupanca ? "CONTA_POUPANCA_INDIVIDUAL" : "CONTA_CORRENTE_INDIVIDUAL" 
            },{
              numero_agencia: client.Agencia,
              numero_banco: bancoTranslate(client.CodBancoCliente),
              numero_conta: client.ContaCorrente.replace(/\D+/g, '').slice(0,-1),
              digito_conta: client.ContaCorrente.replace(/\D+/g, '').slice(-1),
              tipo_conta: client.Poupanca ? "CONTA_POUPANCA_INDIVIDUAL" : "CONTA_CORRENTE_INDIVIDUAL" 
            }]
            const clienteProposta = {
              codigo_tipo_beneficio: client.Especie,
              cpf: client.Cpf,
              dados_bancarios:[bancoTranslate(client.CodBancoCliente) === 104 ? dsdos_bancarios[0]: dsdos_bancarios[1]],
              data_emissao_documento: "01-01-2010",
              data_nascimento: client.Datanascimento.toISOString().split('T')[0].split('-').reverse().join('-'),
              enderecos: [{
                bairro: client.Bairro,
                cep: client.Cep,
                cidade: client.Cidade,
                numero: client.EndNumero,
                logradouro: client.Endereco,
                tipo: "FISICO",
                uf: client.UF
              }],
              estado_civil: "OUTROS",
              matricula_preferencial: client.Maatricula,
              nacionalidade: "BRASILEIRA",
              nome: client.NomeCliente,
              numero_documento: client.rg,
              pessoa_politicamente_exposta: false,
              renda_valor: 5000
            }
            const cond_credit = removeProperties(tabela, ['sucesso', 'mensagem_erro', 'descricao_tabela_financiamento', 'descricao_produto', 'despesas', 'refinanciamentos'])
            const op_credit = {
              condicao_credito: cond_credit,
              tipo_operacao: "MARGEM_LIVRE"
            }
            const registerData = {
              cliente: clienteProposta,
              codigo_usuario: process.env.PAN_USER_CODE,
              codigo_convenio: "007000",
              codigo_filial: process.env.PAN_CODIGO_FILIAL,
              codigo_meio_liberacao: "100",
              codigo_orgao: isAprosentadoria(client.Especie) ? "000501" : "000502",
              codigo_promotora: process.env.PAN_PROMOTER_CODE,
              codigo_digitador: process.env.PAN_CODIGO_DIGITADOR,
              codigo_supervisor: process.env.PAN_CODIGO_SUPERVISOR,
              cpf_usuario_certificado: process.env.PAN_CODIGO_CPF,
              operacoes_credito: [op_credit],
              tipo_formalizacao: "DIGITAL"
            }
            const registerProposta = await pan.registerPropostaINSS(registerData, log);
            if (registerProposta && registerProposta.data) {
              if (registerProposta.data[0] && registerProposta.data[0].numero_proposta) {
                const getLink = await pan.getLink(client.Cpf, registerProposta.data[0].numero_proposta, log);
                if (getLink && getLink.data) {
                  if (getLink.data.linkCliente) {
                    await updateContratoDB(pool, cliente.IdContrato, tabela.valor_cliente, cliente.ValorParcela, 'Valores do Contrato atualizados')
                    return saveDB(pool, cliente.IdContrato, 823, registerProposta.data[0].numero_proposta, getLink.data.linkCliente, true)
                  } else {
                    if (getLink.data.detalhes) return saveDB(pool, cliente.IdContrato, 824, '', `[13]=> ${getLink.data.detalhes[0] ? getLink.data.detalhes[0] : getLink.data.detalhes}`, false)
                    console.log(`[Pan INSS Error(3)]=>`)
                    console.log(getLink.data)
                    return saveDB(pool, cliente.IdContrato, 824, '', '[12]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
                  }
                } else return saveDB(pool, cliente.IdContrato, 824, '', '[11]=> Ocorreu algum erro ao pegar o link de formalização! Pegue MANUALMENTE no banco...', false)
              } else {
                if (registerProposta.data.detalhes) return saveDB(pool, cliente.IdContrato, 824, '', `[10]=> ${registerProposta.data.detalhes[0] ? registerProposta.data.detalhes[0] : registerProposta.data.detalhes}`, false)
                console.log(`[Pan INSS Error(2)]=>`)
                console.log(registerProposta.data)
                return saveDB(pool, cliente.IdContrato, 824, '', '[10]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
              }
            } else return saveDB(pool, cliente.IdContrato, 824, '', '[8]=> Ocorreu algum erro ao registrar a proposta do cliente! Tente novamente mais tarde...', false)
          } else {
            if (simularProposta.data.detalhes) return saveDB(pool, cliente.IdContrato, 824, '', `[5]=> ${simularProposta.data.detalhes[0] ? simularProposta.data.detalhes[0] : simularProposta.data.detalhes}`, false)
            console.log(`[Pan INSS Error(1)]=>`)
            console.log(simularProposta.data)
            return saveDB(pool, cliente.IdContrato, 824, '', '[4]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
          }
        } else return saveDB(pool, cliente.IdContrato, 824, '', '[3]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
      } else return saveDB(pool, cliente.IdContrato, 824, '', '[2]=> Problema na conexão da API! Tente novamente mais tarde...', false)
    } else return saveDB(pool, cliente.IdContrato, 824, '', client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...', false)
  } catch(err) {
    console.log(`[Pan INSS ERROR] => ${err}`)
    console.log(err)
  }
}

const PanCartINSS = async (cliente, pool, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    var client = await dadosCliente(cliente, "INSS");
    if (client && client.status) {
      client = client.dados
      const pan = await new Pan();
      const loadAPI = await pan.refreshToken(log)
      if (loadAPI) {
        const cartaos = [{
          codigo_tabela: "888700",
          deseja_saque: true,
          valor_saque: client.Valor
        },{
          codigo_tabela: "888700",
          deseja_saque: false,
        }]
        const telefones = [{
          tipo: "FONE_FISICO",
          ddd: client.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(0,2),
          numero: client.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(2),
          telefone: client.TelefoneConvenio.split(' ')[0].replace(/\D+/g, ''),
          ramal: null
        }]
        const enderecos = [{
          tipo: "FISICO",
          logradouro: client.Endereco,
          numero: client.EndNumero,
          complemento: client.Complemento,
          bairro: client.Bairro,
          cidade: client.Cidade,
          uf: client.UF,
          cep: client.Cep
        }]
        const dsdos_bancarios = [{
          conta_para_recebimento: true,
          codigo_operacao:  client.Poupanca? '013' : '001',
          numero_agencia: client.Agencia,
          numero_banco: bancoTranslate(client.CodBancoCliente),
          numero_conta: client.ContaCorrente.replace(/\D+/g, '').slice(0,-1),
          digito_conta: client.ContaCorrente.replace(/\D+/g, '').slice(-1),
          tipo_conta: client.Poupanca? "CONTA_POUPANCA_INDIVIDUAL" : "CONTA_CORRENTE_INDIVIDUAL",
          cartao_magnetico: client.TipoLiberacao === "" ? true : false
        },{
          conta_para_recebimento: true,
          numero_agencia: client.Agencia,
          numero_banco: bancoTranslate(client.CodBancoCliente),
          numero_conta: client.ContaCorrente.replace(/\D+/g, '').slice(0,-1),
          digito_conta: client.ContaCorrente.replace(/\D+/g, '').slice(-1),
          tipo_conta: client.Poupanca? "CONTA_POUPANCA_INDIVIDUAL" : "CONTA_CORRENTE_INDIVIDUAL",
          cartao_magnetico: client.TipoLiberacao === "" ? true : false
        }]
        const clienteData = {
          cpf: client.Cpf,
          nome_mae: client.NomeMae,
          nome_pai: client.NomePai,
          email: client.Email,
          receber_fatura_email: true,
          sexo: client.sexo === "M" ?"MASCULINO" : "FEMININO" ,
          telefones,
          enderecos,
          dados_bancarios:[bancoTranslate(client.CodBancoCliente) === 104 ? dsdos_bancarios[0]: dsdos_bancarios[1]],
          data_emissao_documento: "01-01-2010",
          data_nascimento: client.Datanascimento.toISOString().split('T')[0].split('-').reverse().join('-'),
          estado_civil: "SOLTEIRO",
          tipo_documento: "RG",
          matricula_preferencial: client.Maatricula,
          nacionalidade: "BRASILEIRA",
          nome: client.NomeCliente,
          numero_documento: client.rg,
          pessoa_politicamente_exposta: false,
          renda_valor: 1212,
          uf_beneficio: client.UF,
          uf_emissao_documento: client.UF,
          codigo_tipo_beneficio: client.Especie,
          uf_naturalidade: client.UF
        }
        const registerData = {
          cartao: client.Tabela === "CARTAO SEM SAQUE" ? cartaos[1]:cartaos[0],
          cliente: clienteData,
          codigo_usuario: process.env.PAN_USER_CODE,
          codigo_meio_liberacao: "100",
          codigo_orgao: isAprosentadoria(client.Especie) ? "000501" : "000502",
          cpf_usuario_certificado: process.env.PAN_CODIGO_CPF,
          codigo_filial: process.env.PAN_CODIGO_FILIAL,
          codigo_lotacao: "0001",
          codigo_secretaria: "001",
          codigo_supervisor: process.env.PAN_CODIGO_SUPERVISOR,
          codigo_promotora: process.env.PAN_PROMOTER_CODE,
          codigo_digitador: process.env.PAN_CODIGO_DIGITADOR,
          codigo_convenio: "007000",
          nome_operador: "Willian Conzatti",
          operacoes_credito: [{ tipo_operacao: "PROPOSTA_CARTAO" }],
          tipo_formalizacao: "DIGITAL"
        }
        const registerProposta = await pan.registerPropostaINSS(registerData, log);
        if (registerProposta && registerProposta.data) {
          if (registerProposta.data[0] && registerProposta.data[0].numero_proposta) {
            const getLink = await pan.getLink(client.Cpf, registerProposta.data[0].numero_proposta, log);
            if (getLink && getLink.data) {
              if (getLink.data.linkCliente) {
                return saveDB(pool, cliente.IdContrato, 823, registerProposta.data[0].numero_proposta, getLink.data.linkCliente, true)
              } else {
                if (getLink.data.detalhes) return saveDB(pool, cliente.IdContrato, 824, '', `[7]=> ${getLink.data.detalhes[0] ? getLink.data.detalhes[0] : getLink.data.detalhes}`, false)
                console.log(`[Pan CartINSS Error(3)]=>`)
                console.log(getLink.data)
                return saveDB(pool, cliente.IdContrato, 824, '', '[6]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
              }
            } else return saveDB(pool, cliente.IdContrato, 824, '', '[5]=> Ocorreu algum erro ao pegar o link de formalização! Pegue MANUALMENTE no banco...', false)
          } else {
            if (registerProposta.data.detalhes) return saveDB(pool, cliente.IdContrato, 824, '', `[4]=> ${registerProposta.data.detalhes[0] ? registerProposta.data.detalhes[0] : registerProposta.data.detalhes}`, false)
            console.log(`[Pan CartINSS Error(2)]=>`)
            console.log(registerProposta.data)
            return saveDB(pool, cliente.IdContrato, 824, '', '[3]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
          }
        } else return saveDB(pool, cliente.IdContrato, 824, '', '[2]=> Ocorreu algum erro ao registrar a proposta do cliente! Tente novamente mais tarde...', false)
      } else return saveDB(pool, cliente.IdContrato, 824, '', '[1]=> Problema na conexão da API! Tente novamente mais tarde...', false)
    } else return saveDB(pool, cliente.IdContrato, 824, '', client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...', false)
  } catch(err) {
    console.log(`[Pan CartINSS ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { PanFGTS, PanINSS, PanCartINSS }

const removeProperties = (object, propertyList) => Object.keys(object).reduce((cleanObject, key) => {
  if (!propertyList.includes(key)) {
    cleanObject[key] = object[key];
  }
  return cleanObject;
}, {});

const isAprosentadoria = especie => {
  const is = ['07', '08', '41', '52','78','81','04','06','32','33','34','51','83','42','43','44','45','46','49','57','72','82','05','92','37','38','58']
  return (is.includes(especie))
}