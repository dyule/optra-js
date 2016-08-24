beforeEach(function () {
    jasmine.addMatchers({
        toHaveLength: function() {
            return {
                compare: function (actual, expected) {
                    var node = actual.head;
                    var counter = 0;
                    while (node) {
                        node = node.next;
                        counter += 1;
                    }
                    return {
                        pass: counter == expected
                    }

                }
            }
        }
    });
});
