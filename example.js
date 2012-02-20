
var Avahi = require('./avahi'), DBus = require('dbus'), util = require('util');

var client = DBus.system(Avahi.Namespace).object("/").as(Avahi.Server);

function encodeTXTParameters(params) {
	var out = [ ];
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

function decodeTXTParameters(txt) {
	var params = { }
	txt.map(function(t) { return t.map(function(i) { return String.fromCharCode(i); }).join("").split("=",2); }).forEach(function(item) {
		params[item[0]] = item[1];
	})
	return params;
}

client.on("ready", function() {
	
	client.getVersionString(function(err, version) {
		console.log("You're running: "+version);
	})

	client.getHostNameFqdn(function(err, hostnameFqdn) {
		console.log("On the machine: "+hostnameFqdn);
	});


	client.entryGroupNew(function(err, group) {

		group = group.as(Avahi.EntryGroup);

		group.on("ready", function() {

			var params = {  message: "hello" };

			group.addService(Avahi.IF_UNSPEC, Avahi.PROTO_INET, 0, "Hello World", "_test._tcp", "", "", 4444, encodeTXTParameters(params), function(err) {
				group.commit(function() {

				});
			})
		})
		
	})

	client.serviceBrowserNew(Avahi.IF_UNSPEC, Avahi.PROTO_UNSPEC, '_test._tcp', '', 0, function(err, browser) {
		
		browser = browser.as(Avahi.ServiceBrowser);
		
		browser.on("allForNow", function() {
			console.log("All for now");
		}).on("failure", function() {
			console.log("Failure");
		}).on("itemNew", function(interface, protocol, name, type, domain, flags) {
			console.log("Service found.");
			client.resolveService(interface, protocol, name, type, domain, Avahi.PROTO_UNSPEC, 0, function(err, interface, protocol, name, type, domain, host, protocol, address, port, txt, flags) {
				console.log("Connect to "+address+":"+port+" please ("+util.inspect(decodeTXTParameters(txt))+").");
			})

			
		}).on("itemRemove", function() {
			console.log("Service disappeared.");
		})
	})

})