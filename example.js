
var client = require('./avahi');


client.publish("Hello World", "_test._tcp", 3333);

client.on("ready", function() {
	
	client.browse("_ssh._tcp").on("discovery", function(node) {
		node.resolve(function(err, address, port) {
			if (err) {
				console.log("Error resolving host.");
				return;
			}
			console.log("SSH available on "+address+":"+port);
		})
	}).on("disappearance", function(node) {
		console.log("gone");
	})

/*
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

			group.addService(Avahi.IF_UNSPEC, Avahi.PROTO_INET, 0, "Hello World", "_test._tcp", "", "", 4444, Avahi.encodeTXTParameters(params), function(err) {
				group.commit(function() {

				});
			})
		})
		
	})

	client.serviceTypeBrowserNew(Avahi.IF_UNSPEC, Avahi.PROTO_UNSPEC, '', 0, function(err, browser) {

	//})

	//client.serviceBrowserNew(Avahi.IF_UNSPEC, Avahi.PROTO_UNSPEC, '_test._tcp', '', 0, function(err, browser) {
		
		browser = browser.as(Avahi.ServiceTypeBrowser);
		
		browser.on("allForNow", function() {
			console.log("All for now");
		}).on("failure", function() {
			console.log("Failure");
		}).on("itemNew", function(interface, protocol, name, type, domain, flags) {
			console.log("+ "+interface+" "+protocol+" "+name+" "+type+" "+domain+" "+flags);
		}).on("itemRemove", function() {
			console.log("Service disappeared.");
		})
	})
*/
})