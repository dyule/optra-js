describe("Operation List", function() {
  
  it("should be able to create a list", function() {
      var list = operation_list();
      list.push({
          id: 1
      });
      expect(list).toHaveLength(1);
      list.push({
          id: 2
      });
      list.push({
          id: 3
      });
      expect(list).toHaveLength(3);
  });

    it("should be able to iterate through two lists", function() {
        var list1 = operation_list();
        list1.push({
            id: 1
        });
        list1.push({
            id: 3
        });
        list1.push({
            id: 5
        });
        list1.push({
            id: 6
        });
        var list2 = operation_list();

        list2.push({
            id: 2
        });
        list2.push({
            id: 4
        });
        list2.push({
            id: 7
        });

        var merged_list = [];
        list1.iterate_with(list2, function(obj1, obj2) {
            if (!obj1) {
                merged_list.push(obj2.id);
                return false;
            }
            if (!obj2) {
                merged_list.push(obj1.id);
                return true;
            }
            if (obj1.id < obj2.id) {
                merged_list.push(obj1.id);
                return true;
            } else {
                merged_list.push(obj2.id);
                return false;
            }
        });

        expect(merged_list).toEqual([1, 2, 3, 4, 5, 6, 7]);

    });
});
