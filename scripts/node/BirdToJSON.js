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
  var communityMetaData = communityMetaDataList[a];
  if (isValid(communityMetaData)) {
    for (property in communityMetaData.bgp) {
      promises.push(new BirdSocket().getRoutesBySession(4, communityMetaData.asn, property));
      promises.push(new BirdSocket().getRoutesBySession(6, communityMetaData.asn, property));
    }
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
  console.log(data);
  var v4sessions = data[(data.length-2)];
  var v6sessions = data[(data.length-1)];
  var sessions = [];

  //combine v4 and v6 routes for session
  var dataIndex = 0
  for (var i=0; i<communityMetaDataList.length; i++) {
    var communityMetaData = communityMetaDataList[i];
    //skip communities with missing AS because we also skipped them on promise creation
    if (isValid(communityMetaData)) {
      for (property in communityMetaData.bgp) {
        console.log('>>> COMBINE DATA');
        var v4sessionData = findSessionByName(v4sessions, property);
        var v4session = {};
        if (typeof(v4sessionData) != 'undefined') {
          v4session = v4sessionData.v4;
        }

        var v6sessionData = findSessionByName(v6sessions, property);
        var v6session = {};
        if (typeof(v6sessionData) != 'undefined') {
          v6session = v6sessionData.v6;
        }
        var session = {
          name: property,
          as: communityMetaData.asn,
          networks : communityMetaData.networks,
          v4: v4session,
          v6: v6session,
          currentbgp: {
            v4: data[dataIndex],
            v6: data[dataIndex+1]
          }
        };
        dataIndex = dataIndex+2;
        sessions.push(session);
        console.log('<<< COMBINE DATA');
      }
    }
  }

  // write all to a file
  fs.writeFile(webDataPath+'/sessions.js', JSON.stringify(sessions), function (err,data) {
    if (err) {
          return console.log(err);
      }
  });
});

function isValid(communityMetaData) {
  return typeof(communityMetaData.asn) != 'undefined' && typeof(communityMetaData.bgp) != 'undefined';
}

function findSessionByName(sessions, name) {
  for (var i=0;i<sessions.length;i++) {
    if (sessions[i].name == name) {
      return sessions[i];
    }
  }
}
