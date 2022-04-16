var fs = require("fs");
var jsonminify = require("jsonminify");

//The app title, visible e.g. in the browser window
exports.title = "GEEK explorer";

//The url it will be accessed from
exports.address = "localhost";

// logo
exports.logo = "public/images/logo.png";
exports.headerlogo = "public/images/headerlogo.png";

//The app favicon fully specified url, visible e.g. in the browser window
exports.favicon = "public/favicon.ico";

//The Port ep-lite should listen to
exports.port = process.env.PORT || 3001;

//coin symbol, visible e.g. MAX, LTC, HVC
exports.symbol = "GEEK";

//coin name, visible e.g. in the browser window
exports.coin = "GeekCash";

//This setting is passed to MongoDB to set up the database
exports.dbsettings = {
	"user": "geek",
	"password": "explorer",
	"database": "geekexplorerdb",
	"address" : "localhost",
	"port" : 27017
};

//This setting is passed to the wallet
exports.wallet = { "host" : "localhost",
	"port" : 6888,
	"username" : "geek",
	"password" : "explorer"
};

//Locale file
exports.locale = "locale/en.json",

//Menu items to display
exports.display = {
	"api": true,
	"search": true,
	"richlist": true,
	"movement": true,
	"network": true,
};

//API view
exports.api = {
	"blockindex": 1,
	"blockhash": "000001c800f8dd4695bc5f30711c876552f444fbaade6d344f30e05105fcc852",
	"txhash": "716690870aef4090659d6af0946051331e1b029c4e768dab07a35e576565e628",
	"address": "GLjRv3qsGLgonvhSRxUJ5SntVmkYGHtvFH",
};

// richlist/top100 settings
exports.richlist = {
	"distribution": true,
	"received": true,
	"balance": true
};

exports.movement = {
	"min_amount": 1,
	"low_flag": 1000,
	"high_flag": 100000
},

//index
exports.index = {
	"show_hashrate": true,
	"difficulty": "POW",
	"last_txs": 10000,
	"txs_per_page": 50
};

exports.confirmations = 101;

//timeouts
exports.update_timeout = 50;
exports.check_timeout = 250;
exports.block_parallel_tasks = 1;


//genesis
exports.genesis_tx = "6d87016979d2f369dcb5fc3a5c284be1a316790cbaabfcce403d24da4b49b210";
exports.genesis_block = "00000d586e0fd3a2700d656be5fc7076bdd22cfbb3c1de83b61a5f0524fb6bba";

exports.use_rpc = true;
exports.lock_during_index = true;
exports.txcount = 10000;
exports.txcount_per_page = 50;
exports.show_sent_received = true;
exports.supply = "COINBASE";
exports.nethash = "getnetworkhashps";
exports.nethash_units = "H";

exports.labels = {};

exports.reloadSettings = function reloadSettings() {
	// Discover where the settings file lives
	var settingsFilename = "settings.json";
	settingsFilename = "./" + settingsFilename;

	var settingsStr;
	try{
		//read the settings sync
		settingsStr = fs.readFileSync(settingsFilename).toString();
	} catch(e){
		console.warn('No settings file found. Continuing using defaults!');
	}

	// try to parse the settings
	var settings;
	try {
		if(settingsStr) {
			settingsStr = jsonminify(settingsStr).replace(",]","]").replace(",}","}");
			settings = JSON.parse(settingsStr);
		}
	}catch(e){
		console.error('There was an error processing your settings.json file: '+e.message);
		process.exit(1);
	}

	//loop trough the settings
	for(var i in settings)
	{
		//test if the setting start with a low character
		if(i.charAt(0).search("[a-z]") !== 0)
		{
			console.warn("Settings should start with a low character: '" + i + "'");
		}

		//we know this setting, so we overwrite it
		if(exports[i] !== undefined)
		{
			// 1.6.2 -> 1.7.X we switched to a new coin RPC with different auth methods
			// This check uses old .user and .pass config strings if they exist, and .username, .password don't.
			if (i == 'wallet')
			{
				if (!settings.wallet.hasOwnProperty('username') && settings.wallet.hasOwnProperty('user'))
				{
					settings.wallet.username = settings.wallet.user;
				}
				if (!settings.wallet.hasOwnProperty('password') && settings.wallet.hasOwnProperty('pass'))
				{
					settings.wallet.password = settings.wallet.pass;
				}
			}
			exports[i] = settings[i];
		}
		//this setting is unkown, output a warning and throw it away
		else
		{
			console.warn("Unknown Setting: '" + i + "'. This setting doesn't exist or it was removed");
		}
	}

};

// initially load settings
exports.reloadSettings();
