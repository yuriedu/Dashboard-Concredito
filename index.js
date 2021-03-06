console.log(`[Dashboard] => Starting...`)
require('dotenv-safe').config();
const bodyparser = require("body-parser");
const express = require("express");
const { MSSQL, MongoDB } = require('./src/Utils/database');
const { removeSpaces } = require('./src/Utils/functions');

const { FactaFGTS } = require('./src/Controllers/Cadastros/Facta');
const { C6FGTS } = require('./src/Controllers/Cadastros/C6');
const { MercantilFGTS } = require('./src/Controllers/Cadastros/Mercantil');
const { BMGFGTS } = require('./src/Controllers/Cadastros/BMG');
const { SafraFGTS } = require('./src/Controllers/Cadastros/Safra');
const { PanFGTS, PanINSS, PanCartINSS } = require('./src/Controllers/Cadastros/Pan');
const { BanrisulINSS } = require('./src/Controllers/Cadastros/Banrisul');

var logs = []

express()
  .use(bodyparser.json())
  .use(bodyparser.urlencoded({ extended: true }))
  .engine("html", require("ejs").renderFile)
  .use(express.static(require('path').join(__dirname, '/public')))
  .set("view engine", "ejs")

  .get('/', async function(req, res) { res.render(__dirname+'/views/loading.ejs', {}); })
  .get('/logout', async function(req, res) { res.render(__dirname+'/views/main.ejs', {}); })
  .get('/login', async function(req, res) { res.render(__dirname+'/views/login.ejs', {}); })
  .get('/:loading', async function(req, res) { res.render(__dirname+'/views/loading.ejs', {}); })
  .get('/:user/:pass', async function(req, res) {
    if (!req.params.user || !req.params.pass) return res.redirect('/login')
    MongoDB.findById('db', async (error, table) => {
      table.save()
      if (table.users.findIndex(r=>r._id === req.params.user && r.password === req.params.pass) < 0) return res.redirect('/login')
      return res.render(__dirname+'/views/main.ejs', {});
    })
  })
  .get('/:url/:user/:pass', async function(req, res) {
    if (!req.params.user || !req.params.pass) return res.redirect('/login')
    MongoDB.findById('db', async (error, table) => {
      table.save()
      if (table.users.findIndex(r=>r._id === req.params.user && r.password === req.params.pass) < 0) return res.redirect('/login')
      if (req.params.url == "cadastrar" && table.users.findIndex(r=>r._id === req.params.user && r.password === req.params.pass && r.permissions.register) >= 0) return res.render(__dirname+'/views/cadastrar.ejs', {});
      return res.redirect(`/${req.params.user}/${req.params.pass}`)
    })
  })
  .get('*', async function(req, res) { return res.redirect("/") })
  .post('/login', async function(req, res) {
    try {
      if (!req.body.user || !req.body.pass) return res.status(500).send(`Usu??rio ou senha invalido...`)
      MongoDB.findById('db', async (error, table) => {
        // if (!table) { table = new MongoDB({_id: 'db'}); table.save() }; table.save()
        if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.pass) >= 0) return res.send(true)
        return res.status(500).send(`Usu??rio ou senha invalido...`)
      })
    } catch(err) {
      if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(500).send(`Erro de conex??o com o banco de dados! Tente novamente mais tarde...`)
      console.log(`[POST /login] => ${err}`)
      console.log(err)
      return res.status(500).send(`Ocorreu algum erro ao verificar o seu login!`)
    }
  })
  .post('/refresh', async function(req, res) {
    try {
      if (!req.body.user || !req.body.pass) return res.status(500).send({ redirect: '/login', text: 'Login Invalido...' })
      MongoDB.findById('db', async (error, table) => {
        if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.pass) < 0) return res.status(500).send({ redirect: '/login', text: 'Login Invalido...' })
        if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.pass && r.permissions.register) < 0) return res.status(500).send({ redirect: '/', text: 'Login Invalido...' })
        const pool = await MSSQL();
        const FGTS = await pool.request().input('orgao', 23).execute('pr_consulta_contratos_para_robo');
        const INSS = await pool.request().input('orgao', 1).execute('pr_consulta_contratos_para_robo');
        const CART = await pool.request().input('orgao', 7).execute('pr_consulta_contratos_para_robo');
        return res.send({ FGTS: FGTS.recordsets[0], INSS: INSS.recordsets[0], CART: CART.recordsets[0] })
      })
    }catch(err){
      if (err.originalError && err.originalError.code == "ETIMEOUT") return res.status(500).send(`Erro de conex??o com o banco de dados! Tente novamente mais tarde...`)
      console.log(`[POST /refresh] => ${err}`)
      console.log(err)
      return res.status(500).send(`Ocorreu algum erro ao atualizar as propostas FGTS!\nReporte ao Yuri`)
    }
  })
  .post('/cadastrar', async function(req, res) {
    try {
      if (!req.body.user || !req.body.pass || !req.body.proposta) return res.status(500).send({ redirect: '/', text: 'Informa????es necessarias faltando...' })
      if (logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato) >= 0) return res.send({ status: false, proposta: req.body.proposta, data: `Cliente j?? est?? sendo cadastrado...` })
      MongoDB.findById('db', async (error, table) => {
        if (table.users.findIndex(r=>r._id === req.body.user && r.password === req.body.pass && r.permissions.register) < 0) return res.status(500).send({ redirect: '/login', text: 'Login Invalido...' })
        const pool = await MSSQL();
        const db = {
          FGTS: await pool.request().input('orgao', 23).execute('pr_consulta_contratos_para_robo'),
          INSS: await pool.request().input('orgao', 1).execute('pr_consulta_contratos_para_robo'),
          CART: await pool.request().input('orgao', 7).execute('pr_consulta_contratos_para_robo')
        }
        var element = false
        if (db[req.body.proposta.orgaoProposta] && db[req.body.proposta.orgaoProposta].recordsets && db[req.body.proposta.orgaoProposta].recordsets[0] && db[req.body.proposta.orgaoProposta].recordsets[0].findIndex(r=> r.Cpf == req.body.proposta.Cpf && r.IdContrato == req.body.proposta.IdContrato) >= 0) element = db[req.body.proposta.orgaoProposta].recordsets[0][db[req.body.proposta.orgaoProposta].recordsets[0].findIndex(r=> r.Cpf == req.body.proposta.Cpf && r.IdContrato == req.body.proposta.IdContrato)]
        if (!element) return res.send({ status: false, proposta: req.body.proposta, data: `Proposta n??o encontrada no banco dados...` })
        var logUser = logs[logs.length] = { id: req.body.proposta.Cpf, af: req.body.proposta.IdContrato, situation: "Iniciando Cadastro..." }
        setTimeout(()=>{
          if (logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato) >= 0) logs.splice(logs.findIndex(r => r.id == req.body.proposta.Cpf && r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato), 1)
        }, 600000)
        for (var key in element) { element[key] = await removeSpaces(element[key]) }
        var response = false;
        if (element.BancoContrato == "FACTA FINANCEIRA" && req.body.proposta.orgaoProposta == "FGTS") {
          response = await FactaFGTS(element, pool, logUser);
        } else if (element.BancoContrato == "BANCO C6" && req.body.proposta.orgaoProposta == "FGTS") {
          response = await C6FGTS(element, pool, logUser);
        } else if (element.BancoContrato == "PANAMERICANO" && req.body.proposta.orgaoProposta == "FGTS") {
          response = await PanFGTS(element, pool, logUser);
        } else if (element.BancoContrato == "SAFRA" && req.body.proposta.orgaoProposta == "FGTS") {
          response = await SafraFGTS(element, pool, logUser);
        } else if (element.BancoContrato == "MERCANTIL" && req.body.proposta.orgaoProposta == "FGTS") {
          response = await MercantilFGTS(element, pool, logUser);
        } else if (element.BancoContrato == "BMG" && req.body.proposta.orgaoProposta == "FGTS") {
          response = await BMGFGTS(element, pool, logUser);
        } else if (element.BancoContrato == "PANAMERICANO" && req.body.proposta.orgaoProposta == "INSS") {
          response = await PanINSS(element, pool, logUser);
        } else if (element.BancoContrato == "FACTA FINANCEIRA" && req.body.proposta.orgaoProposta == "INSS") {
          // response = await FactaINSS(element, pool, logUser);
        } else if (element.BancoContrato == "BANRISUL" && req.body.proposta.orgaoProposta == "INSS") {
          response = await BanrisulINSS(element, pool, logUser);
        } else if (element.BancoContrato == "PANAMERICANO" && req.body.proposta.orgaoProposta == "CART") {
          response = await PanCartINSS(element, pool, logUser);
        } else {
          if (logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato) >= 0) logs.splice(logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato), 1)
          return res.send({ status: false, proposta: req.body.proposta, data: `Banco/Org??o da proposta n??o ?? cadastravel pelo Robo! Cadastre manualmente...` })
        }
        if (logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato) >= 0) logs.splice(logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato), 1)
        if (response && response.status) return res.send({ status: true, proposta: req.body.proposta, data: response.data })
        if (response && response.data) return res.send({ status: false, proposta: req.body.proposta, data: response.data })
        return res.send({ status: false, proposta: req.body.proposta, data: `Ocorreu algum erro na API desse banco! Tente novamente, se o erro persisitir reporte ao Yuri...` })
      })
    }catch(err){
      if (logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato) >= 0) logs.splice(logs.findIndex(r => r.id == req.body.proposta.Cpf && r.af == req.body.proposta.IdContrato), 1)
      if (err.originalError && err.originalError.code == "ETIMEOUT") return res.send({ status: false, proposta: req.body.proposta, data: `Ocorreu algum erro de Conex??o! Tente novamente, se o erro persisitir reporte ao Yuri...` })
      console.log(`[POST /cadastrar] => ${err}`)
      console.log(err)
      return res.send({ status: false, proposta: req.body.proposta, data: `Ocorreu algum erro no meu codigo! Tente novamente, se o erro persisitir reporte ao Yuri...` })
    }
  })
  .post('/checkSituation', async function(req, res) {
    try {
      if (!req.body.proposta || !req.body.situation) return res.status(500).send({ redirect: '/', text: 'Informa????es necessarias faltando...' })
      var situation = await checkSituation(req.body.proposta, req.body.situation)
      if (situation) {
        if (situation.notFound) return res.send({ status: false, proposta: req.body.proposta, data: `Not Found` })
        return res.send({ status: true, proposta: req.body.proposta, data: situation })
      } else return res.send({ status: 'error', proposta: req.body.proposta, data: `N??o foi possivel verificar a situa????o...` })
    }catch(err){
      if (err.originalError && err.originalError.code == "ETIMEOUT") return res.send({ status: 'error', proposta: req.body.proposta, data: `N??o foi possivel verificar a situa????o...` })
      console.log(`[POST /checkSituation] => ${err}`)
      console.log(err)
      return res.send({ status: false, proposta: req.body.proposta, data: `Ocorreu algum erro no meu codigo...` })
    }
  })
  .listen(3000, function (err) {
    if (err) return console.log(`[Dashboard] => Error Loading:\n${err}`)
    console.log(`[Dashboard] => Successfully Loaded!`)
  });

async function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function checkSituation(proposta, situation) {
  if (logs.findIndex(r => r.id == proposta.Cpf && r.af == proposta.IdContrato) >= 0) {
    if (logs[logs.findIndex(r => r.id == proposta.Cpf && r.af == proposta.IdContrato)].situation == situation) {
      await timeout(1000)
      return checkSituation(proposta, situation)
    } else return logs[logs.findIndex(r => r.id == proposta.Cpf && r.af == proposta.IdContrato)].situation
  } else return { notFound: true }
}