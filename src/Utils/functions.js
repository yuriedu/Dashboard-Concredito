const tradutor = {
  IdContrato: 'Codigo da AF',
  IdCliente: 'Codigo Cliente',
  Cpf: 'Cpf',
  NomeCliente: 'Nome do Cliente',
  Maatricula: 'Matricula',
  Especie: 'Espécie do Benefício',
  Datanascimento: 'Data de Nascimento',
  rg: 'RG',
  OrgaoEmissor: 'Orgão Emissor',
  EstadoCivil: 'Estado Civil',
  sexo: 'Sexo',
  CodBancoCliente: 'Codigo do Banco do Cliente',
  BancoCliente: 'Banco do Cliente',
  Agencia: 'Agencia do Cliente',
  ContaCorrente: 'Conta do Cliente',
  Poupanca: 'Poupança',
  Endereco: 'Logradouro',
  EndNumero: 'Numero do Endereço',
  Complemento: 'Complemento',
  Bairro: 'Bairro',
  Cidade: 'Cidade',
  UF: 'Estado',
  Cep: 'CEP',
  NomeMae: 'Nome da Mãe',
  NomePai: 'Nome do Pai',
  Email: 'Email',
  TelefoneConvenio: 'Telefone da Lista',
  Data: 'Data',
  Valor: 'Valor da AF',
  Tabela: 'Tabela',
  Prazo: 'Prazo',
  ValorParcela: 'Valor da Parcela',
  CodBancoContrato: 'Codigo do Banco do Contrato',
  BancoContrato: 'Banco do Contrato',
  CodAgente: 'Codigo do Agente',
  Agente: 'Nome Agente',
  PrimeiroVencimento: 'Primeira data de vencimento',
  UltimoVencimento: 'Ultima data de vencimento',
  CodFase: 'Codigo da Fase',
  Fase: 'Fase',
  NumeroContrato: 'Numero do Contrato',
  DataLiberacao: 'Data de Liberação',
  MotivoFase: 'Motivo da Fase',
  ObsMotivoFase: 'Observação de motivo da Fase',
  DataCadastramento: 'DataCadastramento',
  PendenteDocumentacao: 'Pendente de documentação',
  ObsPendenteDocumentacao: 'Observação de pensencia de documentação',
  TipoLiberacao: 'Tipo Liberação do Beneficio'
}

