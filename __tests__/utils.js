const { parseOptions } = require('../src/utils');

describe(__filename, () => {
  describe('parseOptions', () => {
    const defaultOptions = {
      foo: 'foo',
      bar: false,
    };

    it('returns the default options', () => {
      const options = parseOptions([], defaultOptions);

      expect(options).toEqual(defaultOptions);
    });

    it('accepts the boolean options', () => {
      const options = parseOptions(['--bar'], defaultOptions);

      expect(options).toEqual({
        ...defaultOptions,
        bar: true,
      });
    });

    it('accepts the string options', () => {
      const fooValue = 'some-fooValue';
      const options = parseOptions(['--foo', fooValue], defaultOptions);

      expect(options).toEqual({
        ...defaultOptions,
        foo: fooValue,
      });
    });

    it('ignores unknown options', () => {
      const options = parseOptions(['--unknown', 'option'], defaultOptions);

      expect(options).toEqual(defaultOptions);
    });
  });
});
