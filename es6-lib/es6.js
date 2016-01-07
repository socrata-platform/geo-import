/**
 * This is a shortcut for development only.
 * This registers the babel compiler for lazy
 * compilation, but it eats up tons of memory,
 * so don't use it as a source of truth.
 */
require('babel/register');
require('./index');
