
var 
	dbus = require('com.izaakschroeder.dbus'),
	EventEmitter = require('events').EventEmitter, 
	util = require('util');

function Avahi() {
	EventEmitter.call(this);
	var self = this;
	this.ready = false;
	this.server = dbus.system(Avahi.Namespace).object("/").as(Avahi.Server);
	this.server.on("ready", function() {
		self.ready = true;
		self.emit("ready");
	})

};
util.inherits(Avahi, EventEmitter);

function Browser() {
	EventEmitter.call(this);
}
util.inherits(Browser, EventEmitter);


function Service(avahi, opts) {
	this.avahi = avahi;
	this.interface = opts.interface;
	this.protocol = opts.protocol;
	this.name = opts.name;
	this.domain = opts.domain;
	this.flags = opts.flags;
	this.type = opts.type;
}

Service.prototype.toString = function() {
	return this.interface+" "+this.protocol+" "+this.type+" "+this.name+" "+this.domain+" "+this.flags;
}

Service.prototype.resolve = function(protocol, callback) {
	if (typeof callback === "undefined")
		callback = protocol;
	if (typeof callback !== "function")
		throw new TypeError("Must provide a valid callback function!")
	
	this.avahi.server.resolveService(this.interface, this.protocol, this.name, this.type, this.domain, protocol || Avahi.PROTO_UNSPEC, 0, function(err, interface, protocol, name, type, domain, host, targetProtocol, address, port, txt, flags) {
		if (err)
			return callback(err);
		callback(undefined, address, port, Avahi.decodeTXTParameters(txt));
	})
}



Avahi.SERVER_INVALID = 0;
Avahi.SERVER_REGISTERING = 1;
Avahi.SERVER_RUNNING = 2;
Avahi.SERVER_COLLISION = 3;
Avahi.SERVER_FAILURE = 4

Avahi.ENTRY_GROUP_UNCOMMITED = 0
Avahi.ENTRY_GROUP_REGISTERING = 1
Avahi.ENTRY_GROUP_ESTABLISHED = 2
Avahi.ENTRY_GROUP_COLLISION = 3
Avahi.ENTRY_GROUP_FAILURE = 4

Avahi.DOMAIN_BROWSER_BROWSE = 0
Avahi.DOMAIN_BROWSER_BROWSE_DEFAULT = 1
Avahi.DOMAIN_BROWSER_REGISTER = 2
Avahi.DOMAIN_BROWSER_REGISTER_DEFAULT = 3
Avahi.DOMAIN_BROWSER_BROWSE_LEGACY = 4

Avahi.PROTO_UNSPEC = -1
Avahi.PROTO_INET = 0
Avahi.PROTO_INET6 = 1

Avahi.IF_UNSPEC = -1

Avahi.PUBLISH_UNIQUE = 1
Avahi.PUBLISH_NO_PROBE = 2
Avahi.PUBLISH_NO_ANNOUNCE = 4
Avahi.PUBLISH_ALLOW_MULTIPLE = 8
Avahi.PUBLISH_NO_REVERSE = 16
Avahi.PUBLISH_NO_COOKIE = 32
Avahi.PUBLISH_UPDATE = 64
Avahi.PUBLISH_USE_WIDE_AREA = 128
Avahi.PUBLISH_USE_MULTICAST = 256

Avahi.LOOKUP_USE_WIDE_AREA = 1
Avahi.LOOKUP_USE_MULTICAST = 2
Avahi.LOOKUP_NO_TXT = 4
Avahi.LOOKUP_NO_ADDRESS = 8

Avahi.LOOKUP_RESULT_CACHED = 1
Avahi.LOOKUP_RESULT_WIDE_AREA = 2
Avahi.LOOKUP_RESULT_MULTICAST = 4
Avahi.LOOKUP_RESULT_LOCAL = 8
Avahi.LOOKUP_RESULT_OUR_OWN = 16
Avahi.LOOKUP_RESULT_STATIC = 32


Avahi.Namespace = "org.freedesktop.Avahi";
Avahi.Server = Avahi.Namespace + ".Server";
Avahi.EntryGroup = Avahi.Namespace + ".EntryGroup";
Avahi.ServiceBrowser = Avahi.Namespace + ".ServiceBrowser";
Avahi.ServiceTypeBrowser = Avahi.Namespace + ".ServiceTypeBrowser"

Avahi.encodeTXTParameters = function (params) {
	var out = [ ];
	if (params)
		for (var key in params) {
			var value = params[key], t = [ ];

			for (var i = 0; i < key.length; ++i)
				t.push(key.charCodeAt(i) & 0xFF);
			t.push('='.charCodeAt(0));
			for (var i = 0; i < value.length; ++i)
				t.push(value.charCodeAt(i) & 0xFF);
			out.push(t);
		}
	return out;
}

