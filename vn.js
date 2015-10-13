/*======= Todo ========*\
[ ] Add better mousehandling for onclicks
[ ] Add button manager
[ ] Add imageButton
[ ] Add textArea
[ ] ParseSettings
[ ] Scene Stuff
[ ] Import Data


*/

function vn(settings){
	//======= Variables =======\\
	

	//System

	var scope = this;
	

	//Settings variables

	var defaultSettings = {
		masterVolume:1,
		width:500,
		height:500,
		font:"arial",
		fontSize:13,
		fullscreen:true,
		preventKeyDefaults:true
	};

	this.settings=settings?settings:defaultSettings;
	

	//Asset variables

	this.audioPaths = [];
	this.imagePaths = [];
	this.scenePaths = [];
	this.loadedAudio = 0;
	this.loadedImages = 0;
	this.loadedScenes = 0;
	this.audio = [];
	this.images = [];
	this.scenes = [];


	//Scene

	this.scene = -1;
	this.frame = 0;
	this.UI = [];

	//IO
	this.keys = {};
	this.keybindings = [];
	this.mouse = {x:-1, y:-1, up:true, hover:-1};


	//======= Methods ========\\

	//IO
	var onKeyDown = function(e){
		scope.keys[e.keyCode] = true;
		scope.lastkey=e.keyCode;
	};

	var onKeyUp = function(e){
		delete scope.keys[e.keyCode];
	};

	var prevent=function(e){
		var keys=[];
		for(var i=0;i<scope.keybindings.length;i++){
			keys.push(scope.keybindings[i].primary);
			keys.push(scope.keybindings[i].secondary);
		}
		if(keys.indexOf(e.keyCode) > -1) {
			e.preventDefault();
		}
	};

	var resize = function(){
		visualNovel.settings.width = window.innerWidth;
		visualNovel.settings.height = window.innerHeight;
		visualNovel.canvas.width = window.innerWidth;
		visualNovel.canvas.height = window.innerHeight;
	};

	var mouseUp = function(e){
		scope.mouse.up = true;
	};

	var mouseDown = function(e){
		scope.mouse.up = false;
	};

	var mouseOut=function(e){
		scope.mouse.up=true;
	};

	var mouseMove=function(e){
		if(e.offsetX) {
			scope.mouse.x = e.offsetX;
			scope.mouse.y = e.offsetY;
		} else if(e.layerX) {
			var box=scope.canvas.getBoundingClientRect();
			scope.mouse.x = e.layerX-box.left;
			scope.mouse.y = e.layerY-box.top;
		}
	};

	//Initialization
	
	this.init = function(target, create){
		target = target?target:document.body;
		if(create){
			this.canvas = document.createElement("canvas");
			this.canvas.width = this.settings.width;
			this.canvas.height = this.settings.height;
			this.context = this.canvas.getContext("2d");
		}

		window.addEventListener("keydown", onKeyDown, false);
		window.addEventListener("keyup", onKeyUp, false);
		if(this.settings.preventKeyDefaults)
			window.addEventListener("keydown", prevent, false);
		if(this.settings.fullscreen)
			window.addEventListener("resize", resize, false);
		this.canvas.addEventListener('mouseup', mouseUp, false);
		this.canvas.addEventListener('mousedown', mouseDown, false);
		this.canvas.addEventListener('mousemove', mouseMove, false);
		this.canvas.addEventListener('mouseout', mouseOut, false);
		target.appendChild(this.canvas);
		this.loadScenes();
		this.loadAudio();
		this.loadImages();
		requestAnimationFrame(disp);
	};

	var parseOptions = function(){

	};


	//Assets
	this.setAudioPaths = function(paths){
		this.audioPaths = paths;
	};

	var audioLoad = function(e){
		scope.loadedAudio++;
	};

	this.loadAudio = function(){
		for(var i = 0; i<this.audioPaths.length;i++){
			this.audio.push(new this.audioFile(this.audioPaths[i]));
			this.audio[i].element=document.createElement('audio');
			this.audio[i].element.src=this.audio[i].src;
			this.audio[i].element.volume=this.settings.masterVolume;
			this.audio[i].element.oncanplaythrough=audioLoad;
			if(this.audio[i].element.load)
				this.audio[i].element.load();
			this.audio[i].element.play();
			this.audio[i].element.pause();
		}
	};
	
	var imageLoad = function(e){
		scope.loadedImages++;
	};

	this.loadImages=function(){
		for(var i=0;i<this.imagePaths.length;i++){
			this.images.push(new Image());
			this.images[i].onload = imageLoad;
			this.images[i].src = this.imagePaths[i];
			this.context.drawImage(this.images[i],-1,-1,1,1);
		}
	};

	var addScene = function(data){
		try{
			var scene = JSON.parse(data);
			scope.scenes.push(scene);
			scope.loadedScenes++;			
		} catch (e){
			error("Scene Path not found!");
		}

	};

	this.loadScenes = function(){
		for(var i=0;i<this.scenePaths.length;i++){
			sendHTTP("get",this.scenePaths[i],{},addScene);
		}
	};

	
	//IO

	this.findKey=function(label){
		for(var i=0;i<this.keybindings.length;i++){
			if(this.keybindings[i].label==label)
				return i;
		}
		return -1;
	};

	this.isKeyDown = function(label){
		if(this.findKey(label)<0)
			return false;
		var keybinding = this.keybindings[this.findKey(label)];
		if(keybinding.primary in this.keys || keybinding.secondary in this.keys)
			return true;
	};
	
	this.rebind=function(label,primary,secondary){
		var k=this.findKey(label);
		if(k>=0){
			if(!primary)
				primary=this.keybindings[k].primary;
			if(!secondary)
				secondary=this.keybindings[k].secondary;
			for(var i=0;i<this.keybindings.length;i++){
				if(i!=k && this.keybindings[i].primary==primary)
					this.keybindings[i].primary=this.keybindings[k].primary;
				if(i!=k && this.keybindings[i].secondary==secondary)
					this.keybindings[i].secondary=this.keybindings[k].secondary;
			}
			this.keybindings[k].primary=primary;
			this.keybindings[k].secondary=secondary;
		} 
	};


	//Display loop

	var disp = function(){
		if(scope.update)
			scope.update();
		if(scope.draw)
			scope.draw();
		requestAnimationFrame(disp);
	};
	
	this.update = function(){
		if(this.scene<0){
			if(this.loadedImages >= this.imagePaths.length && this.loadedAudio >= this.audioPaths.length && this.loadedScenes >= this.scenePaths.length){
				this.scene++;
			}
		} else {
			if(this.isKeyDown("left"))
				console.log("left");
			console.log(scope.mouse);
		}
	};

	this.draw = function(){
		this.context.clearRect(0,0,this.settings.width,this.settings.height);
		if(this.scene<0){
			var loaded = (this.loadedScenes+this.loadedImages+this.loadedAudio);
			var total = (this.audioPaths.length+this.imagePaths.length+this.scenePaths.length);
			this.context.fillStyle="grey";
			this.context.fillRect(this.settings.width/2 - 100, this.settings.height/2 - 50, 100, 50);
			this.context.fillStyle="red";
			this.context.fillRect(this.settings.width/2 - 100, this.settings.height/2 - 50, 100 *(loaded/total) , 50);
		} else {
			drawScene();
		}
	};

	function drawScene(){
		for(var i = 0; i<scope.UI.length;i++){
			scope.UI[i].draw();
		}
	}


	//Misc

	var errorMessage = "vn.js error: ";

	var error=function(message){
		console.error(errorMessage+message);
	};

	var a = function(arg){
		return arg === undefined && arg ===null;
	};


	var sendHTTP = function(method,url,postdata,callback){
		var httpRequest;
		if (window.XMLHttpRequest) { // Mozilla, Safari, IE7+ ...
			httpRequest = new XMLHttpRequest();
		} else if (window.ActiveXObject) { // IE 6 and older
			httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
		}
		httpRequest.onreadystatechange = function(){
			if(httpRequest.readyState === 4){
				if(httpRequest.status === 200){
					callback(httpRequest.responseText);
				} else {
					console.log("Error "+httpRequest.status);	
				}
				
			}
		};
		var post=method.toLowerCase()=="get"?null:JSON.stringify(postdata);
		httpRequest.open(method, url);
		httpRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		try{
			httpRequest.send(post);
		} catch (e) {
			console.log(e);
			error("It appears you are trying to run this game locally, you must either upload it to a server, or use a local enviroment to run it");
		}
		
	};

	//======= Classes =======\\

	this.audioFile = function (src,defaultVolume){
		this.src = src;
		this.loaded = false;
		this.element;
		this.child;
		//Plays sound. If it needs to create multiple sounds, it creates
		//another child and plays that.
		this.play=function(volume,multiple){
			if(a(volume) && this.element.volume!=volume)
				this.element.volume=volume;
			if(a(multiple))
				multiple=false;
			if(multiple){
				if(this.element.paused)
					this.element.play();
				else{
					if(!this.child){
						this.child=new audioFile(this.src);
						this.child.element=document.createElement('audio');
						this.child.element.src=this.child.src;
						this.child.element.volume=this.element.volume;
						console.log("Created new audio element " + this.src);
					}
					this.child.play(this.element.volume,multiple);
				}
			} else {
				this.element.play();
			}
		};

		this.stop=function(){
			this.element.pause();
			try{
				this.element.currentTime = 0;
			} catch(e){
				console.log(e);
			}
		};
	};

	this.key = function (label, primary, secondary){
		this.label=label;
		this.primary=primary;
		this.secondary=secondary;
	};

	var objDraw = function(){
		scope.context.fillRect(this.x, this.y, this.width, this.height);
	};

	this.object = function(x, y, w, h){
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;

		this.draw = objDraw;

		this.update = function(){

		};
	};

	var buttonDraw = function(){
		scope.context.fillStyle = "#084B8A";
		scope.context.fillRect(this.x,this.y,this.width,this.height);
		scope.context.fillStyle = "#2E9AFE";
		scope.context.fillRect(this.x,this.y,this.width,this.height*0.75);
		if(this.label){
			scope.context.font = (this.height/2)*this.fontScale + "px "+scope.settings.font; 
			scope.context.fillStyle = "white";
			scope.context.fillText(this.label,this.x+Math.max(this.width/2 - scope.context.measureText(this.label).width/2,0),this.y+(this.height/2)*this.fontScale,this.width);
		}
	};

	var buttonOnHover = function(){
		scope.context.fillStyle = "#084B8A";
		scope.context.fillRect(this.x,this.y,this.width,this.height);
		if(this.label){
			scope.context.font = (this.height/2)*this.fontScale + "px "+scope.settings.font; 
			scope.context.fillStyle = "white";
			scope.context.fillText(this.label,this.x+Math.max(this.width/2 - scope.context.measureText(this.label).width/2,0),this.y+(this.height/2)*this.fontScale,this.width);
		}
	};

	var buttonParameter = {
		x:"!Number",
		y:"!Number",
		width:"!Number",
		height:"!Number",
		fontScale:"Number: Scales the font",
		label:"Label"
	};

	this.button = function(options){
		if(a(options.x) || a(options.y) || a(options.width) || a(options.height)){
			error("Missing required parameters. Parameter format: "+JSON.stringify(buttonParameter));
			return false;
		}
		scope.object.call(this, options.x, options.y, options.width, options.height);
		this.label = options.label;
		this.fontScale = options.fontScale?options.fontScale:1;
		this.draw = buttonDraw;
		this.onHover = buttonOnHover;
		this.onDown = function(){

		};
		this.onClick = function(){

		};

	};

	var responsiveDraw = function(){
		scope.context.fillStyle = "#084B8A";
		scope.context.fillRect(this.getResponsiveX(),this.getResponsiveY(),this.getResponsiveWidth(),this.getResponsiveHeight());
		scope.context.fillStyle = "#2E9AFE";
		scope.context.fillRect(this.getResponsiveX(),this.getResponsiveY(),this.getResponsiveWidth(),this.getResponsiveHeight()*0.75);
		if(this.label){
			scope.context.font = (this.getResponsiveHeight()/2)*this.fontScale + "px "+scope.settings.font; 
			scope.context.fillStyle = "white";
			scope.context.fillText(this.label,this.getResponsiveX()+Math.max(this.getResponsiveWidth()/2 - scope.context.measureText(this.label).width/2,0),this.getResponsiveY()+(this.getResponsiveHeight()/2),this.getResponsiveWidth());
		}
	};

	var responsiveButtonParameter = {
		xPercent:"?!Number: Can be substituted for x",
		x:"!Number",
		yPercent:"?!Number: Can be substituted for y",
		y:"!Number",
		widthPercent:"?!Number: Can be substituted with width",
		width:"!Number",
		heightPercent:"?!Number: Can be substituted with height",
		height:"!Number",
		fontScale:"Number: Scales the font",
		label:"Label"
	};

	this.responsiveButton = function(options){
		if((a(options.xPercent) || a(options.x)) || (a(options.yPercent) || a(options.y)) || (a(options.width) || a(options.widthPercent)) || (a(options.height) || a(options.heightPercent))){
			error("Missing required parameters. Parameter format: "+JSON.stringify(responsiveButtonParameter));
			return false;
		}
		var obj = {x:options.x || 0, y:options.y || 0, width:options.width || 0, height:options.height || 0};
		scope.button.call(this, obj);
		this.widthPercent = options.widthPercent;
		this.heightPercent = options.heightPercent;
		this.xPercent = options.xPercent;
		this.yPercent = options.yPercent;
		this.label = options.label;
		this.draw = responsiveDraw;
		this.onHover = responsiveDraw;
		this.getResponsiveWidth = function(){
			return this.widthPercent?scope.settings.width*this.widthPercent:this.width;
		};
		this.getResponsiveHeight = function(){
			return this.heightPercent?scope.settings.height*this.heightPercent:this.height;
		};
		this.getResponsiveX = function(){
			return this.xPercent?scope.settings.width*this.xPercent:this.x;
		};
		this.getResponsiveY = function(){
			return this.yPercent?scope.settings.height*this.yPercent:this.y;
		};
	};

}


