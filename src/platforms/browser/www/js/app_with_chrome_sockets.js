/**
 * @author jerome
 * @copyright BSD 3-Clause
 */

// Declare macros here
var CHECK_SOCKET_STATE_MS       = 60000;
var RETRY_DELAY_MS              = 3000;
var SHORT_TOAST_DURATION_MS     = 900;
var TOAST_DURATION_MS           = 3000;
var LONG_TOAST_DURATION_MS      = 6000;
var SEND_TIMEOUT_MS             = 2;

var TYPE_MAINTENANCE            = "N_MAINT";
var TYPE_CONTROL                = "CTRL";
var TYPE_TEMPERATURE            = "TEMP";
var TYPE_ERROR                  = "ERROR";
var TYPE_ALERT_MAINTENANCE      = "ALERT_C";

var DEFAULT_IP_ADDRESS          = "192.168.10.1";
var SERVER_PORT                 = "12345";

var STATE_ON_COLOR              = "rgb(255, 255, 0)";
var STATE_OFF_COLOR             = "rgb(255, 51, 51)";
var STATE_IN_BETWEEN            = "rgb(33, 150, 243)";

var OFF                         = 0;
var ON                          = 1;

/* Configurables par l'utilisateur ?... */
var MAX_THRESHOLD_TEMP          = 25;
var MIN_THRESHOLD_TEMP          = 20;

// Global variables
var is_connected = false;
var socket, count = 5, countConnectionFailures = 0;

var ipAddress = "ipAddress", my_ipAddress;


var app = {
    /**
     *  Application Constructor
     */
    initialize: function() {
        this.bindEvents();
    },

    /**
     * Lorsque l'évènement deviceready est renvoyé, appel à la fonction onDeviceReady
     */
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady);
        /* Bind the detection of a network to functions */
        document.addEventListener('offline', this.onOffline);
        document.addEventListener('online', this.onOnline);
    },

    /**
     * Ajout des listeners pour les évènements concernant le réseau et les boutons.
     * Initialisation des noms des boutons-relais et des groupes si ceux-ci 
     * existent dans le localStorage de la tablette.
     */
    onDeviceReady: function() {
        /* Ajout des listeners sur les boutons des relais pour les évènements "click" */
        var relayButtons = document.getElementsByClassName('relay');
        for (var i = 0; i < relayButtons.length; i++) {
            relayButtons[i].addEventListener('click', manageSocket);
            // console.log('Ajout listener sur boutons carrés '+i);
        }

        /*Ajout des listeners sur les champs des noms des boutons pour les évènements "change" */
        var buttonsNames = document.getElementsByClassName('inputNameButton');
        for (var i = 0; i < buttonsNames.length; i++) {
            buttonsNames[i].addEventListener('change', onChangeInner);
            // console.log('Ajout listeners sur noms des boutons '+i);
        }

        /* Ajout listener sur le bouton des groupes */
        document.getElementsByName('a2')[0].addEventListener('click', searchForExceptionsInGroups);

        // localStorage.clear(); // A enlever dans la version finale
        
        /* Récupération des noms des relais personnalisés par l'utilisateur, s'ils existent dans le localStorage, et actualisation de l'innerHTML des balises <p> */
        /* Récupération du nombre de boutons à créer, de leur nom personnalisé et des relais qu'ils contiennent */
        if (typeof(Storage) !== "undefined" && localStorage.length > 0){
            console.log('localStorage exists, length > 0');

            console.log(localStorage.getItem('relays'));
            
            /* Récupération des noms des boutons relais */
            var relay_storage = JSON.parse(localStorage.getItem('relays'));
            if (relay_storage != null) {
                for (var i = 0; i < 16; i++) {
                    var relayTagName = 'r'+i;
                    // relay_storage.relayTagName)  MARCHE PAS \\.// relay_storage[relayTagName]); MARCHE OK
                    if (relay_storage[relayTagName] != "") {
                        console.log("relay's name not empty");

                        /* Modification de l'innerHTML de la balise <p> */
                        var p_tag = document.getElementById("in"+ i);
                        p_tag.innerHTML = relay_storage[relayTagName];
                    }
                }
            }
            
            /* Récupération et création des groupes */
            var groups_storage = JSON.parse(localStorage.getItem('groups'));
            console.log(groups_storage);
            if (groups_storage != null) {
                for (var i = 0; i < groups_storage.groups.length; i++) {
                    console.log('group name: '+groups_storage.groups[i].value);
                    /* Appel de la fonction qui crée les boutons des groupes, avec le dernier argument à TRUE pour indiquer qu'on est dans la phase d'initialisation des boutons, et que c"est pas une création dynamique */
                    addBloc(groups_storage.groups[i].value, groups_storage.groups[i].relays, true);
                }
            }
        } 
        /* SINON, création dans le local storage d'un objet contenant les id des boutons-relais avec un nom vide "" */
        else {
            console.log('localStorage doesnt exists');
            Materialize.toast('localStorage doesnt exists', TOAST_DURATION_MS);
            var json_relays = {};
            var newName = "";
            for (var i = 0; i < 16; i++) {
                var newRelay = "r"+i;
                json_relays[newRelay] = newName;
            }

            localStorage.setItem('relays', JSON.stringify(json_relays));
            console.log(localStorage.getItem('relays'));
        }

        /* Actualisation des noms des relais dans la liste déroulante des groupes */
        setOptions();

        /* Initialisation de la socket */
        manageSocket();

        /* Appel à la fonction permettant de vérifier périodiquement l'état de la socket */
        checkSocketState();
        
        displayTemperature();
    }
};
app.initialize();


