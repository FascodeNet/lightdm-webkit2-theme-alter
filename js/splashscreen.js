const MOVE_DUR = 300;
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

class SplashScreen {
	constructor() {
		this.options = this.getUserOptions();
		$(this).on("init", () => this._init());
	}
	_init() {
		this.$el = $("#splash-screen");
		this.$content = $("#splash-screen-content");
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
			if (options.vignette == true) {
				this.$vignette = $("#vignette");
				this.$vignette.show();
			}
			if (typeof options.content == "object")
				this.initContent(options.content);
			console.log("triggering ready for splash");
			$(this).trigger("ready");
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
	close(time=500)  {
		if (this.state == "closed" || this.state == "moving") {
			log.warn("Cannot close splash screen when state is: " + this.state);
			return;
		}

		this.state = "moving";
		// this.$el.css("top", "0");
		// this.$el.css("opacity", "1");

		this.$el.fadeIn(MOVE_DUR, () => {
			// this.$el.remove("filter");
			this.state = "closed";
			this.$content.fadeIn("slow")
			// this.$el.show();
		});

	}
	open(time=300) {
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

				this.$content.fadeOut("fast", () => {
					// this.$el.remove("filter");
					this.$el.fadeOut(MOVE_DUR, () => {
						this.state = "open";
					});

					// this.$el.show();
				});
		// this.$el.css("top", "-100%");
		// this.$el.css("opacity", "0");
		//
		//
		// setTimeout(() => {
		// 	this.state = "open";
		// 	this.$el.hide();
		// }, CSS_MOVE_DUR);


	}

 _moveUp($el, cb) {
	      $el.addClass("move-up");
	      setTimeout(() => {
	        $el.css("top", "-100%").removeClass("move-up");
					if (typeof cb == "function") cb($el);
	      }, CSS_MOVE_DUR);
	}
	_moveDown($el, cb) {
		$el.addClass("move-down");
		setTimeout(() => {
			$el.css("top", "0").removeClass("move-down");
			if (typeof cb == "function") cb($el);
		}, CSS_MOVE_DUR);
	}
	/**
	 * Closes the splash screen if there has been no user activity
	 */
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
