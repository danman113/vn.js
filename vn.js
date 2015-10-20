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
[ ] Add deltaTime to loop
[ ] Add touchscreen controls
*/

//Main object
function vn(settings){
	//======= Variables =======\\
	

	//System\\


	//Local version of scope, used for closures
	var scope = this;
	

	//Settings variables\\


	//Default settings object, contains all default settings.

	parseOptions(settings);	

	//Asset variables\\


	//Path variables. Set these to an array of all of the asset URLs and the
	//Application will load them when the init method is called
	this.audioPaths = [];
	this.imagePaths = [];
	this.scenePaths = [];

	//Keeps track of how many assets are loaded. Used for loading
	this.loadedAudio = 0;
	this.loadedImages = 0;
	this.loadedScenes = 0;

	//Contains loaded versions of all assets
	this.audio = [];
	this.images = [];
	this.sceneData = [];
	this.scenes = [];


	//Scene\\


	//Keeps track of the scene and frame
	this.currentScene = -1;

	//Contains all UI elements
	this.UI = [];

	//IO\\

	//Object of keypresses. 
	this.keys = {};

	//Contains all user-defined keybindings. Should be set pre-init
	this.keybindings = [];

	//Object for mouse handling, 
	this.mouse = {
		//X an Y positions of mouse relative to canvas
		x:-1, 
		y:-1, 
		//If the mouse is currently being pressed
		up:true, 
		//UI element mouse is hovering over
		hover:null,
		//UI element that is currently down
		down:null,
		//lastPosition of the mouse.
		lastDown:false,
		//becomes true for one frame if mouse has been clicked
		click:false,
		//becomes true for one frame after mouse has been released
		clickRelease:false
	};


	//======= Methods ========\\

	//IO\\


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

	//Resize window
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

	//Initialization\\
	

	//Initialization function, loads assets, sets IO events, and
	//creates the canvas if it hasn't already been created
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
		this.loadScenes();
		this.loadAudio();
		this.loadImages();
		requestAnimationFrame(disp);
	};

	function parseOptions (options){
		var defaultSettings = {
			masterVolume:1,
			width:500,
			height:500,
			font:"arial",
			fontSize:13,
			fullscreen:true,
			preventKeyDefaults:true
		};
		scope.settings = defaultSettings;
		for(var option in options)
			scope.settings[option] = options[option];
	}


	//Assets\\


	var audioLoad = function(e){
		scope.loadedAudio++;
	};

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

	this.loadImages=function(){
		for(var i=0;i<this.imagePaths.length;i++){
			this.images.push(new Image());
			this.images[i].onload = imageLoad;
			this.images[i].src = this.imagePaths[i];
			this.context.drawImage(this.images[i],-1,-1,1,1);
		}
	};

	var addScene = function(data){
		console.log(data);
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

	this.loadScenes = function(){
		for(var i=0;i<this.scenePaths.length;i++){
			sendHTTP("get",this.scenePaths[i],{},addScene);
		}
	};
	

	//Display loop\\

	var disp = function(){
		if(scope.update)
			scope.update();
		if(scope.draw)
			scope.draw();
		requestAnimationFrame(disp);
	};
	
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
				
		}
	};

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
		}
	};

	function drawScene(){
		for(var i = 0; i<scope.UI.length;i++){
			var obj = scope.UI[i];
			recursiveDraw(obj, 0, 0);
		}
	}

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
				obj.draw();
			}
		} else if(scope.mouse.hover == obj){
			if(obj.onHover){
				obj.onHover();
			} else if(obj.draw){
				obj.draw();
			}
		} else {
			if(obj.draw){
				obj.draw();
			}
		}
		if(children.length>0){
			var childrenHovered = false;
			for (var i = 0, len = children.length; i < len; i++) {
				recursiveDraw(children[i]);
			}
		}
	}

	var handleClicks = function(){
		scope.mouse.hover = null;
		scope.mouse.down = null;
		for (var i = scope.UI.length - 1; i >= 0; i--) {
			var obj = scope.UI[i];
			if(clickRecursive(obj))
				return true;
		}
	};

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



	//Misc

	var rectCollision=function(rect1x, rect1y, rect1w, rect1h, rect2x, rect2y, rect2w, rect2h){
		return rect1x+rect1w > rect2x && rect1x < (rect2x + rect2w) && rect1y+rect1h > rect2y && rect1y < (rect2y + rect2h);
	};

	var errorMessage = "vn.js error: ";

	var error=function(message){
		console.error(errorMessage+message);
	};

	var a = function(arg){
		return arg === undefined || arg ===null;
	};

	var optionalFunction = function(obj, property,func,args){
		if(typeof obj[property] == "function"){

		} else if (typeof property == "string"){
			console.log(scope);
			obj[property] = new Function("scope",obj[property]);
		} else {
			obj[property] = func;
		}

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
		//scope.context.fillRect(this.x, this.y, this.width, this.height);
	};

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

	var buttonDraw = function(obj){
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

	var buttonOnHover = function(obj){
		scope.context.fillStyle = "#084B8A";
		scope.context.fillRect(obj.getGlobalX(),obj.getGlobalY(),obj.getWidth(),obj.getHeight());
		if(obj.text){
			scope.context.font = (obj.getHeight()/2)*obj.fontScale + "px "+obj.font; 
			scope.context.fillStyle = obj.fontColor;
			scope.context.fillText(obj.text,obj.getGlobalX()+Math.max(obj.getWidth()/2 - scope.context.measureText(obj.text).width/2,0),obj.getGlobalY()+(obj.getHeight()/2)+((obj.getHeight()/2)*obj.fontScale)*0.4+obj.getHeight()*obj.fontYOffsetPercent,obj.getWidth());
		}
	};

	var drawButton = function(){
		buttonDraw(this);
	};
	var drawOnHover = function(){
		buttonOnHover(this);
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
		fontColor:"Color: Sets the color of text",
		fontYOffsetPercent:"Number: ",
		text:"Label"
	};

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

	this.button = function(options){
		scope.responsiveObject.call(this, options);
		this.text = options.text;
		this.fontScale = options.fontScale?options.fontScale:1;
		this.fontColor = options.fontColor?options.fontColor:"white";
		this.font = options.font?options.font:scope.settings.font;
		this.fontYOffsetPercent = options.fontYOffsetPercent?options.fontYOffsetPercent:-0.15;
		this.draw = drawButton;
		this.onHover = drawOnHover;
		this.onDown = drawOnHover;
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

	this.colorSquare = function(options){
		scope.responsiveObject.call(this, options);
		this.backgroundColor = options.backgroundColor;
		this.draw = colorDraw;
		this.onClick = function(){};
		this.onRelease = function(){};
	};

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

	this.scene = function(options){
		var init = function(obj){
			//Add frames to scene
			console.log("STEP 1");
			for(var i = 0; i<options.frames.length;i++){
				console.log("STEP 1");
				var frame = new scope.frame(options.frames[i]);
				obj.search[frame.label] = frame;
				obj.frames.push(frame);
				if(i == 0)
					obj.currentFrame = frame;
			}
			//adds connections
			for(var i = 0; i<options.frames.length;i++){
				console.log("STEP 2");
				obj.frames[i].connections=[];
				var connections = options.frames[i].connections?options.frames[i].connections:[];
				for(var x = 0, count = connections.length; x < count;x++){
					console.log("STEP 3");
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
		this.next = function(){
			if(!this.currentFrame)
				return false;
			if(this.currentFrame.connections.length>0){
				for (var i = this.currentFrame.objects.length - 1; i >= 0; i--) {
					if(this.currentFrame.objects[i].reset)
						this.currentFrame.objects[i].reset();
				};
				this.currentFrame.connections[0].loadFrame();
				this.lastFrame = this.currentFrame;
				this.currentFrame = this.currentFrame.connections[0];
			}
		};
	};

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
			scope.UI = this.objects;
		};
	};
}