const { messages } = require('joi-translation-pt-br');
const Joi = require('joi');
async function dadosCliente(cliente, orgao) {
  try {
    const MoldeFGTS = Joi.object({
      IdContrato: Joi.number().required(),
      IdCliente: Joi.number().required(),
      Cpf: Joi.string().alphanum().required(),
      NomeCliente: Joi.string().max(35).required(),
      Maatricula: Joi.string().allow(null, ''),
      Especie: Joi.string().allow(null, ''),
      Datanascimento: Joi.date().cast('string').required(),
      rg: Joi.string().required(),
      OrgaoEmissor: Joi.string().allow(null, ''),
      EstadoCivil: Joi.string().allow(null, ''),
      sexo: Joi.string().required(),
      CodBancoCliente: Joi.number().required(),
      BancoCliente: Joi.string().required(),
      Agencia: Joi.string().max(4).required(),
      ContaCorrente: Joi.string().required(),
      Poupanca: Joi.boolean().required(),
      Endereco: Joi.string().required(),
      EndNumero: Joi.string().required(),
      Complemento: Joi.string().allow(null, ''),
      Bairro: Joi.string().max(35).required(),
      Cidade: Joi.string().required(),
      UF: Joi.string().max(2).required(),
      Cep: Joi.string().length(8).required(),
      NomeMae: Joi.string().max(35).pattern(/^([a-zA-Zà-úÀ-Ú ])+$/).required(),
      NomePai: Joi.string().max(35).pattern(/^([a-zA-Zà-úÀ-Ú ])+$/).required(),
      Email: Joi.string().email().allow(' '),
      TelefoneConvenio: Joi.string().required(),
      Data: Joi.date().allow(null, ''),
      Valor: Joi.number().required(),
      Tabela: Joi.string().required(),
      Prazo: Joi.number().required(),
      ValorParcela: Joi.number().allow(null, ''),
      CodBancoContrato: Joi.number().allow(null, ''),
      BancoContrato: Joi.string().required(),
      CodAgente: Joi.number().allow(null, ''),
      Agente: Joi.string().allow(null, ''),
      PrimeiroVencimento: Joi.date().allow(null, ''),
      UltimoVencimento: Joi.date().allow(null, ''),
      CodFase: Joi.number().required().allow(null, ''),
      Fase: Joi.string().allow(null, ''),
      NumeroContrato: Joi.string().allow(null, ''),
      DataLiberacao: Joi.date().allow(null, ''),
      MotivoFase: Joi.string().allow(null, ''),
      ObsMotivoFase: Joi.string().allow(null, ''),
      DataCadastramento: Joi.date().allow(null, ''),
      PendenteDocumentacao: Joi.boolean().allow(null, ''),
      ObsPendenteDocumentacao: Joi.string().allow(null, ''),
      TipoLiberacao: Joi.number().allow(null, ''),
      PortabilidadeContrato: Joi.string().allow(null, ''),
      PortabilidadeParcelas: Joi.string().allow(null, ''),
      PortabilidadePrestacao: Joi.string().allow(null, ''),
      PortabilidadeBanco: Joi.string().allow(null, ''),
      BeneficioAF: Joi.string().allow(null, ''),
      EspecieAF: Joi.string().allow(null, ''),
    })
    const MoldeINSS = Joi.object({
      IdContrato: Joi.number().required(),
      IdCliente: Joi.number().required(),
      Cpf: Joi.string().alphanum().required(),
      NomeCliente: Joi.string().max(35).required(),
      Maatricula: Joi.string().required(),
      Especie: Joi.string().required(),
      Datanascimento: Joi.date().required(),
      rg: Joi.string().required(),
      OrgaoEmissor: Joi.string().allow(null, ''),
      EstadoCivil: Joi.string().allow(null, ''),
      sexo: Joi.string().required(),
      CodBancoCliente: Joi.number().required(),
      BancoCliente: Joi.string().required(),
      Agencia: Joi.string().max(4).required(),
      ContaCorrente: Joi.string().required(),
      Poupanca: Joi.boolean().required(),
      Endereco: Joi.string().required(),
      EndNumero: Joi.string().required(),
      Complemento: Joi.string().allow(null, ''),
      Bairro: Joi.string().max(35).required(),
      Cidade: Joi.string().required(),
      UF: Joi.string().max(2).required(),
      Cep: Joi.string().length(8).required(),
      NomeMae: Joi.string().max(35).pattern(/^([a-zA-Zà-úÀ-Ú ])+$/).required(),
      NomePai: Joi.string().max(35).pattern(/^([a-zA-Zà-úÀ-Ú ])+$/).required(),
      Email: Joi.string().email().allow(' '),
      TelefoneConvenio: Joi.string().required(),
      Data: Joi.date().allow(null, ''),
      Valor: Joi.number().required(),
      Tabela: Joi.string().required(),
      Prazo: Joi.number().required(),
      ValorParcela: Joi.number().allow(null, ''),
      CodBancoContrato: Joi.number().allow(null, ''),
      BancoContrato: Joi.string().required(),
      CodAgente: Joi.number().allow(null, ''),
      Agente: Joi.string().allow(null, ''),
      PrimeiroVencimento: Joi.date().allow(null, ''),
      UltimoVencimento: Joi.date().allow(null, ''),
      CodFase: Joi.number().required().allow(null, ''),
      Fase: Joi.string().allow(null, ''),
      NumeroContrato: Joi.string().allow(null, ''),
      DataLiberacao: Joi.date().allow(null, ''),
      MotivoFase: Joi.string().allow(null, ''),
      ObsMotivoFase: Joi.string().allow(null, ''),
      DataCadastramento: Joi.date().allow(null, ''),
      PendenteDocumentacao: Joi.boolean().allow(null, ''),
      ObsPendenteDocumentacao: Joi.string().allow(null, ''),
      TipoLiberacao: Joi.number().allow(null, '1'),
      PortabilidadeContrato: Joi.string().allow(null, ''),
      PortabilidadeParcelas: Joi.number().allow(null, ''),
      PortabilidadePrestacao: Joi.number().allow(null, ''),
      PortabilidadeBanco: Joi.number().allow(null, ''),
      BeneficioAF: Joi.string().allow(null, ''),
      EspecieAF: Joi.string().allow(null, ''),
    })
    if (orgao == "FGTS") {
      return { status: true, dados: await MoldeFGTS.validateAsync(cliente, { messages }) }
    } else if (orgao == "INSS") {
      return { status: true, dados: await MoldeINSS.validateAsync(cliente, { messages }) }
    } else return { status: false, data: `[0]=> Esse orgão não é liberado no Robo!` };
  } catch(err) {
    if (err.details && err.details[0] && err.details[0].message) return { status: false, data: `[0]=> ${err.details[0].message.replace(err.details[0].context.label,`${tradutor[err.details[0].context.label] ? tradutor[err.details[0].context.label] : err.details[0].context.label}`)}` }
    console.log(`[Dados do Cliente]=> Erro ao verificar dados: ${err}`)
    return { status: false, data: `[0]=> Ocorreu algum erro ao verificar os dados! Verifique e tente novamente...` }
  }
}

