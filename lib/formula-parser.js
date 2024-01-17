/*! formula-parser v2.0.1 by Ross Kirsling (MIT license) */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.FormulaParser = factory());
}(this, (function () { 'use strict';

const MIN_PRECEDENCE = 0;

/**
 * Returns the remainder of a given string after slicing off
 * the length of a given symbol and any following whitespace.
 * (Does not verify that the symbol is an initial substring.)
 *
 * @private
 * @static
 * @param {string} str    - a string to slice
 * @param {string} symbol - an initial substring
 * @returns {string}
 */
function sliceSymbol(str, symbol) {
  return str.slice(symbol.length).trim();
}

/**
 * Attempts to match a given list of operators against the head of a given string.
 * Returns the first match if successful, otherwise null.
 *
 * @private
 * @static
 * @param {string}   str          - a string to match against
 * @param {Object[]} operatorList - an array of operator definitions, sorted by longest symbol
 * @returns {?Object}
 */
function matchOperator(str, operatorList) {
  return operatorList.reduce((match, operator) => {
    return match ||
      (str.startsWith(operator.symbol) ? operator : null);
  }, null);
}

/**
 * Attempts to parse a variable (i.e., any alphanumeric substring) at the head of a given string.
 * Returns an AST node and string remainder if successful, otherwise null.
 *
 * @private
 * @param {FormulaParser} self
 * @param {string}        currentString - remainder of input string left to parse
 * @returns {?Object}
 */
function _parseVariable(self, currentString) {
  const variable = (currentString.match(/^\w+/) || [])[0];
  if (!variable) {
    return null;
  }

  return {
    json: { [self.variableKey]: variable },
    remainder: sliceSymbol(currentString, variable)
  };
}

/**
 * Attempts to parse a parenthesized subformula at the head of a given string.
 * Returns an AST node and string remainder if successful, otherwise null.
 *
 * @private
 * @param {FormulaParser} self
 * @param {string}        currentString - remainder of input string left to parse
 * @returns {?Object}
 */
function _parseParenthesizedSubformula(self, currentString) {
  if (currentString.charAt(0) !== '(') {
    return null;
  }

  const parsedSubformula = _parseFormula(self, sliceSymbol(currentString, '('), MIN_PRECEDENCE);
  if (parsedSubformula.remainder.charAt(0) !== ')') {
    throw new SyntaxError('Invalid formula! Found unmatched parenthesis.');
  }

  return {
    json: parsedSubformula.json,
    remainder: sliceSymbol(parsedSubformula.remainder, ')')
  };
}

/**
 * Attempts to parse a unary subformula at the head of a given string.
 * Returns an AST node and string remainder if successful, otherwise null.
 *
 * @private
 * @param {FormulaParser} self
 * @param {string}        currentString - remainder of input string left to parse
 * @returns {?Object}
 */
function _parseUnarySubformula(self, currentString) {
  const unary = matchOperator(currentString, self.unaries);
  if (!unary) {
    return null;
  }

  const parsedSubformula = _parseFormula(self, sliceSymbol(currentString, unary.symbol), unary.precedence);

  return {
    json: { [unary.key]: parsedSubformula.json },
    remainder: parsedSubformula.remainder
  };
}

/**
 * Attempts to parse a binary subformula at the head of a given string,
 * given a lower precedence bound and an AST node to be used as a left operand.
 * Returns an AST node and string remainder if successful, otherwise null.
 *
 * @private
 * @param {FormulaParser} self
 * @param {string}        currentString     - remainder of input string left to parse
 * @param {number}        currentPrecedence - lowest binary precedence allowable at current parse stage
 * @param {Object}        leftOperandJSON   - AST node for already-parsed left operand
 * @returns {?Object}
 */
function _parseBinarySubformula(self, currentString, currentPrecedence, leftOperandJSON) {
  const binary = matchOperator(currentString, self.binaries);
  if (!binary || binary.precedence < currentPrecedence) {
    return null;
  }

  const nextPrecedence = binary.precedence + (binary.associativity === 'left');
  const parsedRightOperand = _parseFormula(self, sliceSymbol(currentString, binary.symbol), nextPrecedence);

  return {
    json: { [binary.key]: [leftOperandJSON, parsedRightOperand.json] },
    remainder: parsedRightOperand.remainder
  };
}

/**
 * Recursively parses a formula according to this parser's parameters.
 * Returns an complete AST and a (hopefully empty) string remainder.
 *
 * @private
 * @param {FormulaParser} self
 * @param {string}        currentString     - remainder of input string left to parse
 * @param {number}        currentPrecedence - lowest binary precedence allowable at current parse stage
 * @param {Object}        [currentJSON]     - AST node retained from previous parse stage
 * @returns {Object}
 */
function _parseFormula(self, currentString, currentPrecedence, currentJSON) {
  if (!currentString.length && !currentJSON) {
    throw new SyntaxError('Invalid formula! Unexpected end of input.');
  }

  // First, we need an initial subformula.
  // A valid formula can't start with a binary operator, but anything else is possible.
  const parsedHead =
    currentJSON ? { json: currentJSON, remainder: currentString } :
      _parseUnarySubformula(self, currentString) ||
      _parseParenthesizedSubformula(self, currentString) ||
      _parseVariable(self, currentString);

  if (!parsedHead) {
    throw new SyntaxError('Invalid formula! Could not find an initial subformula.');
  }

  // Having found an initial subformula, let's see if it's the left operand to a binary operator...
  const parsedBinary = _parseBinarySubformula(self, parsedHead.remainder, currentPrecedence, parsedHead.json);
  if (!parsedBinary) {
    // ...if it isn't, we're done!
    return parsedHead;
  }

  // ...if it is, we parse onward, with our new binary subformula as the next initial subformula.
  return _parseFormula(self, parsedBinary.remainder, currentPrecedence, parsedBinary.json);
}

/**
 * A parser class for "operator-precedence languages", i.e.,
 * context-free languages which have only variables, unary operators, and binary operators.
 *
 * The grammar for a parser instance is thus wholly specified by the operator definitions
 * (as well as a key with which to label variable nodes).
 *
 * An operator definition is an object like the following:
 *   { symbol: '+', key: 'plus', precedence: 1, associativity: 'left' }
 * It specifies a symbol, a key for its AST node, a precedence level,
 * and (for binaries) an associativity direction.
 */
class FormulaParser {
  /**
   * @param {string}   variableKey - key to use for a variable's AST node
   * @param {Object[]} unaries     - an array of unary operator definitions
   * @param {Object[]} binaries    - an array of binary operator definitions
   */
  constructor(variableKey = 'var', unaries = [], binaries = []) {
    const byLongestSymbol = (x, y) => y.symbol.length - x.symbol.length;

    Object.assign(this, {
      variableKey,
      unaries: unaries.slice().sort(byLongestSymbol),
      binaries: binaries.slice().sort(byLongestSymbol)
    });
  }

  /**
   * Parses a formula according to this parser's parameters.
   * Returns an AST in JSON format.
   *
   * @param {string} input - a formula to parse
   * @returns {Object}
   */
  parse(input) {
    if (typeof input !== 'string') {
      throw new SyntaxError('Invalid formula! Found non-string input.');
    }

    const parsedFormula = _parseFormula(this, input.trim(), MIN_PRECEDENCE);
    if (parsedFormula.remainder.length) {
      throw new SyntaxError('Invalid formula! Unexpected continuation of input.');
    }

    return parsedFormula.json;
  }
}

return FormulaParser;

})));
