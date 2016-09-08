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

            getMaxTimestamp: function() {
                var myNode = this.head;
                var maxID;
                while (myNode) {
                    if (maxID === undefined || maxID < myNode.timestamp) {
                        maxID = myNode.timestamp;
                    }
                    myNode = myNode.next;
                }
                return maxID;
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
            }
        }
    }
})(this);
