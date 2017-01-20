// Declare global variables here
var is_connected = false;
// var init = 1;

var app = {
	// Application Constructor
    initialize: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady);
        
        // Bind the detection of a network to functions
        document.addEventListener('offline', this.onOffline);
        document.addEventListener('online', this.onOnline);

        /* Ajout des listeners sur les boutons des relais pour les évènements click */
        var buttons = document.getElementsByClassName('btn-large btn-floating waves-effect waves-light blue');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', this.manageSocket);
        }

        /* Ajout des listeners sur les noms des boutons pour les évènements change */
        var buttonsNames = document.getElementsByClassName('inputNameButton');
        for (var i = 0; i < buttonsNames.length; i++) {
            buttonsNames[i].addEventListener('change', this.onChangeInner);
        }

        
    },

    onChangeInner: function(buttonNameInput){
        // console.log('change event '+buttonNameInput.srcElement.id);
        localStorage.setItem(buttonNameInput.srcElement.id, buttonNameInput.srcElement.value);
        console.log(localStorage.getItem(buttonNameInput.srcElement.id));
    },

    onDeviceReady: function() {
        console.log("onDeviceReady");
        /* Récupération des noms des relais personnalisés par l'utilisateur, s'ils existent dans le localStorage */
        var buttonsNames = document.getElementsByClassName('inputNameButton');
        if (typeof(Storage) !== "undefined"){
            for (var i = 0; i < buttonsNames.length; i++) {
                if (null != localStorage.getItem(buttonsNames[i].id)){
                    buttonsNames[i].value = localStorage.getItem(buttonsNames[i].id);
                }
            }
        }

        /* Initialisation de la socket */
        app.manageSocket();
    },

    onOnline: function(){
        /* On pourra jouer avec la forme des toasts plus tard*/
        Materialize.toast('Connection Wifi établie', 1000);
    },

    onOffline: function(){
        Materialize.toast('Connection Wifi perdue...', 1000);
    },

    
    /**
     * Creates and manages socket. Is called whenever a request for information on server-side is made.
     * @param 
     */
    manageSocket: function(action){
        if (!is_connected){
            socket = io.connect('http://localhost:3001');
            is_connected = true;

            socket.on('connect', function() {
                Materialize.toast('Connection avec le serveur établie', 3000);
            });

            socket.on('initialization', function(data_initialization){
                // app.plotTemperature(data_temperature);
                console.log('initialization '+data_initialization);

                // A ce niveau-là, on change les noms des boutons, sauf ceux qui sont dans le localStorage
            });

            // socket.on('groups', function(data_groups){
            //     $.each(data_groups, function(i,field){
            //         console.log(i +"  " +field.group);
            //         $("div").append(i + " "+field.group +"<br/>");
            //     })
            // });

            socket.on('disconnect', function(){
                Materialize.toast('serveur déconnecté...', 3000);
                is_connected = false;
            });
        }else{
            // if (action.srcElement.)
            // if (action.srcElement.id == 'maintenance'){
            //     socket.emit('request_maintenance',{});
            // }
            // if (action.srcElement.id == 'groups'){
            //     socket.emit('request_groups', {});
            // }
            // if (action.srcElement.id == 'temperature'){
            //     socket.emit('request_temperature', {});
            // }
        }

        /* Initialisation de l'appli en demandant au serveur le fichier JSON d'initialisation */
        if (typeof action === 'undefined'){
            console.log('initialisation json');
            socket.emit('request_initialization', {});
        }

        // TODO
        //// Maintenant que le fichier d'initialisation est reçu, il faut affecter les noms des éléments donnés dans ce fichier
        /// aux boutons des relais. 
        // --> A priori, les valeurs des noms des relais ne changeront pas entre chaque initialisation, donc à la première
        // initialisation, on pourra stocker les valeurs des noms dans le localStorage.
    }
};

app.initialize();
