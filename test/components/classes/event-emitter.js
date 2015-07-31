import EventEmitter from '../../../js/classes/event-emitter';

describe('Event Emitter', function() {
    var e;
    beforeEach(function() {
        e = new EventEmitter();
    });

    it('registers a callback under a name', function() {
        var fun1 = function() { return 1; };
        var fun2 = function() { return 2; };

        e.on('test', fun1);
        expect(e).to.have.deep.property('__events__.test');
        expect(e.__events__.test).to.have.length(1);
        e.on('test', fun2);
        expect(e.__events__.test).to.have.length(2);
        e.__events__.test[0].should.equal(fun1);
        e.__events__.test[1].should.equal(fun2);
    });

    it('removes a callback with a reference to it', function() {
        var fun1 = function() { return 1; };
        var fun2 = function() { return 2; };
        var fun3 = function() { return 3; };

        e.on('test', fun1);
        e.on('test', fun2);
        e.on('test', fun3);
        expect(e.__events__.test).to.have.length(3);
        e.__events__.test[0].should.equal(fun1);
        e.__events__.test[1].should.equal(fun2);
        e.__events__.test[2].should.equal(fun3);
        e.off('test', fun3);
        expect(e.__events__.test).to.have.length(2);
        e.__events__.test[0].should.equal(fun1);
        e.__events__.test[1].should.equal(fun2);
        e.off('test', fun1);
        expect(e.__events__.test).to.have.length(1);
        e.__events__.test[0].should.equal(fun2);
        e.off('test', fun2);
        expect(e.__events__.test).to.have.length(0);
    });

    it('removes all callbacks', function() {
        var fun1 = function() { return 1; };
        var fun2 = function() { return 2; };
        var fun3 = function() { return 3; };

        e.on('test', fun1);
        e.on('test', fun2);
        e.on('test2', fun3);
        expect(e.__events__.test).to.have.length(2);
        e.__events__.test[0].should.equal(fun1);
        e.__events__.test[1].should.equal(fun2);
        expect(e.__events__.test2).to.have.length(1);
        e.__events__.test2[0].should.equal(fun3);
        e.allOff();
        expect(e.__events__.test).to.have.length(0);
        expect(e.__events__.test2).to.have.length(0);
    });

    it('passes arguments to callback on emit', function() {
        var fun1 = sinon.spy();
        e.on('test', fun1);
        fun1.should.not.have.been.called;
        e.emit('test', 'a', 'b', 'c');
        fun1.should.have.been.calledOnce;
        fun1.should.have.been.calledWith('a', 'b', 'c');
    });

    it('is inherited', function() {
        class TopLevel extends EventEmitter { }
        var obj = new TopLevel();
        var fun1 = sinon.spy();
        obj.on('test', fun1);
        fun1.should.not.have.been.called;
        obj.emit('test', 'a', 'b', 'c');
        fun1.should.have.been.calledOnce;
        fun1.should.have.been.calledWith('a', 'b', 'c');
    });
});
