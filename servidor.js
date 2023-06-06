// definim constants
const PORT = 5678;
// ---------------------------------------------------------------------------------------------------------------------
// definim variables associades als mòduls que utilitzarem
// ---------------------------------------------------------------------------------------------------------------------
var https = require('https');
var fs = require('fs');
const { count } = require('console');
var websocketServidor = require('ws').Server;
// ---------------------------------------------------------------------------------------------------------------------
//  definim les credencials i instanciem el servidor https amb elles
// ---------------------------------------------------------------------------------------------------------------------
var clauPrivada = fs.readFileSync('laclau.pem', 'utf8');
var certificat = fs.readFileSync('elcertificat.crt', 'utf8');
var credentials = { key: clauPrivada, cert: certificat };

var httpsServer = https.createServer(credentials);
// ---------------------------------------------------------------------------------------------------------------------
//  variables globals
// ---------------------------------------------------------------------------------------------------------------------
var nclients=0;          // comptarà els clients que entren
var llistaclients = [];   // és un array on guardarem els clients connectats
var nomllistaclients = [];
var vMsg;                 // és un array amb el que farem Split dels missatges que arriben
// ---------------------------------------------------------------------------------------------------------------------
//  instanciem i configurem el servidor de websockets a partir del servidor https
// ---------------------------------------------------------------------------------------------------------------------
var wss = new websocketServidor({
  server: httpsServer
});
// ---------------------------------------------------------------------------------------------------------------------
// gestió a l'establir la connexió amb un client
// ---------------------------------------------------------------------------------------------------------------------
wss.on('connection', function connection(ws, req) {
  console.log("---> S'ha connectat un client"); 
  //console.log(JSON.stringify(ws));                   // amb aquesta línia podem veure tota la informació que inclou la petició de connexió

  ws.on('message', function incoming(msg) {
      //console.log('---> Missatge rebut: '+msg);

      var missatge = msg.toString();
      vMsg=missatge.split('#');
      //XAT#missatgeenviat#Llorca
      switch (vMsg[0]) {
        case 'IMATGE' : enviarImatge(ws,vMsg[1]);break;
        case 'HELLO' : acceptarConnexio(ws,vMsg[1]);break;       // arriba un petició de connexió
        case 'XAT'   : missatgeXat(vMsg[1],ws); break;    // arriba un missatge de xat
        case 'BYE'   : desconnectar(ws); break;           // arriba una petició de desconnexió
      } 
  });

  // gestió al tancar la connexió d'un client
  ws.on('close', function close(code,reason) {
    if (llistaclients[0]==ws) {
      llistaclients.shift();  // elimina el primer element de l'array
    } else {
      if (llistaclients[llistaclients.length-1]==ws) {
        llistaclients.pop();  // elimina el darrer element de l'array
      } else {
        // busquem el client que es desconnecta a la llista de clients
        i=1;
        b=false;
        while ((i < llistaclients.length-1) && (!b)) {
          if (llistaclients[i] != ws) {
            i++;
          }
        }
        if (i < llistaclients.length-1) {
          llistaclients.splice(i,1);          // elimina l'element trobat
        }
      }
    }
    console.log("---> CONNEXIÓ TANCADA");
   });
  
  // gestió de possibles errors en la connexió
   ws.on('error', function error(err) {
    console.log("---> ERROR : "+err+" - ");
   });
});

// activem el servidor
httpsServer.listen(PORT);
console.log('---> Servidor activat (escoltant pel port '+PORT+')');
// --------------------------------------------------------------------------------------------------------------------------------------------------------
//  gestionar comiat - fem un broadcast notificant el client que ha sortit
// --------------------------------------------------------------------------------------------------------------------------------------------------------
function desconnectar(client) {
  if (nclients >= 0) {
    for (var i=0; i < llistaclients.length; i++) {
      if ((i != client) && (llistaclients[i][0] !=null) && (llistaclients[i][0] != '')) {
        resposta=JSON.stringify({tipus: 'SORTIDA', dades: 'Ha sortit : '+llistaclients[client][1]});
        console.log("---> ENVIANT : "+llistaclients[i][1]+" : "+resposta);
        llistaclients[i][0].sendUTF(resposta);
      }
    }

    //llistaclients.pop();
    llistaclients.slice(0,2);
    //nomllistaclients.pop();
    nomllistaclients.slice(0,2);  
    
  }
}
// --------------------------------------------------------------------------------------------------------------------------------------------------------
//  Acceptar la connexió d'un nou client
// --------------------------------------------------------------------------------------------------------------------------------------------------------
function acceptarConnexio(client,nomclient) {
  if(nomclient == nomllistaclients[0]){
    resposta=JSON.stringify({tipus: 'KONICKNAME', dades: 'Aquest nom ja està en ús'});
  }else{
    resposta=JSON.stringify({tipus: 'OK', dades: 'Connexió correcta'});
    llistaclients.push(client);
    //console.log(client);
    
    console.log("---> ENVIANT : "+resposta);
    llistaclients[llistaclients.length-1].send(resposta);
    
    
    nomllistaclients.push(vMsg[1]);
    enviarnomaltrepersona(client,vMsg[1]);
  }



  client.send(resposta);


  

}
// --------------------------------------------------------------------------------------------------------------------------------------------------------
//  enviament d'un missatge de xat que hem rebut d'un client --> s'envia a tots els altres clients
// --------------------------------------------------------------------------------------------------------------------------------------------------------
function missatgeXat(msg, client) {
    resposta=JSON.stringify({tipus: 'XAT', dades: msg});
    console.log("---> ENVIANT : "+resposta);
    for (i=0; i < llistaclients.length; i++) {
      if (llistaclients[i] != client) {
        llistaclients[i].send(resposta);
        //llistaclients[i].send(missatgetext);
      }
    }
}

function enviarnomaltrepersona(client, nompersona){
  
  if(nomllistaclients.length == 2){
    
    for(i=0; i < llistaclients.length; i++){
      for(y=0; y < nomllistaclients.length; y++){
        respota = JSON.stringify({tipus: 'PERSONA', dades: nomllistaclients[y]});
        //llistaclients[i].send(client);
        //llistaclients[i].send("Aqui finalistaza la respota del client i comença la del nom del client");
        llistaclients[i].send(respota);
      }
      
    }
  }  
}

function enviarImatge(client,nomfitxer){
  resposta=JSON.stringify({tipus: 'IMATGE', dades: nomfitxer});
    console.log("---> ENVIANT : "+resposta);
    for (i=0; i < llistaclients.length; i++) {
      if (llistaclients[i] != client) {
        llistaclients[i].send(resposta);
        
        
      }
    }
}
// ---