/**
 * Affichage d'un toast lorsque l'application a détecté que la tablette est connectée à un réseau Wifi.
 */
function onOnline(){
    /* On pourra jouer avec la forme des toasts plus tard*/
    Materialize.toast('Connexion Wifi etablie', TOAST_DURATION_MS);
}

/**
 * Affichage d'un toast lorsque la tablette est déconnectée du réseau Wifi.
 */
function onOffline(){
    Materialize.toast('Connexion Wifi perdue...', TOAST_DURATION_MS);
}

/**
 * Stockage dans le localStorage des noms des boutons-relais choisis par l'utilisateur. 
 * Stockage dans le localStorage des noms de groupes de relais modifiés par l'utilisateur. 
 *
 * @param      {DOM Object}  inputNameButton  L'objet champ texte du DOM qui a été modifié
 */
function onChangeInner(inputNameButton){
    console.log('inputNameButton.srcElement.name:  ');
    console.log(inputNameButton.srcElement.name);

    /* SI le inputNameButton est un nom de bouton-relais */
    /* Il faut enregistrer la nouvelle valeur dans localStorage, et modifier l'innerHTML de la balise <p> */
    if (inputNameButton.srcElement.name == 'relayName') {
        /* Modification du nom dans le localStorage */
        var json_relays = JSON.parse(localStorage.getItem('relays'));
        var idRelayButton = 'r'+inputNameButton.srcElement.id.slice(2);
        json_relays[idRelayButton] = inputNameButton.srcElement.value;

        localStorage.setItem('relays', JSON.stringify(json_relays));
        console.log(localStorage.getItem('relays'));

        /* Modification de l'innerHTML de la balise <p> */
        var p_tag = document.getElementById("in"+ inputNameButton.srcElement.id.slice(2));
        console.log(p_tag);
        p_tag.innerHTML = inputNameButton.srcElement.value;
    }

    /* SINON SI le inputNameButton est un nom de groupe */
    /* Il faut récupérer dans le localStorage tous les groupes, chercher celui dont l'ID correspond à celui de inputNameButton, et changer son attribut "value" */
    else if (inputNameButton.srcElement.name == 'groupName') {
        var json_groups = JSON.parse(localStorage.getItem('groups'));

        for (var i = 0; i < json_groups.groups.length; i++) {
            if (json_groups.groups[i].id === inputNameButton.srcElement.id) {
                json_groups.groups[i].value = inputNameButton.srcElement.value;    
                console.log('value: '+json_groups.groups[i].value);
            }
        }

        localStorage.setItem('groups', JSON.stringify(json_groups));
        console.log(localStorage.getItem('groups'));
    }
}


/**
 * Fonction permettant de vérifier périodiquement que la socket est toujours ouverte.
 * Si ce n'est pas le cas, appel à la fonction d'ouverture de socket.
 */
function checkSocketState(){
    setTimeout(function(){
        if (socket.state != Socket.State.OPENED){
            retryConnectOnFailure();
            console.log('checkSocketState');
        }
    }, CHECK_SOCKET_STATE_MS);
}