const RbancoTranslate = (banco) => {
  switch (banco) {
    case 1072:
      return 756;
    case 1071:
      return 748; 
    case 394:
      return 237;
    case 29:
      return 341;
    case 626:
      return 336;
    default:
      return banco;
  }
}
const bancoTranslate = (banco) => {
  switch (banco) {
    default:
      return RbancoTranslate(banco);
  }
}
const bantToString = (banco) => {
  const b = banco.toString()
  if(b.length === 1) return `00${b}`
  if(b.length === 2) return `0${b}`
  return b
}

async function removeSpaces(value) {
  if (typeof value == "string") {
    if (value.slice(0,1) == " ") value = value.slice(1,value.length)
    if (value.slice(value.length-1, value.length) == " ") value = value.slice(0,value.length-1)
    if (value.slice(0,1) == " " || value.slice(value.length-1, value.length) == " ") return removeSpaces(value)
    return value;
  } else return value;
}

async function updateContratoDB(pool, id, contrato, parcela, text) {
  try {
    await pool.request()
      .input('id', id)
      .input('vlrContratoAtual', contrato)
      .input('vlrParcelaAtual', parcela)
      .input('texto', text)
      .execute('pr_atualiza_valor_contrato_robo')
    return true;
  } catch(err) {
    if (err.originalError && (err.originalError.code == "ETIMEOUT" || err.code == "ETIMEOUT")) return updateContratoDB(pool, id, contrato, parcela, text)
    if (err.originalError && (err.originalError.code == "EREQUEST" || err.code == "EREQUEST")) return console.log(`[MSSQL Contrato ERROR] => Algum valor está vazio! ID: ${id} - Contrato: ${contrato} - Parcela: ${parcela} - Text: ${text}`)
    console.log(`[MSSQL ERROR] => Erro no banco de dados: ${err}`)
    console.log(err)
  }
}

async function saveDB(pool, id, fase, contrato, text, status) {
  try {
    await pool.request()
      .input('id', id)
      .input('faseDestino', fase)
      .input('CodContrato', contrato)
      .input('texto', text)
      .execute('pr_atualiza_contrato_robo');
    return { status: status, data: text };
  } catch(err) {
    if (err.originalError && (err.originalError.code == "ETIMEOUT" || err.code == "ETIMEOUT")) return saveDB(pool, id, fase, contrato, text, status)
    if (err.originalError && (err.originalError.code == "EREQUEST" || err.code == "EREQUEST")) {
      console.log(`[MSSQL Save ERROR] => Algum valor está vazio! ID: ${id} - Fase: ${fase} - Contrato: ${contrato} - Text: ${text}`)
      return saveDB(pool, id, 824, '', 'Ocorreu algum erro ao salvar no banco de dados! Algum valor está vazio, reporte ao Yuri...', false)
    }
    console.log(`[MSSQL ERROR] => Erro no banco de dados: ${err}`)
    console.log(err)
  }
}
module.exports = {
  dadosCliente,
  RbancoTranslate,
  bancoTranslate,
  bantToString,
  removeSpaces,
  updateContratoDB,
  saveDB,
}