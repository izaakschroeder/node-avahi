
var Avahi = require('./avahi'), DBus = require('dbus');;

var client = DBus.system(Avahi.Namespace).object("/").as(Avahi.Server);

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
			group.addService(Avahi.IF_UNSPEC, Avahi.PROTO_INET, 0, "Hello World", "_test._tcp", "", "", 4444, [ "message=Hello" ], function(err) {
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
				console.log("Connect to "+address+":"+port+" please.");
			})

			
		}).on("itemRemove", function() {
			console.log("Service disappeared.");
		})
	})

})