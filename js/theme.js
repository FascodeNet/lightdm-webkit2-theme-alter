





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
		"margin-top": "calc(50vh - 90pt)",
		"text-shadow": "rgba(0, 0, 0, 0.8) 0px 7px 10px",
	}
	}]
};


class SplashScreen {
	constructor() {
		this.$el = $("#splash-screen");
		this.$content = $("#splash-screen-content");
		this.options = this.getUserOptions();
		if (!this.$el.length)
			console.error("Missing splash-screen element.");

		// fit background image to sreen size and center
		let $imgs = $(".splash-screen-img");
		$imgs.each((i, v) => this.adjustbackground($(v)));

		this.is_open = false;	

	}

	getUserOptions() {
		let options = {};
		$.extend(true, options, DEF_OPT);
		$.extend(true, options, {});
		return options;
	}


}
$(document).ready(() => {
	var ss = new SplashScreen();

});
