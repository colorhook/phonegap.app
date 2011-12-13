//Signal
var Signal = {
	_events:{},
	bind: function(type, listener){
		var listeners = this._events[type];
		if(!listeners){
			listeners = this._events[type] = [];
		}
		listeners.push(listener);
	},
	trigger: function(type, params){
		var listeners = this._events[type];
		if(!listeners){
			return;
		}
		var copy = listeners.slice();
		for(var i = 0, l = copy.length; i < l; i++){
			var listener = copy[i];
			listener.apply(null, params);
		}
		
	}
};
//Model
var Model = function(){
	if(Model.instance){
		return Model.instance;
	}
	Model.instance = this;
};
Model.EVENT_TYPE = "click";
Model.INIT = "model:init";
Model.LEVEL_PASS = "model:level_pass";
Model.LEVEL_FAIL = "model:level_fail";

Model.prototype = {
	constructor: Model,
	
	init: function(){
		this._bestLevel = this.getBestLevel();
		this._level = 0;
		Signal.trigger(Model.INIT, [this._bestLevel]);
	},
	getLevel: function(){
		return this._level;
	},
	setLevel: function(level){
		this._level = level;
	},
	getBestLevel: function(){
		var level = localStorage.getItem("level") || 0;
		return parseInt(level);
	},
	setBestLevel: function(level){
		localStorage.setItem("level", level + "");
	},
	saveLevel: function(level){
		if(level > this._bestLevel){
			this.setBestLevel(level);
		}
	},
	reset: function(){
		this._level = 0;
	}
};

//View
var View = function(){
};
View.USER_TAP = "view:user_tap";
View.USER_NEXT = "view:user_next";

