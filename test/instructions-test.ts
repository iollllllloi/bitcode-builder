import * as assert from 'assert';
import { Bitcode } from '../';
import { Func } from '../lib/values/function';

describe('bitcode/instructions', () => {
  const b = new Bitcode();
  let fn: Func;

  beforeEach(() => {
    const sig = b.signature(b.void(),
      [ b.i(32), b.i(32), b.i(8), b.i(8).ptr() ]);
    fn = sig.defineFunction('some_func', [ 'a', 'b', 'c', 'p' ]);
  });

  describe('binop', () => {
    it('should be created', () => {
      const i = fn.body.binop('add', fn.getArgument('a'), fn.getArgument('b'));
      assert.strictEqual(i.opcode, 'binop');
      assert.strictEqual(i.binopType, 'add');
      assert(i.ty.isEqual(fn.getArgument('a').ty));
    });

    it('should check that operands are of Int type', () => {
      assert.throws(() => {
        fn.body.binop('add', fn.getArgument('a'), b.i(32).ptr().val(null));
      }, /Only Int/);
    });

    it('should check equality of types', () => {
      assert.throws(() => {
        fn.body.binop('add', fn.getArgument('a'), fn.getArgument('c'));
      }, /Left and right.*different types/);
    });
  });

  describe('cast', () => {
    it('should be created', () => {
      const i = fn.body.cast('zext', fn.getArgument('a'), b.i(64));
      assert.strictEqual(i.opcode, 'cast');
      assert.strictEqual(i.castType, 'zext');
      assert(i.ty.isEqual(b.i(64)));
    });

    it('should check width for `trunc`', () => {
      assert.doesNotThrow(() => {
        fn.body.cast('trunc', fn.getArgument('a'), b.i(8));
      });
      assert.throws(() => {
        fn.body.cast('trunc', fn.getArgument('a'), b.i(64));
      }, /should reduce bit width/);
    });

    it('should check width for `zext`', () => {
      assert.doesNotThrow(() => {
        fn.body.cast('zext', fn.getArgument('a'), b.i(64));
      });
      assert.throws(() => {
        fn.body.cast('zext', fn.getArgument('a'), b.i(8));
      }, /should extend bit width/);
    });

    it('should check width for `sext`', () => {
      assert.doesNotThrow(() => {
        fn.body.cast('sext', fn.getArgument('a'), b.i(64));
      });
      assert.throws(() => {
        fn.body.cast('sext', fn.getArgument('a'), b.i(8));
      }, /should extend bit width/);
    });

    it('should check type for `ptrtoint`', () => {
      assert.doesNotThrow(() => {
        fn.body.cast('ptrtoint', fn.getArgument('p'), b.i(64));
      });
      assert.throws(() => {
        fn.body.cast('ptrtoint', fn.getArgument('a'), b.i(8));
      }, /Invalid types/);
      assert.throws(() => {
        fn.body.cast('ptrtoint', fn.getArgument('p'), b.i(8).ptr());
      }, /Invalid types/);
    });

    it('should check type for `inttoptr`', () => {
      assert.doesNotThrow(() => {
        fn.body.cast('inttoptr', fn.getArgument('a'), b.i(8).ptr());
      });
      assert.throws(() => {
        fn.body.cast('inttoptr', fn.getArgument('a'), b.i(8));
      }, /Invalid types/);
      assert.throws(() => {
        fn.body.cast('inttoptr', fn.getArgument('p'), b.i(8).ptr());
      }, /Invalid types/);
    });

    it('should check type for `bitcast`', () => {
      assert.doesNotThrow(() => {
        fn.body.cast('bitcast', fn.getArgument('p'), b.i(16).ptr());
      });
      assert.throws(() => {
        fn.body.cast('bitcast', fn.getArgument('a'), b.i(8).ptr());
      }, /Invalid types/);
      assert.throws(() => {
        fn.body.cast('bitcast', fn.getArgument('p'), b.i(8));
      }, /Invalid types/);
    });
  });
});