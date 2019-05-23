(function(root){
	//'use strict';
	
	var StrandveiligJSRequest = function(options){
		if(!('apiBaseUrl' in options)) console.error("StrandveiligJSRequest.apiBaseUrl is not specified.");
		
		this.options = options;
	};
	
	StrandveiligJSRequest.prototype = {
		executeXMLHttpRequest: function(req, success, error) {
			if(!('path' in req)){
				error("Path not specified.");
				return;
			}
			
			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					var json = JSON.parse(this.responseText);
					if(json[req.path] !== "failed") {
						success(json);
					} else {
						error(json.message);
					}
				}
			};
			xhttp.open("POST", this.options.apiBaseUrl + req.path, true);
			
			if('payLoad' in req) {
				xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xhttp.send(JSON.stringify(req.payLoad));
			}
		},
		
		executeFetchRequest: function(req, success, error) {
			if(!('path' in req)){
				error("Path not specified.");
				return;
			}
			
			fetch(this.options.apiBaseUrl + req.path,
				('payLoad' in req) ? {
					method: "POST",
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: JSON.stringify(req.payLoad)
				} : {
					method: "POST"
				}
			)
			.then(function(response) {
				return response.json();
			})
			.then(function(json) {
				if(json[req.path] !== "failed") {
					success(json);
				} else {
					error(json.message);
				}
			});
		}
	}

	var StrandveiligJS = function(options){
		this.authToken = null;
		
		this.default_options = {
			apiBaseUrl: "https://www.strandveilig.nl/backend/api/", // Base-URL for the strandveilig API, with trailing slash
			credentials: { // Credentials for the strandveilig API
				username: null,
				password: null
			},
			
			requestType: "XMLHttpRequest", // Type of request to use.
			
			authOnLoad: true, // Whether to authenticate and retrieve authToken upon library-load
			//autoReAuth: true, // Whether to re-authenticate and renew authToken upon authentication error.
		};
		
		this.options = Object.assign(this.default_options, options);
		
		this.SJSRequest = new StrandveiligJSRequest({apiBaseUrl: this.options.apiBaseUrl});
		
		this.options.authOnLoad && this.doAuthentication();
	};

	StrandveiligJS.prototype = {
		executeRequest: function(req, success, error){
			switch(this.options.requestType){
				case "XMLHttpRequest":
					this.SJSRequest.executeXMLHttpRequest(req, success, error);
					break;
				case "fetch":
					this.SJSRequest.executeFetchRequest(req, success, error);
					break;
				default:
					console.error("StrandveiligJS.options.requestType is invalid.");
					break;
			}
		},
		
		doAuthentication : function(){
			var _this = this;
			
			if(!this.options.credentials.username || !this.options.credentials.password){
				console.error("StrandveiligJS.options.credentials are not specified.");
				return;
			}
			
			this.executeRequest({
				path: "login",
				payLoad: this.options.credentials
			}, function(res){
				_this.authToken = res.token;
			}, function(msg){
				console.error("An error occured trying to authenticate: " + msg);
			});
		}
		
	};
  
  root.StrandveiligJS = StrandveiligJS;
})(this);