/*
 * @author Derouene
 *
 * @file index.js
 *
 * @author Adrien derouéné
 * @version 1.0
 * @date 13/10/2016
 * @copyright BSD 3-Clause
 */

/**
 * Fonction d'initialisation du fichier index.js.
 *
 */
$(document).ready(function()
{
    <!-- _________________TEST_____________________ -->
    _colors=$('._select_color_drop li');
    for (var i = _colors.length - 1; i >= 0; i--) {
        $(_colors[i]).click(function(){
            var color_text = $(this).find('span').attr('_text_display');
            var elemnt = $(this).closest('._select_color_drop').prev();
            elemnt.find('span.color').remove();
            $(this).find('span').clone().appendTo(elemnt);
            var contents = $(elemnt).contents();
            if (contents.length > 0) {
                if (contents.get(0).nodeType == Node.TEXT_NODE) {
                    $(elemnt).html(color_text).append(contents.slice(1));
                }
            }
            if($('[name=_color]').val() == undefined){
                elemnt.next().append("<input type='hidden' name='_color' value='"+color_text+"'>");
            }else{
                $('[name=_color]').val(color_text);
            }
            
        })
    };
    <!-- _________________TEST_____________________ -->


    setDate ('date', "oui");
    setOption();


    ajoutMaintenance("Maintenance 13", 1, 30, 13);
    ajoutMaintenance("Maintenance 14", 1, 30, 14);
    ajoutMaintenance("Maintenance 15", 0, 30, 15);
    ajoutMaintenance("Maintenance 16", 1, 30, 16);

    addMessage ("Mnull", "Aucun nouveau message !");
    maintenanceAFaire("Maintenance 13", "Maintenance 13");

    console.log("Le nombre d'élement " + localStorage.length);
    var elements;
    var jsonelements;
    for (var i = 0; i < localStorage.length; i++){
        elements += localStorage.getItem(localStorage.key(i));
    }
    jsonelements = JSON.stringify(elements);
    console.log("Mon contenu " + jsonelements);

});

/*
 * Ajoute un bloc comportant comprenant un div et un bouton. Le div en question peut accueillir jusqu'à deux boutons.
 * @param name
 * @param values
 * @param initialisation, variable permettant de vérifier que les boutons n'ont pas déjà été créés
 */
function addBloc(name, values, initialisation)
{
    console.log("Add bloc. paramètre 1 : " + name + " paramètre 2 : " + values);

    var top_level_div = document.getElementById('div_body');
    var count_div = top_level_div.getElementsByTagName('div').length;
    console.log("here is the number of div : " + count_div);
        
    var id_div = "div" + count_div;
    var top_level_item = document.getElementById(id_div);
    console.log("here is the id of the top element : " + top_level_item  + " : " + id_div);
    var modulus = (count_div % 3);
    console.log("Mon modulo : " + modulus);

    if (modulus == 0)
    {
      try {
          var count_item = top_level_item.getElementsByTagName('div').length;
      }catch(err) {
          
      }   
    }

    /* Valide. */
    if (modulus == 2) 
    {
        var new_id;
        var count_div2 = count_div - 1;
        id_div = "div" + count_div2;
        console.log("here is the number of element inside the div : " + count_item + "ADD_BUTTON");
        new_id = addButton(id_div, count_div, name, values, initialisation);
    } else {
        console.log("here is the number of element inside the div : " + count_item + "ADD_DIV");
        count_div += 1;
        addDiv(count_div, name, values, initialisation);
    }
    setTimeout(function(){
        console.log('after');
    },500);

    var myButton = document.getElementById(new_id);
    if (myButton !== null)
    {
        myButton.addEventListener('click',onClickButtonGroup);
    } else {

      console.log("monBoutton est null !!!");
    }


} 

/*
 * Créer un div  dans la page Groupe (fonction appelé dans addBloc()).
 *
 * @param name
 * @param result
 * @param values
 * @param initialisation, variable permettant de vérifier que les boutons n'ont pas déjà été créés
 */
function addDiv (number, result, values, initialisation) 
{
    console.log("Add div. ");

    var target = document.getElementById('div_body');
    var monDiv = document.createElement("div");
    var new_id;

    monDiv.id = "div" + number;

    console.log("here is the id of my new div : " + monDiv.id);
    target.appendChild(monDiv);

    new_id = addButton(monDiv.id, number, result, values, initialisation);
    var myButton = document.getElementById(new_id);

    if (myButton !== null)
    {
        myButton.addEventListener('click',onClickButtonGroup);
    } else {

      console.log("monBoutton est null !!!");
    }
    console.log("Div créé. ");

}

