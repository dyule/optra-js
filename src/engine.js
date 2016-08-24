(function(global) {
    function get_increment(operation) {
        if (operation.value) {
            return operation.value.length;
        } else {
            return -operation.length;
        }
    }

    function copy_state(state) {
        return {
            siteID: state.siteID,
            localTimestamp: state.localTimestamp,
            remoteTimestamp: state.remoteTimestamp
        }
    }

    function transform(incomingSequence, existingSequence) {
        var incomingOffset = 0;
        var existingOffset = 0;
        var totalOverlap = 0;
        incomingSequence.iterate_with(existingSequence, function(incomingOp, existingOp) {
            if (!incomingOp) {
                return false;
            }
            if (!existingOp) {
                incomingOp.position += existingOffset + totalOverlap;
                return true;
            }

            var incomingStart = incomingOp.position - incomingOffset;
            var existingStart = existingOp.position - existingOffset;
            var incomingEnd = incomingStart + (incomingOp.length || 0);
            var existingEnd = existingStart + (existingOp.length || 0);
            var amount;
            var new_op;
            if (incomingStart < existingStart || (incomingOp.value !== undefined && existingOp.value !== undefined && incomingStart == existingStart && incomingOp.state.siteID < existingOp.state.siteID)) {
                if (existingStart < incomingEnd) {
                    if (existingEnd < incomingEnd) {
                        //Encloses
                        amount = existingStart - incomingStart;
                        new_op = {
                            position: incomingOp.position,
                            length: incomingOp.length - amount,
                            state: copy_state(incomingOp.state),
                            next: incomingOp.next,
                            back: incomingOp
                        };
                        incomingOp.length = amount;
                        incomingOp.next = new_op;
                        incomingOffset += get_increment(incomingOp);
                        incomingOp.position += existingOffset + totalOverlap;
                        return true;
                    } else {
                        //Overlaps Front
                        incomingOffset += get_increment(incomingOp);
                        amount = incomingEnd - existingStart;
                        incomingOp.length -= amount;
                        incomingOp.position += existingOffset + totalOverlap;
                        totalOverlap += amount;
                        return true;

                    }
                } else {
                    //Precedes
                    incomingOffset += get_increment(incomingOp);
                    incomingOp.position += existingOffset + totalOverlap;
                    return true;
                }
            } else {
                if (incomingStart < existingEnd) {
                    if (incomingEnd < existingEnd) {
                        if (incomingStart == existingStart) {
                            //Overlaps Front
                        } else {
                            //Enclosed By
                            incomingOffset += get_increment(incomingOp);
                            amount = incomingStart - existingStart;
                            incomingOp.position += existingOffset + totalOverlap - amount;
                            totalOverlap += incomingOp.length;
                            incomingOp.length = 0;
                            return true;

                        }
                    } else {
                        //Overlaps back
                        existingOffset += get_increment(existingOp);
                        amount = existingEnd - incomingStart;
                        totalOverlap += amount;
                        incomingOffset -= amount;
                        incomingOp.length -= amount;
                        return false;
                    }
                } else {
                    // Follows
                    existingOffset += get_increment(existingOp);
                    return false;
                }
            }

            
        });
    }

    function merge(incoming_sequence, existing_sequence) {
        var offset = 0;
        incoming_sequence.iterate_with(existing_sequence, function(incomingOp, existingOp) {
            if (!incomingOp) {
                existingOp.position += offset;
                return false;
            }
            if (!existingOp) {
                existing_sequence.push({
                    position: incomingOp.position,
                    value: incomingOp.value,
                    length: incomingOp.length,
                    state: copy_state(incomingOp.state),
                    next: incomingOp.next
                });
                return true;
            }
            var newOp;
            if (incomingOp.position < existingOp.position || (incomingOp.value !== undefined && existingOp.value !== undefined && incomingOp.position == existingOp.position && incomingOp.state.siteID < existingOp.state.siteID)) {
                newOp = {
                    position: incomingOp.position,
                    value: incomingOp.value,
                    length: incomingOp.length,
                    state: copy_state(incomingOp.state),
                    next: existingOp,
                    back: existingOp.back
                };
                offset += get_increment(incomingOp);
                if (existingOp.back) {
                    existingOp.back.next = newOp;
                } else {
                    existing_sequence.head = newOp;
                }
                return true;
            } else {
                existingOp.position += offset;
                return false;
            }
        });
    }

    global.engine = function () {
        return {
            inserts: operation_list(),
            deletes: operation_list(),
            integrateRemote: function(remote_sequence) {
                var localConcurrentInserts = this.getConcurrentInserts(remote_sequence.start_state, remote_sequence.originalSite);
                transform(remote_sequence.inserts, localConcurrentInserts);
                var transformedRemoteInserts = remote_sequence.inserts.clone();
                transform(remote_sequence.inserts, this.deletes);
                this.assignTimestamps(transformedRemoteInserts);
                merge(transformedRemoteInserts, this.inserts);

                transform(this.deletes, transformedRemoteInserts);

                var transformedConcurrentInserts = this.getConcurrentInserts(remote_sequence.start_state, remote_sequence.originalSite);
                transform(remote_sequence.deletes, transformedConcurrentInserts);
                transform(remote_sequence.deletes, this.deletes);
                this.assignTimestamps(remote_sequence.deletes);
                merge(remote_sequence.deletes, this.deletes);
            },
            assignTimestamps: function(sequence) {

            },
            getConcurrentInserts: function(state, original_site) {
                var referenceTime;
                var node = this.inserts.head;
                while (node) {
                    if (node.state.siteID == state.siteID && node.state.remoteTimestamp == state.remoteTimestamp) {
                        referenceTime = node.state.localTimestamp;
                        break;
                    }
                    node = node.next;
                }
                if (referenceTime === undefined) {
                    node = this.deletes.head;
                    while (node) {
                        if (node.state.siteID === state.siteID && node.state.remoteTimestamp == state.remoteTimestamp) {
                            referenceTime = node.state.localTimestamp;
                            break;
                        }
                        node = node.next;
                    }
                }
                if (referenceTime === undefined) {
                    console.error("Could not find reference state");
                    return operation_list()
                }
                var returnList = operation_list();
                node = this.inserts.head;
                while (node) {
                    if (node.state.siteID !== original_site && node.state.localTimestamp >  referenceTime) {
                        returnList.push({
                            position: node.position,
                            value: node.value,
                            length: node.length,
                            next: node.next,
                            state: copy_state(node.state),
                        });
                    }
                    node = node.next;
                }
                return returnList;

            },
            internals: {
                transform: transform,
                merge: merge
            }
        }
    }
})(this);