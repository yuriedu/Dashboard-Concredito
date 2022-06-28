const C6 = require('../../APIs/C6');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, bantToString } = require('../../Utils/functions');

const C6FGTS = async (cliente, pool, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    var client = await dadosCliente(cliente, "FGTS");
    if (client && client.status) {
      client = client.dados
      if(!validateBanck(bancoTranslate(cliente.CodBancoCliente), cliente.Agencia)) return saveDB(pool, cliente.IdContrato, 824, '', '[1]=> O Banco C6 não efetua pagamentos nessa Agencia/Banco!', false)
      const c6 = await new C6();
      const loadAPI = await c6.refreshToken(log)
      if (loadAPI) {
        var data = {
          tax_identifier: client.Cpf,
          federation_unit: client.UF,
          requested_amount: client.Valor,
          birth_date: client.Datanascimento.split('T')[0],
          simulation_type: client.Prazo == 10 ? 'POR_VALOR_TOTAL' : 'POR_VALOR_SOLICITADO',
          formalization_subtype:"DIGITAL_WEB",
          table_code: process.env.C6_TABLE,
          promoter_code: process.env.C6_PROMOTER
        }
        const simularProposta = await c6.simularProposta(data, log);
        if (simularProposta && simularProposta.data) {
          if (simularProposta.data.net_amount) {
            if (parseFloat(simularProposta.data.net_amount) - client.Valor > client.Valor*0.05) return saveDB(pool, cliente.IdContrato, 824, '', `[5]=> Valor simulado é mais de 5% menor que o proposto ao cliente! Altere o valor e tente novamente... Valor da simulação: ${simularProposta.data.net_amount}`, false)
            var data2 = {
              origin: {
                promoter_code: process.env.C6_PROMOTER,
                typist_code: process.env.C6_TYPIST,
                tax_identifier_of_certified_agent: process.env.C6_CERT_PRO,
              },
              table_code: process.env.C6_TABLE,
              formalization_subtype: "DIGITAL_WEB",
              requested_amount:  simularProposta.data.net_amount,
              client: {
                tax_identifier: client.Cpf,
                name: client.NomeCliente,
                nationality_code: "01",
                document_type: 'RG',
                document_number: client.rg,
                document_federation_unit: client.UF,
                document_issuance_date: '2010-01-01',
                marital_status: 'Solteiro',
                spouse_name: 'Minha Spouse',
                birth_date: client.Datanascimento.split('T')[0],
                gender: client.sexo === "M" ? 'Masculino' : 'Feminino',
                income_amount: 5000,
                mother_name: client.NomeMae,
                pep: "Nao",
                email: cliente.Email,
                mobile_phone_area_code: client.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(0,2),
                mobile_phone_number: client.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(2),
                address: {
                  street: client.Endereco,
                  number: client.EndNumero,
                  neighborhood: client.Bairro,
                  city: client.Cidade,
                  federation_unit: client.UF,
                  zip_code: client.Cep
                },
                bank_data: {
                  bank_code: bantToString(bancoTranslate(client.CodBancoCliente)),
                  agency_number: client.Agencia,
                  account_type: client.Poupanca ? 'ContaPoupancaIndividual' : 'ContaCorrenteIndividual',
                  account_number: client.ContaCorrente.replace(/\D+/g, '').slice(0,-1),
                  account_digit: client.ContaCorrente.replace(/\D+/g, '').slice(-1)
                }
              }
            }
            const registerProposta = await c6.registerProposta(data2, log);
            if (registerProposta && registerProposta.data) {
              if (registerProposta.data.proposal_number) {
                const getLink = await c6.getLink(registerProposta.data.proposal_number, log);
                if (getLink && getLink.data) {
                  if (getLink.data.url) {
                    await updateContratoDB(pool, cliente.IdContrato, simularProposta.data.net_amount, cliente.ValorParcela, 'Valores do Contrato atualizados')
                    return saveDB(pool, cliente.IdContrato, 9232, registerProposta.data.proposal_number, `${getLink.data.url}`, true)
                  } else {
                    if (getLink.data.details && getLink.data.details) return saveDB(pool, cliente.IdContrato, 824, '', `[5]=> ${getLink.data.details[0] ? getLink.data.details[0] : getLink.data.details}`, false)
                    if (getLink.data.message) return saveDB(pool, cliente.IdContrato, 824, '', `[5]=> ${getLink.data.message}`, false)
                    console.log(`[C6 FGTS Error(3)]=>`)
                    console.log(getLink.data)
                    return saveDB(pool, cliente.IdContrato, 824, '', '[7]=> Ocorreu algum erro ao pegar o link de formalização da proposta! Pegue MANUALMENTE...', false)
                  }
                } else return saveDB(pool, cliente.IdContrato, 824, '', '[8]=> Ocorreu algum erro ao pegar o link de formalização da proposta! Pegue MANUALMENTE...', false)
              } else {
                if (registerProposta.data.details && registerProposta.data.details) return saveDB(pool, cliente.IdContrato, 824, '', `[5]=> ${registerProposta.data.details[0] ? registerProposta.data.details[0] : registerProposta.data.details}`, false)
                if (registerProposta.data.message) return saveDB(pool, cliente.IdContrato, 824, '', `[5]=> ${registerProposta.data.message}`, false)
                console.log(`[C6 FGTS Error(2)]=>`)
                console.log(registerProposta.data)
                return saveDB(pool, cliente.IdContrato, 824, '', '[7]=> Ocorreu algum erro ao registrar a proposta do cliente! Tente novamente mais tarde...', false)
              }
            } else return saveDB(pool, cliente.IdContrato, 824, '', '[6]=> Ocorreu algum erro ao registrar a proposta do cliente! Tente novamente mais tarde...', false)
          } else {
            if (simularProposta.data.details && simularProposta.data.details) return saveDB(pool, cliente.IdContrato, 824, '', `[5]=> ${simularProposta.data.details[0] ? simularProposta.data.details[0] : simularProposta.data.details}`, false)
            if (simularProposta.data.message) return saveDB(pool, cliente.IdContrato, 824, '', `[5]=> ${simularProposta.data.message}`, false)
            console.log(`[C6 FGTS Error(1)]=>`)
            console.log(simularProposta.data)
            return saveDB(pool, cliente.IdContrato, 824, '', '[4]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
          }
        } else return saveDB(pool, cliente.IdContrato, 824, '', '[3]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
      } else return saveDB(pool, cliente.IdContrato, 824, '', '[2]=> Problema na conexão da API! Tente novamente mais tarde...', false)
    } else return saveDB(pool, cliente.IdContrato, 824, '', client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...', false)
  } catch(err) {
    console.log(`[C6 FGTS ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { C6FGTS }

const validateBanck = (banco, agencia) => {
  const validos = [ 756, 748, 136, 091, 001, 104, 033, 070, 341, 237, 041, 336, 41, 260 ]
  const invalid341 = [ 3750, 3728, 3929, 3925, 7320, 7160, 7802, 6176, 7526, 7615, 3738, 3737 ]
  if(validos.includes(banco)){
    switch(banco){
      case 33:
        return agencia === 77 ? false : true
      case 237:
        return invalid341.includes(agencia) ? false : true
      case 655:
        return agencia === 655 ? false : true
      case 341:
        return agencia === 500 ? false : true
      default:
        return true;
    }
  } else return false
}