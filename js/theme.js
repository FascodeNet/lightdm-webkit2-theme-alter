
const  DEF_OPT =
{
	"fit": true,
	"filter": false,
	"vignette": true,
	"active-timeout": 15,
	"content": {
		"clock": [{
			"format": "dddd, MMMM Do",
			"css": {
				"color": "white"
			},
			"parent-css": {
				"margin-top": "calc(20vh - 70pt)",
				"text-align": "center",
				"font-size": "70pt",
				"font-family": "Noto Sans",
				"font-weight": "lighter",
				"text-shadow": "rgba(0, 0, 0, 0.8) 0px 7px 10px",
			}
	        },{
			"format": ["h:mm", "A"],
			"css": [
				{"font-size": "65pt", "font-weight": 200 },
				{"font-size": "30pt", "font-weight": "lighter", "margin-left": "10pt"}
			],
			"parent-css": {
				"margin-top": "20vh",
				"color": "white",
				"font-family": "Noto Sans",
				"text-align": "center",
				"text-shadow": "rgba(0, 0, 0, 0.8) 0px 7px 10px",
			}
		}],

		"html": [{
			"html":"<text style='display: none' class='active-appear'>Press any key to login</text>",
			"css": {

				"margin-top": "5vh",
				"font-weight": "200",
				"font-size": "23pt",
				"text-align": "center",
				"color": "rgba(255, 255, 255, 0.8)"
			}
		}]
	}
};


class logger {
	constructor() {
		window.onerror = (e) => {
		    this.error(e);
		};

		$(document).ready(() => {
			this.$log= $("#console .terminal");
			this.$autoscroll = $("#console input");
			this.$buttonTrigger = $("#buttonTrigger");

			this.$log.keypress(function(e) {
		      e.preventDefault();
		  });
			this.$buttonTrigger.click(() => {
				let e = $("#inputEvent").val();
				log.debug("triggering: " + e);
				$(greeter).trigger(e);

			});
		});
	}
	_parse(str, color) {
			if (typeof str == "object") str = JSON.stringify(str,null, 2);

			str =  "[" + moment().format("hh:mm:ss") + "] " + str;
			str = "<text style='color: " + color + "'>" + str + "</text>";
			return this.$log.html() + str;
	}
	normal (str) {
		console.log(str);
		this.$log.html(this._parse(str,"white"));
		if (this.$autoscroll.prop('checked'))
			this.$log[0].scrollTop = this.$log[0].scrollHeight;
	}
	error (str) {
		console.error(str);
		this.$log.html(this._parse(str,"red"));
		if (this.$autoscroll.prop('checked'))
			this.$log[0].scrollTop = this.$log[0].scrollHeight;
	}
	warn (str) {
		console.warn(str);
		this.$log.html(this._parse(str,"yellow"));
		if (this.$autoscroll.prop('checked'))
			this.$log[0].scrollTop = this.$log[0].scrollHeight;
	}

	debug (str) {
		console.debug(str);
		this.$log.html(this._parse(str,"lightblue"));
		if (this.$autoscroll.prop('checked'))
			this.$log[0].scrollTop = this.$log[0].scrollHeight;
	}
}


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
			this._init();
		});
	}

	_init() {
				this.lightdm = typeof (lightdm) == "undefined" ? {} : lightdm;

		if (this.use_splash) {
			this.splash = new SplashScreen();
		}
		$(this).trigger("ready");
	}


	auth(username="", password="", callback) {

		if (!this.lightdm) {
			log.warn("Cannot attempt login because lightdm is missing the " +
			"required fields. Please note that lightdm is not explicitly " +
			"instantiated in a browser session.");

			// call async so that events can be binded in cascade
			setTimeout(() => $(this).trigger("deny"));
			return;
		}

		let auth_cb = () =>  {
                    this.lightdm.respond(password);
    }
		let auth_complete_cb = () => {
			if (typeof callback == "function")
				callback(this.lightdm.is_authenticated);

			$(this).trigger(this.lightdm.is_authenticated ? "grant" : "deny");
		}

	  window.show_prompt = auth_cb;
		window.authentication_complete = auth_complete_cb;

		if (typeof this.lightdm.authenticate != "function") {
			log.error("lighdm does not contain authenticate");
			$(this).trigger("deny");
			return;
		}
		this.lightdm.authenticate(username);
  }

	login(session_key) {
		if (!this.lightdm.sessions.find(x => x.key == session_key)) {
			log.error("Attempting to login without a valid session.");
			return;
		}

		if (!this.lightdm.is_authenticated) {
			log.error("Attempting to login without authentication.");
			return;
		}
		this.lightdm.start_session_sync(session_key);
	}

	fillUserSelect($el) {
			if (!Array.isArray(this.lightdm.users)) {
					log.warn("No users to fill in lightdm's list.");
					return;
			}

			$el.empty();
			for (let s of this.lightdm.users)
					$el.append("<option value=" + s.username + ">" + s.display_name + "</option>");
			$el.formSelect();
	}

	fillSessionSelect($el) {
		if (!Array.isArray(this.lightdm.sessions)) {
					log.warn("No sessions to fill in lightdm's list.");
				return;
		}

		$el.empty();

		for (let s of this.lightdm.sessions)
				$el.append("<option value=" + s.key + ">" + s.name + "</option>");


		$el.formSelect();
	}

	shutdown() {
		if (this.lightdm.can_shutdown)
				this.lightdm.shutdown();
		else  {
			log.error("Do not have permission to shutdown");
			return -1;
		}

	}
	restart() {
		if (this.lightdm.can_restart)
				this.lightdm.restart();
		else  {
			log.error("Do not have permission to restart");
			return -1;
		}

	}
	hibernate() {
		if (this.lightdm.can_hibernate)
			this.lightdm.hibernate();
		else {
			log.error("Do not have permission to hibernate");
			return -1;
		}
	}
	suspend() {
		if (this.lightdm.can_suspend)
			this.lightdm.suspend();
		else {
			log.error("Do not have permission to suspend");
			return -1;
		}
	}
	get users() {
		return this.lightdm.users;
	}

	get sessions() {
		return this.lightdm.sessions;
	}
}