View.prototype = {
	contructor: View,
	
	init: function(bestLevel){
		this.initPages();
		this.initEvents();
		 TWEEN.start();
	},
	initPages: function(){
		this.welcomePage = $(".welcome-page");
		this.levelPage = $(".level-page");
		this.gamePage = $(".game-page");
		this.overPage = $(".over-page");
		this.eggPage = $(".egg-page");
		this.context =  document.getElementById("canvas").getContext("2d");
		this.currentPage = this.welcomePage;
		this.playing = false;
		this.isInTransition = false;
	},
	initEvents: function(){
		var self = this;
		this.gamePage.bind(Model.EVENT_TYPE, function(e){
			if(self.playing){
				Signal.trigger(View.USER_TAP, [{x: e.x, y:e.y}]);
			}
		});
		this.overPage.bind(Model.EVENT_TYPE, function(){
			if(self.isInTransition){return;};
			var position = {top:0};
			new TWEEN.Tween(position).easing(TWEEN.Easing.Quadratic.EaseOut).to({top:480}, 1000).onUpdate(function(){
				self.overPage.css("top", Math.round(position.top) + "px");
			}).onComplete(function(){
				self.playing = true;
				self.toLevel(0);
				self.isInTransition = false;
			}).start() ;
			self.isInTransition = true;
			
		});
		this.welcomePage.bind(Model.EVENT_TYPE, function(){
			var obj = {alpha:1};
			new TWEEN.Tween(obj).easing(TWEEN.Easing.Quadratic.EaseOut).to({alpha:0}, 800).onUpdate(function(){
				self.welcomePage.css("opacity", obj.alpha);
			}).onComplete(function(){
				self.playing = true;
				self.toLevel(0);
				self.isInTransition = false;
				self.welcomePage.addClass("hidden");
			}).start() ;
			self.isInTransition = true;
		});
	},
	setCurrentPage: function(page){
		if(this.currentPage != page){
			this.currentPage.addClass("hidden");
			this.currentPage = page;
			this.currentPage.removeClass("hidden");
		}
	},

	toLevel: function(level){
		this.levelPage.find(".level-count").html(level + 1);
		this.setCurrentPage(this.gamePage);
		this.levelPage.removeClass("hidden");
		var position = {left:800},
			self = this;
		new TWEEN.Tween(position).easing(TWEEN.Easing.Quadratic.EaseOut).to({left:0}, 400).onUpdate(function(){
			self.levelPage.css("left", Math.round(position.left) + "px");
		}).onComplete(function(){
			Signal.trigger(View.USER_NEXT);
			new TWEEN.Tween(position).easing(TWEEN.Easing.Quadratic.EaseOut).to({left:0}, 500).onComplete(function(){
				new TWEEN.Tween(position).easing(TWEEN.Easing.Quadratic.EaseOut).to({left:-800}, 400).onUpdate(function(){
					self.levelPage.css("left", Math.round(position.left) + "px");
					self.isInTransition = false;
				}).start() ;
			}).start();
		}).start();
		this.isInTransition = true;
	},
	over: function(circle, level){
		this.playing = false;
		var self = this;
		var changeColor = function(arr, callback){
			if(arr.length == 0){
				callback();
				return;
			}
			setTimeout(function(){
				var color = arr.shift();
				self.drawCircle(circle, color);
				changeColor(arr, callback);
			}, 300);
		};
		this.overPage.find(".level-count").html(level);
		changeColor(["#000", "#fff", "#000", "#fff", "#000", "#fff"], function(){
			setTimeout(function(){
				var position = {top: 480};
				new TWEEN.Tween(position).easing(TWEEN.Easing.Quadratic.EaseOut).to({top:0}, 1000).onUpdate(function(){
					self.overPage.css("top", Math.round(position.top) + "px");
				}).onComplete(function(){
					self.isInTransition = false;
					self.reset();
				}).start() ;
				self.isInTransition = true;
			}, 500);
		});
	},
	reset: function(){
		this.playing = false;
		this.context.canvas.width = this.context.canvas.width;
	},
	drawCircle: function(circle, color){
		var ctx = this.context;
		ctx.beginPath(); 
		color = color || "#fff";
		ctx.fillStyle = color;
		ctx.strokeStyle = "#000";
		ctx.beginPath();
		ctx.arc(circle.x, circle.y, circle.r, 0,  Math.PI*2, true); 
		ctx.fill();
		ctx.stroke();
	},
	showEggShell: function(){
		this.setCurrentPage(this.eggPage);
	}
};
//Circle
var Circle = function(){
	this.x = 0;
	this.y = 0;
	this.r = 0;
}
//Controller
var Controller = function(){
	this._pos = [];
	this.min = 20;
	this.max = 100;
	this.width = 800;
	this.height = 480;
	this._internalCount = 0;
	this._internalMaxCount = 1000;
}
Controller.prototype = {
	constructor: Controller,
	
	reset: function(){
		this._internalCount = 0;
		this._pos = [];
	},

	getNextRandomCircle: function(){
		var c = new Circle();
		c.r =Math.ceil(this.getRandomBetween(this.min, this.max));
		c.x = this.getRandomBetween(c.r, this.width -c.r);
		c.y = this.getRandomBetween(c.r, this.height - c.r);
		if(this.isCollisionAtLeastOne(c)){
			this._internalCount++;
			if(this._internalCount > this._internalMaxCount){
				this._internalCount = 0;
				return null;
			}
			return this.getNextRandomCircle();
		}
		this._internalCount = 0;
		this._pos.push(c);
		return c;
	},
	getRandomBetween: function(a, b){
		return a + Math.random() * (b - a);
	},
	
	isCollision: function(a, b){
		var dx = a.x - b.x,
			dy = a.y - b.y,
			dr = a.r + b.r;
		return dx * dx + dy * dy  < dr * dr;
	},
	
	isCollisionAtLeastOne: function(a){
		for(var i = 0, l = this._pos.length; i < l; i++){
			if(this.isCollision(a, this._pos[i])){
				return true;
			}
		}
		return false;
	},

	isPointInCircle: function(p, a){
		var dx = (a.x - p.x),
			dy = (a.y - p.y);
		return dx * dx + dy * dy  <= a.r * a.r;
	},
	
	getCircleUnderPoint: function(p){
		for(var i = 0, l = this._pos.length; i < l; i++){
			if(this.isPointInCircle(p, this._pos[i])){
				return this._pos[i];
			}
		}
		return null;
	},
	
	getLatestCircle: function(){
		return this._pos[this._pos.length-1];
	}
};
//entry point
(function(){
	var model = new Model(),
		view = new View(),
		controller = new Controller();
	

	Signal.bind(Model.INIT, function(bestLevel){
		view.init(bestLevel)
	});
	Signal.bind(Model.LEVEL_PASS, function(level){
		view.toLevel(level);
	});
	Signal.bind(Model.LEVEL_FAIL, function(level){
		model.saveLevel(level);
		view.over(controller.getLatestCircle(), level);
	});

	
	Signal.bind(View.USER_TAP, function(p){
		var c = controller.getCircleUnderPoint(p);
		if(c){
			if(controller.getLatestCircle() == c){
				model.setLevel(model.getLevel() + 1);
				Signal.trigger(Model.LEVEL_PASS, [model.getLevel()]);
			}else{
				Signal.trigger(Model.LEVEL_FAIL,  [model.getLevel()]);
				model.setLevel(0);
			}
		}
	});

	Signal.bind(View.USER_NEXT, function(){
		var c = controller.getNextRandomCircle();
		if(c){
			view.drawCircle(c);
		}else{
			view.showEggShell(model.getLevel());
		}
	});

	model.init();

})();