/* Ajoute un bouton dans un div (fonction appelé dans addBloc()).
 *
 * @param name
 * @param result
 * @param values
 * @param initialisation, variable permettant de vérifier que les boutons n'ont pas déjà été créés
 */
function addButton (ref, count, result, values, initialisation) 
{
    console.log("Mes paramètres : ref : " + ref + ", count : " + count + ", result : " + result +". ");
    console.log("Add button. ");

    var target = document.getElementById(ref);
    var monDiv = document.createElement("div");

    monDiv.id = "inner_div" + count + count;

    console.log("here is the id of my new div : " + monDiv.id);
    target.appendChild(monDiv);
    console.log("Div interne créé. ");

    var id = "in" + count + 17;
    var myP = document.createElement('input');
    myP.id = id;
    myP.className = "inputNameButton";
    myP.name = 'groupName';
    myP.maxLength = 20;
    myP.type = "text";
    myP.value = result;

    /* Ajout d'un listener sur l'input lors d'une modification du texte */
    myP.addEventListener('change', onChangeInner);


    var myA = "input_" + count;
    monDiv.innerHTML = "<a id=\"input_" + count + "\" class=\"btn-large btn-floating waves-effect waves-light group\"> "+ count + "</a>";
    document.getElementById(myA).style.backgroundColor = "rgb(33, 150, 243)";

    /* Enregistrement du groupe créé (nom du groupe + relais associés) dans le localStorage */
    /* SI on n'est pas dans l'initialisation, on crée et ajoute les groupes dans le JSON */
    if (!initialisation) {
      if (localStorage.getItem('groups') != null){
        var json_groups = JSON.parse(localStorage.getItem('groups'));
      }
      else {
        var json_groups = {"groups":[]};
      }


      var new_group = {"id":myP.id, "value":myP.value, "relays":values, "buttonID":myA };

      json_groups.groups.push(new_group);
    
      localStorage.setItem('groups', JSON.stringify(json_groups));
    }

    console.log(JSON.parse(localStorage.getItem('groups')));


    // console.log("Mon id : " + myP.id + ". ");
    console.log("Mon resultat : " + result + ". ");

 
    try {
      document.getElementById(monDiv.id).appendChild(myP);
    }catch(err) {
      return_error(err);

    }

    if (document.getElementById(id) !== null) {
      if (result != null) {
        document.getElementById(id).defaultValue = result;
      } else {console.log("Mon result : " + result + " est null. ");}
        
    } else {console.log("Mon getElementById : return est null. ");}

    console.log("Mon getElementById : " + id);

    var optionValue = JSON.stringify(values);
    console.log("L'identifiant " + myA + " et le contenu des options en string : " + optionValue);
    localStorage.setItem(myA, optionValue);

    return myA;
}

/* Insert la date du device dans un item (à l'id passer en paramètre).
 * Le deuxième paramètre permet de définir si on souhaite afficher l'heure ou non.
 * 
 * @param id
 * @param avecH, pour choisir si on veut prendre les heures avec ou non.
 */
function setDate (id, avecH) 
{
      var now = new Date();
      var setdate = document.getElementById(id);

      var annee   = now.getFullYear();
      var mois    = now.getMonth() + 1;
      var jour    = now.getDate();
      var heure   = now.getHours();
      var minute  = now.getMinutes();
      var seconde = now.getSeconds();
      if (avecH === "oui") {
          var date = "" +jour + "/" + mois + "/" + annee + "; " + heure + ":" + minute + ":" + seconde + "";
      }
      else {
        var date = "" +jour + "/" + mois + "/" + annee + "";
      }
      
      console.log("setDate called for the id : " + id);
      console.log(jour + "/" + mois + "/" + annee + "; " + heure + ":" + minute + ":" + seconde);

      setdate.innerHTML = date;
}

/**
 * Ajoute les divers options possibles dans la liste. 
 *
 */
