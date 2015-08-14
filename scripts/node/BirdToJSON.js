var BirdSocket = require('./BirdSocket.js').BirdSocket;
var YAML = require('yamljs');
var fs = require('fs');
var when = require('when');

//TODO load config somehow
var dataPath = '/opt/icvpn-monitoring/data'
var communityFilesPath = dataPath+'/icvpn-meta'
var webDataPath = '/opt/icvpn-monitoring/web/data';

/*
 * parse yaml files
 */
var files = fs.readdirSync(communityFilesPath);
var ignoreFiles = ['.travis.yml', 'README.rst', ''];
var communityMetaDataList = [];
for (var c=0; c<files.length; c++) {
  var path = communityFilesPath+'/'+files[c];
  //ignore directories and special files
  if (!fs.lstatSync(path).isDirectory() && ignoreFiles.indexOf(files[c]) == -1) {
    communityMetaDataList.push(YAML.load(path));
  }
}

/*
 * get routes and session info
 */
var promises = [];

//get v4  and v6 routes
for (var a=0; a<communityMetaDataList.length; a++) {
  if (typeof(communityMetaDataList[a].asn) != 'undefined') {
    promises.push(new BirdSocket().getRoutesByAS(4, communityMetaDataList[a].asn));
    promises.push(new BirdSocket().getRoutesByAS(6, communityMetaDataList[a].asn));
  }
}

//get v4 sessions
promises.push(new BirdSocket().showProtocols(4));

//get v6 session
promises.push(new BirdSocket().showProtocols(6));

/*
 * combine everything
 */
when.all(promises).then(function(data) {

  //combine v4 and v6 routes for as
  var dataIndex = 0
  for (var i=0; i<communityMetaDataList.length; i++) {
    //skip communities with missing AS because we also skipped them on promise creation
    if (typeof(communityMetaDataList[i].asn) != 'undefined') {
      communityMetaDataList[i].v4 = {};
      communityMetaDataList[i].v4.routes = data[dataIndex];
      communityMetaDataList[i].v6 = {};
      communityMetaDataList[i].v6.routes = data[dataIndex+1];
      dataIndex = dataIndex+2;
    }
  }


  var v4sessions = data[(data.length-2)];
  var v6sessions = data[(data.length-1)];
  var sessions = [];

  //meh this is ugly >:(
  for (var k=0; k< v4sessions.length; k++) {
    //combine v4 and v6 sessions
    var session = {
      name: v4sessions[k].name,
      v4: v4sessions[k].v4,
    };
    for (var j=0; j<v6sessions.length; j++) {
      if (v4sessions[k].name == v6sessions[j].name) {
        session.v6 = v6sessions[j].v6;
        break;
      }
    }
    for (var l=0; l<communityMetaDataList.length; l++) {
      var communityBGP = communityMetaDataList[l].bgp;
      //TODO add routes per session here
      if (typeof(communityBGP) != 'undefined' && communityBGP.hasOwnProperty(session.name)) {
        session.currentbgp = {};
        session.as = communityMetaDataList[l].asn;
        session.networks = communityMetaDataList[l].networks;
        session.currentbgp.v4 = communityMetaDataList[l].v4;
        session.currentbgp.v6 = communityMetaDataList[l].v6;
        break;
      }
    }
    sessions.push(session);
  }

  // write all to a file
  fs.writeFile(webDataPath+'/sessions.js', JSON.stringify(sessions), function (err,data) {
    if (err) {
          return console.log(err);
      }
  });
});

