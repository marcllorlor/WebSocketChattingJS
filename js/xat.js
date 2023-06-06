var websocket;
var hihaerror=false;
var Nickname = null;

var nomusuaris = [];
var contadorpersones = 0;

// Click del botó Connectar
function connectar() {

    servidor = document.getElementById("servidor");
    Nickname = document.getElementById("nickName");
    
    contadorpersones++;
    // validem les dades del servidor
    if (servidor.value == '' || Nickname.value == '') {
        missatge("No has introduït totes les dades de servidor",'KO');
    } else {
        if (servidor.value.toLowerCase().indexOf('wss://') != 0) {
            missatge("La direcció del servidor ha de començar per wss://",'KO');
        } else {   
            
            
            
            hihaerror=false;     
            clearMissatge();            // netegem el lloc on es mostren els missatges d'error que ens retorna el servidor
            iconaWait(true);            // mostrem el gif del wait mentre es fa la connexió amb el websocket del servidor
            websocket = new WebSocket(servidor.value);                  // creem el websocket
            websocket.onopen = function (evt) { onOpen(evt) };          // gestionem l'obertura del websocket
            websocket.onclose = function (evt) { onClose(evt) };        // gestionem el tancament de la connexió amb el websocket (desconnectar)
            websocket.onmessage = function (evt) { onMessage(evt) };    // gestionem els missatges que arriben a través del socket
            websocket.onerror = function (evt) { onError(evt) };        // gestionem els errors de connexió amb el websocket
            NicknamePlacer = document.getElementById("NickNamePanell");
            NicknamePlacer.innerHTML = Nickname.value;
        }
    }
}

// Click del botó Desconnectar
function desconnectar() {
    enviarComiat();
    websocket.close();
}

// netegem el lloc on es mostren els missatges d'error que ens retorna el servidor
function clearMissatge() {
    msgerr = document.getElementById("msgerr");
    msgerr.innerHTML = '';
    if (msgerr.classList.contains('alert-danger')) {
        msgerr.classList.remove("alert-danger");
    }
    if (msgerr.classList.contains('alert-success')) {
        msgerr.classList.remove("alert-success");
    }
    msgerr.style.visibility="hidden";
}

// mostrem el gif del wait mentre es fa la connexió amb el websocket del servidor
function iconaWait(mostrar) {
    msgerr = document.getElementById('msgerr');
    if (mostrar) {
        msgerr.innerHTML='<img class="img-fluid" src="./img/wait.gif" />';
        msgerr.style.visibility="visible";
    } else {
        msgerr.innerHTML = '';
        msgerr.style.visibility='hidden';
    }
}

// gestionem l'obertura del websocket
function onOpen(evt) {
    btConnectar = document.getElementById("btConnectar");
    btDesconnectar = document.getElementById("btDesconnectar");
    formulari = document.getElementById("formulari");

    btConnectar.style.visibility='hidden';
    btConnectar.style.height='0px';
    btDesconnectar.style.visibility='visible';
    btDesconnectar.style.height='';
    formulari.style.visibility='visible';
    formulari.style.height='';
    iconaWait(false);
    enviarPeticioConnexio();
}

// gestionem el tancament de la connexió amb el websocket (desconnectar)
function onClose(evt) {
    btConnectar = document.getElementById("btConnectar");
    btDesconnectar = document.getElementById("btDesconnectar");

    btDesconnectar.style.visibility='hidden';
    btDesconnectar.style.height='0px';
    btConnectar.style.visibility='visible';
    btConnectar.style.height='';
    formulari.style.visibility='hidden';
    formulari.style.height='0px';

    if (!hihaerror) {
        clearMissatge();
    }
}

// gestionem els missatges que arriben a través del socket
function onMessage(evt) {
    
    console.log("Ha arribat missatge : "+JSON.stringify(evt.data));
    if (evt.data != null) {
        
        switch (JSON.parse(evt.data).tipus) {
            case 'IMATGE'  : inseririmatgeremot(JSON.parse(evt.data).dades);break;
            case 'PERSONA' : canviarnomremot(JSON.parse(evt.data).dades);break;
            case 'XAT'     : missatgeXat(JSON.parse(evt.data).dades);
                             break;
            case 'OK'      : missatge(JSON.parse(evt.data).dades,'OK');
                             break;
            case 'KONICKNAME' : missatge(JSON.parse(evt.data).dades,'KO');
                                funcioNicknameCopiat();
                             break;
            default        : break;
        }
    }
}

// gestionem els errors de connexió amb el websocket
function onError(evt) {
    hihaerror=true;
    missatge('Error al connectar-se al servidor','KO');
}

// enviem un missatge de HELLO al servidor
function enviarPeticioConnexio() {
    msg='HELLO#' + Nickname.value;
    websocket.send(msg);    
}

