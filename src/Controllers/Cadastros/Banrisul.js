const Banrisul = require('../../APIs/Banrisul');
const { saveDB, updateContratoDB, dadosCliente, bancoTranslate, bantToString } = require('../../Utils/functions');

const BanrisulINSS = async (cliente, pool, log) => {
  try {
    log.situation = `[0]=> Verificando dados do cliente...`
    var client = await dadosCliente(cliente, "INSS");
    if (client && client.status) {
      client = client.dados
      const banrisul = await new Banrisul();
      const loadAPI = await banrisul.refreshToken(log)
      if (loadAPI) {
        var codBank = `${String(cliente.CodBancoCliente).length == 1 ? `000${cliente.CodBancoCliente}` :  String(cliente.CodBancoCliente).length == 2 ? `00${cliente.CodBancoCliente}` : String(cliente.CodBancoCliente).length == 3 ? `0${cliente.CodBancoCliente}` : cliente.CodBancoCliente }`
        var codBankPort = `${String(cliente.PortabilidadeBanco).length == 1 ? `000${cliente.PortabilidadeBanco}` :  String(cliente.PortabilidadeBanco).length == 2 ? `00${cliente.PortabilidadeBanco}` : String(cliente.PortabilidadeBanco).length == 3 ? `0${cliente.PortabilidadeBanco}` : cliente.PortabilidadeBanco }`
        var simulacao = {
          "ifOriginadora": await banrisul.ListarBancos(codBankPort, log), //CNPJ Banco
          "conveniada": "000020", //Codigo INSS (FUNÇÃO)
          "prazoRestante": cliente.PortabilidadeParcelas, //PRAZO PORTABILIDADE
          "prazoTotal": cliente.Prazo,
          "saldoDevedor": cliente.Valor, //SALDO
          "valorPrestacaoPortabilidade": cliente.PortabilidadePrestacao,
          "valorPrestacaoDesejada": cliente.ValorParcela,
          "dataNascimento": cliente.Datanascimento,
          "retornarSomenteOperacoesViaveis": true,
          "simulacaoEspecial": true,
          "planoRefin": "KEQ6", //TABELA
          "prazoRefin": cliente.Prazo,
          "valorPrestacaoRefin": cliente.ValorParcela
        }
        const simularProposta = await banrisul.simularPropostaPortabilidade(simulacao, log);
        if (simularProposta && simularProposta.data) {
          if (simularProposta.data.retorno && simularProposta.data.retorno.viabilidadeEspecial && simularProposta.data.retorno.viabilidadeEspecial.portavel && simularProposta.data.retorno.viabilidadeEspecial.valorFinanciado) {
            var proposta = {
              "cpfAgente": "03100923022", // CPF OPERADOR
              "cpf": cliente.Cpf,
              "endereco": {
                "cepResidencial": cliente.Cep,
                "enderecoResidencial": cliente.Endereco,
                "complementoEndereco": "",
                "numeroResidencial": cliente.EndNumero,
                "bairroResidencial": cliente.Bairro,
                "cidadeResidencial": cliente.Cidade,
                "ufResidencial": cliente.UF,
                "codigoLogradouro": 081 //Codigo de RUA
              },
              "telefones": {
                "ddD1": parseInt(cliente.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(0,2)),
                "telefone1": parseInt(cliente.TelefoneConvenio.split(' ')[0].replace(/\D+/g, '').slice(2)),
                "ddD2": "",
                "telefone2": ""
              },
              "dadosBasicos": {
                "nome": cliente.NomeCliente,
                "nacionalidade": "BR",
                "dataNascimento": cliente.Datanascimento,
                "ufNascimento": cliente.UF,
                "cidadeNascimento": cliente.Cidade,
                "sexo": "F",
                "nomeMae": cliente.NomeMae,
                "nomePai": cliente.NomePai,
                "email": cliente.Email,
                "codigoGrauInstrucao": 4,
                "deficienteVisual": false,
                "codigoEstadoCivil": "S",
                "codigoRegimeCasamento": null,
                "nomeConjuge": "",
                "cpfConjuge": "",
                "dataNascimentoConjuge": "",
                "sexoConjuge": "",
                "codigoTipoDocumentoIdentidade": "1",
                "numeroDocumentoIdentidade": cliente.rg,
                "codigoOrgaoEmissor": "01", // 01 SSP
                "dataEmissaoDocumentoIdentidade": "2010-06-11T00:00:00.626Z",
                "ufEmissaoDocumentoIdentidade": cliente.UF,
                "naturalidadeEstrangeiro": ""
              },
              "rendimento": {
                "matricula": cliente.BeneficioAF ? cliente.BeneficioAF : cliente.Maatricula,
                "ufRendimento": cliente.UF,
                "banco": codBank,
                "agencia": cliente.Agencia,
                "conta": cliente.ContaCorrente,
                "tipoConta": "N",
                "valorRendimento": 2000,
                "dataAdmissao": "2001-01-01T00:00:00.626Z",
                "conveniada": "000020", //000020 = INSS (Função)
                "orgao": "00001", // 00001 = INSS
                "especieINSS": cliente.EspecieAF ? cliente.EspecieAF : cliente.Especie,
                "funcaoSIAPE": 0,
                "matriculaInstituidorSIAPE": "",
                "nomeInstituidorSIAPE": "",
                "possuiProcuradorSIAPE": false
              },
              "operacao": {
                "ifOriginadora": await banrisul.ListarBancos(codBankPort, log), //CNPJ do Banco PORTABILIDADE (Função)
                "contratoPortado": cliente.PortabilidadeContrato.replace("-",""), //Numero Contrato PORTABILIDADE
                "conveniada": "000020", // 000020 = INSS (Função)
                "orgao": "00001", // 00001 = INSS
                "prazoRestante": cliente.PortabilidadeParcelas,
                "prazoTotal": '84',
                "valorPrestacaoPortabilidade": simularProposta.data.retorno.viabilidadeEspecial.prestacao ? simularProposta.data.retorno.viabilidadeEspecial.prestacao : cliente.PortabilidadePrestacao,
                "saldoDevedor": simularProposta.data.retorno.viabilidadeEspecial.saldoDevedorCorrigido ? simularProposta.data.retorno.viabilidadeEspecial.saldoDevedorCorrigido : cliente.Valor,
                "planoRefin": "KEQ6", //TABELA PORTABILIDADE
                "prazoRefin": '84',
                "valorPrestacaoRefin": simularProposta.data.retorno.viabilidadeEspecial.prestacao ? simularProposta.data.retorno.viabilidadeEspecial.prestacao : cliente.PortabilidadePrestacao,
                "valorPrestacaoDesejada": simularProposta.data.retorno.viabilidadeEspecial.prestacao ? simularProposta.data.retorno.viabilidadeEspecial.prestacao : cliente.PortabilidadePrestacao,
                "simulacaoEspecial": true,
                "aceitePortabilidadeEspecial": true,
                "possuiAssinaturaEletronica": true,
                "operacaoAgrupadaMargemNegativa": true
              },
              "recebimento": {
                "matricula": cliente.BeneficioAF ? cliente.BeneficioAF : cliente.Maatricula,
                "utilizarDadosRendimento": true,
                "banco": codBank,
                "agencia": cliente.Agencia,
                "conta": cliente.ContaCorrente,
                "tipoConta": "N",
                "formaLiberacao": 5, //ListarFormasLiberacao(cliente.Cpf, '000020', 'KEQ6', '4')
                "codigoCorreioAgencia": Number(cliente.Agencia)
              }
            }
            const gravarProposta = await banrisul.gravarPropostaPortabilidade(proposta, log);
            if (gravarProposta && gravarProposta.data) {
              if (gravarProposta.data.retorno && 
                gravarProposta.data.retorno.proposta) {
                await updateContratoDB(pool, cliente.IdContrato, simularProposta.data.retorno.viabilidadeEspecial.valorFinanciado ? simularProposta.data.retorno.viabilidadeEspecial.valorFinanciado : cliente.Valor, cliente.ValorParcela, 'Valores do Contrato atualizados')
                return saveDB(pool, cliente.IdContrato, 823, gravarProposta.data.retorno.proposta, `Proposta cadastrada, o cliente recebeu um SMS para efetuar a assinatura. Se preferir, o cliente pode chamar o banco no WhatsApp e obter o link de formalização. Link abaixo: \n https://wa.me/555140639848?text=Oi \n\n OBS: O cliente precisa entrar em contato pelo WhatsApp com o mesmo número que esta no cadastro`, true)
              } else {
                if (gravarProposta.data.erros && gravarProposta.data.erros[0] && gravarProposta.data.erros[0].mensagem) return saveDB(pool, cliente.IdContrato, 824, '', `[8]=> ${gravarProposta.data.erros[0].mensagem}`, false)
                if (simularProposta.data.retorno && simularProposta.data.retorno.viabilidadeEspecial && simularProposta.data.retorno.viabilidadeEspecial.mensagem) return saveDB(pool, cliente.IdContrato, 824, '', `[8]=> ${simularProposta.data.retorno.viabilidadeEspecial.mensagem}`, false)
                console.log(`[Banrisul INSS Error(2)]=>`)
                console.log(gravarProposta.data)
                return saveDB(pool, cliente.IdContrato, 824, '', '[7]=> Ocorreu algum erro ao gravar a proposta do cliente! Tente novamente mais tarde...', false) 
              }
            } else return saveDB(pool, cliente.IdContrato, 824, '', '[6]=> Ocorreu algum erro ao gravar a proposta do cliente! Tente novamente mais tarde...', false)
          } else {
            if (simularProposta.data.erros && simularProposta.data.erros[0] && simularProposta.data.erros[0].mensagem) return saveDB(pool, cliente.IdContrato, 824, '', `[8]=> ${simularProposta.data.erros[0].mensagem}`, false)
            if (simularProposta.data.retorno && simularProposta.data.retorno.viabilidadeEspecial && simularProposta.data.retorno.viabilidadeEspecial.mensagem) return saveDB(pool, cliente.IdContrato, 824, '', `[8]=> ${simularProposta.data.retorno.viabilidadeEspecial.mensagem}`, false)
            console.log(`[Banrisul INSS Error(1)]=>`)
            console.log(simularProposta.data)
            return saveDB(pool, cliente.IdContrato, 824, '', '[4]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
          }
        } else return saveDB(pool, cliente.IdContrato, 824, '', '[3]=> Ocorreu algum erro ao simular a proposta do cliente! Tente novamente mais tarde...', false)
      } else return saveDB(pool, cliente.IdContrato, 824, '', '[2]=> Problema na conexão da API! Tente novamente mais tarde...', false)
    } else return saveDB(pool, cliente.IdContrato, 824, '', client && client.data ? client.data : '[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...', false)
  } catch(err) {
    console.log(`[Banrisul INSS ERROR] => ${err}`)
    console.log(err)
  }
}

module.exports = { BanrisulINSS }