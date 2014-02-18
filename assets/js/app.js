// ============
// VARIABLES
// ============

var w = window,
	d = document,
	tpl,
	prev, 
	next,
	nombre,
	question,
	questionnaire,
	reponses,
	suites,
	goTo,
	max,
	hash,
	Poll = {},
	entityMap = {
		"[e1]": "&eacute;",
		"[e2]": "&egrave;",
		"[i1]": "&iuml;"
	},
	templates = {
		button : "<button class='{0}' data-go='{1}' onclick='proceed(this,{2})'>{3}</button>",
		range : "<input type='radio' name='r{0}' id='r{1}' value='{1}' /><label for='r{1}' class='r{2}' onclick='proceed(this,{0})' data-go='{3}'>{1}</label>"
	};


// ============
// HELPERS
// ============

function $(expr) { return d.querySelector(expr); }

function k(c, f, p){
	if (w.c === c) f(p);
}

function lgth(object){
	return Object.keys(object).length;
}

String.prototype.upperCase = function(){
	return this.charAt(0).toUpperCase() + this.substring(1);
};

function convertChar(string){
	return String(string).replace(/\[(e1|e2|i1)\]/g, function(s){
		return entityMap[s];
	});
}

String.prototype.format = function(){
	var string = this;

	for (var i = 0, j = arguments.length; i < j; i++) {
		string = string.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
	}

	return string;
};


// =================
// CSS MANIPULATIONS
// =================

Element.prototype.hasClass = function (className) {
    return new RegExp(' ' + className + ' ').test(' ' + this.className + ' ');
};

Element.prototype.addClass = function (className) {
    if (!this.hasClass(className)) {
        this.className += ' ' + className;
    }
    return this;
};

Element.prototype.removeClass = function (className) {
    var newClass = ' ' + this.className.replace(/[\t\r\n]/g, ' ') + ' '
    if (this.hasClass(className)) {
        while (newClass.indexOf( ' ' + className + ' ') >= 0) {
            newClass = newClass.replace(' ' + className + ' ', ' ');
        }
        this.className = newClass.replace(/^\s+|\s+$/g, ' ');
    }
    return this;
};



// ============
// POLL OBJECT
// ============

function isFirstRun(){
	localStorage.getItem("Poll") ? load() : save();
}

function load(){
	Poll = JSON.parse(localStorage.getItem("Poll"));
}

function save(){
	localStorage.setItem("Poll", JSON.stringify(Poll));
	load();
}

function set(num, val){
	console.log(num, val);
	Poll[num] = val;
	save();
}

function get(num){
	return Poll[num];
}


// ============
// INTERFACE
// ============

function run(){
	hash = w.location.hash.replace("#",""),
	hash !== "" ? getQuestionnaire(hash) : info("hash");
}

function getQuestionnaire(id){
	var xhr = null;

	if (window.XMLHttpRequest){ // Firefox 
		xhr = new XMLHttpRequest();
	} else if (window.ActiveXObject){ // Internet Explorer 
		xhr = new ActiveXObject("Microsoft.XMLHTTP");
	} else {
		info("xhr");
		return;
	}

	xhr.open("GET", "https://api.github.com/gists/" + id, false);
	xhr.send(null);

	if (xhr.readyState == 4){
		if(xhr.status == 200){
			var data = JSON.parse(JSON.parse(xhr.responseText).files.questionnaire.content);
				questionnaire = data.questions,
				nombre = lgth(questionnaire);
			w.i = 0;
			setI(0);
		} else {
			info("nf");
		}
	}
};


function setI(i){
	prev = w.i;

	w.i = (w.i + i <= 0) ? 0 : w.i + i; // beginning of object
	w.i = (w.i > nombre - 1) ? nombre - 1 : w.i; // end of object
	
	next = w.i;

	if(w.i === 0){
		display(0);
	} else if (next !== prev) {
		display(w.i);
	}
}

function display(i){
	if(questionnaire[i]){
		question = questionnaire[i];
		$("#message").innerHTML = convertChar(question.q);
		$(".buttons").innerHTML = parseQ(question.a, i);	
		w.i = i;
		setProgress(i+1);
	}
}

function parseQ(a, n){
	tpl = "";

	// Range
	if(a.match(/range/g)){
		max = a.match(/\d/g) || 5;
		goTo = n + 2;

		for (var i = 0; i < max; i++){
			tpl += templates.range.format(n, i, max, goTo);
		}

	// Basic question
	} else {
		reponses = a.match(/[a-z]+/g);
		suites = a.match(/\d/g) || n + 2; 

		for (var i = 0, length = reponses.length; i < length; i++) {
			goTo = suites[i] || suites;
			tpl += templates.button.format(reponses[i], goTo, n, reponses[i].upperCase());
		}
	}
	return tpl;
}

function proceed(q, n){
	set(n+1, q.innerText);
	if(n+1 < nombre){
		display(q.getAttribute("data-go")-1);
	} else {
		$("#indicator").style.background = "green";
		$(".buttons").style.display = "none";
		info("end");
	}
}



// ================
// FEEDBACK TO USER
// ================

function setProgress(n){
	$("#indicator").style.width = (n*100) / nombre + "px";
}

function setMessage(cls, msg){
	$("#holder").addClass(cls); 
	$("#message").innerHTML = msg; 
}

var triggerInfo = {
	hash: function() { setMessage("red-h", "Oups !! Something went wrong &#9785;"); },
	nf: function() { setMessage("red-h", "Questionnaire was not found. Please check the URL."); },
	xhr: function() { setMessage("red-h", "Your browser is not compatible. Please try with an other one."); },
	end: function() { setMessage("green-h", "Thank you for taking the time to complete this questionnaire."); }
}

function info(msg){
	triggerInfo[msg]();
}



// ===================
// RUN YOU CLEVER BOY
// ===================

isFirstRun();

run();

d.onkeydown = function(e){
	w.c = e.keyCode;
	k(37, setI, -1); // 37 = left
	k(39, setI, 1); // 39 = right
};

w.onhashchange = function() {
	run();
};