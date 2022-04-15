var mongoose = require('mongoose');
var db = require('../lib/database');
var Tx = require('../models/tx');
var Address = require('../models/address');
var AddressTx = require('../models/addresstx');
var Richlist = require('../models/richlist');
var	Stats = require('../models/stats');
var	settings = require('../lib/settings');
var	fs = require('fs');

var mode = 'update';
var database = 'index';

// displays usage and exits
function usage() {
	console.log('Usage: node scripts/sync.js [database] [mode]');
	console.log('');
	console.log('database: (required)');
	console.log('index [mode] Main index: coin info/stats, transactions & addresses');
	console.log('');
	console.log('mode: (required)');
	console.log('update       Updates index from last sync to current block');
	console.log('check        checks index for (and adds) any missing transactions/addresses');
	console.log('reindex      Clears index then resyncs from genesis to current block');
	console.log('reindex-rich Clears richlist then resyncs from genesis to current block');
	console.log('');
	console.log('Notes:');
	console.log('* \'current block\' is the latest created block when script is executed.');
	console.log('* If check mode finds missing data(ignoring new data since last sync),');
	console.log('  index_timeout in settings.json is set too low.');
	console.log('');
	process.exit(0);
}

// check options
if (process.argv[2] == 'index') {
	if (process.argv.length <3) {
		usage();
	} else {
		switch(process.argv[3])
		{
			case 'update':
				mode = 'update';
				break;
			case 'check':
				mode = 'check';
				break;
			case 'reindex':
				mode = 'reindex';
				break;
			case 'reindex-rich':
				mode = 'reindex-rich';
				break;
			default:
				usage();
		}
	}
} else {
	usage();
}

function create_lock(cb) {
	if ( database == 'index' ) {
		var fname = './tmp/' + database + '.pid';
		fs.appendFile(fname, process.pid.toString(), function (err) {
			if (err) {
				console.log("Error: unable to create %s", fname);
				process.exit(1);
			} else {
				return cb();
			}
		});
	} else {
		return cb();
	}
}

function remove_lock(cb) {
	if ( database == 'index' ) {
		var fname = './tmp/' + database + '.pid';
		fs.unlink(fname, function (err){
			if(err) {
				console.log("unable to remove lock: %s", fname);
				process.exit(1);
			} else {
				return cb();
			}
		});
	} else {
		return cb();
	}
}

function is_locked(cb) {
	if ( database == 'index' ) {
		var fname = './tmp/' + database + '.pid';
		fs.exists(fname, function (exists){
			if(exists) {
				return cb(true);
			} else {
				return cb(false);
			}
		});
	} else {
		return cb();
	}
}

function exit() {
	remove_lock(function(){
		mongoose.disconnect();
		process.exit(0);
	});
}

var dbString = 'mongodb://' + settings.dbsettings.user;
dbString = dbString + ':' + settings.dbsettings.password;
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + '/' + settings.dbsettings.database;

is_locked(function (exists) {
	if (exists) {
		console.log("Script already running..");
		process.exit(0);
	} else {
		create_lock(function (){
			console.log("script launched with pid: " + process.pid);
			mongoose.connect(dbString, function(err) {
				if (err) {
					console.log('Unable to connect to database: %s', dbString);
					console.log('Aborting');
					exit();
				} else {
					db.check_stats(settings.coin, function(exists) {
						if (exists == false) {
							console.log('Run \'npm start\' to create database structures before running this script.');
							exit();
						} else {
							db.update_db(settings.coin, function(stats){
								if (mode == 'reindex') {
									Tx.deleteMany({}, function(err) { 
										console.log('TXs cleared.');
										Address.deleteMany({}, function(err2) { 
											console.log('Addresses cleared.');
											AddressTx.deleteMany({}, function(err3) {
												console.log('Address TXs cleared.');
												Richlist.updateOne({coin: settings.coin}, {
													received: [],
													balance: [],
												}, function(err3) { 
													Stats.updateOne({coin: settings.coin}, { 
														last: 0,
														count: 0,
														supply: 0,
													}, function() {
														console.log('index cleared (reindex)');
													}); 
													db.update_tx_db(settings.coin, 1, stats.count, settings.update_timeout, function(){
														db.update_richlist('received', function(){
															db.update_richlist('balance', function(){
																db.get_stats(settings.coin, function(nstats){
																	console.log('reindex complete (block: %s)', nstats.last);
																	exit();
																});
															});
														});
													});
												});
											});
										});
									});
								} else if (mode == 'check') {
									db.update_tx_db(settings.coin, 1, stats.count, settings.check_timeout, function(){
										db.get_stats(settings.coin, function(nstats){
											console.log('check complete (block: %s)', nstats.last);
											exit();
										});
									});
								} else if (mode == 'update') {
									db.update_tx_db(settings.coin, stats.last, stats.count, settings.update_timeout, function(){
										db.update_richlist('received', function(){
											db.update_richlist('balance', function(){
												db.get_stats(settings.coin, function(nstats){
													console.log('update complete (block: %s)', nstats.last);
													exit();
												});
											});
										});
									});
								} else if (mode == 'reindex-rich') {
									console.log('update started');
									db.update_tx_db(settings.coin, stats.last, stats.count, settings.check_timeout, function(){
										console.log('update finished');
										db.check_richlist(settings.coin, function(exists){
											if (exists == true) {
												console.log('richlist entry found, deleting now..');
											}
											db.delete_richlist(settings.coin, function(deleted) {
												if (deleted == true) {
													console.log('richlist entry deleted');
												}
												db.create_richlist(settings.coin, function() {
													console.log('richlist created.');
													db.update_richlist('received', function(){
														console.log('richlist updated received.');
														db.update_richlist('balance', function(){
															console.log('richlist updated balance.');
															db.get_stats(settings.coin, function(nstats){
																console.log('update complete (block: %s)', nstats.last);
																exit();
															});
														});
													});
												});
											});
										}); 
									});
								}
							});
						}
					});
				}
			});
		});
	}
});
