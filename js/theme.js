
const  DEF_OPT = 
{
	"fit": true,
	"filter": true,
	"vignette": true,
	"clock": [{
		"format": ["h:MM", "A"],
		"css": [{
				"font-size": "60pt",
			},{
				"font-size": "30pt"
			}
	],			
	"parent-css": {
		"color": "white",
		"font-family": "Noto Sans",
		"text-align": "center",
		"margi-ntop": "calc(50vh - 90pt)",
		"text-shadow": "rgba(0, 0, 0, 0.8) 0px 7px 10px",
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


class SplashScreen {
	constructor() {
		this.$el = $("#splash-screen");
		this.$content = $(".splash-screen-content");
		this.options = this.getUserOptions();
		this.is_open = false;	

		if (!this.$el.length)
			console.error("Missing-screen element.");

		// fit background image to sreen size and center
		this.$img = $(".splash-screen-img");
		if (!this.$img.length) 
			console.warn("No background images supplied for splash screen.");
		this.$img.each((i, v) => adjustBackground($(v)));

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
	
		}

		$(document).keyup((e) => {
			// handle events in seperate method 
			this.keyHandler.call(this, e);
		});
	}

	getUserOptions() {
		let options = {};
		$.extend(true, options, DEF_OPT);
		$.extend(true, options, {});
		return options;
	}
	/**
	 * will toggle the screen and animate it opening and closing
	 * adds a resetTimeout function to automatically close when after user
	 * inactivity */
	toggle(o_time=550, c_time=500)  {
		if (this.is_open) {
			this.$el.animate({
				top: "0"
			}, c_time, "swing", () => {
				this.is_open = false
				clearTimeout(this.resetTimeout);
			});
		} else {
			this.$el.animate({
				top: "-100%"
			}, o_time, "swing", () => {
				this.is_open = true;
				// close the screen after 1 minute of inactivty
				this.resetTimeout = setTimeout(() => {
					if (this.is_open == true) {
						this.toggle(o_time, c_time);
						$(this).trigger("timeout");
					}
				}, 60*1000);
			});			

		}
	}

	/**
	 * handles the key events for the splash
	 */ 
	keyHandler(e) {
		let splash = this.splash;

		switch (e.keyCode) {
			case 13:
				if (splash.enable) 	
					splash.toggle();
				break;
			case 27:
				if (splash.enable)
					splash.toggle();
				break;

		}
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
			let $clock = $("<div class='clock'></div>");
			this.$content.append($clock);
			this.startClock($clock, opts[i]);
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
		$clock.show();
	}


}
$(document).ready(() => {
	var ss = new SplashScreen();

});