/**
 * Fonction appelée lors du démarrage de l'application et après qu'une deconnexion est arrivée
 */
function retryConnectOnFailure(){
    /* Récupération de l'adresse IP si l'utilisateur l'a déjà entrée, sinon prompt box */
    if (typeof(Storage) !== "undefined" && localStorage.getItem(ipAddress) != null){
        my_ipAddress = localStorage.getItem(ipAddress);
        console.log('retryConnectOnFailure: '+localStorage.getItem(ipAddress));
    } else {
        my_ipAddress = window.prompt('Veuillez entrer l\'adresse IP du serveur: ', DEFAULT_IP_ADDRESS);

        /* Si l'adresse IP ne respecte pas le format, remplacement par l'IP par défaut */
        if (checkIPAgainstRegex(my_ipAddress) == false){
            my_ipAddress = DEFAULT_IP_ADDRESS;
        }
        localStorage.setItem(ipAddress, my_ipAddress);
        // console.log(localStorage.getItem(ipAddress));
    }

    var retryConnect = setTimeout(function() {
        if (!is_connected) {
            socket.open(
                  my_ipAddress, // IP Address of the server
                  SERVER_PORT,  // Port the server is listening on 
                  function() {
                    /* invoked after successful opening of socket */
                    Materialize.toast('connexion à '+my_ipAddress+' reussie', LONG_TOAST_DURATION_MS);
                    is_connected = true;
                  },
                  function(errorMessage) {
                    countConnectionFailures++;
                    if (count == 5) {
                        Materialize.toast('echec connexion au serveur:  '+my_ipAddress+'  port  '+SERVER_PORT, TOAST_DURATION_MS);
                        count = 0;
                    }
                    else {
                        count++;
                        console.log("count: "+count);
                    }
                }
            );
            if (countConnectionFailures > 50) {RETRY_DELAY_MS = 15000;}
            if (countConnectionFailures > 100) {clearTimeout(retryConnect);}
            retryConnectOnFailure();
        }
    }, RETRY_DELAY_MS);
}

/**
 * Fonction gérant les envois et réceptions de messages via la socket, ainsi que sa création.
 *
 * @param      {Event}  action             L'évènement qui a été déclenché
 * @param      {var}  optionalParameter    une couleur, ou une durée de report, ou un état d'activation
 */