Avahi.decodeTXTParameters = function (txt) {
	var params = { }
	txt.map(function(t) { return !t ? [] : t.map(function(i) { return String.fromCharCode(i); }).join("").split("=",2); }).forEach(function(item) {
		params[item[0]] = item[1];
	})
	return params;
}


Avahi.prototype.browse = function(options) {
	if (typeof options === "object") {
		var browser = new Browser(), self = this;

		var proceed = (function (browser) {

			var 
				interface = options.interface || Avahi.IF_UNSPEC,
				protocol = options.protocol || Avahi.PROTO_UNSPEC,
				type = options.type,
				domain = options.domain || '',
				flags = options.flags || 0;

			
			switch (typeof interface) {
			case "number":
				break;
			case "string":
				this.server.getNetworkInterfaceIndexByName(interface, function(err, index) {

				});
				break;
			default:
				throw new TypeError("Interface must be a string or integer!");
			}

			switch(typeof protocol) {
			case "number":
			case "string":
				break;
			default:
				throw new TypeError("Interface must be a string or integer!");
			}

			if (typeof domain !== "string")
				throw new TypeError("Domain must be a string!");

			if (typeof flags !== "number")
				throw new TypeError("Flags must be an integer!");

			if (typeof type === "undefined") {
				this.server.serviceTypeBrowserNew(interface, protocol, domain, flags, function(err, internalBrowser) {
					if (err)
						return browser.emit("error", err);

					internalBrowser = internalBrowser.as(Avahi.ServiceTypeBrowser);

					internalBrowser.on("itemNew", function(interface, protocol, type, domain, flags) {
						//browser.emit("discovery", new Service(self, { interface: interface, protocol: protocol, name: name, type: type, flags: flags }));
					}).on("itemRemove", function(interface, protocol, type, domain, flags) {
						//browser.emit("disappearance", new Service(self, { interface: interface, protocol: protocol, name: name, type: type, flags: flags }))
					}).on("allForNow", function() {
						browser.emit("stabilization");
					}).on("failure", function() {
						browser.emit("error");
					});
					browser.emit("ready");
					
				});
			} 
			else {
				this.server.serviceBrowserNew(interface, protocol, type, domain, flags, function(err, internalBrowser) {
					if (err)
						return browser.emit("error", err);
					
					internalBrowser = internalBrowser.as(Avahi.ServiceBrowser);

					internalBrowser.on("ready", function() {
						browser.emit("ready");
					}).on("itemNew", function(interface, protocol, name, type, domain, flags) {
						browser.emit("discovery", new Service(self, { interface: interface, protocol: protocol, name: name, type: type, domain: domain, flags: flags }))
					}).on("itemRemove", function(interface, protocol, name, type, domain, flags) {
						browser.emit("disappearance", new Service(self, { interface: interface, protocol: protocol, name: name, type: type, domain: domain, flags: flags }))
					}).on("allForNow", function() {
						browser.emit("stabilization");
					}).on("failure", function() {
						browser.emit("error");
					}).on("cacheExhausted", function() {
						browser.emit("cacheExhausted");
					})

					
				
				});
			}
		}).bind(this, browser)

		if (this.ready) {
			proceed();
		} 
		else {
			this.on("ready", function() {
				proceed();
			})
		}

		return browser;
	}

	switch(arguments.length) {
	case 0: //nothing
		return this.browse({});
	case 1: //type 
		return this.browse({type: arguments[0]});
	case 2: //interface + type
		return this.browse({interface: arguments[0], type: arguments[1]});
	case 3: //interface + protocol + type
		return this.browse({interface: arguments[0], protocol: arguments[1], type: arguments[2]});
	case 4: //interface + protocol + type + domain
		return this.browse({interface: arguments[0], protocol: arguments[1], type: arguments[2], domain: arguments[3]});
	default:
		throw new TypeError("Invalid number of arguments or something!");
	}
}

Avahi.prototype.publish = function(name, type, port, params) {

	var server = this.server;

	function doPublish() {
		server.entryGroupNew(function(err, group) {
			if (err)
				return;

			group = group.as(Avahi.EntryGroup);

			group.on("ready", function() {
				var 
					interface = Avahi.IF_UNSPEC,
					protocol = Avahi.PROTO_INET,
					domain = "", 
					address = "";
				group.addService(interface, protocol, 0, name, type, domain, address, port, Avahi.encodeTXTParameters(params), function(err) {
					group.commit(function(err) {

					});
				})
			})
			
		})
	}

	if (this.ready)
		doPublish();
	else
		this.on("ready", doPublish);
}

module.exports = Avahi;
module.exports.avahi = new Avahi();