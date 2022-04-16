GEEK Explorer - 0.9.0
================

An open source block explorer written in node.js.

### See it in action

*  [GEEK Explorer](https://explorer.blazegeek.com)

### Requires

*  node.js >= 8.17.0 (12.14.0 is advised for updated dependencies)
*  mongodb 4.2.x
*  geekcashd

### Create database

Enter MongoDB cli:

	$ mongo

Create databse:

	> use explorerdb

Create user with read/write access:

	> db.createUser( { user: "geek", pwd: "explorer", roles: [ "readWrite" ] } )

*Note: If you're using mongo shell 4.2.x, use the following to create your user:*

	> db.addUser( { user: "geek", pwd: "explorer", roles: [ "readWrite"] })

### Get the source

	git clone https://github.com/blazegeek/geek-explorer geek-explorer

### Install node modules

	cd geek-explorer && npm install --production

### Configure

	cp ./settings.json.template ./settings.json

*Make required changes in settings.json*

### Start Explorer

	npm start

*Note: mongod must be running to start the explorer*

As of version 1.4.0 the explorer defaults to cluster mode, forking an instance of its process to each cpu core. This results in increased performance and stability. Load balancing gets automatically taken care of and any instances that for some reason die, will be restarted automatically. For testing/development (or if you just wish to) a single instance can be launched with

	node --stack-size=10000 bin/instance

To stop the cluster you can use

	npm stop

### Syncing databases with the blockchain

sync.js (located in scripts/) is used for updating the local databases. This script must be called from the explorers root directory.

	Usage: node scripts/sync.js [database] [mode]

	database: (required)
	index [mode] Main index: coin info/stats, transactions & addresses

	mode: (required for index database only)
	update       Updates index from last sync to current block
	check        checks index for (and adds) any missing transactions/addresses
	reindex      Clears index then resyncs from genesis to current block

	notes:
	* 'current block' is the latest created block when script is executed.
	* If check mode finds missing data(ignoring new data since last sync),
	  index_timeout in settings.json is set too low.


*It is recommended to have this script launched via a cronjob at 1+ min intervals.*

**crontab**

*Example crontab; update index every minute and market data every 2 minutes*

	*/1 * * * * cd /path/to/geek-explorer && /usr/bin/nodejs scripts/sync.js index update > /dev/null 2>&1
	*/5 * * * * cd /path/to/geek-explorer && /usr/bin/nodejs scripts/peers.js > /dev/null 2>&1

### Wallet

The GeekCash wallet must be running with at least the following flags:

	-daemon -txindex
	
### Security

Ensure mongodb is not exposed to the outside world via your mongo config or a firewall to prevent outside tampering of the indexed chain data. 

### Known Issues

**script is already running.**

If you receive this message when launching the sync script either: a) a sync is currently in progress; or b) a previous sync was killed before it completed. If you are certian a sync is not in progress remove the index.pid and from the tmp folder in the explorer root directory.

	rm tmp/index.pid

**exceeding stack size**

	RangeError: Maximum call stack size exceeded

Nodes default stack size may be too small to index addresses with many tx's. If you experience the above error while running sync.js the stack size needs to be increased.

To determine the default setting run

	node --v8-options | grep -B0 -A1 stack-size

To run sync.js with a larger stack size launch with

	node --stack-size=[SIZE] scripts/sync.js index update

Where [SIZE] is an integer higher than the default.

*note: SIZE will depend on which blockchain you are using, you may need to play around a bit to find an optimal setting*