function manageSocket(action, optionalParameter){
    if (!is_connected) {
        socket = new Socket();
        retryConnectOnFailure();
        console.log('valeur is_connected: '+is_connected);
        // is_connected = true; // TEST PURPOSE ONLY
    
    /* SI la connexion est établie mais que l'action ne provient pas d'un bouton */
    /* on n'entrera jamais dans cette branche */
    } else if (typeof action === 'undefined'){
        console.log('typeof action == undefined');

    /* SI la connexion est établie et qu'un bouton-relais ou bouton-maintenance a été cliqué */
    } else {
        console.log(action.srcElement);
        var textJson;
        /* SI le bouton cliqué est un bouton-relais */
        if (action.srcElement.name.indexOf('r') === 0) {
            console.log('CLICK bouton relais');
            var bouton = document.getElementsByName(action.srcElement.name)
            var bouton_background = window.getComputedStyle(bouton[0]).getPropertyValue('background-color');
            var nextState = (bouton_background == STATE_ON_COLOR) ? 0 : 1;

            var button_number = action.srcElement.name.slice(1);
            var relay_number = (button_number.length == 2) ? Number(1+''+button_number) : Number(10+''+button_number);
            textJson = '{"action":"CTRL",'
                        +'"relay":'+relay_number+','
                        +'"state":'+nextState +'}';

            // Materialize.toast('textJson: '+textJson, TOAST_DURATION_MS);
        }
        /* SI le bouton cliqué est le bouton d'activation d'une maintenance */
        else if (action.srcElement.id.indexOf('Power') > -1){
            console.log('CLICK bouton activation maintenance');

            textJson = '{"action":"A_MAINT",'
                        +'"id":'+'"action.srcElement.id.slice(\'Power\'.length)"'+','
                        +'"state":'+optionalParameter +'}';
        }
        /* SI le bouton cliqué est le bouton d'acquittement d'une maintenance */
        else if (action.srcElement.id.indexOf('Acquit') > -1){
            console.log('CLICK bouton acquittement maintenance');

            textJson = '{"action":"R_MAINT",'
                        +'"id":'+'"action.srcElement.id.slice(\'Acquit\'.length)"'+','
                        +'"report":-1}';
        }
        /* SI le bouton cliqué est le bouton de report d'une maintenance */
        else if (action.srcElement.id.indexOf('Report') > -1){
            console.log('CLICK bouton report maintenance');

            textJson = '{"action":"R_MAINT",'
                        +'"id":'+'"action.srcElement.id.slice(\'Report\'.length)"'+','
                        +'"report":'+optionalParameter +'}';
        }
        /* SI le bouton cliqué est le bouton de changement de couleur d'une maintenance */
        else if (action.srcElement.id.indexOf('Color') > -1){
            console.log('CLICK bouton Couleur maintenance');

            textJson = '{"action":"C_COLOR",'
                        +'"id":'+'"action.srcElement.id.slice(\'Color\'.length)"'+','
                        +'"color":'+'"'+optionalParameter +'"' +'}';
        }

        socket.write(string_To_uint8(textJson));
    }

    /* Invoked after new batch of data is received (typed array of bytes Uint8Array) */
    /*  Communications  SERVEUR --> CLIENT  */
    socket.onData = function(data) {
      dataToString = String.fromCharCode.apply(String, data);

      /* Découpage du string en sous-string, chacun contenant un seul objet JSON. */
      // var stringSliced;
      // if (dataToString.)

      var jsonObject = JSON.parse(dataToString);

      (typeof jsonObject === 'object') ? console.log('reception + jsonisation reussie') : Materialize.toast('echec lors de la jsonisation', 7000);

      console.log(jsonObject);
    
      /* Trouver le type de la requête: maintenance, boutons relais, température */
        switch (jsonObject.action){
            case TYPE_MAINTENANCE:
                /* Si la liste des maintenances dans menuConfig existe déjà, on ne la recrée pas */
                if ($("#configCollapsible").children().length == 0) {
                    Materialize.toast('Received N_MAINT from server', LONG_TOAST_DURATION_MS);
                    addMaintenance(jsonObject);

                    navigator.notification.vibrate([300, 70, 300, 70, 300]);
                    navigator.notification.beep(1);
                }
                break;

            case TYPE_ALERT_MAINTENANCE:
                Materialize.toast('Received alert maintenance', LONG_TOAST_DURATION_MS);
                maintenanceToBeDone(jsonObject.id, "nom_de_la_maintenance");
                navigator.notification.vibrate([300, 70, 300, 70, 750]);

            case TYPE_CONTROL:
                /* Réponse du serveur pour savoir s'il faut changer la couleur du bouton-relais */
                setColorRelayButton(jsonObject.relay, jsonObject.state);
                Materialize.toast('Received CTRL from server', LONG_TOAST_DURATION_MS);
                break;

            case TYPE_TEMPERATURE:
                displayTemperature(dataTemperature);
                break;

            case TYPE_ERROR:
                Materialize.toast(jsonObject.message, LONG_TOAST_DURATION_MS);
                navigator.notification.vibrate([500,30,500]);
                break;

            case "N_RELAY":
                Materialize.toast('Received N_RELAY from server', TOAST_DURATION_MS);
                setColorRelayButton(jsonObject.relay, jsonObject.state);

            default: 
                break;                
        }   
    };


    socket.onClose = function(){
        console.log('connexion fermée');
        Materialize.toast('Connexion interrompue. Tentative de reconnexion en cours...', TOAST_DURATION_MS);
        is_connected = false;
        retryConnectOnFailure();
    };
}

/**
 * Fonction responsable de la conversion d'un string en Uint8 Array pouvant être écrit dans la socket.
 *
 * @param      {string}      stringJSON  Le string contenant l'objet JSON à envoyer au serveur
 * @return     {Uint8Array}  Le tableau d'Uint8 prêt à être envoyé par la socket
 */
function string_To_uint8(stringJSON){
    console.log(JSON.parse(stringJSON));
    var dataToSend = new Uint8Array(stringJSON.length);
    for (var i = 0; i < dataToSend.length; i++) {
      dataToSend[i] = stringJSON.charCodeAt(i);
    }
    return dataToSend;
}

