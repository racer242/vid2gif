import app from './app';
import debugLib from 'debug';
import http from 'http';

import requestStats from 'request-stats';

const debug = debugLib('your-project-name:server');

require("babel-core/register");
require("babel-polyfill");

var port = process.env.PORT;
app.set('port', port);
var server = http.createServer(app);
server.listen(port);

requestStats(server, function (stats) {
  app.registerStats(stats)
})

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
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
});

server.on('listening', () => {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log(`Listening on ${bind}`);
  debug('Listening on ' + bind);
});
