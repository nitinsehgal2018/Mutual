require('dotenv').config() ;
const express = require('express');
const http = require('http');
const path = require('path');
const cluster = require('cluster');
const debug = require('debug')('liberty_Mutual:server');
BaseURL = "https://lmelg-api.mobileprogramming.net" ;
global.__basedir = __dirname + "/..";
const connection = require('./db.js');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const helmet = require('helmet')

const app = express();
app.use(express.static(path.join(__dirname, 'images')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '10kb' }));
app.use(helmet());
app.use(helmet.noSniff());    // set X-Content-Type-Options header
app.use(helmet.frameguard()); // set X-Frame-Options header
app.use(helmet.xssFilter()); // set X-XSS-Protection header

app.use( (request, response, next) => {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,authorization");
    response.header("X-Content-Type-Options", "nosniff");
    response.header("X-XSS-Protection", "1; mode=block");
    // if (request.header('x-forwarded-proto') !== 'https') {
    //     console.log(`https://${request.header('host')}${request.url}`)
    //     response.redirect(`https://${request.header('host')}${request.url}`);       
    // }  else {
    //     next();
    // }
    next();
    
});


const adminRoutes = require('./app/routes/adminroutes');
const userRoutes = require('./app/routes/usersroutes');
const expressValidator = require('express-validator');

app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(expressValidator());

//custom validation middleware
app.use((error,req,res,next)=>{
    console.log(error);
    let status = error.statusCode;
    let message = error.message;
    res.status(status).json({errorMessage:message});
});
    
app.get('/test', async (req,res,next)=>{
    res.send('<h2>Direct access not allowed!!!</h2>'); 
});


port = process.env.PORT || 1042;
const httpServer = http.createServer(app);
// const httpsServer = https.createServer({
//     key: fs.readFileSync('/etc/letsencrypt/live/my_api_url/privkey.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/my_api_url/fullchain.pem'),
//   }, app);


if(cluster.isMaster) {
    var numWorkers = require('os').cpus().length;  
    console.log('Master cluster setting up ' + numWorkers + ' workers...');
  
    for(var i = 0; i < numWorkers; i++) {
        cluster.fork();
    }
  
    cluster.on('online', function(worker) {
        console.log('Worker ' + worker.process.pid + ' is online');
    });
  
    cluster.on('exit', function(worker, code, signal) {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
    });
} else {
    httpServer.listen(port, () => {
        console.log(`HTTP Server running on port ${port}`);
    });
    httpServer.on('error', onError);
    httpServer.on('listening', onListening);  
    // console.log('Process ' + process.pid + ' is listening to all incoming requests');
  
}

function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }  
    let bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;
  
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

function onListening() {
    let addr = httpServer.address();
    let bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug('Listening on ' + bind);
  }
  