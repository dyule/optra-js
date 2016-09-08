(function(global) {
    global.Stamper = function (siteID) {
        var lastLocal;
        var lastRemote;
        var lookup = {};

        function lookupLocal(remoteStamp) {
            if (remoteStamp.siteID in lookup) {
                return lookup[remoteStamp.siteID][remoteStamp.timestamp]
            } else {
                return undefined;
            }
        }

        return {
            stampLocal: function() {
                if (lastLocal === undefined) {
                    lastLocal = 0;
                } else {
                    lastLocal += 1;
                }
                if (!(siteID in lookup)) {
                    lookup[siteID] = {}
                }
                lookup[siteID][lastLocal] = lastLocal;
                lastRemote = {
                    siteID: siteID,
                    timestamp: lastLocal
                };
                return lastLocal;
            },

            stampRemote: function(remoteStamp) {
                if (!(remoteStamp.siteID in lookup)) {
                    lookup[remoteStamp.siteID] = {}
                } else {
                    if (remoteStamp.timestamp in lookup[remoteStamp.siteID]) {
                        return lookup[remoteStamp.siteID][remoteStamp.timestamp];
                    }
                }
                if (lastLocal === undefined) {
                    lastLocal = 0;
                } else {
                    lastLocal += 1;
                }
                lookup[remoteStamp.siteID][remoteStamp.timestamp] = lastLocal;
                lastRemote = remoteStamp;
                return lastLocal;

            },

            getLocalTimestampFor: function(remoteStamp) {
                return lookupLocal(remoteStamp);
            },

            getLookupSince: function(remoteStamp) {
                var lookupsSince = {};
                var localStamp;
                var remoteTime;
                if (remoteStamp !== undefined ) {
                    remoteTime = lookupLocal(remoteStamp);
                }
                for (var siteID in lookup) {
                    if (lookup.hasOwnProperty(siteID)) {
                        for (var remoteTimestamp in lookup[siteID]) {
                            if (lookup[siteID].hasOwnProperty(remoteTimestamp)) {
                                localStamp = lookup[siteID][remoteTimestamp];
                                if (remoteTime === undefined || localStamp > remoteTime) {
                                    lookupsSince[localStamp] = {
                                        siteID: siteID,
                                        timestamp: remoteTimestamp
                                    }
                                }
                            }
                        }
                    }
                }
                return lookupsSince;
            },

            getLastRemote: function() {
                return lastRemote;
            },

            getLastLocal: function() {
                return lastLocal;
            }
        }
    }
})(this);
