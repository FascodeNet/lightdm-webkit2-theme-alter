
const  DEF_OPT = 
{
	"fit": true,
	"filter": true,
	"vignette": true,
	"clock": [{
		"format": ["h:mm", "A"],
		"css": [
			{"font-size": "60pt"},
			{"font-size": "30pt"}
		],
		"parent-css": {
			"color": "white",
			"font-family": "Noto Sans",
			"text-align": "center",
			"margin-top": "calc(50vh - 90pt)",
			"text-shadow": "rgba(0, 0, 0, 0.8) 0px 7px 10px",
		}
	}],
	"html": [{ 
		"text":"Press any key to login",
		"css": {
			"text-align": "center",
			"color": "rgba(255, 255, 255, 0.5)"
		}
	}]
};

/**
 * Scale an image up or down until it's larger than or equal to the viewport 
 * and then center it.
 */
var adjustBackground = function ($img) {
	var viewportWidth = screen.width;
	var viewportHeight = screen.height;
	var viewportAspect = viewportWidth/viewportHeight;
	var imgWidth = $img.width();
	var imgHeight = $img.height();
	var imgAspect = imgWidth/imgHeight; 
	
	/* First determine what is 
	   the limiting factor (ie. if the image is wider, then the height is
	   is the limiting factor and needs to be adjustested */
	if (imgAspect < viewportAspect) {
		/* The view port is wider compared to its height than
		   the image is compared to the image height  meaning
		   the width is the limiting dimension. Therefore we
		   set image width = view ports width use the aspect
		   ratio to set the correct height */
		$img.width(viewportWidth);
		$img.height(viewportWidth/imgAspect);
	} else {
		/* The image is wider than it is tall compared to the
		   viewport so we adjust the to fit */
		$img.height(viewportHeight);
		$img.width(viewportHeight*imgAspect);
	}
	this.centerImage($img);
}

var centerImage =  function($img) {
	var overlapWidth = $img.width() - screen.width;
	var overlapHeight = $img.height() - screen.height;

	console.log("overlapwidth: " + overlapWidth + " overlapHeight " + overlapHeight);
	// image overlaps viewport, move the image back 
	// half the length of the overlap
	$img.css({
		position: "relative",
		right: overlapWidth/2,
		bottom: overlapHeight/2 
	}); 
}

class LoginManager {
	constructor() {
		this.use_splash = true;
		$(document).ready(() => {
			this.init();
		});		
	}

	init() {
		if (this.use_splash) {
			this.splash = new SplashScreen();
		}
		$(this).trigger("ready");
	}


	login(username, password, callback) {
		// set default values
		if (typeof lightdm == 'undefined') {
			console.warn("Cannot attempt login without lightdm");
			// call async so that events can be binded in cascade
			setTimeout(() => $(this).trigger("access-deny"));
			return;
		}
		username = username || lightdm.select_user; 
		password = password || "";
		//  session_key = session_key || lightdm.sessions[0].key;

		let auth_cb = () =>  {
                    lightdm.respond(password);
                }
		let auth_complete_cb = () => {
			if (typeof callback == "function")
				callback(lightdm.is_authenticated); 

			$(this).trigger(lightdm.is_authenticated ? "access-grant" : "access-deny");
		}
		window.show_prompt = auth_cb; 
		window.authentication_complete = auth_complete_cb; 
		lightdm.authenticate(username);
    }
}

class SplashScreen {
	constructor() {
		this.$el = $("#splash-screen");
		this.$content = $("#splash-screen-content");
		this.options = this.getUserOptions();
		this.is_open = false;	

		if (!this.$el.length)
			console.error("Missing-screen element.");

		// fit background image to sreen size and center
		this.$img = $(".splash-screen-img");
		if (!this.$img.length) 
			console.warn("No background images supplied for splash screen.");
		this.$img.each((i, v) => adjustBackground($(v)));

		//TODO make content loop, so objects can be added in a specified order
		let options = this.options; // shorthand
		if (typeof options == "object") {
			this.is_open = false;
			// initilize global values if specfied in the config
			if (options.filter == true) {
				this.$img.addClass("filter");	
			}
			if (options.vignette == true) {
				this.$vignette = $("#vignette");
				this.$vignette.show();
			}
			if (typeof options.clock == "object") {
				this.initClock(options.clock);
			}
			if (options.html) {
				this.initHTML(options.html);	
			}
	
		}

		/******************** Event Listeners ********************/ 
		this.clock = setInterval(() => {
			$(this).trigger("tick");		
		}, 500);

		$(document).keyup((e) => {
			// handle events in seperate method 
			this.keyHandler.call(this, e);
		}).keypress((e) => this.keyHandler.call(this, e));

		this.$el.click(() => {
			this.open();	
		});
	}