// mostrem el missatge de connexió o error que ens ha retornat el servidor al fer la petició de connexió
function missatge(msg, tipus) {
    msgerr = document.getElementById("msgerr");
    msgerr.innerHTML=msg;  
    switch (tipus) {
        case 'KO' : msgerr.classList.add("alert-danger"); break;
        case 'OK' : msgerr.classList.add("alert-success"); break;
    }
    msgerr.style.visibility="visible";
}

// enviem un missatge de BYE al servidor
function enviarComiat() {
    msg='BYE';
    websocket.send(msg);    
}

// enviem al servidor el missatge introduir per l'usuari a la pàgina web
//Aquesta es la funcio que s'executa quan apretem el boto de acceptar
function enviar() {
    missatge = document.getElementById("missatge");
    tipus='XAT';
    msg=tipus+"#"+missatge.value+'#'+Nickname.value;  //XAT#missatgeenviat#Llorca
    websocket.send(msg);       //Aquest es el missatge que senvia per el cmd
    inserirTextLocal(missatge.value);
}

// afegim a la sala de xat el text que s'acaba d'enviar a la sala de xat
// ho fem en blau i aliniat a l'esquerra
function inserirTextLocal(msg) {
    divxat = document.getElementById("divxatlocal");

    nouParagraf=document.createElement('p');
    nouParagraf.setAttribute("style", "color : blue;");
    nouParagraf.innerHTML=msg;
    divxat.appendChild(nouParagraf);
    //Per fer la comprovacio de que en veritat puc posar merdes a la dreta //missatgeXat(msg);
}

// afegim a la sala de xat el text que hem rebut del servidor enviat per un altre usuari del xat
// ho fem en vermell i aliniat a la dreta
function missatgeXat(dades) {
    divxat = document.getElementById("divxatremot");

    nouParagraf=document.createElement('p');
    nouParagraf.setAttribute("style", "color : red; text-align: right;");
    nouParagraf.innerHTML=dades;
    divxat.appendChild(nouParagraf);
}

function canviarnomremot(nompersonaexterna){
    Nicknamepanell = document.getElementById("NickNamePanell");
    if(Nicknamepanell.innerHTML != nompersonaexterna){
         NicknamePlacerRemot = document.getElementById("NickNamePanellRemot");
         NicknamePlacerRemot.innerHTML = nompersonaexterna;
    }
}

function enviarImatge() {    
    imatge = document.getElementById("fitxerimatge");
    console.log(imatge.files);   //Amb aquesta comanda veurem els fitxers que ens ha enviat, si es 0 no hi hauran fitxers, si és 1, hi haura un fitxer
    //Ara haurem de fer un count de les imatges que li passen per el fitxer
    if (imatge.files.length == 0) {
        //Cridar a la funcio de error per que mostri l'error de que no hi ha imatges
        missatgeerrorimatge();
    }else if(imatge.files.length == 1){
        tipus='IMATGE';
        msg=tipus+"#"+imatge.files.item(0).name+'#'+Nickname.value;
        
        websocket.send(msg);       //Aquest es el missatge que senvia per el cmd
        
        inserirImatgeLocal(imatge.files.item(0).name);
        
    }
    
    
}

function missatgeerrorimatge(){
    hihaerror=true;
    missatge('ERROR! Tria una imatge per enviar!!!!!','KO');
}

function inserirImatgeLocal(img) {
    divxat = document.getElementById("divxatlocal");

    nouParagraf=document.createElement('img');
    nouParagraf.setAttribute('src' , "./img/" + img);
    nouParagraf.setAttribute('height' , "120px");
    nouParagraf.setAttribute('width' , "120px");
    divxat.appendChild(nouParagraf);

    //divxat.Value
    //Per fer la comprovacio de que en veritat puc posar merdes a la dreta //missatgeXat(msg);
}

function inseririmatgeremot(nomimatge){
    divxat = document.getElementById("divxatremot");

    nouParagraf=document.createElement('img');
    nouParagraf.setAttribute('src' , "./img/" + nomimatge);
    nouParagraf.setAttribute('height' , "120px");
    nouParagraf.setAttribute('width' , "120px");
    divxat.appendChild(nouParagraf);
}

function funcioNicknameCopiat(){
    btConnectar = document.getElementById("btConnectar");
    btDesconnectar = document.getElementById("btDesconnectar");

    btDesconnectar.style.visibility='hidden';
    btDesconnectar.style.height='0px';
    btConnectar.style.visibility='visible';
    btConnectar.style.height='';
    formulari.style.visibility='hidden';
    formulari.style.height='0px';

    // if (!hihaerror) {
    //     clearMissatge();
    // }
}


