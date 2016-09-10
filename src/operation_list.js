(function (global) {
    global.operation_list = function() {
        return {
            push: function(new_obj) {
                new_obj.back = this.tail;
                if (this.head === undefined) {
                    this.head = new_obj;
                    this.tail = new_obj;
                } else {
                    this.tail.next = new_obj;
                    this.tail = new_obj;
                }
                new_obj.next = undefined;
            },

            iterate: function(iterFunc) {
              var node = this.head;
                while (node) {
                    iterFunc(node);
                    node = node.next;
                }
            },

            iterate_with: function(otherIterator, compareFunc) {
                var my_node = this.head;
                var other_node = otherIterator.head;
                var compare_result;
                while (my_node || other_node) {
                    compare_result = compareFunc(my_node, other_node);
                    if (compare_result) {
                        my_node = my_node.next;
                    } else {
                        other_node = other_node.next;
                    }
                }
            },

            getMinTimestamp: function() {
                var myNode = this.head;
                var minID;
                while (myNode) {
                    if (minID === undefined || myNode.timestamp < minID ) {
                        minID = myNode.timestamp;
                    }
                    myNode = myNode.next;
                }
                return  minID;
            },
            filter: function(filterFunc) {

                var newList = operation_list();
                var node = this.head;
                var newNode;
                while (node) {
                    if (filterFunc(node)) {
                        newNode = {
                            position: node.position,
                            value: node.value,
                            length: node.length,
                            siteID: node.siteID,
                            timestamp: node.timestamp
                        };
                        newList.push(newNode);
                    }
                    node = node.next;
                }
                return newList;


            },
            clone: function(){
                var newList = operation_list();
                var node = this.head;
                var newNode;
                while (node) {
                    newNode = {
                        position: node.position,
                        value: node.value,
                        length: node.length,
                        siteID: node.siteID,
                        timestamp: node.timestamp

                    };
                    newList.push(newNode);
                    node = node.next;
                }
                return newList;
            },
            getLength: function() {
                var len = 0;
                this.iterate(function() {
                    len += 1;
                });
                return len;
            }
        };
    };
})(this);
