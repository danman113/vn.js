/*======= Todo ========*\
[X] Add children to draw
[X] Add addChild method
[X] Add better mousehandling for onclicks
[X] Add button manager
[X] Add button click manager
[X] Add imageButton
[X] Improved hover and click areas
[X] Made responsive object it's own class
[X] Add textArea
[X] Add typewriter
[X] ParseSettings
[X] Scene Stuff
[X] Import Data
[X] Add deltaTime to loop
[X] Added simple image class
[X] Add touchscreen controls
[X] Add bgMusic class
[X] Add playSound class
[X] Add update loop
[X] Add custom class
[ ] Add script support
[ ] Add more comments for classes
*/

/**
 * Main object
 * @Class
 * @param  {Object} Settings Object
 */
function vn(settings){
	//======= Variables =======\\
	

	//System\\


	//Local version of scope, used for closures
	var scope = this;
	
	parseOptions(settings);	

	//Asset variables\\


	/**
	 * An array of audio paths to load on init. 
	 * Set these to an array of all of the audio URLs and vn.js
	 * will load them when the init method is called.
	 * @type {Array.<String>}
	 */
	this.audioPaths = [];

	/**
	 * An array of image paths to load on init. 
	 * Set these to an array of all of the image URLs and vn.js 
	 * will load them when the init method is called.
	 * @type {Array.<String>}
	 */
	this.imagePaths = [];

	/**
	 * An array of scene paths to load on init. 
	 * Set these to an array of all of the scene URLs and vn.js 
	 * will load them when the init method is called.
	 * @type {Array.<String>}
	 */
	this.scenePaths = [];

	/**
	 * Keeps track of how many audio assets are loaded.
	 * @type {Number}
	 */
	this.loadedAudio = 0;

	/**
	 * Keeps track of how many image assets are loaded.
	 * @type {Number}
	 */
	this.loadedImages = 0;

	/**
	 * Keeps track of how many scenes are loaded.
	 * @type {Number}
	 */
	this.loadedScenes = 0;

	/**
	 * Contains all loaded audio assets.
	 * @type {Array}
	 */
	this.audio = [];

	/**
	 * Contains all loaded image assets.
	 * @type {Array}
	 */
	this.images = [];

	/**
	 * Contains all scene data loaded from scene objects. Objects are parsed
	 * and sent to scenes array.
	 * @type {Array}
	 */
	this.sceneData = [];

	/**
	 * Contains all scenes. Contains all main data used in vn.js
	 * @type {Array}
	 */
	this.scenes = [];


	//Scene\\


	//Keeps track of the scene and frame
	this.currentScene = -1;

	//Stuff for deltaTime
	var now = window.performance?window.performance:Date;
	this.now = function(){
		return now.now();
	};
	var deltaTime = 1;
	var lastTime = this.now();
	var target = 1000/60;
	
	//Contains all UI elements
	/**
	 * Contains all UI elements currently rendered on screen. 
	 * @type {Array.<Object>}
	 */
	this.UI = [];

	//IO\\

	/**
	 * Object of key presses.
	 * Example: 
	 * if(17 in keys){
	 * 		//Do something
	 * }
	 * @type {Object}
	 */
	this.keys = {};

	/**
	 * Contains all user-defined keybindings. Should be set pre-init
	 * @type {Array.<Object>}
	 */
	this.keybindings = [];

	/**
	 * Contains all touch objects
	 * @type {Array.<Object>}
	 */
	this.touches = [];
	this.taps = [];

	/**
	 * Keeps track of total frames
	 * @type {Number}
	 */
	this.frameCount=0;

	/**
	 * Object for mouse handling
	 * @property   {Number} mouse.x X position of mouse relative to canvas
	 * @property   {Number} mouse.y Y position of mouse relative to canvas
	 * @property   {Boolean} mouse.up If the mouse is currently being pressed
	 * @property   {Object} mouse.hover UI element mouse is hovering over
	 * @property   {Object} mouse.down UI element that is currently down
	 * @property   {Boolean} mouse.lastDown Value of mouse.up from previous frame
	 * @property   {Boolean} Requires mouseManager in update loop. mouse.click Becomes true for one frame if mouse has been clicked.
	 * @property   {Boolean} mouse.clickRelease Requires mouseManager in update loop. Becomes true for one frame after mouse has been released.
	 */
	this.mouse = {
		x:-1,
		y:-1, 
		up:true,
		hover:null,
		down:null,
		lastDown:false,
		click:false,
		clickRelease:false
	};


	//======= Methods ========\\

	//IO\\

	//keydown event
	var onKeyDown = function(e){
		scope.keys[e.keyCode] = true;
		scope.lastkey=e.keyCode;
	};

	var onKeyUp = function(e){
		delete scope.keys[e.keyCode];
	};

	//Prevents default key actions of keybindings
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

	/**
	 *	Simple linear search, not enough inputs to warrent 
	 *	a more complex data structure.
	 * @param  {String} label Label of the key to find
	 * @return {Number} Index of key in keys object
	 */
	this.findKey=function(label){
		for(var i=0;i<this.keybindings.length;i++){
			if(this.keybindings[i].label==label)
				return i;
		}
		return -1;
	};
 
	/**
	 * Simpler interface for checking if a key is pressed.
	 * @param  {String}  label Label of the key to find
	 * @return {Boolean} Wether or not that key is pressed
	 */
	this.isKeyDown = function(label){
		if(this.findKey(label)<0)
			return false;
		var keybinding = this.keybindings[this.findKey(label)];
		if(keybinding.primary in this.keys || keybinding.secondary in this.keys)
			return true;
		return false;
	};
	
	/**
	 * Rebinds key, switching keys if the key is currently used.
	 * @param  {String} label     Label of key to change
	 * @param  {Number} primary   Value to change primary key to
	 * @param  {Number} secondary Value to change secondary key to
	 */
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

	//Resize window
	var resize = function(){
		scope.settings.width = window.innerWidth;
		scope.settings.height = window.innerHeight;
		scope.canvas.width = window.innerWidth;
		scope.canvas.height = window.innerHeight;
	};

	//Mouse handlers, simple enough
	var mouseUp = function(e){
		scope.mouse.up = true;
	};

	var mouseDown = function(e){
		scope.mouse.up = false;
	};

	var mouseOut=function(e){
		scope.mouse.up=true;
	};

	//Gets mouse movement in both chrome, IE and firefox.
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

	//Makes it so mouse.click and mouse.clickRelease work
	var clickManager = function(){
		if(!scope.mouse.lastMouseUp  && scope.mouse.up){
			scope.mouse.clickRelease=true;
		} else {
			scope.mouse.clickRelease=false;
		}
		if(scope.mouse.lastMouseUp  && !scope.mouse.up){
			scope.mouse.click=true;
		} else {
			scope.mouse.click=false;
		}

		scope.mouse.lastMouseUp = scope.mouse.up;
	};

	//Touchscreen handlers
	var touchStart = function(e){
		var touches = e.touches;
		scope.touches = [];
		for (var i = 0; i < touches.length; i++) {
			scope.touches.push(new scope.touch(touches[i]));
		}
		e.preventDefault();
	};

	var touchMove = function(e){
		var touches = e.touches;
		for (var i = 0; i < touches.length; i++) {
			scope.touches[i].x=touches[i].clientX;
			scope.touches[i].y=touches[i].clientY;
			scope.touches[i].radius=touches[i].radiusX || 25;
		}
		e.preventDefault();
	};

	var touchEnd = function(e){
		var touches = e.touches;
		scope.touches = [];
		for (var i = 0; i < touches.length; i++) {
			scope.touches.push(new scope.touch(touches[i]));
		}
		var taps = e.changedTouches;
		for (var i = 0; i < taps.length; i++) {
			scope.taps.push(new scope.touch(taps[i]));
		}
	};

	var touchCancel = function(e){
		var touches = e.touches;
		scope.touches = [];
		for (var i = 0; i < touches.length; i++) {
			scope.touches.push(new scope.touch(touches[i]));
		}
		e.preventDefault();
	};

	//Initialization\\
	

	/**
	 * Initialization function, loads assets, sets IO events, and 
	 * creates the canvas if it hasn't already been created
	 * @param  {Object} target DOM object that vn.js either adds events to or appends a canvas
	 * @param  {Boolean} create Determines if vn.js creates a new canvas or uses an existing
	 */
	this.init = function(target, create){
		target = target?target:document.body;
		if(create){
			this.canvas = document.createElement("canvas");
			if(this.settings.fullscreen){
				this.settings.width = window.innerWidth;
				this.settings.height = window.innerHeight;
			}
			this.canvas.width = this.settings.width;
			this.canvas.height = this.settings.height;
			target.appendChild(this.canvas);
		}

		this.context = this.canvas.getContext("2d");
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
		this.canvas.addEventListener('touchstart', touchStart, false);
		this.canvas.addEventListener('touchmove', touchMove, false);
		this.canvas.addEventListener('touchend', touchEnd, false);
		this.canvas.addEventListener('touchcancel', touchCancel, false);
		target = 1000/this.settings.targetFps;
		this.loadScenes();
		this.loadAudio();
		this.loadImages();
		requestAnimationFrame(disp);
	};

	//Parese main argument and sets default values
	function parseOptions (options){
		var defaultSettings = {
			masterVolume:1,
			width:500,
			height:500,
			font:"arial",
			fontSize:13,
			fullscreen:true,
			preventKeyDefaults:true,
			targetFps:60
		};
		scope.settings = defaultSettings;
		for(var option in options)
			scope.settings[option] = options[option];
	}


	//Assets\\

	//No explanation needed
	var audioLoad = function(e){
		scope.loadedAudio++;
	};

	//Loops through audioPaths array and creates new audio 
	//instance for each one
	this.loadAudio = function(){
		for(var i = 0; i<this.audioPaths.length;i++){
			this.audio.push(new this.audioFile(this.audioPaths[i]));
			this.audio[i].element=document.createElement('audio');
			this.audio[i].element.src=this.audio[i].src;
			this.audio[i].element.onerror = function(e){
				alert(e);
			};
			//this.audio[i].element.addEventListener("canplaythrough",audioLoad); 
			if(this.audio[i].element.load)
				this.audio[i].element.load();
			this.audio[i].element.volume=this.settings.masterVolume;
			
			this.audio[i].element.oncanplay=audioLoad;
			this.audio[i].element.play();
			this.audio[i].element.pause();
		}
	};
	
	var imageLoad = function(e){
		scope.loadedImages++;
	};

	//Loops through imagePaths and creates one 
	this.loadImages=function(){
		for(var i=0;i<this.imagePaths.length;i++){
			this.images.push(new Image());
			this.images[i].onload = imageLoad;
			this.images[i].src = this.imagePaths[i];
			this.context.drawImage(this.images[i],-1,-1,1,1);
		}
	};

	//Parses scene JSON object and adds it to scenes.
	var addScene = function(data){
		try{
			var scene = JSON.parse(data);
			console.log(scene);
			scope.sceneData.push(scene);
			scope.scenes.push(new scope.scene(scene));
			scope.loadedScenes++;			
		} catch (e){
			error("Scene could not be read!");
			console.error(e);
		}
	};

	//Loops through scenePaths and sends AJAX calls for the JSON data
	this.loadScenes = function(){
		for(var i=0;i<this.scenePaths.length;i++){
			sendHTTP("get",this.scenePaths[i],{},addScene);
		}
	};
	

	//Display loop\\

	var disp = function(){
		deltaTime = (scope.now()-lastTime)/target;
		if(scope.update)
			scope.update(deltaTime);
		if(scope.draw)
			scope.draw(deltaTime);
		this.frameCount++;
		lastTime = scope.now();
		requestAnimationFrame(disp);
	};

	var updateUI = function(){
		for(var i = 0; i < scope.UI.length;i++){
			var obj = scope.UI[i];
			recursiveUpdate(obj, 0, 0);
		}
	};

	var recursiveUpdate = function(obj){
		var children = obj.getChildren();
		if(obj.hide)
			return false;
		if(obj.update)
			obj.update(scope,obj);
		if(children.length>0){
			var childrenHovered = false;
			for (var i = 0, len = children.length; i < len; i++) {
				recursiveUpdate(children[i]);
			}
		}
	};

	this.recursiveCall = function(method,params){
		for (var i = 0; i < scope.UI.length; i++) {
			recurse(scope.UI[i],method,params);
		}
	};
	var recurse = function(obj,method,params){
		var children = obj.getChildren();
		if(obj[method])
			obj[method](params);
		for (var i = 0; i < children.length; i++) {
			recurse(children[i],method,params);
		}
	};
	
	/**
	 * Update function that is called every frame
	 */
	this.update = function(){
		if(this.currentScene<0){
			if(this.loadedImages >= this.imagePaths.length && this.loadedAudio >= this.audioPaths.length && this.loadedScenes >= this.scenePaths.length){
				this.currentScene++;
				this.scenes[this.currentScene].currentFrame.loadFrame();
			}
		} else {
			if(this.isKeyDown("left"))
				console.log("left");
			clickManager();
			handleClicks();
			updateUI();
			tapManager();
		}
	};
 
	/**
	 * Main draw loop, used exclusively for VN.js
	 */
	this.draw = function(){
		this.context.clearRect(0,0,this.settings.width,this.settings.height);
		if(this.currentScene<0){
			var loaded = (this.loadedScenes+this.loadedImages+this.loadedAudio);
			var total = (this.audioPaths.length+this.imagePaths.length+this.scenePaths.length);
			this.context.fillStyle="grey";
			this.context.fillRect(this.settings.width/2 - 100, this.settings.height/2 - 50, 100, 50);
			this.context.fillStyle="red";
			this.context.fillRect(this.settings.width/2 - 100, this.settings.height/2 - 50, 100 *(loaded/total) , 50);
		} else {
			drawScene();
			drawTouches();
		}
	};

	//Initiates recursive scene-graph traversal
	function drawScene(){
		for(var i = 0; i < scope.UI.length;i++){
			var obj = scope.UI[i];
			recursiveDraw(obj, 0, 0);
		}
	}

	//Traverses scene graph to render UI elements
	function recursiveDraw(obj){
		var children = obj.getChildren();
		var collision = obj.isCollision(scope.mouse.x,scope.mouse.y,1,1);
		if(obj.hide)
			return false;
		if(scope.mouse.down == obj){
			if(obj.onDown){
				obj.onDown();
			} else if(obj.onHover){
				obj.onHover();
			} else if(obj.draw){
				obj.draw(scope,obj);
			}
		} else if(scope.mouse.hover == obj){
			if(obj.onHover){
				obj.onHover();
			} else if(obj.draw){
				obj.draw(scope,obj);
			}
		} else {
			if(obj.draw){
				obj.draw(scope,obj);
			}
		}
		if(children.length>0){
			var childrenHovered = false;
			for (var i = 0, len = children.length; i < len; i++) {
				recursiveDraw(children[i]);
			}
		}
	}

	//Draws touches on screen
	function drawTouches(){
		for (var i = 0; i<scope.touches.length;i++) {
			scope.context.fillStyle="grey";
			scope.context.beginPath();
			scope.context.arc(scope.touches[i].x, scope.touches[i].y, scope.touches[i].radius || 25, 0, 2 * Math.PI, false);
			scope.context.fill();
		}
	}

	//Initiates click events
	var handleClicks = function(){
		scope.mouse.hover = null;
		scope.mouse.down = null;
		for (var i = scope.UI.length - 1; i >= 0; i--) {
			var obj = scope.UI[i];
			if(clickRecursive(obj))
				return true;
			if(touchRecursive(obj))
				return true;
		}
	};

	//
	var tapManager = function(){
		scope.taps = [];
	};

	//traverses scene graph for touch collision
	var touchRecursive = function(obj){
		var children = obj.getChildren();
		if(obj.hide)
			return false;
		if(children.length>0){
			for (var i = children.length - 1; i >= 0; i--) {
				if(touchRecursive(children[i]))
					return false;
			}
		}
		for (var i = 0; i < scope.touches.length; i++) {
			var collision = obj.isCollision(scope.touches[i].x,scope.touches[i].y,scope.touches[i].radius,scope.touches[i].radius);
			if(collision){
				if(!scope.mouse.hover && !scope.mouse.down)
					scope.mouse.hover = obj;
				if(obj.onClick){
					obj.onClick(scope);
				}
			}
		}
		for (var i = 0; i < scope.taps.length; i++) {
			var collision = obj.isCollision(scope.taps[i].x,scope.taps[i].y,scope.taps[i].radius,scope.taps[i].radius);
			if(collision && !scope.mouse.down){
				if(obj.onRelease){
					obj.onRelease(scope);
					scope.mouse.down = obj;
					scope.mouse.hover = null;
				}
			}
		}
		if(scope.mouse.hover || scope.mouse.down)
			return true;
		else
			return false;
	};

	//traverses scene graph to detect collision for mouse
	var clickRecursive = function(obj){
		var children = obj.getChildren();
		if(obj.hide)
			return false;
		if(children.length>0){
			for (var i = children.length - 1; i >= 0; i--) {
				if(clickRecursive(children[i]))
					return false;
			}
		}
		var collision = obj.isCollision(scope.mouse.x,scope.mouse.y,1,1);
		if (collision && !scope.mouse.up){
			if(!scope.mouse.down){
				scope.mouse.down = obj;
				scope.mouse.hover = null;
			}
			if(collision && scope.mouse.click){
				if(obj.onClick){
					obj.onClick(scope);		
					return true;
				}
			} 
		}else if(collision && scope.mouse.click){
			if(obj.onClick){
				obj.onClick(scope);
				return true;
			}
		} else if (collision && scope.mouse.clickRelease){
			if(obj.onRelease){
				obj.onRelease(scope);
				scope.mouse.down = obj;
				scope.mouse.hover = null;
				return true;
			}
		} else if(collision){
			if(!scope.mouse.hover && !scope.mouse.down)
				scope.mouse.hover = obj;
			return false;
		} else {
			return false;
		}
	};



	//Misc\\


	//Bounding box collision detection
	var rectCollision=function(rect1x, rect1y, rect1w, rect1h, rect2x, rect2y, rect2w, rect2h){
		return rect1x+rect1w > rect2x && rect1x < (rect2x + rect2w) && rect1y+rect1h > rect2y && rect1y < (rect2y + rect2h);
	};

	var errorMessage = "vn.js error: ";

	//Shortcut for posting error messages
	var error=function(message){
		console.error(errorMessage+message);
	};

	//Argument detection for numbers. Used when 0 is a correct argument
	var a = function(arg){
		return arg === undefined || arg ===null;
	};

	//Used for custom functions in scene JSON, will set a string 
	//to a function and assign it to a specified property of an object
	var optionalFunction = function(obj, property,func,args){
		if(typeof obj[property] == "function"){

		} else if (typeof property == "string"){
			obj[property] = new Function("scope",obj[property]);
		} else {
			obj[property] = func;
		}
	};

	//Cross platform xmlhttp request 
	var sendHTTP = function(method,url,postdata,callback){
		var httpRequest;
		if (window.XMLHttpRequest) { // Mozilla, Safari, IE7+ ...
			httpRequest = new XMLHttpRequest();
		} else if (window.ActiveXObject) { // IE 6 and older
			httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
		}
		httpRequest.onreadystatechange = function(){
			if(httpRequest.readyState === 4){
				if(httpRequest.status === 200 || httpRequest.status === 0){
					callback(httpRequest.responseText);
				} else {
					console.log("Error "+httpRequest.status);	
				}
				
			}
		};
		var post=method.toLowerCase()=="get"?null:JSON.stringify(postdata);
		httpRequest.open(method, url);
		httpRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		
		//Due to the same origin policy, this will not work if a user
		//tries to run the program locally. This attempts to inform the
		//user of the problem
		try{
			httpRequest.send(post);
		} catch (e) {
			console.log(e);
			error("It appears you are trying to run this game locally, you must either upload it to a server, or use a local enviroment to run it");
		}
	};


	//======= Classes =======\\

	/**
	 * Audiofile class. Contains pointer to element, as well as 
	 * methods to play multiple sounds using a linked list 
	 * implementation
	 * @class
	 * @param  {String} src The source URL of the audio element
	 * @param  {Number} defaultVolume Default volume of audio element.
	 */
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
						this.child=new scope.audioFile(this.src);
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

		this.stop=function(keep){
			this.element.pause();
			if(!keep){
				try{
					this.element.currentTime = 0;
				} catch(e){
					console.log(e);
				}
			}
		};
	};

	/**
	 * Simple keybind data structure
	 * @class
	 * @param  {String} label     Label of the key, used to find it.
	 * @param  {Number} primary   Primary key value of key
	 * @param  {Number} secondary Secondary key value of key
	 */
	this.key = function (label, primary, secondary){
		this.label=label;
		this.primary=primary;
		this.secondary=secondary;
	};

	var objDraw = function(){
		scope.context.fillRect(this.x, this.y, this.width, this.height);
	};

	/**
	 * Basic UI object class. Contains objects for implementing scene graph
	 * and some default functionality
	 * @class
	 * @param  {Number} x X position of object
	 * @param  {Number} y Y position of object
	 * @param  {Number} width Width of object
	 * @param  {Number} height Height of object
	 */
	this.object = function(x, y, w, h){
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;
		this.parent = null;
		this.hide = false;
		var children = [];

		this.draw = objDraw;

		this.update = function(){

		};

		this.getGlobalX = function(){
			return getX(this);
		};

		this.getX = function(){
			return this.x;
		};

		var getX = function(obj){
			if(obj.parent)
				return obj.getX() + getX(obj.parent);
			else
				return obj.getX();
		};

		this.getGlobalY = function(){
			return getY(this);
		};

		this.getY = function(){
			return this.y;
		};

		var getY = function(obj){
			if(obj.parent)
				return obj.getY() + getY(obj.parent);
			else
				return obj.getY();
		};

		this.getHeight = function(){
			return this.height;
		};

		this.getWidth = function(){
			return this.width;
		};

		this.isCollision = function(rect2x, rect2y, rect2w, rect2h){
			var rect1x = this.getGlobalX(), rect1y = this.getGlobalY(), rect1w = this.getWidth(), rect1h = this.getHeight();
			return (rect1x+rect1w) > rect2x && rect1x < (rect2x + rect2w) && rect1y+rect1h > rect2y && rect1y < (rect2y + rect2h);
		};

		this.getChildren = function(){
			return children;
		};

		this.addChild = function(obj){
			obj.parent = this;
			children.push(obj);
			return obj;
		};
	};

	//Used to show what parameters object takes
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
		fontColor:"Color: Sets the color of text",
		fontYOffsetPercent:"Number: ",
		text:"Label"
	};

	
	/**
	 * Basic responsive object class. Uses percent values for both width and height. 
	 * Will use parent's coordinate values if applicable
	 * @class
	 * @param  {Object} options Options object
	 * @param  {Number} options.x strict X value of object
	 * @param  {Number} options.y strict Y value of object
	 * @param  {Number} options.width strict width value of object
	 * @param  {Number} options.height height value of object
	 * @param  {Number} options.xPercent Percentage value of object's horizontal position
	 * @param  {Number} options.yPercent Percentage value of object's vertical position
	 * @param  {Number} options.widthPercent Percentage value of object's width
	 * @param  {Number} options.heightPercent Percentage value of object's height
	 */
	this.responsiveObject = function(options){
		if((a(options.xPercent) && a(options.x)) || (a(options.yPercent) && a(options.y)) || (a(options.width) && a(options.widthPercent)) || (a(options.height) && a(options.heightPercent))){
			error("Missing required parameters. Parameter format: ");
			console.log(responsiveButtonParameter);
			return false;
		}
		scope.object.call(this, (options.x || 0), (options.y || 0), (options.width || 0), (options.height || 0));
		var init = function(obj){
			for(var option in options){
				obj[option] = options[option];
			}
		};
		init(this);
		this.widthPercent = options.widthPercent;
		this.heightPercent = options.heightPercent;
		this.xPercent = options.xPercent;
		this.yPercent = options.yPercent;
		this.getGlobalX = function(){
			return getX(this);
		};
		var getX = function(obj){
			if(obj.parent)
				return obj.getX() + getX(obj.parent);
			else
				return obj.getX();
		};
		this.getGlobalY = function(){
			return getY(this);
		};
		var getY = function(obj){
			if(obj.parent)
				return obj.getY() + getY(obj.parent);
			else
				return obj.getY();
		};
		
		this.getWidth = function(){
			var w = scope.settings.width;
				if(this.parent)
					w = this.parent.getWidth();
			return this.widthPercent?w*this.widthPercent:this.width;
		};
		this.getHeight = function(){
			var h = scope.settings.height;
			if(this.parent)
					h = this.parent.getHeight();
			return this.heightPercent?h*this.heightPercent:this.height;
		};
		this.getX = function(){
			var x = scope.settings.width;
			if(this.parent)
				x = this.parent.getWidth();
			return this.xPercent?x*this.xPercent:this.x;
		};
		this.getY = function(){
			var y = scope.settings.height;
			if(this.parent)
				y = this.parent.getHeight();
			return this.yPercent?y*this.yPercent:this.y;
		};

	};

	//Draw methods for button class, made outside scope for better memory usage
	var buttonDraw = function(){
		var obj = this;
		scope.context.fillStyle = "#084B8A";
		scope.context.fillRect(obj.getGlobalX(),obj.getGlobalY(),obj.getWidth(),obj.getHeight());
		scope.context.fillStyle = "#2E9AFE";
		scope.context.fillRect(obj.getGlobalX(),obj.getGlobalY(),obj.getWidth(),obj.getHeight()*0.75);
		if(obj.text){
			scope.context.font = (obj.getHeight()/2)*obj.fontScale + "px "+obj.font; 
			scope.context.fillStyle = obj.fontColor;
			scope.context.fillText(obj.text,obj.getGlobalX()+Math.max(obj.getWidth()/2 - scope.context.measureText(obj.text).width/2,0),obj.getGlobalY()+(obj.getHeight()/2)+((obj.getHeight()/2)*obj.fontScale)*0.4+obj.getHeight()*obj.fontYOffsetPercent,obj.getWidth());
		}
	};

	var buttonOnHover = function(){
		var obj = this;
		scope.context.fillStyle = "#084B8A";
		scope.context.fillRect(obj.getGlobalX(),obj.getGlobalY(),obj.getWidth(),obj.getHeight());
		if(obj.text){
			scope.context.font = (obj.getHeight()/2)*obj.fontScale + "px "+obj.font; 
			scope.context.fillStyle = obj.fontColor;
			scope.context.fillText(obj.text,obj.getGlobalX()+Math.max(obj.getWidth()/2 - scope.context.measureText(obj.text).width/2,0),obj.getGlobalY()+(obj.getHeight()/2)+((obj.getHeight()/2)*obj.fontScale)*0.4+obj.getHeight()*obj.fontYOffsetPercent,obj.getWidth());
		}
	};

	/**
	 * Basic button class. You can hover over it and click it
	 * @class
	 * @param {Object} options options object
	 * @param {String} options.text Text that button displays in center
	 * @param {Number} options.fontScale How much the font scales with the width
	 * @param {String} options.fontColor Color of the text
	 * @param {String} options.font Font that is used.
	 * @param {Number} options.fontYOffsetPercent Adds an offset of a certain amount of pixels
	 * @param {String | Function} options.onClick Custom function that is called when button is clicked
	 *                  		  and in the down position.
	 * @param {String | Function} options.onRelease Custom function that is called when button is released
	 *                  		  and in the up position.
	 * @extends responsiveObject
	 */
	this.button = function(options){
		scope.responsiveObject.call(this, options);
		this.text = options.text;
		this.fontScale = options.fontScale?options.fontScale:1;
		this.fontColor = options.fontColor?options.fontColor:"white";
		this.font = options.font?options.font:scope.settings.font;
		this.fontYOffsetPercent = options.fontYOffsetPercent?options.fontYOffsetPercent:-0.15;
		this.draw = buttonDraw;
		this.onHover = buttonOnHover;
		this.onDown = buttonOnHover;
		optionalFunction(this,"onClick",function(){
			console.log(this);
		});

		optionalFunction(this,"onRelease",function(){
			console.log(this);
		});
	};

	var imageButtonParameter = {
		imageUp:"!Image: Normal \"Up\" position of the button. Will be used for others if no hover is provided",
		imageHover:"Image: Image shown when mouse is hovering. Will replace imageDown",
		imageDown:"Image shown when mouse is down"
	};

	var imageButtonDraw = function(obj, image){
		scope.context.drawImage(image,obj.getGlobalX(),obj.getGlobalY(),obj.getWidth(),obj.getHeight());
		if(obj.text){
			scope.context.font = (obj.getHeight()/2)*obj.fontScale + "px "+obj.font; 
			scope.context.fillStyle = obj.fontColor;
			scope.context.fillText(obj.text,obj.getGlobalX()+Math.max(obj.getWidth()/2 - scope.context.measureText(obj.text).width/2,0),obj.getGlobalY()+(obj.getHeight()/2)+((obj.getHeight()/2)*obj.fontScale)*0.4+obj.getHeight()*obj.fontYOffsetPercent,obj.getWidth());
		}
	};

	/**
	 * Image button, you can use custom images for the up, hover, and down states of the button
	 * @class
	 * @param  {Object} options Options object
	 * @param  {Object} options.imageUp Image that is displayed when the mouse is not over the button
	 * @param  {Object} options.imageHover Image that is displayed when the mouse is over the button
	 * @param  {Object} options.imageDown Image that is displayed when the mouse is clicking the object
	 */
	this.imageButton = function(options){
		scope.button.call(this,options);
		if(!options.imageUp){
			error("Missing required parameters. Parameter format: ");
			console.log(imageButtonParameter);
		}
		this.fontYOffsetPercent = this.fontYOffsetPercent!==-0.15?this.fontYOffsetPercent:0;
		this.imageUp = options.imageUp;
		this.imageHover = options.imageHover?options.imageHover:this.imageUp;
		this.imageDown = options.imageDown?options.imageDown:this.imageHover;
		this.draw = function(){imageButtonDraw(this, this.imageUp);};
		this.onHover = function(){imageButtonDraw(this, this.imageHover);};
		this.onDown = function(){imageButtonDraw(this, this.imageDown);};		
	};

	var colorDraw = function(){
		if(this.backgroundColor){
			scope.context.fillStyle = this.backgroundColor;
			scope.context.fillRect(this.getGlobalX(),this.getGlobalY(),this.getWidth(),this.getHeight());
		}
	};

	//Really simple color square. It simply draws a rect.
	this.colorSquare = function(options){
		scope.responsiveObject.call(this, options);
		this.backgroundColor = options.backgroundColor;
		this.draw = colorDraw;
		this.onClick = function(){};
		this.onRelease = function(){};
	};

	/**
	 * Textarea class, it renders text in a specific area 
	 * and will wrap the text as best it can given it's dimensions
	 * @class
	 * @param  {Object} options Options object
	 * @param  {Number} options.fontSize Size of text
	 * @param  {String} options.fontColor Color of text
	 * @param  {String} options.font Font of text
	 * @param  {String} options.text Text that the textArea displays
	 * @param  {Number} options.lineHeight Height between lines of text
	 * @param  {Boolean} options.showSize Shows the width and height of textArea
	 * @extends responsiveObject
	 */
	this.textArea = function(options){
		scope.responsiveObject.call(this, options);
		if(!options.text)
			error("Missing required parameters. Missing parameter: \"text\"");
		this.fontSize = options.fontSize?options.fontSize:scope.settings.fontSize;
		this.fontColor = options.fontColor?options.fontColor:"black";
		this.font = options.font?options.font:scope.settings.font;
		this.text = options.text;
		this.lineHeight = options.lineHeight?options.lineHeight:0;
		this.showSize = false;
		var textMatrix = [];
		var lastHeight = this.getHeight();
		var lastWidth = this.getWidth();
		optionalFunction(this,"onClick",function(){
			console.log(this);
		});
		optionalFunction(this,"onRelease",function(){
			console.log(this);
		});
		var textDraw = function(){
			if(textMatrix.length<=0 || (lastHeight!=this.getHeight() || lastWidth!=this.getWidth()))
				this.format();
			if(this.showSize){
				scope.context.fillStyle = "rgba(0,0,0,0.5)";
				scope.context.fillRect(this.getGlobalX(),this.getGlobalY(),this.getWidth(),this.getHeight());
			}
			for(var i = 0;i<textMatrix.length;i++){
				if(!(this.getGlobalY()+(this.fontSize+this.lineHeight)*(i+1)>=this.getHeight()+this.getGlobalY())){
					scope.context.font = this.fontSize+"px "+this.font;
					scope.context.fillStyle = this.fontColor;
					scope.context.fillText(textMatrix[i],this.getGlobalX(),this.getGlobalY()+(this.fontSize+this.lineHeight)*(i+1));	
				}
			}
		};
		var formatText = function(obj){
			lastHeight = obj.getHeight();
			lastWidth = obj.getWidth();
			var text = obj.text;
			var lastSpace= 0;
			textMatrix = [];
			scope.context.font = obj.fontSize+"px "+obj.font;
			for(var i = 0,count = text.length;i<count;i++){
				if(text[i]==" ")
					lastSpace = i;
				if(scope.context.measureText(text.substr(0,i)).width>=obj.getWidth()-10){
					textMatrix.push(text.substr(0,lastSpace));
					text = text.substr(lastSpace+1,text.length);
					i = 0;
				}
			}
			textMatrix.push(text);
		};

		this.draw = textDraw;

		this.format = function(){
			formatText(this);
		};
	};

	/**
	 * Like a textarea, but will show each letter gradually, as if 
	 * typed on a typewriter or on an old computer. Lots of customization 
	 * options
	 * @class
	 * @param  {Object} options Options object
	 * @param  {Number} options.speed milliseconds per character type. Smaller is faster.
	 * @extends responsiveObject
	 * @extends textArea
	 */
	this.typewriter = function(options){
		scope.responsiveObject.call(this, options);
		if(!options.text)
			error("Missing required parameters. Missing parameter: \"text\"");
		this.fontSize = options.fontSize?options.fontSize:scope.settings.fontSize;
		this.fontColor = options.fontColor?options.fontColor:"black";
		this.font = options.font?options.font:scope.settings.font;
		this.text = options.text;
		this.lineHeight = options.lineHeight?options.lineHeight:0;
		this.showSize = options.showSize?true:false;
		this.lastTyped = -1;
		this.finished = false;
		var textMatrix = [];
		var lastHeight = this.getHeight();
		var lastWidth = this.getWidth();
		var text = this.text;
		var lastSpace= 0;
		var index = 0;
		var matrixIndex = 0;
		var typed = 0;
		this.speed = options.speed?options.speed:50;
		optionalFunction(this,"onRelease",function(){console.log(this.finished);this.skip();});
		this.onClick = function(){};
		var type = function(obj){
			lastHeight = obj.getHeight();
			lastWidth = obj.getWidth();
			if(textMatrix.length<=0)
				textMatrix.push("");
			index++;
			typed++;
			scope.context.font = obj.fontSize+"px "+obj.font;
			if(text[index-1]==" ")
				lastSpace = index-1;
			if(scope.context.measureText(text.substr(0,index)).width>=obj.getWidth()-10){
				textMatrix[matrixIndex] = textMatrix[matrixIndex].substr(0, lastSpace);
				textMatrix.push(text.substr(0,lastSpace));
				matrixIndex++;
				text = text.substr(lastSpace+1,text.length);
				index = 0;
			}
			textMatrix[matrixIndex]= text.substr(0,index);
			if(!text[index]){
				obj.finished = true;
				return;
			}
		};

		this.skip = function(){
			rebuild(this, this.text.length*2);
			this.finished = true;
		};

		this.reset = function(){
			textMatrix = [];
			text = this.text;
			lastSpace= 0;
			index = 0;
			matrixIndex = 0;
			typed = 0;
			this.finished = false;
			this.lastTyped = -1;
		};

		var rebuild = function(obj,x){
			if(x===0) return;
			textMatrix = [];
			text = obj.text;
			lastSpace= 0;
			index = 0;
			matrixIndex = 0;
			typed = 0;
			scope.context.font = obj.fontSize+"px "+obj.font;
			for(var i = 0,count = x;i<count;i++){
				type(obj);	
			}
		};

		this.type = function(){
			if(this.lastTyped<0)
				this.lastTyped = Date.now();
			var value = Math.floor((Date.now()-this.lastTyped)/this.speed);
			if(value>0){
				for(var i = 0; i<value;i++)
					type(this);
				this.lastTyped = Date.now();
			}
		};

		this.draw = function(){
			if((lastHeight!=this.getHeight() || lastWidth!=this.getWidth()))
				rebuild(this, typed);
			this.type();
			if(this.showSize){
				scope.context.fillStyle = "rgba(0,0,0,0.5)";
				scope.context.fillRect(this.getGlobalX(),this.getGlobalY(),this.getWidth(),this.getHeight());
			}
			for(var i = 0;i<textMatrix.length;i++){
				if(!(this.getGlobalY()+(this.fontSize+this.lineHeight)*(i+1)>=this.getHeight()+this.getGlobalY())){
					scope.context.font = this.fontSize+"px "+this.font;
					scope.context.fillStyle = this.fontColor;
					scope.context.fillText(textMatrix[i],this.getGlobalX(),this.getGlobalY()+(this.fontSize+this.lineHeight)*(i+1));	
				}
			}
		};
	};

	/**
	 * Simple image on the screen. Will use default image width/height without
	 * parameters.
	 * @class
	 * @param  {Object} options Options object
	 * @param  {Object} options.image Image that is displayed
	 * @extends responsiveObject
	 */
	this.image = function(options){
		if(options.image && a(options.width) && a(options.height)){
			options.width = options.image.width;
			options.height = options.image.height;
		}
		scope.button.call(this,options);
		if(!options.image){
			error("Missing required parameters. image.image.");
		}
		this.fontYOffsetPercent = this.fontYOffsetPercent!==-0.15?this.fontYOffsetPercent:0;
		this.image = options.image;
		this.draw = function(){imageButtonDraw(this, this.image);};
		this.onHover = this.draw;
		this.onDown = this.draw;	
	};

	/**
	 * Plays an audio track constantly 
	 * @class
	 * @param  {Object} options Options object
	 * @param  {Number} options.audioElementIndex index of audio element
	 * @param  {Number} options.volume Volume of element
	 */
	this.bgMusic = function(options){
		scope.responsiveObject.call(this, {x:5,y:5,width:5,height:5});
		this.drawHelper = options.drawHelper === false;
		this.backgroundColor = "rgba(0,0,0,.5)";
		this.audioElementIndex = options.audioElementIndex===undefined?-1:options.audioElementIndex;
		this.volume = options.volume === undefined?0:options.volume;
		this.draw = function(){
			if(this.drawHelper){
				colorDraw();
			}
		};

		this.update = function(){
			if(this.audioElementIndex>=0){
				scope.audio[this.audioElementIndex].play(this.volume);
			}
		};

		this.stop = function(elements){
			var sounds = [];
			for (var i = 0; i < elements.length; i++) {
				if(elements[i].audioElementIndex>=0){
					sounds.push(elements[i].audioElementIndex);
				}
			}
			console.log(sounds);
			if(this.audioElementIndex>=0 && sounds.indexOf(this.audioElementIndex)<0){
				scope.audio[this.audioElementIndex].stop();
			}
		};
	};

	/**
	 * Plays a sound once, then never again
	 * @class
	 * @param  {Object} options Options object
	 * @param  {Number} options.audioElementIndex index of audio element
	 * @param  {Number} options.volume Volume of element
	 */
	this.sound = function(options){
		scope.responsiveObject.call(this, {x:5,y:5,width:5,height:5});
		this.drawHelper = options.drawHelper !== false;
		this.backgroundColor = "rgba(0,0,0,.5)";
		this.audioElementIndex = options.audioElementIndex===undefined?-1:options.audioElementIndex;
		this.volume = options.volume === undefined?0:options.volume;
		this.played = false;
		this.draw = function(){
			if(this.drawHelper){
				colorDraw();
			}
		};

		this.update = function(){
			if(this.audioElementIndex>=0){
				if(scope.audio[this.audioElementIndex].element.currentTime>0)
					this.played = true;
				if(!this.played)
				scope.audio[this.audioElementIndex].play(this.volume);
			}
		};

		this.stop = function(elements){
			var sounds = [];
			this.played = false;
			if(this.audioElementIndex>=0){
				scope.audio[this.audioElementIndex].stop();
			}
		};
	};

	/**
	 * A custom object with a custom draw and update function
	 * @class
	 * @param  {Object} options Options object
	 * @param  {String | function} options.draw Custom draw function
	 * @param  {String | function} options.update Custom update function
	 * @extends responsiveObject
	 */
	this.custom = function(options){
		scope.responsiveObject.call(this, options);
		if(typeof options.draw === "string"){
			this.draw = new Function(["scope","obj"],options.draw);
		} else if (typeof options.draw === "function"){
			this.draw = options.draw;
		} else {
			this.draw = function(){

			};
		}

		if(typeof options.update === "string"){
			this.update = new Function(["scope","obj"],options.update);
		} else if (typeof options.update === "function"){
			this.update = options.update;
		} else {
			this.update = function(){

			};
		}

	};
	
	//
	/**
	 * Scene class, uses javascript object hash table for quick searching 
	 * of frames. Also will take a scene JSON object on initialization and 
	 * make a local instance of it with all associated methods 
	 * @class
	 * @param  {Object} options Options object
	 */
	this.scene = function(options){
		var init = function(obj){
			//Add frames to scene
			for(var i = 0; i<options.frames.length;i++){
				var frame = new scope.frame(options.frames[i]);
				obj.search[frame.label] = frame;
				obj.frames.push(frame);
				if(i === 0)
					obj.currentFrame = frame;
			}
			//adds connections
			for(var i = 0; i<options.frames.length;i++){
				obj.frames[i].connections=[];
				var connections = options.frames[i].connections?options.frames[i].connections:[];
				for(var x = 0, count = connections.length; x < count;x++){
					if(connections[x]){
						if(connections[x] == "next"){
							if(i+1<obj.frames.length){
								obj.frames[i].connections.push(obj.frames[i+1]);
							}
						} else {
							if(obj.search[connections[x]]){
								obj.frames[i].connections.push(obj.search[connections[x]]);
							}
						}
					}
				}

			}
		};
		this.label = options.label?options.label:"Frame "+Date.now();
		this.search = {};
		this.frames = [];
		this.lastFrame = null;
		this.currentFrame = null;
		init(this);
		this.goToConnection = function(index){
			if(!this.currentFrame)
				return false;
			if(this.currentFrame.connections.length>0){
				for (var i = this.currentFrame.objects.length - 1; i >= 0; i--) {
					if(this.currentFrame.objects[i].reset)
						this.currentFrame.objects[i].reset();
				}
				this.currentFrame.connections[index].loadFrame();
				this.lastFrame = this.currentFrame;
				this.currentFrame = this.currentFrame.connections[index];
			}
		};
		this.next = function(){
			if(!this.currentFrame)
				return false;
			if(this.currentFrame.connections.length>0){
				for (var i = this.currentFrame.objects.length - 1; i >= 0; i--) {
					if(this.currentFrame.objects[i].reset)
						this.currentFrame.objects[i].reset();
				}
				this.currentFrame.connections[0].loadFrame();
				this.lastFrame = this.currentFrame;
				this.currentFrame = this.currentFrame.connections[0];
			}
		};
	};

	/**
	 * Frame class, contains UI objects that will be loaded on the scene.
	 * @param  {Object} options Options object
	 */
	this.frame = function(options){
		var init = function(obj){
			for(var i = 0; i<options.objects.length;i++){
				switch(options.objects[i].type){
					case "button":
						obj.objects.push(new scope.button(options.objects[i]));
					break;
					case "imageButton":
						obj.objects.push(new scope.imageButton(options.objects[i]));
					break;
					case "textArea":
						obj.objects.push(new scope.textArea(options.objects[i]));
					break;
					case "typewriter":
						obj.objects.push(new scope.typewriter(options.objects[i]));
					break;
				}
			}
		};
		this.label = options.label?options.label:"Frame "+Date.now()+Math.floor(Math.random()*0xFFFFF);
		this.objects = [];
		this.connections = [];
		init(this);
		this.loadFrame = function(){
			scope.recursiveCall("stop",this.objects);
			scope.UI = this.objects;
		};
	};

	/**
	 * Touch Object
	 * @param  {Object} e event of ontouch event
	 */
	this.touch = function(e){
		this.x = e.clientX;
		this.y = e.clientY;
		this.radius = e.radiusX || 25;
	};
}


