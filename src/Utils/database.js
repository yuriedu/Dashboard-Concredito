const mssql = require('mssql');
const MSSQL = async () => {
  return await mssql.connect({
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_NAME,
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    options: { encrypt: true, enableArithAbort: true, trustServerCertificate: true }
  });
}

const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://concredito:concredito4334@concredito.3kmub.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, error => {
  if (error) {
    console.log(`[Dashboard] => Erro MongoDB: ${error}`);
    return process.exit(1);
  }
  return console.log(`[Dashboard] => MongoDB Connected!`);
});

var userSchema = new mongoose.Schema({
  _id: String,
  password: String,
  permissions: {
    administrator: Boolean,
    register: Boolean,
    simulation: Boolean,
    lotes: Boolean,
  },
  counts: {
    register: Number,
  }
})
  var mongoSchema = new mongoose.Schema({
  _id: String,
  users: [userSchema],
})

module.exports = { MSSQL, MongoDB: mongoose.model('db', mongoSchema)  }