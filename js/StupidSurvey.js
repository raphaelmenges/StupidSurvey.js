var StupidSurvey = StupidSurvey || {};

StupidSurvey = (function() {

// Global variables
var SURVEY = null;

// Page
class Page {
	constructor(id) {

		// Members
		this._items = [];
		this._id = id;
		this._div = document.createElement("div");

		// Create div to contain items
		this._contents = document.createElement("div");
		this._contents.classList.add("contents");
		this._div.appendChild(this._contents);

		// Create footer div
		this._footer = document.createElement("div");
		this._footer.classList.add("footer");
		this._div.appendChild(this._footer);
		
		// Initially, hide this page
		this.hide();
	}
	push(item) {
		this._items.push(item)
		this._contents.appendChild(item.div)
		item.prependName(this._id);
	}
	show() {
		this._div.style.display = "block"

		// Tell items about it
		for(var i = 0; i < this._items.length; ++i) {
			this._items[i].show();
		}
	}
	hide() {
		this._div.style.display = "none"

		// Tell items about it
		for(var i = 0; i < this._items.length; ++i) {
			this._items[i].hide();
		}
	}
	addNext() {
		var _button = document.createElement("button");
		_button.setAttribute("type", "button");
		_button.setAttribute(
			"onClick",
			"StupidSurvey.next();");
		_button.innerHTML = "Next <i class='fa fa-arrow-circle-right' aria-hidden='true'></i>";
		this._footer.appendChild(_button);
	}
	addPrevious() {
		var _button = document.createElement("button");
		_button.setAttribute("type", "button");
		_button.setAttribute(
			"onClick",
			"StupidSurvey.previous();");
		_button.innerHTML = "<i class='fa fa-arrow-circle-left' aria-hidden='true'></i> Previous";
		this._footer.appendChild(_button);
	}
	addSubmit() {
		var _submit = document.createElement("button");
		_submit.setAttribute("id", "submit");
		_submit.setAttribute("type", "submit");
		_submit.innerHTML = "Submit data <i class='fa fa-share-square' aria-hidden='true'></i>";
		this._footer.appendChild(_submit);
	}
	get validate() {
		var ok = true;
		for(var i = 0; i < this._items.length; ++i) {
			if (!this._items[i].valid) {
				ok = false;
			}
		}
		return ok;
	}
	get id() {
		return this._id;
	}
	get items() {
		return this._items;
	}
	get div() {
		return this._div;
	}
};

// Survey
class Survey {
	constructor(parent) {

		// Member
		this._pages = [];
		this._checks = []; // collect all check elements in order to create fallbacks at submission
		this._current = 0;
		this._div = document.createElement("div");
		this._div.classList.add("stupidsurvey");
		parent.appendChild(this._div);

		// Header
		this._header = document.createElement("div");
		this._div.appendChild(this._header);

		// Create form
		this._form = document.createElement("form");
		this._form.setAttribute("id", "form");
		this._form.setAttribute("method", "post");
		this._form.setAttribute("action", "cgi-bin/processor.py");
		this._form.setAttribute("onsubmit", "StupidSurvey.submit()");
		this._form.setAttribute("accept-charset", "UTF-8");
		this._form.setAttribute("autocomplete", "off");
		this._div.appendChild(this._form);

		// Page number display
		this._pageNumber = document.createElement("div");
		this._pageNumber.classList.add("pagenumber");
		this._div.appendChild(this._pageNumber);

		// Append reset link
		this._reset = document.createElement("a");
		this._reset.setAttribute("onclick", "StupidSurvey.reset();");
		this._reset.setAttribute("href", "javascript:void(0);");
		this._reset.setAttribute("style", "float: right; display: block;");
		this._reset.innerHTML = "Reset all answers";
		this._div.appendChild(this._reset);
	}
	pushPage(page) {
		this._pages.push(page)
		this._form.appendChild(page.div)
	}
	pushHeaderItem(item) {
		this._header.appendChild(item.div)
	}
	finalize() {

		// Add navigation buttons to pages
		for(var i = 0; i < this._pages.length; ++i) {
			if(i > 0) {
				this._pages[i].addPrevious();
			}
			if(i < this._pages.length-1) {
				this._pages[i].addNext();
			}
		}

		// Add submit on last page
		this._pages[this._pages.length - 1].addSubmit();

		// Restore values
		for(var i = 0; i < this._pages.length; ++i) {
			var page = this._pages[i];
			for(var j = 0; j < page.items.length; ++j) {
				var value = window.localStorage.getItem(page.id + "_" + j);
				if(value) {
					page.items[j].restore(value);
				}
			}
		}

		// Get the initial page index from URL
		var index = extractPageIndex(window.location.href);
		if(Number.isInteger(index)) { // valid index is given

			// Check whether last page should be displayed
			if(index < 0) {
				index = this._pages.length - 1;
			}

			// Validate answers on all pages up to that index
			var ok = true;
			for(var i = 0; i < index; ++i) {
				if(!(this._pages[i].validate)) {
					// If validation fails, put user on that page
					this.changePage(i);
					document.getElementById("submit").click(); // force the form to try and submit so we get error messages
					ok = false;
				}
			}
			if(ok) { this.changePage(index); }
		} else { // Show first page
			this.changePage(0);
		}
	}
	changePage(index, pushHistory = true) {
		this._pages[this._current].hide();
		this._current = index;
		this._pages[this._current].show();
		this._pageNumber.innerHTML = "Page " + (this._current + 1) + " out of " + this._pages.length + " pages.";
		window.scrollTo(0, 0);
		if(pushHistory) {
			history.pushState(
				{page: 1},
				"Page " + (this._current + 1),
				"?page=" + (this._current + 1));
		}
	}
	next() {
		if(this._pages[this._current].validate) // validate when going to next
		{
			if(this._current < this._pages.length - 1) {
				this.changePage(this._current + 1);
			}
		} else { // point out error
			document.getElementById("submit").click(); // force the form to try and submit so we get error messages
		}
	}
	previous() {
		if(this._current > 0) {
			this.changePage(this._current - 1);
		}
	}
	gotoFirst() {
		this.changePage(0);
	}
	persist() {
		for(var i = 0; i < this._pages.length; ++i) {
			var page = this._pages[i];
			for(var j = 0; j < page.items.length; ++j) {
				window.localStorage.setItem(page.id + "_" + j, page.items[j].persist);
			}
		}
	}
	registerCheck(check) {
		this._checks.push(check);
	}
	get checks() {
		return this._checks;
	}
	get pages() {
		return this._pages;
	}
	get form() {
		return this._form;
	}
	get currentIndex() {
		return this._current;
	}
};

// Item
class Item {
	constructor() {
		this._div = document.createElement("div");
		this._div.classList.add("item");
	}
	get div() {
		return this._div;
	}
	get valid() {
		return true;
	}
	get persist() {
		return "";
	}
	restore(value) {}
	show() {}
	hide() {}
	prependName(str) {}
};

// Question
class Question extends Item {
	constructor(text, example = "") {
		super();
		this._div.classList.add("question");
		this._div.innerHTML = "<i class='fa fa-minus' aria-hidden='true'></i> " + text;
		if(example) {
			this._div.innerHTML = this._div.innerHTML + " <i class='fa fa-question-circle example' aria-hidden='true' title='" + example + "'></i>";
		}
	}
};

// Headline
class Headline extends Item {
	constructor(text, level = 2) {
		super();
		var h = document.createElement("h" + level);
		h.innerHTML = text;
		this._div.appendChild(h);
	}
};

// Paragraph
class Paragraph extends Item {
	constructor(text) {
		super();
		var para = document.createElement("p");
		para.innerHTML = text;
		this._div.appendChild(para);
	}
};

// Space
class Space extends Item {
	constructor(px) {
		super();
		this._div.setAttribute("style", "height: " + px + "px;");
	}
};

// Separator
class Separator extends Item {
	constructor(text) {
		super();
		var hr = document.createElement("hr");
		this._div.appendChild(hr);
	}
};

// Strong Separator
class StrongSeparator extends Item {
	constructor(text) {
		super();
		var hr = document.createElement("hr");
		hr.classList.add("strongseparator");
		this._div.appendChild(hr);
	}
};

// Picture
class Picture extends Item {
	constructor(src) {
		super();
		var img = document.createElement("img");
		img.setAttribute("src", src);
		this._div.appendChild(img);
	}
};

// Gallery
class Gallery extends Item {
	constructor(srcs, baseURL = "", canvasWidth = 800, canvasHeight = 600, overlayBaseURL = "") {
		super();
		this._div.classList.add("gallery");
		this._srcs = srcs;
		this._imgs = new Map();
		this._imgIdx = 0;
		this._overlayImgs = null;
		this._showOverlay = true;

		if(overlayBaseURL) {
			this._overlayImgs = new Map();
		}

		// Containers
		this._controls = document.createElement("div");
		this._gallery = document.createElement("div");
		this._div.appendChild(this._controls);
		this._div.appendChild(this._gallery); // exchanged controls and gallery

		// Canvas
		this._canvas = document.createElement("canvas");
		this._canvas.setAttribute("width", canvasWidth);
		this._canvas.setAttribute("height", canvasHeight);
		this._gallery.appendChild(this._canvas);
		this._ctx = this._canvas.getContext("2d");

		// Canvas control
		this._control = {
			zoom: 0.25,
			x: 0,
			y: 0,
			prevMouseX: 0,
			prevMouseY: 0,
			drag: false
		};

		// Mouse movement callback
		(function(gallery, canvas, control){
			canvas.addEventListener('mousemove', function(event) {
				if(control["drag"]) {
					var x = event.pageX - canvas.offsetLeft;
					var y = event.pageY - canvas.offsetTop;
					control["x"] += x - control["prevMouseX"];
					control["y"] += y - control["prevMouseY"];
					control["prevMouseX"] = x;
					control["prevMouseY"] = y;
					gallery.updateCanvas();
				}
			})
		})(this, this._canvas, this._control);

		// Mouse down callback
		(function(canvas, control){
			canvas.addEventListener('mousedown', function(event) {
				control["prevMouseX"] = event.pageX - canvas.offsetLeft;
				control["prevMouseY"] = event.pageY - canvas.offsetTop;
				control["drag"] = true;
			})
		})(this._canvas, this._control);

		// Mouse up callback
		(function(control){
			window.addEventListener('mouseup', function(event) {
				control["drag"] = false;
			})
		})(this._control);

		// Initiate canvas
		this._ctx.fillStyle = "black";
		this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
		this._ctx.fillStyle = "white";
		this._ctx.fillText("Loading contents...", 10, 20);

		// Load background pattern (could happen that this is not load when canvas draws, but unlikely)
		this._alpha = new Image();
		this._alpha.src = './assets/alpha.png';

		// Load all images
		for(var i = 0; i < this._srcs.length; ++i) {

			// Images
			(function(gallery, srcs, imgs, i){
				var img = new Image();
				img.src = baseURL + srcs[i];
				img.onload = function() {
					imgs.set(srcs[i], img);
					gallery.updateCanvas();
				};
			})(this, this._srcs, this._imgs, i);

			// Overlay images
			if(this._overlayImgs) {
				(function(gallery, srcs, overlayImgs, i){
				var img = new Image();
				img.src = overlayBaseURL + srcs[i];
				img.onload = function() {
					overlayImgs.set(srcs[i], img);
					gallery.updateCanvas();
				};
				})(this, this._srcs, this._overlayImgs, i);
			}
		}

		// Previous button
		var _previous = document.createElement("button");
		_previous.setAttribute("type", "button");
		(function(gallery, button){
			button.onclick = function() {
				gallery.previous();
			};
		})(this, _previous);
		_previous.innerHTML = "<i class='fa fa-arrow-circle-left'></i>";
		this._controls.appendChild(_previous);

		// Next button
		var _next = document.createElement("button");
		_next.setAttribute("type", "button");
		(function(gallery, button){
			button.onclick = function() {
				gallery.next();
			};
		})(this, _next);
		_next.innerHTML = "<i class='fa fa-arrow-circle-right'></i>";
		this._controls.appendChild(_next);

		// 25% button
		var _25 = document.createElement("button");
		_25.setAttribute("type", "button");
		(function(gallery, button){
			button.onclick = function() {
				gallery.setZoom(0.25);
				gallery.resetPosition();
			};
		})(this, _25);
		_25.innerHTML = "<i class='fa fa-search' aria-hidden='true'></i> 25%";
		this._controls.appendChild(_25);

		// 50% button
		var _50 = document.createElement("button");
		_50.setAttribute("type", "button");
		(function(gallery, button){
			button.onclick = function() {
				gallery.setZoom(0.5);
				gallery.resetPosition();
			};
		})(this, _50);
		_50.innerHTML = "<i class='fa fa-search' aria-hidden='true'></i> 50%";
		this._controls.appendChild(_50);

		// 75% button
		var _75 = document.createElement("button");
		_75.setAttribute("type", "button");
		(function(gallery, button){
			button.onclick = function() {
				gallery.setZoom(0.75);
				gallery.resetPosition();
			};
		})(this, _75);
		_75.innerHTML = "<i class='fa fa-search' aria-hidden='true'></i> 75%";
		this._controls.appendChild(_75);

		// 100% button
		var _100 = document.createElement("button");
		_100.setAttribute("type", "button");
		(function(gallery, button){
			button.onclick = function() {
				gallery.setZoom(1.0);
				gallery.resetPosition();
			};
		})(this, _100);
		_100.innerHTML = "<i class='fa fa-search' aria-hidden='true'></i> 100%";
		this._controls.appendChild(_100);

		// 150% button
		var _150 = document.createElement("button");
		_150.setAttribute("type", "button");
		(function(gallery, button){
			button.onclick = function() {
				gallery.setZoom(1.5);
				gallery.resetPosition();
			};
		})(this, _150);
		_150.innerHTML = "<i class='fa fa-search' aria-hidden='true'></i> 150%";
		this._controls.appendChild(_150);

		// Reset position button
		var _resetPosition = document.createElement("button");
		_resetPosition.setAttribute("type", "button");
		(function(gallery, button){
			button.onclick = function() {
				gallery.resetPosition();
			};
		})(this, _resetPosition);
		_resetPosition.innerHTML = "<i class='fa fa-arrows-alt' aria-hidden='true'></i> Reset position";
		this._controls.appendChild(_resetPosition);

		// Toggle overlay button
		var _toggleOverlay = document.createElement("button");
		_toggleOverlay.setAttribute("type", "button");
		(function(gallery, button){
			button.onclick = function() {
				gallery._showOverlay = !gallery._showOverlay;
				gallery.updateCanvas();
				if(gallery._showOverlay) {
					button.innerHTML = "<i class='fa fa-eye' aria-hidden='true'></i> Toggle Overlay OFF";
				} else {
					button.innerHTML = "<i class='fa fa-eye' aria-hidden='true'></i> Toggle Overlay ON";
				}
			};
		})(this, _toggleOverlay);
		_toggleOverlay.innerHTML = "<i class='fa fa-eye' aria-hidden='true'></i> Toggle Overlay OFF";
		this._controls.appendChild(_toggleOverlay);

		// Image number display
		this._imageNumber = document.createElement("div");
		this._imageNumber.classList.add("imagenumber");
		this._div.appendChild(this._imageNumber);
	}

	next() {
		this._imgIdx = Math.min(this._imgIdx + 1, this._srcs.length - 1);
		this.resetPosition();
		this.updateCanvas();
	}

	previous() {
		this._imgIdx = Math.max(this._imgIdx - 1, 0);
		this.resetPosition();
		this.updateCanvas();
	}

	setZoom(level) {
		this._control["zoom"] = level;
		this.updateCanvas();
	}

	resetPosition() {
		this._control["x"] = 0;
		this._control["y"] = 0;
		this.updateCanvas();
	}

	updateCanvas() {
		if(this._imgs.size === this._srcs.length) {

			// Update number display
			this._imageNumber.innerHTML = (this._imgIdx + 1) + "/" + this._srcs.length;

			// Get image
			var img = this._imgs.get(this._srcs[this._imgIdx]);

			// Fill background
			this._ctx.fillStyle = this._ctx.createPattern(this._alpha, 'repeat');
			this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

			// Draw image
			this._ctx.drawImage(
				img,
				this._control["x"],
				this._control["y"],
				this._control["zoom"] * img.width,
				this._control["zoom"] * img.height);

			// Draw overlay if available
			if(this._showOverlay && this._overlayImgs && this._overlayImgs.size === this._srcs.length) {
				var overlayImg = this._overlayImgs.get(this._srcs[this._imgIdx]);
				this._ctx.drawImage(
					overlayImg,
					this._control["x"],
					this._control["y"],
					this._control["zoom"] * overlayImg.width,
					this._control["zoom"] * overlayImg.height);
			}
		}
	}
}

// Video wall
class VideoWall extends Item {
	constructor(domain) {
		super();
		this._div.classList.add("videowall");

		// Containers
		this._wall = document.createElement("div");
		this._controls = document.createElement("div");
		this._div.appendChild(this._wall);
		this._div.appendChild(this._controls);

		// How to append a video
		function appendVideo(parent, participant) {
			var video = document.createElement("video");
			video.setAttribute("height", "240");
			video.setAttribute("controls", "controls");
			video.muted = true;
			video.setAttribute("id", domain + "_" + participant);
			var source = document.createElement("source");
			source.setAttribute("src", "/survey/p" + participant + "/" + domain + ".mp4");
			source.setAttribute("type", "video/mp4");
			video.appendChild(source);
			parent.appendChild(video);
			return video;
		}

		// Do if for the videos
		this._videos = [];
		this._videos.push(appendVideo(this._wall, 1));
		this._videos.push(appendVideo(this._wall, 2));
		this._videos.push(appendVideo(this._wall, 3));
		this._videos.push(appendVideo(this._wall, 4));

		// Play all button
		var _play = document.createElement("button");
		_play.setAttribute("type", "button");
		_play.setAttribute(
			"onClick",
			"document.getElementById('" + domain + "_1').play();\
			 document.getElementById('" + domain + "_2').play();\
			 document.getElementById('" + domain + "_3').play();\
			 document.getElementById('" + domain + "_4').play();");
		_play.innerHTML = "Play all <i class='fa fa-play-circle' aria-hidden='true'></i>";
		this._controls.appendChild(_play);

		// Pause all button
		var _pause = document.createElement("button");
		_pause.setAttribute("type", "button");
		_pause.setAttribute(
			"onClick",
			"document.getElementById('" + domain + "_1').pause();\
			 document.getElementById('" + domain + "_2').pause();\
			 document.getElementById('" + domain + "_3').pause();\
			 document.getElementById('" + domain + "_4').pause();");
		_pause.innerHTML = "Pause all <i class='fa fa-pause-circle' aria-hidden='true'></i>";
		this._controls.appendChild(_pause);

		// Stop all button
		var _stop = document.createElement("button");
		_stop.setAttribute("type", "button");
		_stop.setAttribute(
			"onClick",
			"var v = document.getElementById('" + domain + "_1'); v.pause(); v.currentTime = 0;\
			 var v = document.getElementById('" + domain + "_2'); v.pause(); v.currentTime = 0;\
			 var v = document.getElementById('" + domain + "_3'); v.pause(); v.currentTime = 0;\
			 var v = document.getElementById('" + domain + "_4'); v.pause(); v.currentTime = 0;");
		_stop.innerHTML = "Reset all <i class='fa fa-stop-circle' aria-hidden='true'></i>";
		this._controls.appendChild(_stop);

		// Backward
		var _backward = document.createElement("button");
		_backward.setAttribute("type", "button");
		_backward.setAttribute(
			"onClick",
			"var v = document.getElementById('" + domain + "_1'); v.currentTime -= 10.0;\
			 var v = document.getElementById('" + domain + "_2'); v.currentTime -= 10.0;\
			 var v = document.getElementById('" + domain + "_3'); v.currentTime -= 10.0;\
			 var v = document.getElementById('" + domain + "_4'); v.currentTime -= 10.0;");
		_backward.innerHTML = "<i class='fa fa-chevron-circle-left' aria-hidden='true'></i> 10&hairsp;s backward";
		this._controls.appendChild(_backward);

		// Forward
		var _forward = document.createElement("button");
		_forward.setAttribute("type", "button");
		_forward.setAttribute(
			"onClick",
			"var v = document.getElementById('" + domain + "_1'); v.currentTime += 10.0;\
			 var v = document.getElementById('" + domain + "_2'); v.currentTime += 10.0;\
			 var v = document.getElementById('" + domain + "_3'); v.currentTime += 10.0;\
			 var v = document.getElementById('" + domain + "_4'); v.currentTime += 10.0;");
		_forward.innerHTML = "10&hairsp;s forward <i class='fa fa-chevron-circle-right' aria-hidden='true'></i>";
		this._controls.appendChild(_forward);
	}
	hide() {
		// Pause all videos when hidden
		for(var i = 0; i < this._videos.length; ++i) {
			this._videos[i].pause();
		}
	}
};

// Text input
class Text extends Item {
	constructor(name, required = false, persist = true) {
		super();
		this._persist = persist;
		this._input = document.createElement("input");
		this._input.setAttribute("type", "text");
		this._input.setAttribute("name", name);
		this._input.setAttribute("size", "40");
		this._input.setAttribute("placeholder", "Type here");
		this._input.setAttribute("onkeydown", "return event.key != 'Enter';"); // do not submit with enter
		this._input.required = required;
		this._div.appendChild(this._input);
	}
	get valid() {
		return this._input.validity.valid;
	}
	get persist() {
		if(this._persist) { return this._input.value; } else { return ""; }
	}
	restore(value) {
		this._input.value = value;
	}
	prependName(str) {
		this._input.setAttribute("name", str + "." + this._input.getAttribute("name"));
	}
};

// Area input
class Area extends Item {
	constructor(name) {
		super();
		this._textarea = document.createElement("textarea");
		this._textarea.setAttribute("name", name);
		this._textarea.setAttribute("rows", "6");
		this._textarea.setAttribute("cols", "40");
		this._textarea.setAttribute("placeholder", "Type here");
		this._div.appendChild(this._textarea);
	}
	get persist() {
		return this._textarea.value;
	}
	restore(value) {
		this._textarea.innerHTML = value;
	}
	prependName(str) {
		this._textarea.setAttribute("name", str + "." + this._textarea.getAttribute("name"));
	}
};

// Numerical input
class Numerical extends Item {
	constructor(name, min = 0, required = false) {
		super();
		this._input = document.createElement("input");
		this._input.setAttribute("type", "number");
		this._input.setAttribute("name", name);
		this._input.setAttribute("min", min);
		this._input.setAttribute("onkeydown", "return event.key != 'Enter';"); // do not submit with enter
		this._input.required = required;
		this._div.appendChild(this._input);
	}
	get valid() {
		return this._input.validity.valid;
	}
	get persist() {
		return this._input.value.toString();
	}
	restore(value) {
		this._input.value = parseInt(value);
	}
	prependName(str) {
		this._input.setAttribute("name", str + "." + this._input.getAttribute("name"));
	}
}

// Radio input
class Radio extends Item {
	constructor(name, options, required = false) {
		super();
		this._inputs = []
		for(var i = 0; i < options.length; ++i) {

			// Radio input
			var _input = document.createElement("input");
			_input.setAttribute("type", "radio");
			_input.setAttribute("name", name);
			_input.setAttribute("id", name + "_" + options[i]);
			_input.setAttribute("value", options[i]);
			_input.setAttribute("onkeydown", "return event.key != 'Enter';"); // do not submit with enter
			_input.required = required;
			/*if(i == Math.floor(options.length/2)) { // heuristics: check centered
				_input.checked = "checked";
			}*/
			this._div.appendChild(_input);
			this._inputs.push(_input)

			// Label
			var _label = document.createElement("label");
			_label.setAttribute("for", name + "_" + options[i]);
			_label.innerHTML = options[i];
			this._div.appendChild(_label);
		}
	}
	get valid() {
		var ok = false;
		for(var i = 0; i < this._inputs.length; ++i) {
			ok = ok || this._inputs[i].validity.valid;
		}
		return ok;
	}
	get persist() {
		var index = -1
		for(var i = 0; i < this._inputs.length; ++i) {
			if(this._inputs[i].checked) {
				index = i;
			}
		}
		return index;
	}
	restore(value) {
		if(value >= 0) {
			this._inputs[value].checked = "checked";
		}
	}
	prependName(str) {
		for(var i = 0; i < this._inputs.length; ++i) {
			this._inputs[i].setAttribute("name", str + "." + this._inputs[i].getAttribute("name"));
		}
	}
};

// Check input
class Check extends Item {
	constructor(name, option, required = false) {
		super();

		// Check input
		this._input = document.createElement("input");
		this._input.setAttribute("type", "checkbox");
		this._input.setAttribute("name", name);
		// this._input.setAttribute("id", name);
		this._input.setAttribute("value", "yes");
		this._input.setAttribute("onkeydown", "return event.key != 'Enter';"); // do not submit with enter
		this._input.required = required;
		this._div.appendChild(this._input);
		SURVEY.registerCheck(this._input);

		// Label
		var _label = document.createElement("label");
		_label.setAttribute("for", name);
		_label.innerHTML = option;
		this._div.appendChild(_label);
	}
	get valid() {
		return this._input.validity.valid;
	}
	get persist() {
		if(this._input.checked) { return 1; } else { return 0; }
	}
	restore(value) {
		if(value > 0) { this._input.checked = true } else { this._input.checked = false; }
	}
	prependName(str) {
		this._input.setAttribute("name", str + "." + this._input.getAttribute("name"));
	}
};

// Select input
class Select extends Item {
	constructor(name, options, required = false) {
		super();

		// Select tag
		this._select = document.createElement("select");
		this._select.setAttribute("name", name);
		this._select.setAttribute("onkeydown", "return event.key != 'Enter';"); // do not submit with enter
		this._select.required = required;
		this._div.appendChild(this._select);

		// Prepend empty option
		options.unshift("");

		// Options within
		this._options = []
		for(var i = 0; i < options.length; ++i) {

			// Option
			var _option = document.createElement("option");
			_option.setAttribute("value", options[i]);
			_option.innerHTML = options[i];
			this._select.appendChild(_option);
			this._options.push(_option)
		}
	}
	get valid() {
		return this._select.validity.valid;
	}
	get persist() {
		return this._select.selectedIndex;
	}
	restore(value) {
		this._select.selectedIndex = value;
	}
	prependName(str) {
		this._select.setAttribute("name", str + "." + this._select.getAttribute("name"));
	}
};

// Returns NaN if not successful, otherwise integer page index or -1 when last page should be displayed
function extractPageIndex(url) {
	var param = url.split("?")[1];
	if(param) {
		var page = param.split("=")[1];
		page = parseInt(page); // try to make an integer
		if(Number.isInteger(page)) { // only proceed if parsing successful
			index = page - 1;
			index = Math.min(Math.max(index, -1), SURVEY.pages.length - 1);
			return index;
		}
	}
	return NaN;
};

// Warning before closing the form without sending
window.onload = function() {
	window.addEventListener("beforeunload", function (e) {

		// Store values in local storage
		SURVEY.persist();
		return undefined;

		/*
		// If form was submitted, do not complain
		if (FORM_SUBMITTED) {
			
		}

		// Complain
		var confirmationMessage = 'It looks like you have been editing something. '
								+ 'If you leave before saving, your changes will be lost.';

		(e || window.event).returnValue = confirmationMessage; // Gecko + IE
		return confirmationMessage; // Gecko + Webkit, Safari, Chrome etc.
		*/
	});
};

// Implement going back
window.onpopstate = function(event) {
	if(event) {
		var newIndex = extractPageIndex(event.srcElement.location.href);
		if(Number.isInteger(newIndex)) {
			var currentIndex = SURVEY.currentIndex;

			// If going forward, first validate page
			var ok = true;
			if(currentIndex < newIndex) {
				ok = SURVEY.pages[currentIndex].validate;
				if(!ok) {
					document.getElementById("submit").click();
				}
			}

			// Change page
			if(ok) {
				SURVEY.changePage(newIndex, false); // everything ok, pop state
			} else {
				SURVEY.changePage(currentIndex); // stick on current page
			}
		}
	}
};

// Submit the form
var submit = function() {

	// Disable submit button
	document.getElementById("submit").disabled = true;

	// For each check that is not checked, one must create a hidden input for the submission
	var checks = SURVEY.checks;
	for(var i = 0; i < checks.length; ++i) {
		if(!checks[i].checked) {
			var fallback_input = document.createElement("input");
			fallback_input.setAttribute("type", "hidden");
			fallback_input.setAttribute("name", checks[i].getAttribute("name")); // same name as original!
			fallback_input.setAttribute("value", "no");
			SURVEY.form.appendChild(fallback_input);
		}
	}
};

// Reset function
var reset = function() {
	if (confirm("Do you really want to remove all your answers on *all* pages? This cannot be undone!")) {

		// Reset local storage
		window.localStorage.clear();

		// Reset form
		SURVEY.form.reset();

		// Extra treatment for the textarea
		var textareas = document.getElementsByTagName('textarea');
		for(var i = 0; i < textareas.length; ++i) {
			textareas[i].innerHTML = "";
		}

		// Go to first page
		SURVEY.gotoFirst();
	}
};

// Some aliases
var init = function(parent) { SURVEY = new Survey(parent); };
var pushPage = function(page) { SURVEY.pushPage(page); };
var pushHeaderItem = function(item) { SURVEY.pushHeaderItem(item); };
var finalize = function() { SURVEY.finalize(); };
var next = function() { SURVEY.next(); };
var previous = function() { SURVEY.previous(); };

// Public accessible contents
return {

	// Functions
	init: init,
	pushPage: pushPage,
	pushHeaderItem: pushHeaderItem,
	finalize: finalize,
	next: next, // called by buttons
	previous: previous, // called by buttons
	submit: submit, // called at submission
	reset: reset,

	// Classes
	Page: Page,
	Question: Question,
	Headline: Headline,
	Paragraph: Paragraph,
	Space: Space,
	Separator: Separator,
	StrongSeparator: StrongSeparator,
	Picture: Picture,
	Gallery: Gallery,
	VideoWall: VideoWall,
	Text: Text,
	Area: Area,
	Numerical: Numerical,
	Radio: Radio,
	Check: Check,
	Select: Select
};

})(); // end of namespace