	removeFilter() {
		this.$img.animate({
			
		}, 1000);
	}

	getUserOptions() {
		let options = {};
		$.extend(true, options, DEF_OPT);
		$.extend(true, options, {});
		return options;
	}
	/**
	 * open and close will toggle the screen and animate it opening and closing
	 * adds a resetTimeout function to automatically close after a period of user
	 * inactivity */
	close(time=450)  {
		if (!this.is_open) 
			return
		this.$el.animate({
			top: "0"
		}, time, "easeInCubic", () => {
			this.is_open = false
			clearTimeout(this.resetTimeout);
		});
	}
	open(time=400) {
		clearTimeout(this.resetTimeout);
		let reset_duration = 60*1000;


		if (this.is_open) {
			this.resetTimeout = setTimeout(this.reset, reset_duration); 
			return;
		}
		this.$el.animate({
			top: "-100%"
		}, time, "easeInCubic", () => {
			this.is_open = true;
			// close the screen after 1 minute of inactivty
			this.resetTimeout = setTimeout(() => this.reset, reset_duration); 
		});			
	}
	reset() {
		if (this.is_open == true) {
			this.close();
			$(this).trigger("timeout");
		}
	}

	/**
	 * handles the key events for the splash
	 */ 
	keyHandler(e) {
		switch (e.keyCode) {
			case 32:
			case 13:
				this.open();
				break;
			case 27:
				if (this.is_open) this.close();
				else this.open();
				break;
			default:
				if (e.keyCode != 82 && e.keyCode != 17) // for testing
				this.open();
				break;
		}
	
		// stop reset timeout since there has been user activity
		if (this.is_open)
			clearTimeout(this.resetTimeout);
		
	}

	/**
	 *  Creates clock elements based on the usr config
	 */
	initClock(opts) {
		if (typeof opts != "object")
			return -1;
		// handle arrays and a single clock object
		if (!Array.isArray(opts))
			opts = [opts];

		for (let i in opts) {
			this.$clock = $("<div class='clock'></div>");
			this.$content.append(this.$clock);
			this.startClock(this.$clock, opts[i]);
		}
	}

	/**
	 * Applys the css specfied in the argument opts to the jQuery oboject $clock.
	 * Subscribes the clock to a tick event 
	 */
	startClock($clock, opts) {
		if (typeof opts != "object") {
			console.error("Clock opts is not a valid object");
			return -1;
		}			
		// handle multiple formats for multiple clocks on the same line
		if(typeof opts.format == "string")
			opts.format = [opts.format];

		// ensure the format is now an array
		if(!Array.isArray(opts.format)) {
			console.error(`Specfied clock format is not a valid type.
				Type can be a single string or Array.`);
			return -1;		
		}
			
		if(!Array.isArray(opts.css))
			opts.css = [opts.css];
		
		for (let i in opts.format) {

			let $format = $("<sub></sub>");
			// create text field in clock
			$clock.append($format);

			// apply css styles
			if (i < opts.css.length && typeof opts.css[i] == "object")
				$format.css(opts.css[i]);

			// start clock
			$format.text(moment().format(opts.format[i]));
			$(this).on("tick", () => {
				$format.text(moment().format(opts.format[i]));
			});
		}

		if (typeof opts["parent-css"] == "object")
			$clock.css(opts["parent-css"]);
		console.debug($clock);
		$clock.show();
	}

	/**
	 * Inserts HTML specified in the user config into the splash screen
	 * accepts plain strings and objects. String literals are interpreted as
	 * normal text element. Objects are set using the jQuery API
	 */
	initHTML(opts) {
		// handle single objects and strings
		if (!Array.isArray(opts)) {	
			opts = [opts];
		}

		for (let el of opts) {
			if (typeof el == "string") {
				let $el = $("<text>");
				$el.text(el);
				// create simple text element
				this.$content.append($el);		
			} else if (typeof el == "object") {
				// let user specify element properites in object el
				let $el = $("<div>");
				for (let prop in el) {
					$el[prop](el[prop]);
				}
				this.$content.append($el);
				
			} else {
				console.warn("Splash screen html element is invalid type");
			}
		}

	}


}
// create singleton 
const greeter = new LoginManager();
$(greeter).ready(function() {
	greeter.login("jay", "");
	$(greeter).on("access-grant", () => {
             lightdm.start_session_sync("i3");
	}).on("access-deny", () => console.log("denied!"));
});