class SplashScreen {
	constructor() {
		this.$el = $("#splash-screen");
		this.$content = $("#splash-screen-content");
		this.options = this.getUserOptions();
		this.state = "closed";
		this.last_active = 0;
		this.active_timeout = 15;

		if (!this.$el.length)
			log.error("Missing-screen element.");

		// fit background image to sreen size and center
		this.$img = $(".splash-screen-img");
		if (!this.$img.length)
			log.warn("No background images supplied for splash screen.");
		this.$img.each((i, v) => adjustBackground($(v)));

		let options = this.options; // shorthand
		if (typeof options == "object") {
			// initilize global values if specfied in the config
			this.is_open = false;


			if (typeof options["active-timeout"] == "number")
				this.active_timeout = options["active-timeout"];
			if (options.filter == true)
				this.$img.addClass("filter");
			if (options.vignette == true)
				this.$vignette = $("#vignette");
				this.$vignette.show();
			if (typeof options.content == "object")
				this.initContent(options.content);
		}

		/******************** Event Listeners ********************/
		this.clock = setInterval(() => {
			$(this).trigger("tick");

			if (!this.isActive())
				$(this).trigger("inactive");
		}, 500);

		// update last active time
		$(this).on("active", () => this.last_active = moment());

		$(document).keyup((e) => {
			// handle events in seperate method
			this.keyHandler.call(this, e);
		}).keypress((e) => this.keyHandler.call(this, e));

		this.$el.click(() => {
			this.open();
		}).mousemove((e) => {
			if (!this.isActive())
				$(this).trigger("active", e)
		});
		setTimeout(() => $(this).trigger("active"), 1);
	}

	/**
	 * Loops through the user specified content and adds them to the DOM in order
	 */
	initContent(content) {
		for (let content_type in content) {
			if (content_type == "clock")
				this.initClock(content[content_type]);
			else if (content_type == "html")
				this.initHTML(content[content_type]);
			else
				log.warn("Specified content " + content_type + " is not valid.");
		}
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
		if (this.state == "closed" || this.state == "moving") {
			log.warn("Cannot close splash screen when state is: " + this.state);
			return;
		}

		this.state = "moving";
		this.$el.animate({
			top: "0"
		}, time, "easeInCubic", () => {
			this.state = "closed";
			clearTimeout(this.resetTimeout);
		});
	}
	open(time=400) {
		if (this.state == "open" || this.state == "moving") {
			log.warn("Cannot open splash screen when state is: " + this.state);
			return;
		}
		clearTimeout(this.resetTimeout);
		let reset_duration = 60*1000;

		if (this.state == "open" || this.state == "moving") {
			this.resetTimeout = setTimeout(this.reset, reset_duration);
			return;
		}
		this.state = "moving";
		this.$el.animate({
			top: "-100%"
		}, time, "easeInCubic", () => {
			this.state = "open";
			// close the screen after 1 minute of inactivty
			this.resetTimeout = setTimeout(() => this.reset, reset_duration);
		});
	}
	reset() {
		if (this.state == "open") {
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
			case 13: // Enter key
				if (this.state == "closed") this.open();
				break;
			case 27: // ESC key
				if (this.state == "open") this.close();
				else if (this.state == "closed") this.open();
				break;
			default:
				if (e.keyCode != 82 && e.keyCode != 17 && this.state == "closed") // for testing
					this.open();
				break;
		}

		// stop reset timeout since there has been user activity
		if (this.state == "open")
			clearTimeout(this.resetTimeout);

		if (!this.isActive())
			$(this).trigger("active", e);
	}

	isActive() {
		if (moment().diff(this.last_active, "seconds", true) > 30) {
			return 0;
		}
		return 1;
	}

	/**
	 *  Creates clock elements based on the usr config
	 */
	initClock(opts) {
		if (typeof opts != "object") {
			log.error("Unable to initialize clock thats not an object");
			return -1;
		}
		// handle arrays and a single clock object
		if (!Array.isArray(opts))
			opts = [opts];

		for (let i in opts) {
			this.$clock = $("<div id='clock-" + i + "' class='clock'></div>");
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
			log.error("Clock opts is not a valid object");
			return -1;
		}
		// handle multiple formats for multiple clocks on the same line
		if(typeof opts.format == "string")
			opts.format = [opts.format];

		// ensure the format is now an array
		if(!Array.isArray(opts.format)) {
			log.error(`Specfied clock format is not a valid type.
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
				// let user specify element properites in object el.
				let $el = $("<div>");
				for (let prop in el) {
					$el[prop](el[prop]);
				}
				this.$content.append($el);

			} else {
				log.warn("Splash screen html element is invalid type");
			}
		}

	}


}
