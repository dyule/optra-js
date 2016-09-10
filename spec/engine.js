describe("engine", function() {
    function op_generator(siteID) {
        var stamper = Stamper(siteID);
        return {
            ins: function(position, value) {
                return {
                    position: position,
                    value: value,
                    siteID: siteID,
                    timestamp: stamper.stampLocal()
                };
            }, del: function(position, len) {
                return {
                    position: position,
                    length: len,
                    timestamp: stamper.stampLocal()
                };
            }, getStamper: function () {
                return stamper;
            }
        }
    }

    function list_checker(list) {
        var current = list.head;
        return {
            checkIns: function (position, value) {
                expect(current.position).toEqual(position);
                expect(current.value).toEqual(value);
                current = current.next;
            },
            checkDel: function(position, len) {
                expect(current.position).toEqual(position);
                expect(current.length).toEqual(len);
                current = current.next;
            }
        }
    }
    it("should be able to transform two inserts", function() {
        var the_engine = engine();
        var generator = op_generator(2);
        var sequence1 = operation_list();
        sequence1.push(generator.ins(3, "ee"));
        sequence1.push(generator.ins(11, "k"));
        sequence1.push(generator.ins(18, "wnwnwn"));
        sequence1.push(generator.ins(28, "xx!"));
        generator = op_generator(1);
        var sequence2 = operation_list();
        sequence2.push(generator.ins(4, "very "));
        sequence2.push(generator.ins(14, "ly"));
        sequence2.push(generator.ins(20, "u"));

        the_engine.internals.transform(sequence1, sequence2);
        var checker = list_checker(sequence1);
        checker.checkIns(3, "ee");
        checker.checkIns(18, "k");
        checker.checkIns(26, "wnwnwn");
        checker.checkIns(36, "xx!");
    });

    it("should be able to transform a delete and insert", function() {
        var the_engine = engine();
        var generator = op_generator(1);
        var sequence1 = operation_list();
        sequence1.push(generator.del(2, 1));
        sequence1.push(generator.del(4, 1));
        sequence1.push(generator.del(8, 2));
        sequence1.push(generator.del(15, 2));
        sequence1.push(generator.del(19, 1));

        generator = op_generator(2);
        var sequence2 = operation_list();
        sequence2.push(generator.ins(3, "ee"));
        sequence2.push(generator.ins(18, "k"));
        sequence2.push(generator.ins(26, "wnwnwn"));
        sequence2.push(generator.ins(36, "xx!"));

        the_engine.internals.transform(sequence1, sequence2);
        var checker = list_checker(sequence1);
        checker.checkDel(2, 1);
        checker.checkDel(6, 1);
        checker.checkDel(10, 2);
        checker.checkDel(18, 2);
        checker.checkDel(28, 1);
    });

    it("should be able to transform a delete and a delete", function() {
        var the_engine = engine();
        var generator = op_generator(2);
        var sequence1 = operation_list();
        sequence1.push(generator.del(4, 9));
        sequence1.push(generator.del(15, 7));
        sequence1.push(generator.del(20, 3));
        generator = op_generator(1);
        var sequence2 = operation_list();
        sequence2.push(generator.del(1, 5));
        sequence2.push(generator.del(2, 2));
        sequence2.push(generator.del(4, 4));
        sequence2.push(generator.del(21, 12));

        the_engine.internals.transform(sequence1, sequence2);
        var checker = list_checker(sequence1);
        checker.checkDel(1, 1);
        checker.checkDel(1, 2);
        checker.checkDel(10, 7);
        checker.checkDel(11, 0);

        sequence1 = operation_list();
        sequence1.push(generator.del(4, 9));
        sequence1.push(generator.del(15, 7));
        sequence1.push(generator.del(20, 3));
        the_engine.internals.transform(sequence2, sequence1);
        checker = list_checker(sequence2);
        checker.checkDel(1, 3);
        checker.checkDel(1, 0);
        checker.checkDel(1, 2);
        checker.checkDel(11, 4);
        checker.checkDel(11, 5);


    });

    it("should be able to integrate remote transactions", function() {
        var the_engine = engine(1);
        var generator = op_generator(1) ;
        the_engine.inserts.push(generator.ins(0, "The quick brown fox"));
        the_engine.inserts.push(generator.ins(4, "very "));
        the_engine.inserts.push(generator.ins(14, "ly"));
        the_engine.inserts.push(generator.ins(20, "u"));

        the_engine.deletes.push(generator.del(2, 1));
        the_engine.deletes.push(generator.del(4, 1));
        the_engine.deletes.push(generator.del(8, 2));
        the_engine.deletes.push(generator.del(15, 2));
        the_engine.deletes.push(generator.del(19, 1));

        var stamper = generator.getStamper();
        generator = op_generator(2);
        var insSequence = operation_list();
        insSequence.push(generator.ins(3, "ee"));
        insSequence.push(generator.ins(11, "k"));
        insSequence.push(generator.ins(18, "wnwnwn"));

        insSequence.push(generator.ins(28, "xx!"));
        var delSequence = operation_list();
        delSequence.push(generator.del(1, 2));
        delSequence.push(generator.del(11, 3));
        delSequence.push(generator.del(20, 1));

        insSequence.iterate(function(o) {
            stamper.stampRemote({
                siteID: 2,
                timestamp: o.timestamp
            })
        });

        delSequence.iterate(function(o) {
            stamper.stampRemote({
                siteID: 2,
                timestamp: o.timestamp
            })
        });

        the_engine.integrateRemote({
            lastTimestamp: {
                siteID: 1,
                timestamp: 0
            },
            inserts: insSequence,
            deletes: delSequence
        }, generator.getStamper().getLookupSince(), stamper);
        var checker = list_checker(insSequence);
        checker.checkIns(2, "ee");
        checker.checkIns(14, "k");
        checker.checkIns(20, "wnwnwn");
        checker.checkIns(29, "xx!");

        checker = list_checker(delSequence);
        checker.checkDel(1, 1);
        checker.checkDel(15, 2);
        checker.checkDel(24, 1);

        checker = list_checker(the_engine.inserts);
        checker.checkIns(0, "The quick brown fox");
        checker.checkIns(3, "ee");
        checker.checkIns(6, "very ");
        checker.checkIns(16, "ly");
        checker.checkIns(18, "k");
        checker.checkIns(23, "u");
        checker.checkIns(26, "wnwnwn");
        checker.checkIns(36, "xx!");

        checker = list_checker(the_engine.deletes);
        checker.checkDel(1, 1);
        checker.checkDel(1, 1);
        checker.checkDel(5, 1);
        checker.checkDel(9, 2);
        checker.checkDel(15, 2);
        checker.checkDel(15, 2);
        checker.checkDel(24, 1);
        checker.checkDel(24, 1);

    });

    it("should be able to process a local transaction", function() {
        var the_engine = engine(1);
        var generator = op_generator(1) ;
        the_engine.inserts.push(generator.ins(0, "The quick brown fox"));
        the_engine.inserts.push(generator.ins(4, "very "));
        the_engine.inserts.push(generator.ins(14, "ly"));
        the_engine.inserts.push(generator.ins(20, "u"));

        the_engine.deletes.push(generator.del(2, 1));
        the_engine.deletes.push(generator.del(4, 1));
        the_engine.deletes.push(generator.del(8, 2));
        the_engine.deletes.push(generator.del(15, 2));
        the_engine.deletes.push(generator.del(19, 1));

        generator = op_generator(2);
        var insSequence = operation_list();
        insSequence.push(generator.ins(2, "ee"));
        insSequence.push(generator.ins(14, "k"));
        insSequence.push(generator.ins(20, "wnwnwn"));
        insSequence.push(generator.ins(29, "xx!"));

        var delSequence = operation_list();
        delSequence.push(generator.del(1, 1));
        delSequence.push(generator.del(15, 2));
        delSequence.push(generator.del(24, 1));

        the_engine.processTransaction({
            originalSite: 2,
            inserts: insSequence,
            deletes: delSequence
        });

        var checker = list_checker(insSequence);
        checker.checkIns(3, "ee");
        checker.checkIns(18, "k");
        checker.checkIns(26, "wnwnwn");
        checker.checkIns(36, "xx!");

        checker = list_checker(delSequence);
        checker.checkDel(1, 1);
        checker.checkDel(19, 2);
        checker.checkDel(30, 1);

        checker = list_checker(the_engine.inserts);
        checker.checkIns(0, "The quick brown fox");
        checker.checkIns(3, "ee");
        checker.checkIns(6, "very ");
        checker.checkIns(16, "ly");
        checker.checkIns(18, "k");
        checker.checkIns(23, "u");
        checker.checkIns(26, "wnwnwn");
        checker.checkIns(36, "xx!");

        checker = list_checker(the_engine.deletes);
        checker.checkDel(1, 1);
        checker.checkDel(1, 1);
        checker.checkDel(5, 1);
        checker.checkDel(9, 2);
        checker.checkDel(15, 2);
        checker.checkDel(15, 2);
        checker.checkDel(24, 1);
        checker.checkDel(24, 1);
    });
});
