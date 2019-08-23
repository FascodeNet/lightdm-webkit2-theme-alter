const DEF_LM = {
	"plugins": [
		"SplashScreen"
	]
}

class logger {
	constructor(show=false) {
		if (show) $("body").prepend(`	<!-- Debug Console -->
		    <div id="console" class="row">
		        <div class="col s3">
		          <div class="row">
		            <div class="switch">
		              <label>
		                <input type="checkbox" checked="true">
		                <span class="lever"></span>
		                Auto
		              </label>
		            </div>
		          </div>

		          <div class="row">
		            <div class="input-field col ">
		              <input id="inputEvent" >
		              <label for="inputEvent">Event</label>
		            </div>
		            <a id="buttonTrigger" class="waves-effect waves-light btn">Trigger</a>
		          </div>

		        </div>
		        <div class="col s9">
		          <div contentEditable="true" class="terminal"></div>
		        </div>
		    </div>
		<!-- End Debug Console -->`);

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
		// console.log(str);
		this.$log.html(this._parse(str,"white"));
		if (this.$autoscroll.prop('checked'))
			this.$log[0].scrollTop = this.$log[0].scrollHeight;
	}
	error (str) {
		// console.error(str);
		this.$log.html(this._parse(str,"red"));
		if (this.$autoscroll.prop('checked'))
			this.$log[0].scrollTop = this.$log[0].scrollHeight;
	}
	warn (str) {
		// console.warn(str);
		this.$log.html(this._parse(str,"yellow"));
		if (this.$autoscroll.prop('checked'))
			this.$log[0].scrollTop = this.$log[0].scrollHeight;
	}

	debug (str) {
		// console.debug(str);
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
		this.plugins = {}; // map of plugin objects
		this._plugins = DEF_LM.plugins;
		$(document).ready(() => {

			// read config file, use defaults on failure
			$.getJSON("json/LoginManager.json", (data) => {
					if (Array.isArray(data.plugins)) {
						this._plugins = data.plugins;
					}
					this._init();
			}).fail((e) => {
				log.warn("Could not load LoginManager config, using defaults instead");
				this._init();

			});

		});
	}

	_init() {
		this.lightdm = typeof(lightdm) == "undefined" ? {} : lightdm;

	  /* Instantiate all plugins using the config file. Plugins will be
		constructed by using the string in the following manner
					LoginManagerObj.plugins[str] = new [str]()
		The login manager will hold references to this using the same string
		identifier as seen above */
		let ready_count = 0;
		for (let name of this._plugins) {
			if (this._plugins.length == 0) {
					$(this).trigger("ready");
					return;
			}

			// use plugin name to instantiate objects
			this.plugins[name]= eval("new " + name + "()");
			let $plugin =  $(this.plugins[name]);

			$plugin.on("ready", () => {
						ready_count ++;
						if (ready_count == this._plugins.length)
							$(this).trigger("ready");
			});
			$plugin.on("load", () => $plugin.trigger("init"));

		}
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

		if (!this.lightdm.authenticate) {
			log.error("lightdm does not contain authenticate");
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