/**
 * Fonction permettant de vérifier le format de l'adresse IP rentrée par l'utilisateur
 *
 * @param      {Number}  ipAddressToCheck  The ip address
 * @return     {boolean}  True if ipAddressToCheck matches the Regex, False otherwise.
 */
function checkIPAgainstRegex(ipAddressToCheck){
    var ip_pattern = '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$';
    var regx = new RegExp(ip_pattern, 'g');

    var testBool = regx.test(ipAddressToCheck)
    console.log('Regex verification is: '+testBool);

    return testBool;
}

/**
 * Fonction permettant d'afficher et de mettre à jour la courbe d'évolution de la température
 *
 * @param      {JSON Object}  dataTemperature  The data temperature
 */
function displayTemperature(dataTemperature){
    /*-----------------------------------------------------------------------------
    |                           FLOT
    +-----------------------------------------------------------------------------*/
    var tempDataPoints = [];
    var maxThreshold = [], minThreshold = [];

    setInterval(function(){     // A enlever quand le serveur enverra des données de température
        var randTemp = Math.floor(Math.random()*(27-18+1)+18); // A enlever également
        tempDataPoints.push([tempDataPoints.length, randTemp]);
        maxThreshold.push([maxThreshold.length, MAX_THRESHOLD_TEMP]);
        minThreshold.push([minThreshold.length, MIN_THRESHOLD_TEMP]);

        var temp_10 = tempDataPoints.slice(-10);
        var xaxis_min = temp_10[0][0];

        var xaxis_min_full = 0;
        if (tempDataPoints.length > 10) {
            xaxis_min_full = tempDataPoints.length - 10;
        }

        $.plot("#temperature", 
            [{
                color: "rgb(0, 51, 204)",
                data: temp_10,
                lines: { show: true, fill: true },
                points: {show: true}
            },{
                color: "rgb(255, 0, 0)",
                data: maxThreshold,
                lines: {lineWidth: 5},
            },{
                color: "rgb(255, 0, 0)",
                data: minThreshold,
                lines: {lineWidth: 5}
            }],
            {
                grid: {
                    backgroundColor: "#fff"
                },
                yaxis: {
                    min: 15,
                    max: 30
                },
                xaxis: {
                    min: xaxis_min
                }
            }
        );

        $.plot('#temperature_full',
            [{
                data: tempDataPoints,
                color: "rgb(0, 51, 204)",
                lines: { show: true, fill: true }
            }],
            {
                grid: {
                    backgroundColor: "#fff"
                },
                xaxis: {
                    min: xaxis_min_full
                },
                yaxis: {
                    min: 15,
                    max: 30,
                    ticks: 15,
                    font:{
                        size:13,
                        style:"italic",
                        family:"sans-serif",
                        color:"#ddffdd"
                    }
                }
            }
        );
    },LONG_TOAST_DURATION_MS);
}

/**
 * Fonction permettant de changer la couleur des boutons-relais après que la confirmation du serveur est arrivée.
 *
 * @param      {number}  relayNumber  Le numéro du relais tel qu'indiqué dans la trame au format JSON
 * @param      {number}  relayState   L'état dans lequel mettre le relais. 0 -> éteint (rouge), 1 -> allumé (jaune)
 */
function setColorRelayButton(relayNumber, relayState){        
    relayButtonUpdate = document.getElementsByName('r'+Number(String(relayNumber).slice(1)));

    console.log(Number(String(relayNumber).slice(1)));
    console.log(window.getComputedStyle(relayButtonUpdate[0]).getPropertyValue('background-color'));

    relayButtonUpdate[0].style.backgroundColor = (relayState == OFF) ? STATE_OFF_COLOR : STATE_ON_COLOR;
}

/**
 * Fonction gérant l'allumage et l'extinction des boutons relais associés dans un groupe
 *
 * @param      {DOM Object}  buttonGroup  Le bouton du groupe qui a été cliqué
 */
