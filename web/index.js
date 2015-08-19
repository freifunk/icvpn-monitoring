var icvpnmeta = angular.module('icvpnmeta',[]);

icvpnmeta.controller('connectionsTable', function($scope, $http) {
  $scope.metaInfo = {lastRun: {}};

  $http.get("data/sessions.js")
        .success(function (data) {
            $scope.connections = data;
        });

  $http.get("data/lastrun-update-sessioninfo.txt")
    .success(function(data) {
      $scope.metaInfo.lastRun.updateessioninfo = data;
    });

  $http.get("data/lastrun-update-icvpnmeta-gitrepo.txt")
    .success(function(data) {
      $scope.metaInfo.lastRun.updateicvpnmeta = data;
    });

  $scope.toggle = function(connection) {
    connection.showDetails = !connection.showDetails;
  }
});

icvpnmeta.filter('unroutedNetworks', function() {
	return function( items, routedNetworks) {
		var unroutedNetworks = [];
		if (typeof(items) != 'undefined') {
			for (var i=0; i<items.length; i++) {
				if (typeof(routedNetworks) != 'undefined' && routedNetworks.indexOf(items[i]) == -1) {
					unroutedNetworks.push(items[i]);
				}
			}
		}
		return unroutedNetworks;
	}
});
