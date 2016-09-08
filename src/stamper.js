(function(global) {
    global.stamper = function (siteID) {
        var lastLocal;
        var lastRemote;
        var lookup = {};

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
                lastRemote = remote;
                return lastLocal;

            },

            getLocalTimestampFor: function(remoteStamp) {
                if (remoteStamp.siteID in lookup) {
                    return lookup[remoteStamp.siteID][remoteStamp.timestamp]
                } else {
                    return undefined;
                }
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