function setOption ()
{
    var inputsNames = document.getElementsByClassName('pNameButton');
    var buttonsNames = document.getElementsByClassName('relay');

    console.log("setOption1/input : " + inputsNames.length);
    console.log("setOption1/buttons : " + buttonsNames.length);

    for (var i = 0; i < inputsNames.length; i++) {
        $("#select-choice-8").append('<option value=' + buttonsNames[i].name + '>' + inputsNames[i].textContent + '</option>');
        // console.log("Le nom : " + buttonsNames[i].name + " et la valeur :" + inputsNames[i-5].innerText);
    }
    

}

/**
 * Clean le menu déroulant, pour choisir les options. 
 */
function cleanSelect ()
{
  $("#select-choice-8")
      .find('option')
      .remove()
      .end()
  ;
  setOption();
}

/**
 * Fonction permerrant de capturer la selection dans la liste des groupes.
 */
function submit()
{
  console.log("submit ?");

  var values = $('#select-choice-8').val();
  var select = document.getElementById('select-choice-8');
  var length = select.options.length;

  console.log("You selected these options : " + values);
  
  for (i = 0; i < length; i++) {
    select.options[i] = null;
  }

  cleanSelect();
  if(values !== null) {
      addBloc("name", values, false);

  }

}

/**
 *Ajoute un message dans la liste sur l'écran d'accueil.
 *  
 * @param id
 * @param message
 */
function addMessage (id, message) 
{
    var maListe = document.getElementById('custom');

    if (id !== "Mnull") {
      var listItem = "<li id =\"malistedivider" + id + "\" data-role=\"list-divider\" width=\"100%\"> <p id=\"" + id + "\" /></li><li id=\"maSliste" + id + "\"><h2>Maintenance.</h2><p><strong> " + message + "</strong></p></li>";

    }else {
      console.log("Ajout d'un autre message et suppression de l'ancien.");
      var listItem = "<li id =\"malistedivider" + id + "\" data-role=\"list-divider\" width=\"100%\"> <p id=\"" + id + "\" /></li><li id=\"maSliste" + id + "\"><h2>Aucune maintenance à faire</h2><p><strong> " + message + "</strong></p></li>";

    }
    $(maListe).append(listItem);

    setDate(id, "non");

    $('#custom').listview().listview('refresh');
    console.log("Ajout d'un message avec pour ID : " + id);

    if (id !== "Mnull") {
      removeMessage("Mnull");
    }
}

/**
 * Supprime un message de la liste des messages sur l'écran d'accueil.
 *
 * @param id
 */
function removeMessage(id)
{ 
    if (id == "Mnull")
    {
        var id2 = "malistedivider" + id;
        var id3 = "maSliste" + id;
    } else {
        var id2 = "malistedivider" + id.slice(6);
        var id3 = "maSliste" + id.slice(6);
    }   
    var el = document.getElementById(id2);
    var el2 = document.getElementById(id3);

    console.log("L'id du message maintenance à supprimer est : " + id);
    if (el !== null) {
      el.remove();
    }
    if (el2 !== null) {
      el2.remove();
    }
    console.log("Remove message with id :" + id + " !");
    var count = $("#custom").children().length;
    if (count == 0)
    {
      addMessage("Mnull", "Aucun nouveau message !");
    }
}

/**
 * Ajoute une maintenance dans la liste des maintenances.
 * @param message
 * @param activate
 * @param jour
 * @param id
 */
function ajoutMaintenance(message, activate, jour, id)
{
  var powerId = "Power" + id;
  var colorId = "Color" + id;
  var collapseItem = "<div id=\"collapsible" + id + "\" data-role=\"collapsible\" data-collapsed=\"true\" data-theme=\"a|b\" data-mini=\"true\"><h5 id=\"Acquit1\" data-theme=\"b\" class=\"\"> Maintenances 1 </h5><ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\"> <li><a href=\"#\"><h2>Activer la maintenance.</h2></a><a id=\"" + powerId + "\" href=\"#\" data-icon=\"power\" class=\"green\"></a></li><li><a href=\"#\"><h2>Changer la couleur de la maintenance</h2></a><a id=\"" + colorId + "\" href=\"#\" data-icon=\"clock\" class=\"orange\"></a></li></ul></div>"

  $("#configCollapsible").append( collapseItem );
  if(activate === 1) {
      addCollapseItem(message, id, jour);
  }

  console.log("colorId : " + colorId);
  var myButtonColor = document.getElementById(colorId);
  myButtonColor.addEventListener('click', function(){
    changerCouleur(colorId);
  });

  var myButtonPower = document.getElementById(powerId);
  console.log("reportId : " + powerId);
  myButtonPower.addEventListener('click', function(){
    activerMaintenance(powerId);
  });

}

