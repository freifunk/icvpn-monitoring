# icvpn-monitoring
Monitoring of BGP sessions in our Inter City VPN

## web
The website is a simple angularjs application that presents data read from a sessions.js. The sessions.js contains information about BGP sessions in JSON format.

### setup
1. Copy web folder to your webserver directory
2. Create a data folder in the web folder
3. Configure your webserver to serve index.html 


## data source
The data source (sessions.js) is created by a nodejs script. The scripts reads yaml files from [icvpn-meta](https://github.com/freifunk/icvpn-meta) repository and combines them with BGP session data from [bird](http://bird.network.cz/). 
If you want to keep the information on the web page up to date schedule some taks to checkout [icvpn-meta](https://github.com/freifunk/icvpn-meta) repository and run the BirdToJSON.js script.

###setup
1. Clone [icvpn-meta](https://github.com/freifunk/icvpn-meta) repository
2. Change [dataPath](https://github.com/freifunk/icvpn-monitoring/blob/master/scripts/node/BirdToJSON.js#L7) variable in BirdToJSON.js to the parent folder of the icvpn-meta data folder
3. Chage [webDataPath](https://github.com/freifunk/icvpn-monitoring/blob/master/scripts/node/BirdToJSON.js#L9) in BirdToJSON.js to data folder you created in step 2 of web setup
4. Install BirdToJSON.js node dependencies
5. Run BirdToJSON.js Node script







