import throttle from '../../../../js/utils/throttle';

describe('Throttle Utility', function() {
    it('throws when not given a function', function() {
        expect(throttle.bind()).to.throw();
    });

    it('throws when not given a numeric time delay', function() {
        expect(throttle.bind(null, function(){})).to.throw();
    });

    it('fires the function on rising edge and blocks afterward', function(done) {
        var delay = 50;
        var spy = sinon.spy();
        var func = throttle(spy, delay, true);
        spy.should.not.have.been.called;
        func('a', 'b');
        spy.should.have.been.calledOnce;
        spy.should.have.been.calledWith('a', 'b');
        func();
        func();
        func();
        func();
        func();
        spy.should.have.been.calledOnce;
        spy.should.have.been.calledWith('a', 'b');
        setTimeout(function() {
            spy.should.have.been.calledOnce;
            spy.should.have.been.calledWith('a', 'b');
            func('c', 'd');
            spy.should.have.been.calledTwice;
            spy.should.have.been.calledWith('c', 'd');
            done();
        }, delay);
    });

    it('blocks the function call on falling edge until delay is up', function(done) {
        var delay = 50;
        var spy = sinon.spy();
        var func = throttle(spy, delay);
        spy.should.not.have.been.called;
        func();
        spy.should.not.have.been.called;
        func();
        func();
        func();
        func();
        func();
        func();
        spy.should.not.have.been.called;
        setTimeout(function() {
            func();
            func();
            func();
            func('a', 'b');
            spy.should.not.have.been.called;

            setTimeout(function() {
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledWith('a', 'b');
                done();
            }, delay);
        },10);
    });
});