/**
 * Ajoute un item dans la liste des maintenances.
 *  
 * @param id 
 * @param message
 * @param jour
 */
function addCollapseItem(id, message, jour)
{
    var acquitId = "Acquit" + id;
    var reportId = "Report" + id;
    var collapseItem = "<div id=\"collapsible" + id + "\" data-role=\"collapsible\" data-collapsed=\"true\" data-theme=\"a|b\" data-mini=\"true\"><h5 id=\"Alert" + id + "\" data-theme=\"b\" class=\"ui-btn ui-btn-b ui-icon-alert ui-btn-icon-right\">" + id + " </h5><ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\"> <li><a href=\"#\"><h2>Acquittement</h2></a><a id=\"" + acquitId + "\" href=\"#\" data-icon=\"check\" class=\"green\"></a></li><li><a href=\"#\" id=\"" + reportId + "\"><h2>Report</h2></a><a href=\"#\" data-icon=\"clock\" class=\"orange\"></a></li><li data-theme=\"a\"><h2 href=\"\" data-transition=\"slide\" data-theme=\"c\" data-native-menu = \"false\">La prochaine alerte pour la " + id + " sera dans  " + jour + " jours.</h2></li></ul></div>"

    $("#collapsible").append( collapseItem );

    console.log("acquitId : " + acquitId);
    var myButtonAcquit = document.getElementById(acquitId);
    myButtonAcquit.addEventListener('click', function(){
      acquittement(acquitId);
    });

    var myButtonReport = document.getElementById(reportId);
    console.log("reportId : " + reportId);
    myButtonReport.addEventListener('click', function(){
      report(reportId);
    });
}

/**
 * Indique qu'une maintenance est à faire (et potentiellment à acquitter si elle est faite).
 *  
 * @param id 
 * @param message
 */
function maintenanceAFaire(id, message)
{
  var alertId = "Alert" + id; 
  var el = document.getElementById(alertId);

   el.className = "ui-btn ui-icon-alert ui-btn-icon-right"; 
   alert("Ajout message !!!");
   addMessage(id, message);


}

/**
 * Acquitte une maintenance.
 *  
 * @param id 
 */
function acquittement(id)
{
  var split = "Alert" + id.slice(6);
  var el = document.getElementById(split);

  console.log("L'id de la maintenance à acquittée est : " + id);
  console.log("L'id splité de la maintenance à acquittée est : " + split);

  if (el.className !== "ui-btn ui-icon-alert ui-btn-icon-right") {
      el.className = "ui-btn ui-icon-alert ui-btn-icon-right"; 
      alert("La maintenance n'est pas à faire !");
  } else { // Aquitemment fait!
      el.className = "ui-btn"; 
      removeMessage(id);
  }
}

/**
 * Reporte une maintenance.
 *  
 * @param id 
 */
function report(id)
{
  //pop-up à implémener.
  var el = document.getElementById(id);
  console.log("L'id de la maintenance à faire est : " + id);

  // Aquitemment fait!
  el.className = ""; 
  removeMessage(id);
}

/**
 * Active/desactive une maintenance.
 *  
 * @param id 
 */
function activerMaintenance(id)
{
  alert("\"activate\" à besoin d'etre implémenter !!!");
}

/**
 * Change la couleur d'une maintenance.
 *  
 * @param id 
 */
function changerCouleur(id)
{
  alert("\"changeColor\" à besoin d'etre implémenter !!!");

}

/* Fonction de debuf permettant de gérer les érreurs dans la console. */
function return_error (err)
{
      message='Une erreur s\'est produite.\n\n';
      message+='Description : ' + err.message + err.cause + '\n\n';
      message+='Cliquez sur OK pour poursuivre.';
      alert(message);

}

 
function removeButton(){
  var confirm = window.confirm('Voulez-vous vraiment supprimer tous les groupes ?');
  if (confirm) {
    localStorage.removeItem('groups');
    var topDiv = document.getElementById('div_body');
    while (topDiv.hasChildNodes()){
      topDiv.removeChild(topDiv.lastChild);
    }
  }
}