function onClickButtonGroup(buttonGroup){
    console.log('onClickButtonGroup ___ buttonGroup.srcElement:');
    console.log(buttonGroup.srcElement);

    var buttonGroup_state = window.getComputedStyle(buttonGroup.srcElement).getPropertyValue('background-color');
    console.log(buttonGroup_state);

    /* A priori ailleurs, une fois qu'on aura reçu la confirmation de l'état es relais de la part du serveur */
    var nextState;
    if (buttonGroup_state == STATE_IN_BETWEEN || buttonGroup_state == STATE_OFF_COLOR) {
        nextState = STATE_ON_COLOR;
        buttonGroup.srcElement.style.backgroundColor = nextState;
    } else if (buttonGroup_state == STATE_ON_COLOR) {
        nextState = STATE_OFF_COLOR;
        buttonGroup.srcElement.style.backgroundColor = nextState;
    }
     
    /* On récupère les "name" des boutons des relais. Pour chacun d'eux, on envoie une requête d'allumage ou d'extinction, selon la couleur précédente du bouton du groupe. */
    
        /* Récupérer l'id du groupe dans le JSON = récupérer le nombre dans "input_xx" et l'ajouter au milieu de "in" et "17". */
        var middleNumber = buttonGroup.srcElement.id.slice(6);
        console.log("middleNumber: "+middleNumber);

        var id_group_JSON = "in"+middleNumber+17;
        console.log('id_group_JSON: '+id_group_JSON);

    var groups_JSON = JSON.parse(localStorage.getItem('groups')).groups;
    console.log(groups_JSON);

    /* On parcourt la liste des groupes jusqu'à trouver celui dont l'id correspond à celle determinée plus haut */
    var i = 0, found = false, relays_in_group;
    while (i < groups_JSON.length && !found) {
        if (groups_JSON[i].id == id_group_JSON) {
            relays_in_group = groups_JSON[i].relays;
            console.log('relays_in_group: '+relays_in_group);
            found = true;
        }
        i++;
    }

    /* On regarde l'état de chaque relais. S'il correspond à l'état demandé du groupe, on n'envoie pas de requête */
    var arrayTextJson = [];
    for (var i = 0; i < relays_in_group.length; i++) {
        var element = document.getElementsByName(relays_in_group[i]);
        if (window.getComputedStyle(element[0]).getPropertyValue('background-color') != nextState) {
                var button_number = relays_in_group[i].slice(1);
                var relay_number = (button_number.length == 2) ? Number(1+''+button_number) : Number(10+''+button_number);

                textJson = '{"action":"CTRL",'
                        +'"relay":'+relay_number+','
                        +'"state":'+((nextState == STATE_ON_COLOR) ? 1 : 0) +'}';

                arrayTextJson.push(textJson);
        }
    }
    
    var arrayTextJsonSliced;
    if (is_connected) {
        var sendWithTimeout = setInterval(function(){
            if (arrayTextJson[0] != null) {
                console.log(arrayTextJson[0]);
                socket.write(string_To_uint8(arrayTextJson[0]));
                console.log('SENDING '+arrayTextJson[0]);

                arrayTextJsonSliced = arrayTextJson.slice(1);
                arrayTextJson = arrayTextJsonSliced;
                console.log(arrayTextJson);
            }
            else {
                clearTimeout(sendWithTimeout);
                console.log('clearTimeout');
            }
        }, SEND_TIMEOUT_MS);
    } else {
        console.log('Pas de connexion détectée');
    }
}

/**
 * Fonction appelée lors du clic sur le bouton "Groupes". Elle permet de remettre à BLEU le bouton du groupe si
 *  tous les relais de ce groupe ne sont pas de la même couleur que le groupe (= états différents)
 */
function searchForExceptionsInGroups(){
    if (localStorage.getItem('groups') != null) {
        var arrayGroups = JSON.parse(localStorage.getItem('groups')).groups;
        for (var i = 0; i < arrayGroups.length; i++) {
            var arrayRelays = arrayGroups[i].relays;
            var groupButtonID = arrayGroups[i].buttonID;
            console.log(arrayRelays);

            var j = 0, is_exception = false;
            while (j < arrayRelays.length && !is_exception) {
                var relayColor = window.getComputedStyle(document.getElementsByName(arrayRelays[j])[0]).getPropertyValue('background-color');
                var groupColor = window.getComputedStyle(document.getElementById(groupButtonID)).getPropertyValue('background-color');
                
                /* SI un des relais a une couleur différente de celui du groupe, on change la couleur du bouton de groupe à STATE_IN_BETWEEN */
                if (relayColor != groupColor) {
                    is_exception = true;
                    document.getElementById(groupButtonID).style.backgroundColor = STATE_IN_BETWEEN;
                }

                j++;
            }
        }
    }
}